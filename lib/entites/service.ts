import { NextResponse } from "next/server";
import { z } from "zod";
import type { AuthPayload } from "@/lib/auth-middleware";
import { prismaSysteme as prisma } from "@/lib/prisma-client";
import { cheminDe, chargerArbre, descendance, oublierArbre, peutLire, type Perimetre } from "./perimetre";

/**
 * Gestion de l'arbre des entités (banques, filiales, groupes).
 * Réservée aux administrateurs système, dans leur périmètre : un administrateur
 * rattaché à une filiale gère la descendance de sa filiale, ni sa maison mère ni
 * les filiales sœurs.
 */

export const TYPES_ENTITE = ["GROUPE", "BANQUE", "BANQUE_REGIONALE", "FILIALE"] as const;

const texteOptionnel = z
  .string()
  .trim()
  .max(500)
  .nullish()
  .transform((v) => (v ? v : null));

export const entiteSchema = z.object({
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/, "Lettres, chiffres, - et _ uniquement"),
  nom: z.string().trim().min(2).max(200),
  type: z.enum(TYPES_ENTITE),
  parentId: z.string().uuid().nullish().transform((v) => v ?? null),
  pays: texteOptionnel,
  isActive: z.boolean().optional(),
  nomOutil: texteOptionnel,
  logoUrl: texteOptionnel.refine((v) => !v || /^(https:\/\/|\/)/.test(v), "Le logo doit être une adresse https:// ou un chemin /…"),
  couleurPrimaire: texteOptionnel.refine((v) => !v || /^#[0-9a-fA-F]{6}$/.test(v), "Couleur au format #RRGGBB"),
});
export type EntiteSaisie = z.infer<typeof entiteSchema>;

export class ErreurEntite extends Error {
  constructor(message: string, readonly statut = 400) {
    super(message);
  }
}

/** Entités visibles dans le périmètre, avec leurs effectifs. */
export async function listerEntites(p: Perimetre) {
  const arbre = await chargerArbre();
  const visibles = p.tout ? arbre : arbre.filter((e) => peutLire(p, e.id));
  const ids = visibles.map((e) => e.id);
  const [utilisateurs, clients, projets] = await Promise.all([
    prisma.user.groupBy({ by: ["entiteId"], where: { entiteId: { in: ids }, deletedAt: null }, _count: true }),
    prisma.client.groupBy({ by: ["entiteId"], where: { entiteId: { in: ids } }, _count: true }),
    prisma.project.groupBy({ by: ["entiteId"], where: { entiteId: { in: ids } }, _count: true }),
  ]);
  const compte = (rows: Array<{ entiteId: string | null; _count: number }>) =>
    new Map(rows.map((r) => [r.entiteId, r._count]));
  const [u, c, pr] = [compte(utilisateurs), compte(clients), compte(projets)];
  return visibles.map((e) => ({
    ...e,
    effectifs: { utilisateurs: u.get(e.id) ?? 0, clients: c.get(e.id) ?? 0, projets: pr.get(e.id) ?? 0 },
  }));
}

function controlerParent(p: Perimetre, parentId: string | null) {
  if (!parentId && !p.tout) throw new ErreurEntite("Seul un administrateur de toute la plateforme crée une entité racine.", 403);
  if (parentId && !peutLire(p, parentId)) throw new ErreurEntite("Entité parente hors de votre périmètre.", 403);
}

export async function creerEntite(p: Perimetre, saisie: EntiteSaisie) {
  controlerParent(p, saisie.parentId);
  const arbre = await chargerArbre();
  const parent = saisie.parentId ? arbre.find((e) => e.id === saisie.parentId) : null;
  if (saisie.parentId && !parent) throw new ErreurEntite("Entité parente introuvable.", 404);
  if (arbre.some((e) => e.code.toLowerCase() === saisie.code.toLowerCase())) {
    throw new ErreurEntite(`Le code « ${saisie.code} » est déjà utilisé.`, 409);
  }
  const id = crypto.randomUUID();
  const creee = await prisma.entite.create({
    data: {
      ...saisie,
      id,
      chemin: cheminDe(id, parent?.chemin ?? null),
      niveau: parent ? parent.niveau + 1 : 0,
    },
  });
  oublierArbre();
  return creee;
}

