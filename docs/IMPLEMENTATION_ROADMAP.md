# ROADMAP IMPLÉMENTATION - REFONTE SCORING
## PF SCORING V7++

---

## PHASE 0 : STABILISATION TECHNIQUE ✅ COMPLÉTÉE

**Status :** ✅ Fait  
**Durée estimée :** 2-3 jours  
**Branch :** claude/add-execution-tracking-MhV1u

### Livrables
- [x] Build Vercel OK
- [x] Build CI OK
- [x] Schéma Prisma cohérent
- [x] Client Prisma généré
- [x] Database connectivity OK (ERR_DB_001 résolu)
- [x] Login page OK
- [x] Clients CRUD OK
- [x] Projects CRUD OK (partiellement)

### Commits clés
- `983d446` — Replace __TABLE_PREFIX__ placeholders
- `8d49ea9` — Correct table prefix underscores

---

## PHASE 1 : SCHÉMA PRISMA CIBLE ⏳ EN COURS

**Status :** À démarrer immédiatement  
**Durée estimée :** 5-7 jours  
**Dépend de :** Phase 0 ✅  
**Branche recommandée :** claude/scoring-schema-v1

### Étape 1.1 : Audit du schéma existant
- [ ] Identifier toutes les tables legacy (Domain, Criterion, etc.)
- [ ] Documenter les dépendances
- [ ] Analyser les données existantes
- [ ] Décider : migrer ou paralléliser

**Livrables :**
- Document : `analysis/SCHEMA_AUDIT.md`

---

### Étape 1.2 : Création des tables cibles
**Tables à créer/modifier :**
- [ ] `ScoringModel`
- [ ] `ScoringModelVersion`
- [ ] `ScoringNode` (nouvelle structure)
- [ ] `ScoringNodeOption`
- [ ] `ScoringNodeRange`
- [ ] `ScoringNodeFormula`
- [ ] `ScoringNodeRule`
- [ ] `ScoringNodeApplicabilityRule`
- [ ] `ScoringNodeDocumentRequirement`
- [ ] `ScoringEvaluation` (adaptée)
- [ ] `ScoringEvaluationAnswer` (enrichie)
- [ ] `ScoringEvaluationNodeResult` (nouvelle)
- [ ] `ScoringChangeLog` (new)

**Livrables :**
- Migration Prisma : `20260416_scoring_schema_refactoring.sql`
- Schema Prisma mis à jour
- Types Prisma régénérés

**Validation :**
```bash
npx prisma migrate status
npx prisma generate
npx tsc --noEmit
```

---

### Étape 1.3 : Bindings et données
- [ ] Créer `ScoringNodeDataBinding`
- [ ] Créer `ScoringDataFieldRegistry` (optionnel)
- [ ] Créer `ScoringCalculatedField` (optionnel)
- [ ] Enrichir `Client` et `Project` si nécessaire

**Livrables :**
- Tables de binding créées
- Types TypeScript générés

---

### Étape 1.4 : Tests de cohérence
- [ ] Vérifier absence de cycles
- [ ] Vérifier références croisées
- [ ] Vérifier contraintes de clés étrangères
- [ ] Load test (1000 nœuds, 10000 évaluations)

**Livrables :**
- Script de validation : `scripts/validate-schema.ts`
- Rapport de test

---

## PHASE 2 : MOTEUR DE SCORING GÉNÉRIQUE ⏳ À PLANIFIER

**Status :** Après Phase 1  
**Durée estimée :** 7-10 jours  
**Branche recommandée :** claude/scoring-engine-v2

### Services à créer

#### 2.1 `ModelLoader`
**Responsabilité :** Charger la version publiée du modèle.

```typescript
interface ModelLoader {
  loadPublishedModel(modelId: string): Promise<ScoringModel>;
  loadVersion(versionId: string): Promise<ScoringModelVersion>;
  loadNodes(versionId: string): Promise<ScoringNode[]>;
}
```

---

#### 2.2 `TreeBuilder`
**Responsabilité :** Construire la hiérarchie.

