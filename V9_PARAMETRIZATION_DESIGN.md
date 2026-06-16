# V9+ — Paramétrage profond : calibrage sectoriel, granularité de saisie, écrans

**Date :** 16 juin 2026
**Branche :** `claude/add-execution-tracking-MhV1u`
**Décisions produit (validées) :**
1. **Calibrage sectoriel** = *réintégration complète* derrière un toggle. ON → le sectoriel entre dans le score global (poids sectoriels + red flags/no-go + stress tests + malus/bonus). OFF → socle V7++ pur.
2. **Granularité de saisie** = *par domaine, très flexible*. Chaque domaine choisit son niveau de saisie (domaine / critère / sous-critère) ; la saisie se fait par sélection de valeurs au niveau choisi, sans descendre plus bas.
3. **Écrans Signalétique & Projet** = *ultra-paramétrables* : visibilité + ordre + libellés, requis/optionnel, champs personnalisés, listes de valeurs paramétrables.

---

## 1. État des lieux (analyse profonde)

### 1.1 Moteurs de scoring présents
| Fichier | Rôle | Statut |
|--------|------|--------|
| `lib/services/scoring-engine.ts` (`ScoringEngine`) | **Moteur canonique** : récursif sur `ScoringNode` + `ScoringEvaluationAnswer`, agrégation paramétrable (WEIGHTED_AVERAGE, MIN, MAX, SUM…), application de règles | **Actif** (chemin DB, alimenté par `ScoringQuestionnaireService`) |
| `lib/scoring-engine.ts` | Modèle codé en dur `SCORING_MODEL` (9/28/84) | Legacy / parallèle |
| `lib/scoring-engine-v8.ts` (`V8ScoringEngine.applyV8Adjustments`) | Ajustements sectoriels (poids, red flags, stress, malus) | **Écrit mais non branché par défaut** |
| `lib/services/v9-sectors-service.ts` | Lecture des secteurs V9 (thresholds, weights, red flags, indicateurs, stress) | Actif (API `/api/v9/sectors`) |

> **Conséquence** : le sectoriel est déjà disponible côté données et logique V8 — il manque le **branchement paramétrable** dans le moteur canonique.

### 1.2 Granularité — déjà supportée côté données
- `ScoringNode.scoreLeafDepth` (Int) et `ScoringNode.isScoringLeaf` (Bool) existent.
- `lib/services/scoring-leaves-service.ts` sait construire l'arbre de saisie à n'importe quel niveau (`isScoringLeaf`, `getScoringLeaves`, `buildScoringLeafTree`).
- Convention de profondeur : `depth 0 = domaine`, `1 = critère`, `2 = sous-critère`.

> **Conséquence** : il faut **piloter `scoreLeafDepth` par domaine via le paramétrage** et faire respecter ce niveau par l'UI de saisie et l'agrégation.

### 1.3 Écrans — système de champs déjà construit, non câblé
- Modèles `FormSection`, `FieldConfiguration`, `FormPreset` (schema.prisma) + admin `app/admin/field-management/page.tsx` + `lib/services/field-config-service.ts` + défauts `lib/field-config.ts` (`PROJECT_SECTIONS`).
- **MAIS** : `app/projects/new`, `[id]/edit`, `[id]` rendent **64+ champs en dur** (onglets, libellés, types, listes), sans consommer ce système ni `useAppConfig`.

> **Conséquence** : Phase 4 = **câbler** les écrans projet sur l'existant (rendu dynamique depuis `FieldConfiguration`), + listes de valeurs et champs custom.

### 1.4 Paramétrage global
- `AppConfiguration` (clé/valeur typée + `AppConfigHistory`) + `app-config-service.ts` (cache 5 min) + admin `app/admin/configuration/page.tsx`.
- Contraintes `CHECK` DB : `category ∈ {branding,theme,behavior}`, `type ∈ {string,color,url,enum,bool,number}`.

---

## 2. Plan par phases

| Phase | Livrable | Risque | Statut |
|------|----------|--------|--------|
| **1** | Fondation paramétrage : extension contraintes, clés de config, service typé, admin | Faible | ✅ **Fait** |
| **2** | Granularité par domaine pilotée par config + UI de saisie + agrégation | Moyen | ⏳ À venir |
| **3** | Réintégration sectorielle paramétrable dans `ScoringEngine` | Élevé | ⏳ À venir |
| **4** | Écrans Signalétique/Projet rendus dynamiquement (FieldConfiguration) | Moyen | ⏳ À venir |

---

## 3. Phase 1 — Fondation (livrée)

**Migration** `prisma/migrations/20260616000000_parametrization_extensions/migration.sql`
- Élargit `category` → ajoute `scoring`, `screens`.
- Élargit `type` → ajoute `json`.
- Insère (idempotent) les 3 nouvelles clés.

