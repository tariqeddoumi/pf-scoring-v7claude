# 📋 Audit d'Alignement Backend/Frontend/Database - Scoring

**Date:** Avril 2026  
**Statut:** Diagnostic complet

---

## 🟢 CE QUI FONCTIONNE BIEN

### Frontend (EvaluationWorkspace)
✅ **Listes déroulantes** pour OPTION_SINGLE (90% des critères)
✅ **Champs numériques** pour NUMERIC_RANGE avec plages visuelles
✅ **Real-time scoring** avec calcul instant des scores
✅ **UI conviviale** avec 3 colonnes (sidebars + workspace)
✅ **Auto-save** avec debouncing (3 secondes)

### Backend (API)
✅ POST `/api/scoring/evaluations` crée ScoringEvaluation
✅ PATCH `/api/scoring/evaluations/[id]/answers` sauvegarde les réponses
✅ POST `/api/scoring/evaluations/[id]/calculate` calcule les scores
✅ GET `/api/scoring/questionnaire` retourne la structure complète

### Database
✅ **39 nœuds** (9 domaines + 30 critères) ✓
✅ **100 options** avec scores ✓
✅ **25 ranges** numériques ✓
✅ Hiérarchie `DOMAIN → CRITERION` maintenue ✓

---

## 🔴 PROBLÈMES & DÉSALIGNEMENTS

