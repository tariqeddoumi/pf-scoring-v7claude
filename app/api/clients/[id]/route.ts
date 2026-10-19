import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { withAuth } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import prisma from "@/lib/prisma-client";
import { seulementFournis, updateClientSchema } from "@/lib/validation-schemas";
import {
  donneesClient,
  ecritureActionnaires,
  messageConflit,
  provenanceT24,
  resoudreGroupe,
} from "@/lib/clients/enregistrement";
import { lireAttestation } from "@/lib/services/t24/attestation";
import { messagePublic } from "@/lib/erreur-publique";
import { codeErreur } from "@/lib/erreur-inconnue";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    const { id } = await params;
    try {
      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          entite: { select: { id: true, code: true, nom: true } },
          actionnaires: { orderBy: { ordre: "asc" } },
          groupeAffaires: {
            select: {
              id: true,
              code: true,
              nom: true,
              paysSiege: true,
              secteurPrincipal: true,
              ratingGroupe: true,
              sourceDonnees: true,
            },
          },
          // La fiche affiche l'encours demandé et la note de chaque dossier :
          // sans montant ni note, la liste des projets n'apprend rien.
          projects: {
            select: {
              id: true,
              nom: true,
              status: true,
              montant: true,
              grade: true,
              scoreGlobal: true,
            },
            orderBy: { dateCreation: "desc" },
          },
        },
      });

      if (!client) {
        return NextResponse.json(
          { success: false, error: "Client non trouvé" },
          { status: 404 }
        );
      }

      // Sociétés du même groupe, lues par une requête cloisonnée : une inclusion
      // imbriquée échapperait au filtre d'entité et montrerait les clients d'une
      // autre banque du groupe.
      const membres = client.groupeAffairesId
        ? await prisma.client.findMany({
            where: { groupeAffairesId: client.groupeAffairesId, NOT: { id } },
            select: {
              id: true,
              nom: true,
              raisonSociale: true,
              codeClientT24: true,
              roleGroupe: true,
              ratingInterne: true,
              exposition: true,
            },
            orderBy: { nom: "asc" },
          })
        : [];
      // Exposition consolidée du groupe (périmètre visible) : repère de division des risques.
      const expositions = [client, ...membres]
        .map((c) => c.exposition)
        .filter((e): e is number => e != null);
      const groupe = client.groupeAffaires
        ? {
            ...client.groupeAffaires,
            membres,
            expositionConsolidee:
              expositions.length > 0
                ? expositions.reduce((a, b) => a + b, 0)
                : null,
          }
        : null;

      return NextResponse.json({
        success: true,
        data: { ...client, groupeAffaires: groupe },
      });
    } catch (error: unknown) {
      console.error(`[Client ${id} GET]`, error);
      return NextResponse.json(
        { success: false, error: messagePublic(error, "Erreur serveur") },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    // Aucune vérification de rôle n'était faite : un compte en lecture seule pouvait
    // modifier la signalétique d'une contrepartie, notation interne comprise.
    if (!hasPermission(user.role as UserRole, "client", "update")) {
      return NextResponse.json(
        {
          success: false,
          error: "Vos droits ne permettent pas de modifier ce client",
        },
        { status: 403 }
      );
    }
    const { id } = await params;
    try {
      const body = await req.json();

      // Quatorze champs étaient ignorés en silence — raison sociale, forme juridique,
      // capital, effectifs, adresse, ville, code postal, site, centre d'affaires,
      // gestionnaire, date de relation, exposition, nom commercial, chiffre
      // d'affaires. L'utilisateur voyait « enregistré » et retrouvait l'ancienne
      // valeur. Le schéma partiel décrit l'ensemble des champs modifiables.
      const validation = updateClientSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Données invalides",
            errors: validation.error.issues.map((i) => ({
              field: i.path.join("."),
              message: i.message,
            })),
          },
          { status: 400 }
        );
      }

      const {
        groupe,
        entiteId,
        attestationT24,
        attestationGroupeT24,
        ...saisie
      } = seulementFournis(validation.data, body);
      const attClient = lireAttestation(attestationT24, "client", user.userId);
      const attGroupe = lireAttestation(
        attestationGroupeT24,
        "groupe",
        user.userId
      );
      const avant = await prisma.client.findUnique({
        where: { id },
        select: {
          entiteId: true,
          champsT24: true,
          groupeAffaires: { select: { code: true, nom: true, entiteId: true } },
        },
      });
      if (!avant) {
        return NextResponse.json(
          { success: false, error: "Client non trouvé" },
          { status: 404 }
        );
      }
      const banque = entiteId || avant.entiteId;
      const transfert = Boolean(entiteId && entiteId !== avant.entiteId);

      // Un client transféré ne peut pas rester rattaché au groupe d'une autre banque :
      // le groupe est retrouvé ou recréé (même code, même nom) dans la banque d'arrivée.
      let groupeCible = groupe;
      if (
        groupe === undefined &&
        transfert &&
        avant.groupeAffaires &&
        avant.groupeAffaires.entiteId !== banque
      ) {
        groupeCible = {
          code: avant.groupeAffaires.code,
          nom: avant.groupeAffaires.nom,
        };
      }

      const existants = Array.isArray(avant.champsT24)
        ? avant.champsT24.filter((c): c is string => typeof c === "string")
        : [];
      const provenance = provenanceT24(
        { ...saisie, ...(groupe !== undefined ? { groupe } : {}) },
        attClient,
        existants
      );

      // Client et projets changent de banque ensemble ou pas du tout : un client
      // transféré dont les projets resteraient dans l'ancienne banque y exposerait
      // ses données.
      const client = await prisma.$transaction(async (tx) => {
        const groupeAffairesId = await resoudreGroupe(tx, groupeCible, {
          entiteId: banque,
          ficheT24: attGroupe?.g ?? null,
          codeAtteste: attClient?.g?.code ?? null,
        });
        const maj = await tx.client.update({
          where: { id },
          data: {
            ...(donneesClient(saisie) as Prisma.ClientUncheckedUpdateInput),
            ...(groupeAffairesId !== undefined ? { groupeAffairesId } : {}),
            ...(saisie.actionnaires !== undefined
              ? {
                  actionnaires: ecritureActionnaires(
                    saisie.actionnaires,
                    "modification"
                  ),
                }
              : {}),
            ...(provenance
              ? {
                  champsT24:
                    provenance.champsT24.length > 0
                      ? provenance.champsT24
                      : Prisma.DbNull,
                  sourceDonnees: provenance.sourceDonnees,
                  ...(provenance.dateSynchroT24
                    ? { dateSynchroT24: provenance.dateSynchroT24 }
                    : {}),
                }
              : {}),
            // null n'est pas une entité : seul un transfert vers une banque est accepté.
            ...(entiteId ? { entiteId } : {}),
          },
        });
        // Transfert du client vers une autre banque : ses projets le suivent.
        if (transfert) {
          await tx.project.updateMany({
            where: { clientId: id },
            data: { entiteId: entiteId! },
          });
          // … et les crédits de ces projets (unicité du numéro de dossier par banque).
          await tx.projectCredit.updateMany({
            where: { project: { clientId: id } },
            data: { entiteId: entiteId! },
          });
        }
        return maj;
      });

      return NextResponse.json({ success: true, data: client });
    } catch (error: unknown) {
      const conflit = messageConflit(error);
      if (conflit) {
        return NextResponse.json(
          { success: false, error: conflit },
          { status: 409 }
        );
      }
      // Client visible en consultation (banque mère) mais hors du périmètre d'écriture.
      if (codeErreur(error) === "P2025") {
        return NextResponse.json(
          {
            success: false,
            error: "Ce client est en consultation seule depuis votre banque.",
          },
          { status: 403 }
        );
      }
      console.error(`[Client ${id} PUT]`, error);
      return NextResponse.json(
        { success: false, error: messagePublic(error, "Erreur serveur") },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    if (!hasPermission(user.role as UserRole, "client", "delete")) {
      return NextResponse.json(
        {
          success: false,
          error: "Vos droits ne permettent pas de supprimer ce client",
        },
        { status: 403 }
      );
    }
    const { id } = await params;
    try {
      await prisma.client.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Client supprimé" });
    } catch (error: unknown) {
      // Client absent, ou visible en consultation seule depuis cette banque.
      if (codeErreur(error) === "P2025") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Client introuvable ou en consultation seule depuis votre banque.",
          },
          { status: 404 }
        );
      }
      console.error(`[Client ${id} DELETE]`, error);
      return NextResponse.json(
        { success: false, error: messagePublic(error, "Erreur serveur") },
        { status: 500 }
      );
    }
  });
}