```typescript
interface TreeBuilder {
  buildTree(nodes: ScoringNode[]): ScoringNodeTree;
  validateHierarchy(tree: ScoringNodeTree): ValidationResult;
}
```

---

#### 2.3 `ValueResolver`
**Responsabilité :** Résoudre les valeurs (bindings + overrides).

```typescript
interface ValueResolver {
  resolveAnswer(
    nodeId: string,
    evaluation: ScoringEvaluation,
    bindings: ScoringNodeDataBinding[]
  ): Promise<ResolvedValue>;
}
```

---

#### 2.4 `ScoreCalculator`
**Responsabilité :** Calculer le score d'un nœud.

```typescript
interface ScoreCalculator {
  scoreLeaf(node: ScoringNode, value: ResolvedValue): Score;
  scoreParent(node: ScoringNode, childScores: Score[]): Score;
  applyRules(nodeScore: Score, rules: ScoringNodeRule[]): Score;
}
```

---

#### 2.5 `AggregationEngine`
**Responsabilité :** Agréger selon la méthode choisie.

```typescript
interface AggregationEngine {
  aggregate(
    method: AggregationMethod,
    scores: Score[],
    weights?: number[]
  ): Score;
}
```

---

#### 2.6 `RuleEngine`
**Responsabilité :** Évaluer et appliquer les règles.

```typescript
interface RuleEngine {
  evaluateRules(nodeScore: Score, rules: ScoringNodeRule[]): RuleResult[];
  applyPenalties(score: Score, results: RuleResult[]): Score;
}
```

---

#### 2.7 `Explainer`
**Responsabilité :** Générer la justification.

```typescript
interface Explainer {
  explainScore(
    nodeId: string,
    score: Score,
    inputs: ResolvedValue,
    rules: RuleResult[]
  ): Explanation;
}
```

---

#### 2.8 `PersistenceService`
**Responsabilité :** Stocker les résultats.

```typescript
interface PersistenceService {
  storeNodeResult(result: ScoringEvaluationNodeResult): Promise<void>;
  storeFinalScore(evaluation: ScoringEvaluation): Promise<void>;
  storeAuditLog(log: ScoringChangeLog): Promise<void>;
}
```

---

### Processus d'évaluation
```
1. LoadPublishedModel(modelId)
   ↓
2. BuildTree(nodes)
   ↓
3. ValidateHierarchy(tree)
   ↓
4. For each node in BFS order:
   a. ResolveAnswers(node) → ResolvedValue
   b. ScoreLeaf(node, value) → rawScore
   c. EvaluateRules(rawScore) → ruleResults
   d. ApplyPenalties(rawScore) → finalScore
   e. StoreNodeResult(finalScore)
   ↓
5. For each parent node in reverse BFS:
   a. AggregateChildren(method, childScores)
   b. ScoreParent(aggregated)
   c. EvaluateRules(parentScore)
   d. ApplyPenalties(parentScore)
   e. StoreNodeResult(finalScore)
   ↓
6. CalculateFinalScore(rootScores)
   ↓
7. DetermineRating(finalScore)
   ↓
8. StoreFinalScore(evaluation)
   ↓
9. Return CompleteEvaluation
```

---

## PHASE 3 : APIS ÉVALUATION ⏳ À PLANIFIER

**Status :** Après Phase 2  
**Durée estimée :** 5-7 jours  
**Branche recommandée :** claude/scoring-apis-v3

### APIs à créer

#### 3.1 Création d'évaluation
```
POST /api/scoring/evaluations
{
  "projectId": "proj-123",
  "clientId": "client-456",
  "modelId": "model-789",
  "analystId": "user-abc"
}
→ { "id": "eval-xyz", "status": "draft" }
```

---

#### 3.2 Récupérer le formulaire
```
GET /api/scoring/evaluations/:id/form
→ {
  "nodes": [...],
  "tree": { ... },
  "bindings": { ... }
}
```

---

