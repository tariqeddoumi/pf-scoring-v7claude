# Phase 3 — Réintégration sectorielle (Design avant implémentation)

**Date :** 18 juin 2026
**Objectif :** Intégrer automatiquement le calibrage sectoriel (V8) dans le calcul du score global, derrière le toggle `SCORING_SECTORIAL_ENABLED`.

## Architecture

### Fonctionnement

**Entrée :** Évaluation complétée avec réponses aux nœuds de scoring

**Processus :**
```
1. Calcul du socle V7++ (scoring canonique)
   → globalScore, domainScores, rating

2. Si SCORING_SECTORIAL_ENABLED = true :
   a) Récupère project.secteur
   b) Cherche V9Sector par code
   c) Applique V8ScoringEngine.applyV8Adjustments() :
      - Poids sectoriels (V9SectorDomainWeight)
      - Red flags (V9RedFlag) → NO-GO ou malus
      - Stress tests (V9StressTest) → malus on failure
      - Malus/Bonus (V9MalusBonus) avec anti-cumul
   d) Retourne score ajusté + détails ajustements

3. Sinon :
   → Retour score socle pur (V7++)

4. Enregistre finalScore + rating ajusté
```

### Source de vérité

**Toggle principal :** `SCORING_SECTORIAL_ENABLED` (AppConfiguration)
- Type : bool
- Défaut : false (comportement actuel préservé)
- Admin : `/admin/configuration` → catégorie "Moteur de scoring"

**Secteur du projet :** `Project.secteur` (string)
- Exemples : "ENR", "EAU", "TRA", "POR", "IND", "MIN", "TOU", "TEL", "SAN", "AGR", "ETH", "IMM"
- NULL acceptable → secteur non reconnu, ignore sectoriel

**Données V8 :**
- V9Sector : sectorCode, description, thresholds
- V9SectorDomainWeight : sectorId, domainCode, baseWeight, weightAdjusted, reason
- V9RedFlag : sectorId, code, severity, penalty, isNOGO
- V9StressTest : sectorId, variableName, shockPercentage, passDscrMinimum
- V9MalusBonus : sectorId, code, baseAmount, capPerDomain, capGlobal, nonCumulGroup
- V9AntiDoubleCount : malusId, penaltyId, rule

## Implémentation

### Modificateurs de fichiers

#### 1. lib/services/scoring-engine.ts

**Ajouter importations :**
```typescript
import { isSectorialEnabled } from "@/lib/services/scoring-config-service";
import { V8ScoringEngine } from "@/lib/scoring-engine-v8";
import { V9SectorsService } from "@/lib/services/v9-sectors-service";
```

**Modifier scoreEvaluation() :**
```typescript
// Après scoreEvaluation() actuelle, avant retour
const sectorialEnabled = await isSectorialEnabled();
if (sectorialEnabled) {
  // Enrichir results avec données sectoriales
  // (voir Phase 4 pour stockage)
}
```

**IMPORTANT :** Le scoring-engine.ts fait le calcul récursif. Si on veut appliquer sectoriel ici, il faudrait:
- Passer effectiveLeafDepth ET sectorialConfig aux nœuds
- Modifier aggregateChildScores() pour utiliser les poids sectoriels si disponibles

Mais attendez, ça pourrait compliquer excessivement le moteur. Meilleure approche : appliquer sectoriel **après** que le moteur ait terminé (dans la route).

#### 2. app/api/evaluations/calculate-score/route.ts (OU nouvelle route)

**Approach 1 : Modifier la route existante**
```typescript
// Après ScoringEngine.getFinalScores()

const sectorialEnabled = await isSectorialEnabled();
let finalScore = globalScore;
let finalRating = rating;
let sectorialResult = null;

if (sectorialEnabled) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: { project: true }
  });

  if (evaluation?.project?.secteur) {
    const sector = await V9SectorsService.getSectorByCode(evaluation.project.secteur);
    if (sector) {
      const adjustedResult = await V8ScoringEngine.applyV8Adjustments(
        { /* base result from scoring engine */ },
        sector,
        evaluation.project
      );
      finalScore = adjustedResult.finalScore;
      finalRating = adjustedResult.rating;
      sectorialResult = {
        secteur: evaluation.project.secteur,
        adjustments: adjustedResult.v8Adjustment,
        detail: "Calibrage sectoriel appliqué"
      };
    }
  }
}

// Update evaluation
await EvaluationService.updateEvaluation(
  evaluationId,
  { finalScore, rating: finalRating },
  user.userId
);

// Return with sectoriel detail
return NextResponse.json({
  data: {
    finalScore,
    rating: finalRating,
    scores,
    sectorielApplique: sectorialEnabled && sectorialResult,
    sectorialResult // Detail des ajustements
  }
});
```

