"use client";

import { cn } from "@/lib/utils";
import { ratingBadgeClass } from "@/lib/score-colors";
import { useVoirScores } from "@/components/providers/visibilite-scores";

/**
 * Puces d'état : statut de projet, statut d'évaluation, note de crédit.
 *
 * Chaque écran redéfinissait ses propres correspondances entre statut et couleur, et
 * plusieurs affichaient la valeur brute de la base — « en_revue », « brouillon » —
 * telle quelle. Les libellés français et les couleurs sont fixés ici une fois.
 */

type Ton = "neutre" | "favorable" | "vigilance" | "alerte" | "primaire";

const TONS: Record<Ton, string> = {
  neutre: "bg-muted text-muted-foreground",
  favorable: "bg-success-subtle text-success",
  vigilance: "bg-warning-subtle text-warning",
  alerte: "bg-destructive-subtle text-destructive",
  primaire: "bg-accent text-accent-foreground",
};

/** Statuts de projet, tels qu'ils existent en base. */
const PROJET: Record<string, { libelle: string; ton: Ton }> = {
  brouillon: { libelle: "Brouillon", ton: "neutre" },
  en_cours: { libelle: "En cours", ton: "neutre" },
  en_revue: { libelle: "En revue", ton: "vigilance" },
  approuve: { libelle: "Approuvé", ton: "favorable" },
  rejete: { libelle: "Rejeté", ton: "alerte" },
};

/**
 * Statuts d'évaluation. Les clés sont les valeurs de l'énumération EvaluationStatus
 * — brouillon, soumis, valide, rejete. Les formes féminines sont tolérées : elles
 * circulent dans quelques écrans et dans les jeux d'essai.
 */
const EVALUATION: Record<string, { libelle: string; ton: Ton }> = {
  brouillon: { libelle: "Brouillon", ton: "neutre" },
  soumis: { libelle: "À valider", ton: "vigilance" },
  soumise: { libelle: "À valider", ton: "vigilance" },
  valide: { libelle: "Validée", ton: "favorable" },
  validee: { libelle: "Validée", ton: "favorable" },
  rejete: { libelle: "Rejetée", ton: "alerte" },
  rejetee: { libelle: "Rejetée", ton: "alerte" },
  archivee: { libelle: "Archivée", ton: "neutre" },
};

function Puce({ libelle, ton }: { libelle: string; ton: Ton }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold",
        TONS[ton]
      )}
    >
      {libelle}
    </span>
  );
}

export function StatutProjet({ statut }: { statut: string | null | undefined }) {
  const s = PROJET[statut ?? ""] ?? { libelle: statut || "—", ton: "neutre" as Ton };
  return <Puce libelle={s.libelle} ton={s.ton} />;
}

export function StatutEvaluation({ statut }: { statut: string | null | undefined }) {
  const s = EVALUATION[statut ?? ""] ?? { libelle: statut || "—", ton: "neutre" as Ton };
  return <Puce libelle={s.libelle} ton={s.ton} />;
}

/**
 * Note de crédit. Le score l'accompagne lorsqu'il est connu : la note seule ne dit
 * pas si le dossier est au bas ou au haut de son palier.
 */
export function Note({
  note,
  score,
  taille = "normale",
}: {
  note: string | null | undefined;
  score?: number | null;
  taille?: "normale" | "grande";
}) {
  const voirScores = useVoirScores();
  if (!voirScores) return null; // note réservée aux rôles qui voient les scores
  if (!note) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span
        className={cn(
          "rounded-md border font-bold tabulaire",
          ratingBadgeClass(note),
          taille === "grande" ? "px-3 py-1 text-base" : "px-2 py-0.5 text-[12.5px]"
        )}
      >
        {note}
      </span>
      {score !== null && score !== undefined && (
        <span className="text-[12.5px] text-muted-foreground tabulaire">
          {score.toFixed(1).replace(".", ",")}
        </span>
      )}
    </span>
  );
}
