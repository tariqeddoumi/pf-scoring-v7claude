import { z } from "zod";

export const projectSchema = z.object({
  nom: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(200, "Le nom ne peut pas dépasser 200 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  secteur: z.string().min(1, "Le secteur est requis"),
  montant: z
    .number()
    .positive("Le montant doit être positif")
    .max(100_000_000_000, "Montant maximum dépassé"),
});

export const scoreComponentSchema = z.object({
  categorie: z.enum([
    "financier",
    "technique",
    "marche",
    "environnemental",
    "social",
    "gouvernance",
    "juridique",
    "pays",
  ]),
  score: z.number().min(0).max(100),
  ponderation: z.number().min(0).max(1),
  commentaire: z.string().optional(),
});

export const scoringSubmissionSchema = z.object({
  projectId: z.string().uuid(),
  composantes: z
    .array(scoreComponentSchema)
    .min(1, "Au moins une composante est requise"),
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type ScoreComponentInput = z.infer<typeof scoreComponentSchema>;
export type ScoringSubmissionInput = z.infer<typeof scoringSubmissionSchema>;
