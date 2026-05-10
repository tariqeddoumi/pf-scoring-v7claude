CREATE TABLE IF NOT EXISTS "scoring_rating_buckets" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "minScore" DOUBLE PRECISION NOT NULL,
  "maxScore" DOUBLE PRECISION NOT NULL,
  "rating" TEXT NOT NULL,
  "riskLevel" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "decisionPolicy" TEXT,
  "color" TEXT,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "scoring_rating_buckets" ("id", "minScore", "maxScore", "rating", "riskLevel", "recommendation", "color", "orderIndex") VALUES
  ('rtb-aaa', 90, 100, 'AAA', 'Risque très faible', 'Financer', '#15803d', 1),
  ('rtb-aa', 80, 89.99, 'AA', 'Risque faible', 'Financer', '#22c55e', 2),
  ('rtb-a', 70, 79.99, 'A', 'Risque acceptable', 'Financer avec conditions mineures', '#86efac', 3),
  ('rtb-bbb', 60, 69.99, 'BBB', 'Risque modéré', 'Financer avec conditions', '#fbbf24', 4),
  ('rtb-bb', 50, 59.99, 'BB', 'Risque élevé', 'Analyse approfondie requise', '#f97316', 5),
  ('rtb-b', 40, 49.99, 'B', 'Risque très élevé', 'Financer sous conditions strictes', '#ef4444', 6),
  ('rtb-ccc', 30, 39.99, 'CCC', 'Risque critique', 'Refus recommandé', '#dc2626', 7),
  ('rtb-d', 0, 29.99, 'D', 'Défaut probable', 'Refuser', '#991b1b', 8);