**Nouvelles clés `AppConfiguration`**
| Clé | Type | Catégorie | Défaut | Effet |
|-----|------|-----------|--------|-------|
| `SCORING_SECTORIAL_ENABLED` | bool | scoring | `false` | Réintégration sectorielle ON/OFF |
| `SCORING_DOMAIN_GRANULARITY` | json | scoring | `{}` | Niveau de saisie par domaine `{ code: "DOMAIN"\|"CRITERION"\|"SUB_CRITERION" }` |
| `SCREENS_DYNAMIC_FORMS_ENABLED` | bool | screens | `false` | Rendu des écrans projet depuis `FieldConfiguration` |

> Défauts **non-breaking** : OFF/vide ⇒ comportement actuel inchangé.

**Service typé** `lib/services/scoring-config-service.ts`
- `isSectorialEnabled()`, `getDomainGranularity()`, `getDomainGranularityLevel(code)`, `getDomainLeafDepth(code)`, `getScoringConfig()`.
- `GRANULARITY_DEPTH` : `DOMAIN→0`, `CRITERION→1`, `SUB_CRITERION→2`.

**Admin** `app/admin/configuration/page.tsx`
- Catégories `scoring` / `screens` affichées (libellés FR « Moteur de scoring » / « Écrans & formulaires »).
- Rendu des types `bool` (Activé/Désactivé) et `json` (textarea mono).

**Seed** : 3 clés ajoutées à `prisma/migrations/v9_source_data.json` (reprises par `seed-v9.ts`).

---

## 4. Conception des phases suivantes (pour exécution)

### Phase 2 — Granularité par domaine
- **Source de vérité** : `SCORING_DOMAIN_GRANULARITY` (override admin) **>** `ScoringNode.scoreLeafDepth` (défaut par nœud) **>** défaut global (critère).
- **Construction du questionnaire** (`ScoringQuestionnaireService.getQuestionnaire`) : tronquer l'arbre au `leafDepth` effectif du domaine ; marquer le nœud du niveau choisi comme feuille de saisie (sélection de valeurs/options à ce niveau).
- **Agrégation** (`ScoringEngine`) : un nœud devient feuille s'il atteint le `leafDepth` du domaine, même s'il a des enfants → on lit l'`answer` au lieu d'agréger plus bas.
- **UI** (`EvaluationWorkspace` / `CriteriaTree` / `NodeInput`) : n'afficher des inputs qu'aux feuilles effectives ; les niveaux choisis « DOMAIN » et « CRITERION » exposent des options de score directes.
- **Admin** : éditeur dédié (liste des domaines + select de niveau) écrivant le JSON `SCORING_DOMAIN_GRANULARITY`.

### Phase 3 — Réintégration sectorielle
- **Pré-calcul socle** inchangé (`ScoringEngine.scoreEvaluation`).
- Si `isSectorialEnabled()` :
  1. Résoudre le secteur du projet (`project.secteur` → `V9Sector.code`).
  2. **Poids** : remplacer les poids de domaine par `V9SectorDomainWeight.weightAdjusted`.
  3. **Red flags / no-go** : appliquer `V9RedFlag` (no-go ⇒ rejet ; sinon malus `penalty`).
  4. **Stress tests** : `V9StressTest` (variable, shockPct, passDscrMin) → malus si échec.
  5. **Malus/Bonus** : `V9MalusBonus` avec `capPerDomain`/`capGlobal`/`nonCumulGroup` (anti-cumul) + `V9AntiDoubleCount`.
- Si OFF : retour du score socle pur. Sortie enrichie (`summaryJson`) traçant base vs sectoriel.

### Phase 4 — Écrans ultra-paramétrables
- Composant générique `DynamicEntityForm` consommant `getFormSections(entity)` + `FieldConfiguration` (visibilité, ordre, libellé, requis, type, options).
- Listes de valeurs : tables référentielles existantes (`Sector`, `LegalForm`, `ClientType`, …) éditables en admin → alimentent les `select`.
- Champs personnalisés : `FieldConfiguration` custom + stockage JSON sur l'entité (ou table d'attributs) ; valeurs rendues/validées dynamiquement.
- Bascule progressive via `SCREENS_DYNAMIC_FORMS_ENABLED` (fallback formulaire actuel tant que OFF).

---

## 5. Compatibilité & déploiement
- Tous les défauts laissent le comportement **strictement identique** à l'actuel tant que l'admin n'active rien.
- Déploiement : `npx prisma migrate deploy` (applique 20260613 puis 20260616) → `npm run db:seed:v9`.
- `npx tsc --noEmit` : **0 erreur** après Phase 1.