### 1. **Admin Paramétrage Scoring** (Critique)
**Problème:** Pas d'interface pour modifier/créer critères dynamiquement
- ❌ `/admin/scoring-grid` lit la table legacy vide (`BP_PF_scoring_criteria`)
- ❌ `/admin/scoring` affiche READ-ONLY (pas d'édition)
- ❌ Pas de CRUD pour ajouter/modifier critères
- ❌ Pas d'interface pour ajouter options/ranges

**Impact:** Administrateur doit faire SQL direct pour modifier le modèle

### 2. **Questionnaire API Structure** (Moyen)
**Problème:** API retourne une structure qui n'est pas optimale
```typescript
// Frontend attend
{
  id, code, label, options, ranges, children
}

// API retourne AUSSI
{
  depth, nodeType, scoringMethod, defaultValue
}

// MANQUENT
{
  parentNodeId, displayPath, isMandatory, isScoringMethod
}
```

### 3. **Types TypeScript Incohérents** (Moyen)
**Backend (Prisma):**
```typescript
answerType: ScoringAnswerType (ENUM)
  - OPTION_SINGLE, OPTION_MULTI, BOOLEAN, NUMERIC_RANGE, etc.
```

**Frontend (QuestionnaireNode):**
```typescript
answerType?: string (STRING optionnel)
```

→ Pas de validation stricte des types

### 4. **Flexibility Paramétrage** (Critique)
**Admin ne peut pas:**
- ❌ Ajouter/supprimer domaines
- ❌ Ajouter/supprimer critères
- ❌ Modifier les poids
- ❌ Ajouter/modifier options (scores)
- ❌ Ajouter/modifier ranges
- ❌ Modifier ordre des critères
- ❌ Activer/désactiver critères

**Solution:** Interface CRUD complète requise

### 5. **Validation Métier** (Moyen)
**Actuellement:**
- ✅ Backend valide les modèles existent
- ❌ Pas de validation que la somme des poids = 1.0
- ❌ Pas de validation que options/ranges couvrent toutes les valeurs
- ❌ Pas de validation que les critères ont EXACTEMENT options OU ranges

### 6. **Audit & Traçabilité** (Léger)
- ✅ Evaluation answers are tracked
- ❌ Pas d'historique quand les critères/options changent
- ❌ Pas de versioning des modifications paramétrage

---

## 📊 TABLEAU D'ALIGNEMENT

| Composant | Backend | Frontend | Database | Aligné? |
|-----------|---------|----------|----------|---------|
| Create Eval | ✅ POST | ✅ Form | ✅ créé | ✅ |
| Answer Input | ✅ PATCH | ✅ UI | ✅ sauvé | ✅ |
| Real-time Calc | ✅ API | ✅ Frontend | ✅ ranges OK | ✅ |
| Read Params | ✅ GET | ✅ affiche | ✅ chargé | ✅ |
| **Create Param** | ❌ API | ❌ UI | ✅ DB | ❌ |
| **Update Param** | ❌ API | ❌ UI | ✅ DB | ❌ |
| **Delete Param** | ❌ API | ❌ UI | ✅ DB | ❌ |
| Type Validation | ⚠️ ENUM | ❌ string | ✅ ENUM | ⚠️ |
| Weight Validation | ❌ | ❌ | ❌ | ❌ |

---

## 🚀 PRIORITÉS DE CORRECTION

### Phase 1: URGENT (Permet l'usage) ✅ COMPLÉTÉ
1. **Créer Admin CRUD pour Paramétrage** ✅
   - New page `/admin/scoring/builder` ✅
   - Create/Read/Update/Delete domains ✅
   - Create/Read/Update/Delete criteria ✅
   - Create/Read/Update/Delete options ✅
   - Create/Read/Update/Delete ranges ✅
   - Status: COMPLETE - Full CRUD UI implemented with modals

2. **Créer API pour Admin CRUD** ✅
   - `POST/PUT/DELETE /api/admin/scoring/nodes` ✅
   - `POST/PUT/DELETE /api/admin/scoring/options` ✅
   - `POST/PUT/DELETE /api/admin/scoring/ranges` ✅
   - Status: COMPLETE - All endpoints implemented with validation

### Phase 2: Important (Robustesse)
3. **Ajouter Validation Métier**
   - Vérifier sum(weights) = 1.0
   - Vérifier options XOR ranges
   - Vérifier couverture ranges
   - Time: 1 heure

4. **TypeScript Strict**
   - Frontend: `answerType: ScoringAnswerType` (not string)
   - API contracts: export types du backend
   - Time: 1-2 heures

### Phase 3: Polish (Flexibilité complète)
5. **Versioning Paramétrage**
   - Track changes to domains/criteria/options
   - Ability to rollback versions
   - Time: 2-3 heures

6. **Bulk Operations**
   - Import/export modèles (JSON/CSV)
   - Clone domaines/critères
   - Time: 2-3 heures

---

## ✨ SOLUTION RECOMMANDÉE

### Architecture Admin Builder

```
/admin/scoring/builder
├── Model Overview (current v7pp state)
├── Domains Panel (CRUD + reorder)
│   ├── Create domain
│   ├── Edit domain (label, weight, order)
│   └── Delete domain
├── Criteria Panel (CRUD + reorder)
│   ├── Create criterion (type: OPTION or NUMERIC)
│   ├── Edit criterion
│   ├── Delete criterion
│   └── Options/Ranges Sub-panel
│       ├── Add option (label, value, score)
│       ├── Edit option
│       ├── Delete option
│       ├── Add range (min, max, score, label)
│       ├── Edit range
│       └── Delete range
└── Validation Panel
    ├── Weight sum indicator
    ├── Missing options warnings
    ├── Coverage warnings
    └── Publish button
```

### Types Alignés

```typescript
// Backend exports (lib/types/scoring.ts)
export enum ScoringAnswerType {
  OPTION_SINGLE = "OPTION_SINGLE",
  NUMERIC_RANGE = "NUMERIC_RANGE",
}

export interface ScoringOption {
  value: string;
  label: string;
  score: number;
}

export interface ScoringRange {
  minValue: number;
  maxValue: number;
  score: number;
  label?: string;
}

// Frontend uses same types
import { ScoringAnswerType } from "@/lib/types/scoring"
```

---

## 🎯 CHECKPOINT: Activation en Production

Avant d'activer en production :

- [ ] Admin CRUD complète fonctionnelle
- [ ] Tests API: Create/Update/Delete opérations
- [ ] Validation métier: poids, options, ranges
- [ ] Documentation: Guide admin utilisation
- [ ] Migration: Importer grille actuelle si existe
- [ ] Backup: Snapshot BD avant go-live

---

## 📝 CHECKLIST D'ALIGNEMENT

**Frontend:**
- [x] Listes déroulantes pour options
- [x] Champs numérique pour ranges
- [x] Interface admin paramétrage (Phase 1 complete)
- [ ] Type safety strict (Phase 2)

**Backend:**
- [x] GET questionnaire structure
- [x] PATCH answers
- [x] POST/PUT/DELETE domains/criteria
- [x] POST/PUT/DELETE options
- [x] POST/PUT/DELETE ranges
- [x] Validation métier

**Database:**
- [x] Schema v7pp_scoring_nodes
- [x] Données PF_V7PP insérées
- [ ] Indexes sur queries fréquentes
- [ ] Audit log des changes

---

## ✅ PHASE 1 IMPLÉMENTÉE

### Endpoints API Créés
- ✅ `POST /api/admin/scoring/nodes` - Create domain/criterion
- ✅ `PUT /api/admin/scoring/nodes` - Update node properties  
- ✅ `DELETE /api/admin/scoring/nodes` - Delete node with cascade
- ✅ `POST /api/admin/scoring/options` - Create option
- ✅ `PUT /api/admin/scoring/options` - Update option
- ✅ `DELETE /api/admin/scoring/options` - Delete option
- ✅ `POST /api/admin/scoring/ranges` - Create range
- ✅ `PUT /api/admin/scoring/ranges` - Update range
- ✅ `DELETE /api/admin/scoring/ranges` - Delete range

### Composants Frontend Créés
- ✅ `/app/admin/scoring/builder/page.tsx` - Full CRUD interface
- ✅ `/components/scoring/NodeModal.tsx` - Domain/criterion create/edit
- ✅ `/components/scoring/OptionModal.tsx` - Option create/edit
- ✅ `/components/scoring/RangeModal.tsx` - Range create/edit

### Features
- ✅ Hierarchical tree view with expand/collapse
- ✅ Inline create/edit/delete buttons
- ✅ Weight validation indicator (shows % total)
- ✅ Model statistics dashboard
- ✅ Delete confirmation dialogs
- ✅ Loading states and error handling
- ✅ All TypeScript strict mode compliant

### Documentation
- ✅ `ADMIN_SCORING_BUILDER_GUIDE.md` - Complete implementation guide

---

**Prochaines étapes:** Phase 2 (Validation Métier) et Phase 3 (Versioning/Bulk Operations)
