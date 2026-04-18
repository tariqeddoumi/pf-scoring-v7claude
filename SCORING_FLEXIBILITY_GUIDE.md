# Guide d'Utilisation: Scoring Ultra-Flexible

## 🎯 Objectif

Permettre des configurations de scoring très flexibles sans modification du code :
- ✅ Réduction du nombre de domaines (9 → 6)
- ✅ Fusion de domaines
- ✅ Scoring à différents niveaux de profondeur
- ✅ Configuration par branche (D1 au niveau domaine, D2-D9 au niveau critère)

## 📋 Configuration Actuelle (Défaut)

```
Niveaux de Profondeur:
  depth=0: DOMAINS (D1, D2, D3, ...)
  depth=1: CRITERIA (D1_C1, D1_C2, ...) ← 🎯 Scoring ici
  depth=2+: Sub-criteria (futures)

Nombre de Points de Saisie:
  ✅ 9 domaines (groupes)
  ✅ 28 critères (points de saisie)
  ✅ 123 options de scoring
  ✅ 30 plages numériques
```

## 🔧 Comment Modifier la Configuration

### Cas 1: Réduire à 6 Domaines

**Via Admin Builder:**

```
1. Aller à /admin/scoring/builder
2. Supprimer 3 domaines (D7, D8, D9)
   - Clic sur 🗑️ trash icon
   - Confirmer suppression
3. Les critères de D7-D9 sont supprimés en cascade
4. Recalculer les poids des domaines restants
   - Actuels: 0.15, 0.15, 0.12, 0.12, 0.12, 0.10, 0.12, 0.06, 0.06
   - Si D7-D9 supprimés, renormaliser D1-D6:
     * Total = 0.15+0.15+0.12+0.12+0.12+0.10 = 0.76
     * Multiplier chacun par 1/0.76 = 1.316
     * Nouveaux poids: 0.197, 0.197, 0.158, 0.158, 0.158, 0.132
```

**Via SQL Direct (si urgent):**

```sql
-- Supprimer les domaines D7, D8, D9
DELETE FROM "BP_PF_v7pp_scoring_nodes"
WHERE code IN ('D7', 'D8', 'D9')
  AND "nodeType" = 'DOMAIN';

-- Les critères enfants sont supprimés en cascade
-- Recalculer les poids:
UPDATE "BP_PF_v7pp_scoring_nodes"
SET weight = weight / 0.76  -- 1 / (1 - 0.12 - 0.06 - 0.06)
WHERE "nodeType" = 'DOMAIN'
  AND depth = 0;
```

### Cas 2: Fusionner Deux Domaines

**Exemple: Fusionner D8 + D9 dans D7**

```sql
-- Reparenter tous les critères de D8 et D9 vers D7
WITH d7_id AS (
  SELECT id FROM "BP_PF_v7pp_scoring_nodes"
  WHERE code = 'D7' AND "nodeType" = 'DOMAIN'
)
UPDATE "BP_PF_v7pp_scoring_nodes" parent
SET "parentNodeId" = (SELECT id FROM d7_id)
WHERE "parentNodeId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_nodes"
  WHERE code IN ('D8', 'D9') AND "nodeType" = 'DOMAIN'
);

-- Augmenter le poids de D7
UPDATE "BP_PF_v7pp_scoring_nodes"
SET weight = 0.12 + 0.06 + 0.06  -- 0.24
WHERE code = 'D7' AND "nodeType" = 'DOMAIN';

-- Supprimer les domaines vides
DELETE FROM "BP_PF_v7pp_scoring_nodes"
WHERE code IN ('D8', 'D9') AND "nodeType" = 'DOMAIN';
```

### Cas 3: Scoring à Niveau Domaine (Un Seul Score pour D1)

**Configuration:**

```sql
-- D1 devient un point de saisie directe
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 0,  -- Scoring au niveau de ce nœud
    "isScoringLeaf" = true,
    "answerType" = 'NUMERIC_RANGE'  -- Ou OPTION_SINGLE
WHERE code = 'D1' AND "nodeType" = 'DOMAIN';

-- Les critères de D1 deviennent des groupes (pas de saisie directe)
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 0,  -- Hérité du parent
    "isScoringLeaf" = false
WHERE "parentNodeId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_nodes"
  WHERE code = 'D1' AND "nodeType" = 'DOMAIN'
);

-- D2-D9 gardent le scoring au niveau critère (depth 1)
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 1,
    "isScoringLeaf" = true
WHERE "nodeType" = 'CRITERION'
  AND "parentNodeId" IN (
    SELECT id FROM "BP_PF_v7pp_scoring_nodes"
    WHERE code IN ('D2','D3','D4','D5','D6','D7','D8','D9')
      AND "nodeType" = 'DOMAIN'
  );
```

**Résultat dans l'Interface d'Évaluation:**

```
Questionnaire de Scoring:
├─ D1: Financial Risk [📝 INPUT DIRECTE - Score 0-100]
├─ D2: Technical Risk [GROUP]
│  ├─ C2.1: Technology Maturity [📝 INPUT]
│  ├─ C2.2: EPC Contractor [📝 INPUT]
│  └─ C2.3: O&M Contractor [📝 INPUT]
├─ D3: Market Risk [GROUP]
│  ├─ C3.1: Offtake [📝 INPUT]
│  └─ ...
└─ ...
```

### Cas 4: Scoring Multi-Niveaux Hétérogène

**Configuration Complexe:**
- D1: Domaine (depth=0) ← Score ici
- D2: Critère (depth=1) ← Score ici
- D3: Sous-critère (depth=2) ← Score ici

