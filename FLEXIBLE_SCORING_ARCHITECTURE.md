# Architecture de Scoring Ultra-Flexible

## Vision

Permettre une configuration granulaire et flexible du scoring à différents niveaux hiérarchiques :
- **Scoring au niveau Domaine** (depth 0)
- **Scoring au niveau Critère** (depth 1) - **DÉFAUT ACTUEL**
- **Scoring au niveau Sous-critère** (depth 2+)
- **Arrêt à différents niveaux par branche**

## Concept Clé: Niveaux de Scoring

```
MODÈLE HIÉRARCHIQUE
├── D1: Financial Risk (depth=0) ─┐
│   ├── C1.1: Leverage Ratio (depth=1) ─┐
│   │   ├── SC1.1.1: Debt/Equity (depth=2)  ← Peut être scoring point
│   │   └── SC1.1.2: Senior Debt (depth=2)  ← Ou agrégé au parent
│   └── C1.2: DSCR (depth=1) ─┐
│       └── ... (depth=2+)
└── D2: Technical Risk (depth=0) ─┐
    └── ... (même structure possible)

CONCEPT:
- Chaque nœud a un "scoreLeafDepth" optionnel
- scoreLeafDepth = 0 → Score au niveau Domaine (saisie directe)
- scoreLeafDepth = 1 → Score au niveau Critère (saisie directe)
- scoreLeafDepth = 2 → Score au niveau Sous-critère (saisie directe)
- scoreLeafDepth = null → Hérité du parent
```

## Schéma Prisma Extensions

### Champs à Ajouter à ScoringNode

```sql
-- Déjà présents:
- depth: Int (0=domaine, 1=critère, 2+=sous-critères)
- isScored: Boolean (peut contribuer au score)
- isMandatory: Boolean (réponse obligatoire)

-- À AJOUTER:
- scoreLeafDepth: Int? (null=non configuré, 0/1/2=niveau d'arrêt)
- isScoringLeaf: Boolean (true=point de saisie du score)
```

### Migration

```sql
ALTER TABLE "BP_PF_v7pp_scoring_nodes" 
ADD COLUMN "scoreLeafDepth" INTEGER,
ADD COLUMN "isScoringLeaf" BOOLEAN DEFAULT false;

-- Pour l'implémentation actuelle (depth 1 = scoring)
UPDATE "BP_PF_v7pp_scoring_nodes"
SET "scoreLeafDepth" = 1,
    "isScoringLeaf" = (depth = 1 AND "nodeType" = 'CRITERION');
```

## Cas d'Usage

### Cas 1: Configuration Actuelle (Défaut)
```
✅ Saisie au niveau Critère (depth 1)
   - D1 → C1.1, C1.2, C1.3, ...
   - Chaque critère = point de saisie
   - Configuration: scoreLeafDepth = 1 pour tous
```

### Cas 2: Réduction à 6 Domaines
```
✅ Fusionner D8 + D9 dans D7
   - Paramétrable via l'admin builder
   - Modifier parentNodeId des critères
   - Recalculer les poids (0.15 + 0.12 = 0.27)
   - Configuration: scoreLeafDepth = 1 (inchangé)
```

### Cas 3: Scoring à Deux Niveaux
```
✅ D1 → Saisie au niveau Domaine (un seul score pour D1)
✅ D2-D9 → Saisie au niveau Critère
   - Configuration:
     * D1: scoreLeafDepth = 0 (domaine)
     * D2-D9: scoreLeafDepth = 1 (critère)
```

### Cas 4: Scoring Multi-Niveaux Hétérogène
```
✅ D1 → Saisie au niveau Domaine
✅ D2 → Saisie au niveau Critère
✅ D3 → Saisie au niveau Sous-critère
   - Configuration:
     * D1: scoreLeafDepth = 0
     * D2: scoreLeafDepth = 1
     * D3: scoreLeafDepth = 2
```

## Moteur de Calcul

### Déterminer les Nœuds de Saisie (Leaf Nodes)

```typescript
function getScoringLeaves(node: ScoringNode): ScoringNode[] {
  // Si ce nœud est configuré comme feuille de scoring
  if (node.isScoringLeaf) {
    return [node];
  }

  // Si ce nœud a un scoreLeafDepth défini ET on l'a atteint
  if (node.scoreLeafDepth !== null && node.depth >= node.scoreLeafDepth) {
    return [node];
  }

  // Sinon, récurser sur les enfants
  if (node.children && node.children.length > 0) {
    return node.children.flatMap(child => getScoringLeaves(child));
  }

  // Feuille de l'arbre par défaut
  return [node];
}
```

### Calcul du Score Parent

```typescript
function calculateParentScore(
  parent: ScoringNode,
  childAnswers: Record<string, number>,
  method: 'AVERAGE' | 'WEIGHTED_AVERAGE'
): number {
  const children = parent.children || [];
  
  // Ignorer les enfants qui ne sont pas des feuilles de scoring
  const scoringChildren = children.filter(c => isScoringLeaf(c));
  
  if (scoringChildren.length === 0) {
    return 0; // Pas d'enfants à scorer
  }

  const scores = scoringChildren
    .map(c => childAnswers[c.id] || 0)
    .filter(s => s !== null && s !== undefined);

  if (method === 'WEIGHTED_AVERAGE' && parent.weight) {
    const weights = scoringChildren.map(c => c.weight || 1 / scoringChildren.length);
    return scores.reduce((sum, s, i) => sum + s * weights[i], 0);
  }

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}
```

