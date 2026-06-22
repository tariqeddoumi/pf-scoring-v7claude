# Diagnostic technique & fonctionnel — Corrections

**Date :** 18 juin 2026
**Branche :** `claude/add-execution-tracking-MhV1u`
**Méthode :** 4 agents d'audit parallèles (moteurs/intégration, granularité, modèle de données, build/runtime).

---

## Constat central

Les Phases 2 & 3 ciblaient le **mauvais moteur**. L'UI (`EvaluationWorkspace`) appelle
`POST /api/scoring/evaluations/[id]/calculate` → **`ScoringEngineV8`**
(`lib/services/scoring/scoring-engine-v8.ts`), alors que mes changements visaient
`ScoringEngine` (`lib/services/scoring-engine.ts`) et `/api/evaluations/calculate-score`
— une route **jamais appelée** par l'UI.

➡️ Décision (validée) : **re-architecture complète** = porter granularité + sectoriel
dans le moteur LIVE, + corriger les bugs de fond.

---

## Corrections appliquées

### C1 — Granularité sans effet sur le score → CORRIGÉ
**`lib/services/scoring/scoring-engine-v8.ts`**
- Le moteur live lit désormais `getDomainGranularity()` et calcule, par domaine racine,
  le `effectiveLeafDepth`.
- Décision feuille/agrégation revue : un nœud est **feuille** si `depth >= leafDepth`
  configuré (sinon comportement par défaut basé sur `isScored`, **inchangé**).
- Ajout de `buildRootCodeMap()` (mappe chaque nœud à son domaine racine D1..D9).
- L'arbre de trace est **élagué** aux feuilles effectives (`effectiveLeafIds`).
- **UI et moteur désormais cohérents** : le questionnaire (`getQuestionnaire`, déjà
  tronqué en Phase 2) et le calcul utilisent la même config.

### C2 — Saisie au niveau DOMAINE impossible → CORRIGÉ (approche « options sur le domaine »)
- **Moteur** : un domaine en niveau DOMAINE est scoré depuis ses options/plages.
- **Éditeur admin** (`NodeDetailsPanel.tsx`) : le sélecteur **Answer Type** était masqué
  pour les nœuds à `answerType = null` (tous les domaines) → un admin ne pouvait jamais
  rendre un domaine scoreable. Désormais **toujours affiché**, avec l'option
  « Aucun (agrégation des enfants) » + OPTION_SINGLE / NUMERIC_RANGE.
- L'onglet **Options** (sans restriction de profondeur) permet alors d'ajouter les
  options de score directement sur le domaine.

### C3 — `fetch` relatif côté serveur → CORRIGÉ
- Nouveau `lib/services/scoring/sectorial.ts` lit les données V9 **directement via Prisma**
  (plus de `fetch('/api/v9/sectors')` côté serveur qui échouait silencieusement).
- Le bloc sectoriel cassé de la route morte a été **retiré**.

### C4 — `getFinalScores` cassé (moteur legacy) → CORRIGÉ
**`lib/services/scoring-engine.ts`**
- Filtre racine `nodeId.startsWith("child")` (toujours vrai) remplacé par une vraie
  détection : racines = nœuds qui n'apparaissent dans aucun `childScores`.
- `globalScore` = **vraie moyenne pondérée** (Σ score·poids / Σ poids), avec repli
  sur moyenne simple si aucun poids (au lieu de diviser par le nombre).

### Sectoriel (réintégration complète) → IMPLÉMENTÉ NATIVEMENT
**`lib/services/scoring/scoring-engine-v8.ts` + `sectorial.ts`**
- Derrière `isSectorialEnabled()` : résolution du secteur du projet
  (`Project.secteur`, matching tolérant code/label car champ texte libre) vers `V9Sector`.
- **Poids sectoriels** : les facteurs `V9SectorDomainWeight.weightAdjusted` (multiplicateurs
  0.8–1.2) repondèrent les domaines dans le score global.
- **Échelle cohérente** : tout reste en 0–100 (corrige H3 ; plus de mélange 1–10/0–100).
- La trace expose `sectorial` : `{ sectorCode, sectorLabel, baseScore, adjustedScore,
  weightFactors, redFlags, stressTests }` (red flags & stress tests **listés** à titre
  informatif). Retourné aussi dans la réponse de la route live.

### H2 / H3 — Mismatch V9→V8 & échelles → CORRIGÉS
- Le pont V9→V8 (`as any`, `domainImpacts=[]`, champs incompatibles) est **supprimé** ;
  remplacé par le calcul natif ci-dessus. Échelle unifiée 0–100.

### M1 — Admin config : 404 au 1er enregistrement + cache périmé → CORRIGÉ
**`app/api/admin/configuration/[key]/route.ts`**
- Le PUT passe désormais par `setAppConfig()` → **upsert** (plus de 404), écriture
  d'historique, et **invalidation du cache** (effet immédiat sur moteur/écrans).

---

## Points restants / connus

- **H1 (deux systèmes d'évaluation `Evaluation` vs `ScoringEvaluation` sans FK)** :
  le **parcours live** est cohérent (tout sur `ScoringEvaluation`). La route legacy
  `/api/evaluations/calculate-score` est **dépréciée** (non appelée par l'UI) ; son
  mélange de tables est documenté. Une unification complète nécessite une migration de
  données dédiée — **hors périmètre de ce correctif sûr**.
- **Secteur projet = texte libre** : le matching est tolérant, mais pour fiabiliser la
  réintégration sectorielle, l'écran Projet devrait proposer un **sélecteur de secteur**
  alimenté par `V9Sector` (à intégrer en Phase 4 — écrans paramétrables).
- **Red flags / stress tests sectoriels** : listés dans la trace mais **non auto-évalués**
  (les `V9RedFlag`/`V9StressTest` sont un catalogue sans condition de déclenchement).
  Les malus restent gérés par le système de règles existant (`ScoringNodeRule` /
  `APPLY_MALUS`). Une auto-évaluation nécessiterait des conditions de déclenchement.

---

## Validation

- `npx tsc --noEmit` : **0 erreur**
- `npm run build` : **succès** (114 pages, exit 0)
- Non-cassant : tous les défauts (sectoriel OFF, granularité `{}`) ⇒ comportement
  **strictement identique** à l'actuel.

## Fichiers touchés

| Fichier | Nature |
|---------|--------|
| `lib/services/scoring/scoring-engine-v8.ts` | Granularité + sectoriel natifs (moteur LIVE) |
| `lib/services/scoring/sectorial.ts` | **NEW** — résolution secteur V9 via Prisma |
| `app/api/scoring/evaluations/[id]/calculate/route.ts` | Expose `sectorial` dans la réponse |
| `app/admin/scoring-grid-v7pp/components/NodeDetailsPanel.tsx` | Answer Type toujours éditable (C2) |
| `lib/services/scoring-engine.ts` | Fix `getFinalScores` (C4) |
| `app/api/admin/configuration/[key]/route.ts` | upsert + invalidation cache (M1) |
| `app/api/evaluations/calculate-score/route.ts` | Dépréciée, bloc sectoriel cassé retiré (C3) |
