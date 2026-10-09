import { readFileSync } from "fs";
import path from "path";

/**
 * En production, ces colonnes sont de type TEXT, pas les énumérations Postgres.
 * Déclarées en énumération dans Prisma, tout filtre `in` / `not` ou toute requête
 * dans une transaction échouait (« operator does not exist: text = "EvaluationStatus" ») :
 * la sauvegarde des réponses était impossible. Le schéma doit rester aligné.
 */
const COLONNES_TEXTE: Array<[modele: string, champ: string]> = [
  ["ScoringModel", "status"],
  ["ScoringModelVersion", "status"],
  ["ScoringNode", "nodeType"],
  ["ScoringNode", "answerType"],
  ["ScoringNodeRule", "ruleType"],
  ["ScoringEvaluation", "status"],
  ["ScoringEvaluationAnswer", "answerType"],
];

const schema = readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");

function typeDuChamp(modele: string, champ: string): string | undefined {
  const bloc = schema.match(new RegExp(`^model ${modele} \\{([\\s\\S]*?)^\\}`, "m"))?.[1];
  return bloc?.match(new RegExp(`^\\s+${champ}\\s+(\\S+)`, "m"))?.[1];
}

describe("schéma Prisma aligné sur la base de production", () => {
  it.each(COLONNES_TEXTE)("%s.%s est une chaîne, comme en production", (modele, champ) => {
    expect(typeDuChamp(modele, champ)).toMatch(/^String\??$/);
  });
});