## Interface d'Évaluation

### Affichage Dynamique

```typescript
// Charger UNIQUEMENT les feuilles de scoring
const scoringLeaves = getScoringLeaves(questionnaire);

// Afficher le formulaire basé sur les feuilles, pas sur la profondeur
scoringLeaves.forEach(leaf => {
  // Créer un input pour cette feuille
  // Le libellé inclut le chemin complet (D1 > C1.1 > SC1.1.1)
  renderInput(leaf);
});

// Les domaines/critères intermédiaires sont affichés 
// comme conteneurs/groupes, mais sans input directe
```

### Exemple: D1 à Domaine, D2-D9 à Critère

```
Form Affiché:
├── D1: Financial Risk [INPUT DIRECT] ←─ scoreLeafDepth = 0
├── D2: Technical Risk [GROUP]
│   ├── C2.1: Technology Maturity [INPUT]
│   ├── C2.2: EPC Contractor Quality [INPUT]
│   └── ... (scoreLeafDepth = 1)
├── D3: Market Risk [GROUP]
│   ├── C3.1: Offtake Agreements [INPUT]
│   └── ... (scoreLeafDepth = 1)
└── ...
```

## Admin Builder Extensions

### Configuration du Niveau d'Arrêt

```typescript
// Dans le NodeModal, ajouter select pour scoreLeafDepth:
<div>
  <label>Niveau de Saisie du Score</label>
  <select value={scoreLeafDepth} onChange={...}>
    <option value="">Hérité du parent</option>
    <option value={0}>Au niveau de ce nœud (Domaine)</option>
    <option value={1}>Au niveau des enfants (Critère)</option>
    <option value={2}>Au niveau des sous-enfants (Sous-critère)</option>
  </select>
</div>

// Visualisation dans l'arborescence:
D1 [scoreLeafDepth=0] 🟢 Scoring ici
  └── C1.1 [scoreLeafDepth=null] ⚪ Hérité (agrégé)
      └── SC1.1.1 [scoreLeafDepth=null] ⚪ Hérité (agrégé)
```

## Implémentation Par Étapes

### Phase 1: Infrastructure (Flexible Dès le Départ) ✅
- ✅ Ajouter scoreLeafDepth et isScoringLeaf au schéma
- ✅ Migration: Initialiser avec depth=1 (configuration actuelle)
- ✅ Fonction getScoringLeaves() dans le service
- ✅ Tests: Vérifier que depth=1 donne les critères

### Phase 2: Interface d'Évaluation (Dynamique)
- Modifier EvaluationWorkspace pour utiliser getScoringLeaves()
- Afficher UNIQUEMENT les feuilles de scoring
- Tester avec configuration actuelle (depth=1)

### Phase 3: Admin Builder (Configuration)
- Ajouter control scoreLeafDepth dans NodeModal
- Afficher indicateur visuel du niveau de saisie
- Validation: scoreLeafDepth ≤ depth enfants

### Phase 4: Fusion/Réduction de Domaines (Opérationnel)
- Interface pour fusionner domaines
- Recalcul automatique des poids
- Re-configuration des scoreLeafDepth si nécessaire

## Avantages de cette Architecture

✅ **Très flexible** - Chaque branche peut avoir son propre comportement  
✅ **Extensible** - Support futur de profondeurs arbitraires  
✅ **Rétro-compatible** - Fonctionne avec config actuelle (depth=1)  
✅ **Maintenable** - Logique centralisée dans getScoringLeaves()  
✅ **Paramétrable** - Pas de code dur, tout en config DB  
✅ **Ultra-granulaire** - Possibilité d'ajuster par nœud, pas globalement  

## Cas d'Erreur à Gérer

```typescript
// ❌ Erreur: scoreLeafDepth > depth du nœud
if (node.scoreLeafDepth > node.depth) {
  throw new Error("scoreLeafDepth ne peut pas dépasser la profondeur du nœud");
}

// ❌ Erreur: scoreLeafDepth > depth minimum des enfants
if (node.scoreLeafDepth > Math.min(...children.map(c => c.depth))) {
  throw new Error("Pas d'enfants au niveau de profondeur demandé");
}

// ✅ Valide: scoreLeafDepth = null (hérité)
// ✅ Valide: scoreLeafDepth = 0 (ce nœud)
// ✅ Valide: scoreLeafDepth = 1 (enfants immédiats)
```

## Configuration Recommandée pour le Démarrage

```json
{
  "scoringConfiguration": {
    "defaultLeafDepth": 1,
    "description": "Scoring au niveau Critère (Domaine > Critère)",
    "domains": [
      {
        "code": "D1",
        "scoreLeafDepth": null,
        "isScoringLeaf": false
      },
      {
        "code": "D1_C1",
        "scoreLeafDepth": null,
        "isScoringLeaf": true
      }
    ]
  }
}
```

---

**Prochaines Étapes:**
1. Ajouter les champs au schéma Prisma
2. Créer la migration
3. Implémenter getScoringLeaves() dans ScoringQuestionnaireService
4. Tester avec configuration actuelle
5. Étendre l'interface d'admin builder
