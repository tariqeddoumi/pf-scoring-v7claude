import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { withAuth, type AuthPayload } from "@/lib/auth-middleware";
import { hasPermission } from "@/lib/services/permission-service";
import type { UserRole } from "@/lib/permissions";
import prisma from "@/lib/prisma-client";
import { createClientSchema } from "@/lib/validation-schemas";
import {
  donneesClient,
  ecritureActionnaires,
  messageConflit,
  provenanceT24,
  resoudreGroupe,
} from "@/lib/clients/enregistrement";
import { lireAttestation } from "@/lib/services/t24/attestation";
import { messagePublic } from "@/lib/erreur-publique";

async function handler(request: NextRequest, user: AuthPayload) {
  // GET - List clients
  if (request.method === "GET") {
    try {
      const { searchParams } = new URL(request.url);
      // Bornes : un paramètre illisible ou démesuré ne doit ni faire échouer la
      // requête, ni ramener la table entière.
      const skipDemande = Number.parseInt(searchParams.get("skip") ?? "", 10);
      const takeDemande = Number.parseInt(searchParams.get("take") ?? "", 10);
      const skip = Number.isFinite(skipDemande) ? Math.max(0, skipDemande) : 0;
      const take = Number.isFinite(takeDemande)
        ? Math.min(500, Math.max(1, takeDemande))
        : 10;
      const search = searchParams.get("search") || "";

      const where = search
        ? {
            OR: [
              { nom: { contains: search, mode: "insensitive" as const } },
              {
                raisonSociale: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              { email: { contains: search, mode: "insensitive" as const } },
              // Le chargé d'affaires retrouve un client par son code T24 ou son ICE.
              {
                codeClientT24: {
                  equals: search.trim(),
                  mode: "insensitive" as const,
                },
              },
              { ice: { equals: search.trim() } },
              {
                groupeAffaires: {
                  nom: { contains: search, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {};

      const [clients, total] = await Promise.all([
        prisma.client.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            nom: true,
            email: true,
            telephone: true,
            type: true,
            typeClient: true,
            segmentClientele: true,
            statusKYC: true,
            statusConformite: true,
            ratingInterne: true,
            statutBancaire: true,
            secteur: true,
            pays: true,
            status: true,
            createdAt: true,
            // La liste montre l'exposition, le gestionnaire et le nombre de projets :
            // ce sont les repères d'un chargé d'affaires, et ils n'étaient pas
            // sélectionnés.
            exposition: true,
            gestionnaire: true,
            raisonSociale: true,
            ville: true,
            codeClientT24: true,
            radical: true,
            classificationBAM: true,
            sourceDonnees: true,
            groupeAffaires: { select: { id: true, code: true, nom: true } },
            projects: { select: { id: true } },
            entite: { select: { id: true, code: true, nom: true } },
          },
        }),
        prisma.client.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: clients,
        total,
        page: Math.floor(skip / take),
        pageSize: take,
      });
    } catch (error: unknown) {
      console.error("[Clients GET]", error);
      return NextResponse.json(
        { success: false, error: messagePublic(error, "Erreur serveur") },
        { status: 500 }
      );
    }
  }

  // POST - Create client
  if (request.method === "POST") {
    try {
      // La route ne vérifiait aucun rôle : tout compte authentifié, y compris un
      // compte en lecture seule ou un auditeur, pouvait créer une contrepartie.
      if (!hasPermission(user.role as UserRole, "client", "create")) {
        return NextResponse.json(
          {
            success: false,
            error: "Vos droits ne permettent pas de créer un client",
          },
          { status: 403 }
        );
      }

      const body = await request.json();

      // La route ne retenait que onze champs sur les vingt-neuf que le formulaire
      // envoie : raison sociale, forme juridique, rating interne, exposition, ville,
      // adresse, gestionnaire et le reste étaient perdus sans le moindre message.
      // Le schéma Zod les décrit tous ; c'est lui qui fait foi désormais.
      const validation = createClientSchema.safeParse(body);
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

      const { groupe, attestationT24, attestationGroupeT24, ...saisie } =
        validation.data;
      const attClient = lireAttestation(attestationT24, "client", user.userId);
      const attGroupe = lireAttestation(
        attestationGroupeT24,
        "groupe",
        user.userId
      );

      // Un même client T24 saisi deux fois dans une banque ferait deux dossiers de
      // crédit sur la même contrepartie : la fiche existante est signalée. Le contrôle
      // porte sur la banque cible seulement (le code est unique par banque).
      const banqueCible = saisie.entiteId ?? user.perimetre?.entiteId ?? null;
      if (saisie.codeClientT24 && banqueCible) {
        const existant = await prisma.client.findFirst({
          where: { codeClientT24: saisie.codeClientT24, entiteId: banqueCible },
          select: { id: true, nom: true },
        });
        if (existant) {
          return NextResponse.json(
            {
              success: false,
              error: `Le code client T24 ${saisie.codeClientT24} est déjà attribué à « ${existant.nom} ».`,
              existant,
            },
            { status: 409 }
          );
        }
      }

      const provenance = provenanceT24(
        { ...saisie, ...(groupe ? { groupe } : {}) },
        attClient,
        null
      );
      const client = await prisma.$transaction(async (tx) => {
        const actionnaires = ecritureActionnaires(
          saisie.actionnaires,
          "creation"
        );
        const cree = await tx.client.create({
          data: {
            ...(donneesClient(saisie) as Prisma.ClientUncheckedCreateInput),
            nom: saisie.nom,
            ...(saisie.entiteId ? { entiteId: saisie.entiteId } : {}),
            type: saisie.type || "Entreprise",
            typeClient: saisie.typeClient || "Entreprise",
            statusKYC: saisie.statusKYC || "En attente",
            statusConformite: saisie.statusConformite || "En attente",
            // status n'est pas nullable en base et vaut « Actif » par défaut.
            status: saisie.status || "Actif",
            ...(provenance && provenance.champsT24.length > 0
              ? {
                  champsT24: provenance.champsT24,
                  sourceDonnees: provenance.sourceDonnees,
                  dateSynchroT24: provenance.dateSynchroT24,
                }
              : {}),
            ...(actionnaires ? { actionnaires } : {}),
          },
        });
        // Le groupe est cherché ou créé dans la banque effective du client, connue
        // une fois la fiche créée (banque choisie ou celle de l'utilisateur).
        const groupeAffairesId = await resoudreGroupe(tx, groupe, {
          entiteId: cree.entiteId,
          ficheT24: attGroupe?.g ?? null,
          codeAtteste: attClient?.g?.code ?? null,
        });
        return groupeAffairesId
          ? tx.client.update({
              where: { id: cree.id },
              data: { groupeAffairesId },
            })
          : cree;
      });

      return NextResponse.json(
        { success: true, data: client },
        { status: 201 }
      );
    } catch (error: unknown) {
      const conflit = messageConflit(error);
      if (conflit) {
        return NextResponse.json(
          { success: false, error: conflit },
          { status: 409 }
        );
      }
      console.error("[Clients POST]", error);
      return NextResponse.json(
        { success: false, error: messagePublic(error, "Erreur serveur") },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: "Méthode non autorisée" },
    { status: 405 }
  );
}

export async function GET(request: NextRequest) {
  return withAuth(request, (req, user) => handler(req, user));
}

export async function POST(request: NextRequest) {
  return withAuth(request, (req, user) => handler(req, user));
}