export async function modifierEntite(p: Perimetre, id: string, saisie: Partial<EntiteSaisie>) {
  const arbre = await chargerArbre();
  const actuelle = arbre.find((e) => e.id === id);
  if (!actuelle || !peutLire(p, id)) throw new ErreurEntite("Entité introuvable.", 404);
  // On ne déplace ni ne désactive l'entité dont on dépend soi-même.
  const sienne = !p.tout && p.entiteId === id;
  const deplacement = saisie.parentId !== undefined && saisie.parentId !== actuelle.parentId;
  if (sienne && (deplacement || saisie.isActive === false)) {
    throw new ErreurEntite("Vous ne pouvez ni déplacer ni désactiver votre propre entité.", 403);
  }
  if (saisie.code && arbre.some((e) => e.id !== id && e.code.toLowerCase() === saisie.code!.toLowerCase())) {
    throw new ErreurEntite(`Le code « ${saisie.code} » est déjà utilisé.`, 409);
  }

  if (deplacement) {
    const parentId = saisie.parentId ?? null;
    controlerParent(p, parentId);
    if (parentId && descendance(arbre, id).includes(parentId)) {
      throw new ErreurEntite("Une entité ne peut pas devenir la filiale de sa propre filiale.");
    }
    const parent = parentId ? arbre.find((e) => e.id === parentId) : null;
    const nouveauChemin = cheminDe(id, parent?.chemin ?? null);
    const ecart = (parent ? parent.niveau + 1 : 0) - actuelle.niveau;
    // Toute la descendance suit : chemin et niveau recalculés dans une transaction.
    const sousArbre = arbre.filter((e) => e.chemin.startsWith(actuelle.chemin));
    await prisma.$transaction([
      ...sousArbre.map((e) =>
        prisma.entite.update({
          where: { id: e.id },
          data: { chemin: nouveauChemin + e.chemin.slice(actuelle.chemin.length), niveau: e.niveau + ecart },
        })
      ),
      prisma.entite.update({ where: { id }, data: { ...saisie, parentId } }),
    ]);
  } else {
    const { parentId: _ignore, ...reste } = saisie;
    void _ignore;
    await prisma.entite.update({ where: { id }, data: reste });
  }
  oublierArbre();
  return prisma.entite.findUnique({ where: { id } });
}

export async function supprimerEntite(p: Perimetre, id: string) {
  const arbre = await chargerArbre();
  if (!arbre.some((e) => e.id === id) || !peutLire(p, id)) throw new ErreurEntite("Entité introuvable.", 404);
  if (!p.tout && p.entiteId === id) throw new ErreurEntite("Vous ne pouvez pas supprimer votre propre entité.", 403);
  if (arbre.some((e) => e.parentId === id)) throw new ErreurEntite("Supprimez ou déplacez d'abord ses filiales.", 409);
  const [u, c, pr] = await Promise.all([
    prisma.user.count({ where: { entiteId: id } }),
    prisma.client.count({ where: { entiteId: id } }),
    prisma.project.count({ where: { entiteId: id } }),
  ]);
  if (u + c + pr > 0) {
    throw new ErreurEntite(
      `Entité utilisée (${u} utilisateur(s), ${c} client(s), ${pr} projet(s)) : désactivez-la plutôt que de la supprimer.`,
      409
    );
  }
  await prisma.entite.delete({ where: { id } });
  oublierArbre();
}

/** Réponse HTTP d'une erreur de gestion des entités. */
export function reponseErreur(e: unknown) {
  if (e instanceof ErreurEntite) return NextResponse.json({ success: false, error: e.message }, { status: e.statut });
  throw e;
}

export async function journaliser(user: AuthPayload, action: string, details: unknown) {
  await prisma.auditLog.create({
    data: { utilisateurId: user.userId, action, details: JSON.stringify(details).slice(0, 4000) },
  });
}