#### 3.3 Sauvegarder les réponses
```
PATCH /api/scoring/evaluations/:id/answers
{
  "answers": [
    {
      "nodeId": "node-1",
      "value": "option-a",
      "sourceType": "MANUAL"
    }
  ]
}
```

---

#### 3.4 Recalculer
```
POST /api/scoring/evaluations/:id/calculate
→ {
  "finalScore": 78.5,
  "rating": "A",
  "nodeResults": [...]
}
```

---

#### 3.5 Soumettre
```
POST /api/scoring/evaluations/:id/submit
→ { "status": "submitted", "submittedAt": "..." }
```

---

#### 3.6 Résultats détaillés
```
GET /api/scoring/evaluations/:id/results
→ {
  "finalScore": 78.5,
  "rating": "A",
  "byDomain": [...],
  "byNode": [...],
  "triggeredRules": [...],
  "explanations": [...]
}
```

---

## PHASE 4 : DESIGNER HIÉRARCHIQUE ⏳ À PLANIFIER

**Status :** Après Phase 2  
**Durée estimée :** 10-15 jours  
**Branche recommandée :** claude/scoring-designer-v4

### Écrans à créer

#### 4.1 Catalogue des modèles
- Liste avec recherche/filtres
- Actions : créer, dupliquer, archiver, voir versions
- Affichage des dernières modifications

#### 4.2 Gestion des versions
- Timeline des versions
- Comparaison entre versions
- Publication/retrait

#### 4.3 Designer principal
**Layout :**
- Arbre hiérarchique (gauche)
- Détail du nœud (centre)
- Panneaux latéraux (droite) :
  - Propriétés
  - Options/Ranges
  - Formules
  - Règles
  - Bindings

**Actions :**
- Ajouter nœud
- Supprimer nœud
- Déplacer nœud
- Dupliquer branche
- Convert terminal ↔ parent

#### 4.4 Paramétrage des barèmes
- UI pour options (liste de sélection)
- UI pour ranges (plages numériques)
- UI pour formules (expression builder)

#### 4.5 Paramétrage des règles
- Type de règle
- Condition
- Sévérité
- Action/pénalité
- Messages

#### 4.6 Validation en temps réel
- Affichage des erreurs
- Avertissements
- Suggestions

---

## PHASE 5 : BINDINGS CLIENT/PROJET ⏳ À PLANIFIER

**Status :** Après Phase 1 & 4  
**Durée estimée :** 5-7 jours  
**Branche recommandée :** claude/scoring-bindings-v5

### Fonctionnalités

#### 5.1 Paramétrage des bindings
- Sélectionner source (Client, Project, etc.)
- Sélectionner champ
- Mode de binding
- Priorité
- Transformation
- Valeurs par défaut

#### 5.2 Pré-remplissage automatique
- Au chargement du formulaire
- Lors du refresh
- Avec historique des versions

#### 5.3 Traçabilité
- Affichage source dans le formulaire
- Snapshot des valeurs
- Historique des changements

#### 5.4 Test des bindings
- Simulation avec données réelles
- Vérification des transformations

---

## PHASE 6 : OVERRIDES + AUDIT ⏳ À PLANIFIER

**Status :** Après Phase 3 & 5  
**Durée estimée :** 3-5 jours  
**Branche recommandée :** claude/scoring-overrides-v6

### Fonctionnalités

#### 6.1 Gestion des overrides
- Détection automatique
- Blocage des overrides si not allowed
- Exigence de raison si requis
- Sauvegarde du contexte

#### 6.2 Audit
- Qui a changé quoi
- Quand
- Pourquoi
- Valeur ancienne/nouvelle

#### 6.3 Contrôle
- Approbation par senior analyst
- Historique complet
- Rollback possible

---

## PHASE 7 : AMÉLIORATION USERS ⏳ À PLANIFIER

**Status :** Parallèle ou après Phase 3  
**Durée estimée :** 3-5 jours  
**Branche recommandée :** claude/scoring-users-v7

### Existant ✅
- [x] isActive
- [x] mustChangePassword
- [x] lastLoginAt
- [x] deletedAt
- [x] UserAuditLog

