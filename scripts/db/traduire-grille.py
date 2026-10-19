"""
Génère le SQL de traduction en français de la grille générique (constructeur) à partir
de prisma/data/traduction-grille-generique.json. Chaque valeur remplacée est d'abord
sauvegardée dans BP_PF_traduction_sauvegarde (retour arrière possible). Rejouable.

    python3 scripts/db/traduire-grille.py > /tmp/traduction.sql
"""
import json, os

ICI = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(ICI, "..", "..", "prisma", "data", "traduction-grille-generique.json"), encoding="utf-8"))
COLONNES = {
    "BP_PF_v7pp_scoring_nodes": ["label", "shortLabel", "description", "helpText"],
    "BP_PF_v7pp_scoring_options": ["label"],
    "BP_PF_v7pp_scoring_ranges": ["label"],
    "BP_PF_v7pp_scoring_rules": ["label", "description", "messageUser", "messageCommittee"],
    "BP_PF_v7pp_scoring_versions": ["label", "changeReason"],
    "BP_PF_v7pp_scoring_models": ["label", "description"],
}
q = lambda s: "'" + s.replace("'", "''") + "'"
valeurs = ",\n  ".join(f"({q(a)}, {q(b)})" for a, b in T.items())
print("""CREATE TABLE IF NOT EXISTS "BP_PF_traduction_sauvegarde" (
  "tableName" TEXT NOT NULL, "columnName" TEXT NOT NULL, "rowId" TEXT NOT NULL,
  "ancien" TEXT, "nouveau" TEXT, "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
ALTER TABLE "BP_PF_traduction_sauvegarde" ENABLE ROW LEVEL SECURITY;
CREATE TEMP TABLE trad (en TEXT PRIMARY KEY, fr TEXT NOT NULL) ON COMMIT DROP;
INSERT INTO trad VALUES
  """ + valeurs + ";")
for table, cols in COLONNES.items():
    for c in cols:
        print(f'''INSERT INTO "BP_PF_traduction_sauvegarde" ("tableName","columnName","rowId","ancien","nouveau")
  SELECT '{table}', '{c}', t.id::text, t."{c}", trad.fr FROM "{table}" t JOIN trad ON trad.en = t."{c}";
UPDATE "{table}" t SET "{c}" = trad.fr FROM trad WHERE trad.en = t."{c}";''')