**Approach 2 : Nouvelle route "full flow"**
```
POST /api/evaluations/calculate-score-full
- Accepte evaluationId + answers
- Sauvegarde answers
- Calcule socle
- Si SCORING_SECTORIAL_ENABLED, applique sectoriel
- Retourne résultat final avec détails
```

Prefer Approach 1 (modifier existant) pour minimiser les changements.

## Détails techniques

### Matching secteur

```typescript
// Dans applyV8Adjustments(), ou avant l'appel :
const sectorCode = project.secteur; // "ENR", "EAU", etc.
const sector = await prisma.v9Sector.findFirst({
  where: { code: sectorCode }
});

if (!sector) {
  console.warn(`Sector ${sectorCode} not found in V9 database`);
  // Continue with base score (graceful degradation)
}
```

### Agrégation des ajustements

V8 retourne un `V8ScoringResult` qui contient :
- `adjustments`: Object avec clés par domaine, values = delta de score
- `totalAdjustment`: Somme de tous les ajustements
- `finalScore`: globalScore + totalAdjustment
- `rating`: Mapping finalScore → rating (AAA, AA, etc.)

### Audit trail

Enregistrer dans AppConfigHistory ou nouveau log si sectorial appliqué:
```
- evaluationId
- sectorCode
- baseScore
- adjustments (JSON)
- finalScore
- appliedAt
```

## Sortie enrichie

Format JSON retourné par la route :
```json
{
  "finalScore": 75,
  "rating": "A",
  "scores": { "D1": 85, "D2": 65, ... },
  "sectorielApplique": true,
  "sectorCode": "ENR",
  "sectorName": "Énergies Renouvelables",
  "adjustments": {
    "domainWeights": { "D1": +3, "D2": -2, ... },
    "redFlags": ["FLAG_001: Risque géopolitique", ...],
    "stressTests": [{ name: "DSCR Stress -20%", penalty: -5, ... }],
    "malus": [{ code: "M1", amount: -3, ... }],
    "bonus": []
  },
  "traceabilite": {
    "version": "V8+",
    "appliedAt": "2026-06-18T10:30:00Z",
    "analyst": "user@example.com"
  }
}
```

## Cas limites

### Secteur NULL ou inconnu
```
if (!project.secteur || !sector) {
  // Ignore sectoriel, retourne socle
  // Log warning
}
```

### Score < 0 après ajustements
```
finalScore = Math.max(0, adjustments);
// Log as clamped
```

### Stress test failure
```
// Applique malus selon V9StressTest.penalty
// Si penalty = NO-GO, rating = "D"
```

### Anti-cumul
```
// V9AntiDoubleCount empêche cumul de certains malus
// Exemple: M1 + M2 ne peuvent s'appliquer ensemble
```

## Non-breaking compatibility

✅ **Défaut = false** → Aucun changement tant que l'admin n'active pas
✅ **Graceful degradation** → Secteur inconnu = ignore sectoriel
✅ **Pas de migration DB** → Utilise V9 tables existantes

## Tests recommandés

1. **Config OFF** (défaut)
   - Évaluation normale → score = socle uniquement

2. **Config ON + secteur trouvé**
   - Évaluation pour secteur "ENR" → score = socle + ajustements ENR

3. **Config ON + secteur NULL**
   - Project sans secteur → graceful degrade, score = socle

4. **Config ON + secteur inconnu**
   - Project avec secteur invalide → log warning, score = socle

5. **Stress test fail**
   - Doit appliquer malus configuré

6. **NO-GO triggered**
   - Rating = "D", finalScore = 0 ou malus majeur

## État

⏳ À implémenter (prêt pour développement)

**Fichiers à modifier :**
- app/api/evaluations/calculate-score/route.ts
- (optionnel) lib/services/scoring-engine.ts si enrichissement interne

**Fichiers à créer :**
- (optionnel) Tests unitaires pour V8 integration

**Risque :** Élevé (logique complexe, impact sur score final)

## Dépendances

✅ Phase 1 : AppConfiguration + keys (SCORING_SECTORIAL_ENABLED)
✅ Phase 2 : Granularité (non dépendante, mais compatible)
⏳ Phase 3 : Sectoriel (THIS)
⏳ Phase 4 : Écrans (indépendante)