```sql
-- D1 à niveau domaine
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 0, "isScoringLeaf" = true
WHERE code = 'D1' AND "nodeType" = 'DOMAIN';

-- D2 à niveau critère
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 1, "isScoringLeaf" = true
WHERE code = 'D2' AND "nodeType" = 'DOMAIN';

-- D3 à niveau sous-critère (créer d'abord les sous-critères)
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 2
WHERE code = 'D3' AND "nodeType" = 'DOMAIN';

-- Créer des sous-critères sous D3_C1 si nécessaire
INSERT INTO "BP_PF_v7pp_scoring_nodes" (
  id, "versionId", "parentNodeId", "nodeType", code, label, depth,
  "orderIndex", "scoreLeafDepth", "isScoringLeaf", "isActive", 
  "isScored", weight, "answerType", "createdAt", "updatedAt"
) VALUES
  (gen_random_uuid(), {VERSION_ID}, {D3_C1_ID}, 'SUBCRITERION', 
   'D3_C1_SC1', 'Sub-criterion 1', 2, 0, 2, true, true, true, 0.5, 
   'NUMERIC_RANGE', NOW(), NOW());
```

## 🧮 Logique de Calcul Automatique

Le moteur de scoring utilise automatiquement `scoreLeafDepth` pour :

1. **Déterminer les points de saisie** (scoring leaves)
   ```typescript
   const leaves = getScoringLeaves(questionnaire);
   // Retourne uniquement les nœuds où l'utilisateur doit entrer des données
   ```

2. **Calculer les scores parents**
   ```typescript
   // D1 score = saisie directe (pas d'agrégation)
   // D2 score = moyenne pondérée des critères D2_C1, D2_C2, ...
   // D3 score = moyenne pondérée des sous-critères D3_C1_SC1, ...
   ```

3. **Agrégation jusqu'au score final**
   ```
   Final Score = f(D1, D2, D3, ...) selon modèle
   ```

## 📊 Tableau Récapitulatif des Configurations

| Cas | Domaines | Niveau Scoring | Saisie | Points | Complexité |
|-----|----------|----------------|--------|--------|-----------|
| **Actuellement** | 9 | Critère (1) | 28 inputs | 28 | ✅ Simple |
| **6 domaines** | 6 | Critère (1) | 21 inputs | 21 | ✅ Simple |
| **D1 domaine, D2-9 critère** | 9 | Mixte | 1+24=25 | 25 | ⚠️ Moyen |
| **Multi-niveaux** | 9 | Profondeur 2+ | 50+ inputs | 50+ | 🔴 Complexe |

## ✅ Checklist: Modifier la Configuration

### Pour Réduire à 6 Domaines:
- [ ] Décider quels 3 domaines supprimer (D7, D8, D9?)
- [ ] Sauvegarder une snapshot de la BD avant changement
- [ ] Exécuter la suppression via Admin Builder ou SQL
- [ ] Vérifier: `SELECT COUNT(*) FROM ... WHERE "nodeType"='DOMAIN'` → 6
- [ ] Vérifier: `SELECT COUNT(*) FROM ... WHERE "nodeType"='CRITERION'` → nouveau count
- [ ] Recalculer les poids (somme = 1.0)
- [ ] Tester la création d'une évaluation
- [ ] Vérifier que les domaines restants s'affichent

### Pour Scoring Mixte (D1 domaine + autres critère):
- [ ] Identifier le domaine(s) à scorer au niveau domaine
- [ ] Ajouter un answerType à ce domaine (OPTION_SINGLE ou NUMERIC_RANGE)
- [ ] Créer les options/ranges pour ce domaine
- [ ] Mettre à jour scoreLeafDepth=0 pour ce domaine
- [ ] Vérifier que l'interface montre 1 input pour D1, plusieurs pour autres
- [ ] Tester le calcul automatique du score

## 🐛 Troubleshooting

### Problème: "Pas de critères à scorer"
```
Cause: scoreLeafDepth mal configuré
Solution: 
  SELECT * FROM "BP_PF_v7pp_scoring_nodes" 
  WHERE "isScoringLeaf" = true;
  -- Doit retourner au minimum quelques nœuds
```

### Problème: "Certains domaines n'ont pas d'inputs"
```
Cause: Tous les critères du domaine supprimés
Solution:
  -- Créer d'autres critères ou reconfigurer scoreLeafDepth
  -- Si domaine doit avoir input: scoreLeafDepth = 0
  -- Si domaine doit être vide: scoreLeafDepth = NULL + créer critères
```

### Problème: "Score final ne s'affiche pas"
```
Cause: Pas assez de scoring leaves avec données
Solution:
  -- Vérifier que au moins un critère/domaine a une réponse
  -- Vérifier que answerType est correct (OPTION_SINGLE, NUMERIC_RANGE, etc.)
```

## 📚 Fichiers Pertinents

- **Documentation:** `/FLEXIBLE_SCORING_ARCHITECTURE.md`
- **Service:** `/lib/services/scoring-leaves-service.ts`
- **Migration:** `/prisma/migrations/add_flexible_scoring_config/migration.sql`
- **Admin Builder:** `/app/admin/scoring/builder/page.tsx`
- **Evaluation Form:** `/components/scoring/EvaluationWorkspace.tsx`

## 🚀 Prochaines Étapes

1. **Appliquer la migration:** 
   ```bash
   npx prisma migrate deploy
   ```

2. **Tester avec config actuelle** (doit être identique):
   ```bash
   npm run dev
   # Créer une évaluation
   # Vérifier que 28 critères s'affichent
   ```

3. **Ajouter UI dans Admin Builder** pour configurer `scoreLeafDepth`

4. **Documenter les configurations** spécifiques à votre usage

---

**Support:** Pour des configurations spéciales, contactez l'équipe technique avec les détails exacts du modèle souhaité.
