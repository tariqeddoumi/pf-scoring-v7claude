import { z } from "zod";
import { Prisma } from "@prisma/client";
import { hasMinimumRole, type UserRole } from "@/lib/permissions";
import { hasPermission } from "@/lib/services/permission-service";
import { NATURES_CREDIT, DEVISES_CREDIT } from "./codes";

/** Dossier de crédit saisi à la main (en attendant le rapatriement depuis Evolan). */
export const creditSchema = z.object({
  numero: z.string().trim().min(1, "Saisissez le numéro du dossier de crédit").max(50),
  nature: z.enum(NATURES_CREDIT, { message: "Choisissez une nature de crédit dans la liste" }),
  montant: z.number().min(0, "Montant positif ou nul").nullable().optional(),
  devise: z.enum(DEVISES_CREDIT).default("MAD"),
  dureeAns: z.number().min(0).max(99, "Durée en années (0 à 99)").nullable().optional(),
  role: z.string().trim().max(100).nullable().optional(),
  commentaire: z.string().trim().max(2000).nullable().optional(),
  ordre: z.number().int().min(0).optional(),
});
export type CreditSaisi = z.infer<typeof creditSchema>;

/** Même règle que la modification du projet : son créateur, ou à partir du responsable des risques. */
export function peutModifierProjet(role: string, userId: string, creePar: string): boolean {
  return hasPermission(role as UserRole, "project", "update")
    && (creePar === userId || hasMinimumRole(role as UserRole, "risk_manager"));
}

export function messageConflitCredit(e: unknown): string | null {
  if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") return null;
  return "Ce numéro de dossier de crédit est déjà rattaché à un projet de la banque : un crédit ne finance qu'un seul projet.";
}