### À faire
- [ ] Permissioning par role
- [ ] Périmètre (agence, région, etc.)
- [ ] Audit des droits
- [ ] 2FA optionnel

---

## PHASE 8 : DOCUMENTATION & TESTS ⏳ À PLANIFIER

**Status :** Parallèle ou final  
**Durée estimée :** 5-7 jours  
**Branche recommandée :** claude/scoring-docs-v8

### Tests
- [ ] Unit tests (services)
- [ ] Integration tests (APIs)
- [ ] E2E tests (workflows)
- [ ] Performance tests

### Documentation
- [ ] README technique
- [ ] Guide admin
- [ ] Guide analyst
- [ ] API docs
- [ ] Troubleshooting

---

## TIMING GLOBAL

```
Phase 0 ✅                      [COMPLÉTÉE]
Phase 1 ⏳                      [5-7j]    → Avril 2026
Phase 2                         [7-10j]   → Fin avril
Phase 3                         [5-7j]    → Mai 2026
Phase 4 (parallèle 2-3)        [10-15j]  → Mi-mai
Phase 5 (parallèle 3-4)        [5-7j]    → Mai 2026
Phase 6 (parallèle 5)          [3-5j]    → Fin mai
Phase 7 (parallèle)            [3-5j]    → En parallèle
Phase 8 (final)                [5-7j]    → Juin 2026

DURÉE TOTALE ESTIMÉE : 6-8 semaines
```

---

## CRITÈRES D'ENTRÉE / SORTIE PAR PHASE

### Phase 1 : Schéma
**Entrée :**
- Phase 0 complétée ✅
- Specs validées ✅

**Sortie :**
- [ ] Migrations exécutées
- [ ] Schéma Prisma cohérent
- [ ] Types générés
- [ ] Tests passés
- [ ] Build OK

---

### Phase 2 : Moteur
**Entrée :**
- Phase 1 complétée

**Sortie :**
- [ ] Services créés et testés
- [ ] Processus d'évaluation implémenté
- [ ] Tests unitaires > 80%
- [ ] Build OK

---

### Phase 3 : APIs
**Entrée :**
- Phase 2 complétée

**Sortie :**
- [ ] APIs implémentées
- [ ] Tests intégration OK
- [ ] Documentation API
- [ ] Build OK

---

### Phases 4-8
Similaires

---

## DEPENDENCIES & BLOCKERS

### Actuellement bloquée
- Phase 1 nécessite décision sur legacy tables

### Non bloquées
- Phases 4-6 peuvent démarrer en parallèle dès phase 2 OK

### À anticiper
- Données de test pour phase 5
- Accès Supabase pour migrations

---

## PROCHAINES ÉTAPES IMMÉDIATES

### Semaine 1 (à partir de maintenant)
1. [ ] Valider le plan avec stakeholders
2. [ ] Créer branch phase 1
3. [ ] Démarrer audit du schéma existant
4. [ ] Identifier legacy vs nouveau

### Semaine 2
5. [ ] Écrire migrations Prisma
6. [ ] Créer tables cibles
7. [ ] Tester cohérence
8. [ ] Valider avec senior dev

### Semaine 3
9. [ ] Démarrer phase 2 en parallèle
10. [ ] Concevoir architecture services
11. [ ] Implémenter ModelLoader
12. [ ] Implémenter TreeBuilder

---

## CONTACTS & DÉCISIONS CLÉS

**Décisions requises :**
- [ ] Garder tables legacy pendant migration ?
- [ ] Support backward-compat requis ?
- [ ] Quels champs Client/Projet à binder ?
- [ ] Qui valide les grilles ?

**Points de revue :**
- Fin phase 1 : Revue schéma
- Fin phase 2 : Revue moteur
- Fin phase 3 : Revue APIs
- Fin phase 4 : Revue designer
- Fin phase 8 : Revue complète

---

**Document mis à jour :** 2026-04-16  
**Statut :** En cours  
**Propriétaire :** Tariq Eddoumi  
