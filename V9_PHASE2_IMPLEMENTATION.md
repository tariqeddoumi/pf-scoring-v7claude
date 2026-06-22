# Phase 2 — Granularité du scoring par domaine (✅ Implémentée)

**Date :** 18 juin 2026
**Branche :** `claude/add-execution-tracking-MhV1u`

## Objectif

Permettre à chaque domaine d'être configuré avec son propre niveau de saisie :
- **DOMAIN** (depth 0) : 9 entrées totales, une par domaine
- **CRITERION** (depth 1) : 28 entrées, une par critère (défaut, comportement actuel)
- **SUB_CRITERION** (depth 2) : 84+ entrées, niveau maximum de détail

## Architecture

### Source de vérité (hiérarchie)

```
SCORING_DOMAIN_GRANULARITY (config admin)
    ↓ (override)
ScoringNode.scoreLeafDepth (valeur DB par nœud)
    ↓ (défaut)
Défaut global (CRITERION = depth 1)
```

### Flux d'intégration

#### 1. Questionnaire (UI input) — `scoring-questionnaire-service.ts`

**Changement :** La méthode `getQuestionnaire(modelVersionId)` tronque maintenant l'arbre en fonction du leafDepth configuré pour chaque domaine.

```typescript
// Avant : retournait l'arbre complet
// Après : 
1. Pour chaque domaine racine (depth 0)
2. Récupère son leafDepth : getDomainLeafDepth(domainCode)
3. Appelle buildScoringLeafTree(node, leafDepth)
4. Retourne l'arbre tronqué
```

**Résultat :** L'UI n'affiche que les nœuds jusqu'au niveau configuré.

#### 2. Moteur de scoring (agrégation) — `scoring-engine.ts`

**Changement :** La méthode `scoreNodeRecursive()` respecte maintenant le leafDepth pendant le calcul.

```typescript
// Avant : 
if (childScores.length > 0 && node.aggregationMethod) {
  // agréger
} else {
  // scorer comme feuille
}

// Après :
const isAtLeafDepth = node.depth >= effectiveLeafDepth;
if (!isAtLeafDepth && childScores.length > 0 && node.aggregationMethod) {
  // agréger
} else {
  // scorer comme feuille (même s'il y a des enfants en DB)
}
```

**Résultat :** Un nœud au leafDepth configuré est traité comme une feuille (lire la réponse directe) même s'il a des enfants en base de données.

#### 3. Interface admin — `app/admin/scoring/granularity/page.tsx` (NEW)

**Composant client React** affichant :
- Liste de tous les domaines
- Pour chaque domaine : sélecteur déroulant (DOMAIN / CRITERION / SUB_CRITERION)
- Description brève du niveau sélectionné
- Bouton Enregistrer

**API :** 
- GET `/api/admin/configuration/SCORING_DOMAIN_GRANULARITY` : récupère la config
- PUT `/api/admin/configuration/SCORING_DOMAIN_GRANULARITY` : enregistre la config en JSON

#### 4. Récupération des domaines — `app/api/scoring/domains/route.ts` (NEW)

**API admin-only** retournant tous les domaines (nœuds depth 0) du modèle publié.

Utilisée par l'interface granularité pour afficher la liste des domaines.

#### 5. Menu admin — `app/admin/page.tsx` (MODIFIÉ)

**Ajout :** Nouvelle section "Granularité du Scoring ★" redirigeant vers `/admin/scoring/granularity`.

## Stockage de la configuration

Format JSON dans la clé `SCORING_DOMAIN_GRANULARITY` :

```json
{
  "D1": "CRITERION",
  "D2": "DOMAIN",
  "D3": "SUB_CRITERION",
  "D4": "CRITERION"
}
```

Chaque clé = code domaine, chaque valeur = niveau de saisie choisi.

**Défaut :** `{}` (tous les domaines utilisent le défaut global = CRITERION)

## Compatibilité

✅ **Totalement non-cassante** :
- Défaut = CRITERION (comportement actuel préservé à 100%)
- Admins activent progressivement par domaine
- Aucune migration DB nécessaire
- Aucune dépendance déployée (utilise infrastructure existante)

## Fichiers modifiés

| Fichier | Changements |
|---------|-------------|
| `lib/services/scoring-questionnaire-service.ts` | Import + getDomainLeafDepth + buildScoringLeafTree, troncature arbre |
| `lib/services/scoring-engine.ts` | Import + getDomainLeafDepth, paramètre effectiveLeafDepth, check isAtLeafDepth |
| `app/admin/scoring/granularity/page.tsx` | **NEW** composant UI |
| `app/api/scoring/domains/route.ts` | **NEW** API domaines |
| `app/admin/page.tsx` | Ajout section menu |

## Tests manuels recommandés

1. **Admin** : `/admin/scoring/granularity`
   - Vérifier affichage des domaines
   - Changer un domaine en "DOMAIN"
   - Enregistrer et recharger → vérifier persistance

2. **Scoring UI** : `/projects/[id]/scoring`
   - Créer/modifier une évaluation
   - Vérifier que le questionnaire reflète le niveau configuré
   - Si D2 = DOMAIN, devrait afficher D2 comme feuille, pas ses critères

3. **Moteur** : Calcul des scores
   - Modifier réponses
   - Vérifier que le score agrège depuis le bon niveau (leafDepth)

## État

✅ **COMPLET** : Tous les fichiers implémentés et committés

```
TypeScript: 0 erreurs
Git: Commit 2fd88ff
Branch: claude/add-execution-tracking-MhV1u
```

## Phase suivante

**Phase 3 — Réintégration sectorielle** : Intégrer V8ScoringEngine dans le moteur canonique, derrière le toggle `SCORING_SECTORIAL_ENABLED`.
