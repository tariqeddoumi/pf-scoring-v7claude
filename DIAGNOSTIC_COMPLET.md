# DIAGNOSTIC COMPLET - PF Scoring v7pp

**Date:** 2026-04-18  
**Status:** Refonte V7++.5 - Lot 1 terminé  
**Verdict:** Application non prête prod. Refonte structurée requise.

---

## 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. SÉCURITÉ - Routes dangereuses exposées

**Routes de test/debug SANS authentification:**

| Route | Danger | Action |
|-------|--------|--------|
| `/api/health-debug` | Expose env vars, DB status | **SUPPRIMER** |
| `/api/test-login` | HTML form avec credentials hardcodées | **SUPPRIMER** |
| `/api/test` | Endpoint test GET/POST | **SUPPRIMER** |
| `/api/debug/login` | Login via query params | **SUPPRIMER** |
| `/api/diagnostic/db` | Expose structure DB | **SUPPRIMER** |
| `/api/diagnostic/full` | Idem (2 versions) | **SUPPRIMER** |
| `/api/projects-bypass` | Contournement auth complet | **SUPPRIMER PRIORITAIRE** |

**Routes d'initialisation AVEC auth faible:**

| Route | Problème | Action |
|-------|---------|--------|
| `/api/init-test-user` | Token Bearer simple (`INIT_TOKEN`) | Protéger ou supprimer |
| `/api/init/set-admin-password` | Token Bearer simple | Protéger ou supprimer |
| `/api/db-migrate` | Token Bearer simple | Protéger ou supprimer |

### 2. SÉCURITÉ - Authentification défaillante

**Fichier: `/lib/auth-middleware.ts` (Lignes 41-48)**

Code actuel:
```typescript
export async function withAuth(request, handler) {
  const user = await authenticateRequest(request);
  if (!user) {
    // FALLBACK MOCK USER - CRITIQUE!
    const mockUser: AuthPayload = {
      userId: "550e8400-e29b-41d4-a716-446655440000",
      email: "mock@example.com",
      role: "admin",  // <-- TOUJOURS ADMIN!
    };
    return handler(request, mockUser);
  }
}
```

**Impact:** Toute requête sans token JWT reçoit `role: "admin"` automatiquement!

**Action:** Retourner 401 si pas de token valide

### 3. SÉCURITÉ - Tokens JWT non sécurisés

**Fichier: `/lib/middleware.ts` (Lignes 32-34)**

```typescript
// JWT DECODE sans vérification de signature!
const payload = JSON.parse(
  Buffer.from(parts[1], "base64").toString("utf-8")
);
// N'importe qui peut forger un token
```

**Fichier: `/app/api/auth/login/route.ts`**

```typescript
response.cookies.set({
  name: "auth_token",
  value: token,
  httpOnly: false,  // <-- JavaScript peut lire!
  ...
});
```

**Actions:**
- Vérifier signature JWT dans middleware.ts
- `httpOnly: true` sur tous les cookies
- `secure: true` sauf local

### 4. SÉCURITÉ - Mocks utilisateurs permanents

**Fichier: `/lib/user-context.tsx` (Lignes 96-117)**

5 utilisateurs mock hardcodés:
```
1. Ahmed Ben Selhami (admin@pf-scoring.ma)
2. Fatima Fassi (manager@pf-scoring.ma)
3. Karim Bennani (analyste@pf-scoring.ma)
4. Leila Bouabid (evaluator@pf-scoring.ma)
5. Mohamed Amine Tazi (viewer@pf-scoring.ma)
```

Chargés en localStorage si vide → Utilisés comme fallback!

**Action:** Supprimer mocks. Charger UNIQUEMENT depuis DB.

### 5. SÉCURITÉ - RBAC non implémenté

**Situation:**

- `ROLE_PERMISSIONS` défini dans `/lib/middleware.ts:3-8` mais **JAMAIS UTILISÉ**
- Routes admin (`/api/admin/*`) sans aucune vérification de rôle
- `withAdminAuth()` ne vérifie QUE si `role === "admin"` (mauvaise logique)
- Pas de granularité par action (read, create, update, delete, configure)

**Exemple dangereux:** `/api/admin/countries` - Aucune authentification!

### 6. INCOHÉRENCE - Modèles de scoring parallèles

**Legacy model:**
- Tables: `ScoreDomain`, `ScoreCriterion`, `ScoreOption`, `ScoreRange`, `Evaluation`
- Fichiers: `/lib/scoring-model.ts` (config hardcodée D1-D9)

**V7++ model:**
- Tables: `ScoringModel`, `ScoringModelVersion`, `ScoringNode`, `ScoringNodeOption`, `ScoringNodeRange`, `ScoringEvaluation`
- Fichiers: `/lib/scoring-model-v7-config.ts`

**Problème:** Deux systèmes coexistent, pas de migration, pas de source unique de vérité.

### 7. INCOHÉRENCE - Conventions API incohérentes

**Patterns trouvés (devrait être UN SEUL):**

```typescript
// Format 1
{ success: true, user: {...} }

// Format 2
{ success: true, data: [...] }

// Format 3
{ error: "message", errorCode: "ERR_CODE" }

// Format 4
{ status: "ok|error", message: "..." }

// Format 5
Plain JSON
```

**Exigence:** UN seul format pour tous les 70+ endpoints.

### 8. BASE DE DONNÉES - Dualisme Evaluation

**Deux tables incompatibles:**

| Champ | Evaluation (legacy) | ScoringEvaluation (V7++) |
|-------|-------------------|------------------------|
| Table | `Evaluation` | `ScoringEvaluation` |
| Score | `score` simple | Hiérarchique (domaine + critère) |
| Lié à | `Evaluation` | `ScoringModelVersion` |
| Réponses | Simples | `ScoringEvaluationAnswer` |
| Historique | ❌ Non | Partiellement |

**Question irrésolue:** Laquelle est l'officielle pour la décision crédit?

---

## 🟠 PROBLÈMES IMPORTANTS

### 9. Moteur de scoring incohérent

**Fichier: `lib/services/scoring/scoring-engine-v8.ts`**

- Commentaire says "bottom-up" mais implémentation utilise DFS classique (parent avant enfants)
- Conséquence: Enfants pas encore scorés quand parent agrège

**Fichier: `/lib/scoring-model.ts`**

- Modèle entièrement hardcodé en TypeScript
- 9 domaines, options/ranges en dur
- Pas lié à la BD

**Fichier: `/lib/services/scoring/score-calculator.ts`**

- Utilise `eval()` pour les formules ❌ (critique sécurité)
- Pas sécurisé, non auditable, non bancaire

### 10. Frontend - Mock données omniprésentes

- `/lib/evaluation-context.tsx` - Fallback localStorage si API échoue
- `/lib/documents-context.tsx` - Idem
- Tout écran projet/évaluation peut afficher du localStorage

**Problème:** Pas de garantie que l'utilisateur voit la vraie donnée.

### 11. Exports/Reporting non professionnels

- `/lib/export-service.ts` prétend exporter "PDF" mais c'est du HTML pour impression
- "Word" est du HTML compat
- "Excel" est du CSV
- Aucun vrai PDF bancaire, aucun DOCX, aucun XLSX

---

## 📋 BACKLOG DE RÉPARATION

### Lot 1 - Sécurisation immédiate (DÉMARRER)

**A. Supprimer routes dangereuses**
- [ ] Supprimer `/api/health-debug`
- [ ] Supprimer `/api/test-login`
- [ ] Supprimer `/api/test`
- [ ] Supprimer `/api/debug/login`
- [ ] Supprimer `/api/diagnostic/db` et `/api/diagnostic/full`
- [ ] **SUPPRIMER `/api/projects-bypass`** ← Priorité absolue
- [ ] Documenter si init-user/db-migrate doivent être gardés ou sécurisés

**B. Corriger authentification**
- [ ] Corriger `/lib/auth-middleware.ts` ligne 41-48 - Retourner 401 si pas de token
- [ ] Corriger `/lib/middleware.ts` - Vérifier signature JWT
- [ ] `httpOnly: true` sur tous cookies
- [ ] `secure: true` sauf localhost
- [ ] Retirer tokens Bearer des logs

**C. Supprimer mocks utilisateurs**
- [ ] Supprimer MOCK_USERS de `/lib/user-context.tsx`
- [ ] Supprimer fallback localStorage
- [ ] Charger utilisateurs uniquement depuis DB

**D. Implémenter RBAC**
- [ ] Créer enum `Role` correct: SYSTEM_ADMIN, SCORING_ADMIN, RISK_ANALYST, RISK_MANAGER, COMMITTEE_MEMBER, AUDITOR, READ_ONLY
- [ ] Créer fonction `checkPermission(user, action)`
- [ ] Protéger tous les endpoints `/api/admin/*` avec `withAdminAuth()`
- [ ] Ajouter checks permission dans services

**Critère d'acceptation:**
- Aucune route critique accessible sans authentification valide
- Aucune route retournant role="admin" par défaut
- Aucun mock user en localStorage
- Tous les tests/bypass supprimés

### Lot 2 - Rationalisation base de données

**A. Décider modèle canonique**
- [ ] Garder V7++ et décommissionner legacy? OU
- [ ] Garder legacy et supprimer V7++?
- ⭐ **RECOMMANDATION: Garder V7++, isoler legacy en read-only**

**B. Nettoyer Prisma schema**
- [ ] Documenter quels modèles legacy sont utilisés par quels endpoints
- [ ] Documenter quels modèles V7++ sont utilisés par quels endpoints
- [ ] Créer plan de migration Evaluation → ScoringEvaluation
- [ ] Ajouter timestamps/audit aux tables critiques

**C. Ajouter tables manquantes**
- [ ] WorkflowInstance, WorkflowInstanceStep, WorkflowActionLog
- [ ] ScoringEvaluationOverride, ScoringEvaluationApproval
- [ ] ScoringEvaluationDecision
- [ ] ProjectDocument, DocumentRequirement, DocumentValidation

**D. Standardiser réponses API**

```typescript
// Format unique
{
  "success": boolean,
  "data": any,
  "meta": { count?: number, cursor?: string },
  "error": {
    "code": "ERROR_CODE",
    "message": "User message",
    "details": {}
  }
}
```

### Lot 3 - Refonte moteur scoring

**A. Corriger calcul bottom-up**
- [ ] Implémenter parcours post-order réel
- [ ] Scorées feuilles d'abord, puis agréger
- [ ] Tester sur cas complet

**B. Charger réellement config DB**
- [ ] Options depuis ScoringNodeOption
- [ ] Ranges depuis ScoringNodeRange
- [ ] Formulas depuis ScoringNodeFormula
- [ ] Rules depuis ScoringNodeRule
- [ ] Pondérations réelles

**C. Supprimer eval()**
- [ ] Remplacer par parser safe
- [ ] Supporter: MIN, MAX, AVG, IF, ROUND, ABS, RATIO, CLAMP

**D. Moteur de règles**
- [ ] NO_GO
- [ ] HARD_STOP
- [ ] MALUS / BONUS
- [ ] WARNINGS
- [ ] APPLICABILITY
- [ ] MANDATORY_IF

**E. Normaliser scores**
- [ ] rawScore (valeur brute option/range/formula)
- [ ] normalizedScore (0-1)
- [ ] weightedScore (appliquée poids)
- [ ] globalScore (final)
- [ ] rating (AAA, AA, A, ...)

### Lot 4 - Refonte backend

**A. Standardiser toutes APIs**
- [ ] GET /api/admin/scoring/models
- [ ] POST /api/admin/scoring/models
- [ ] PUT /api/admin/scoring/models/[id]
- [ ] DELETE /api/admin/scoring/models/[id]
- [ ] Tout dans format unique
- [ ] Toute réponse d'erreur en format unique

**B. Protéger les endpoints**
- [ ] Ajouter withAdminAuth() sur `/api/admin/*`
- [ ] Ajouter checkPermission() avant op sensible
- [ ] 401 si pas auth, 403 si pas permission

**C. Validation métier**
- [ ] Validation Zod stricte
- [ ] Erreurs normalisées
- [ ] Messages utilisateur français

### Lot 5 - Refonte frontend métier

**A. Fiches métier**
- [ ] Projet: Bloc signalétique + structure + parties + contrats + financement + garanties + docs
- [ ] Client: Signalétique + portefeuille projets
- [ ] Évaluation: Navigation par domaines

**B. Supprimer mocks écrans**
- [ ] Tous les écrans branchés aux APIs réelles
- [ ] Zéro fallback localStorage
- [ ] Zéro données en dur

### Lot 6 - Workflow validation

- [ ] Statuts: DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
- [ ] Tracer transitions
- [ ] Commentaires obligatoires sur certaines transitions
- [ ] Verrouiller évaluations approuvées
- [ ] Versionner nouvelles modifications

### Lot 7 - Reporting

- [ ] Fiche synthèse comité (1-2 pages, PDF réel)
- [ ] Rapport détaillé (10-20 pages, PDF réel)
- [ ] Export audit XLSX réel
- [ ] Dashboard portefeuille

### Lot 8 - Industrialisation

- [ ] Tests unitaires
- [ ] Tests intégration
- [ ] Tests E2E
- [ ] Documentation

---

## 📊 MÉTRIQUES DIAGNOSTIC

| Aspect | Note | Commentaire |
|--------|------|------------|
| Sécurité | 2/10 | Routes exposées, auth permissive, mocks partout |
| Architecture données | 6/10 | Schéma riche mais dualisme paralysant |
| Moteur scoring | 4/10 | Bonne direction mais incomplet, eval() dangerous |
| Backend | 5/10 | Services existent mais API non standardisée |
| Frontend | 5/10 | Volumétrie ok mais trop mocké et hardcodé |
| RBAC/Workflow | 3/10 | Esquissé mais pas implémenté |
| Reporting | 2/10 | Export pseudo-PDF |
| **GLOBAL** | **4/10** | Prototype avancé, PAS production bancaire |

---

## ✅ PROCHAINES ÉTAPES

1. **Créer branche refonte:** `refactor/v7pp-5-industrialisation`
2. **Exécuter Lot 1:** Sécurisation (3-4 jours)
3. **Exécuter Lot 2:** Base de données (2-3 jours)
4. **Exécuter Lot 3:** Moteur scoring (3-4 jours)
5. **Exécuter Lot 4:** Backend (2-3 jours)
6. **Exécuter Lot 5:** Frontend (3-5 jours)
7. **Tests et validation:** 2-3 jours

**Durée estimée:** 2-3 semaines pour une refonte solide

---

**Document généré:** 2026-04-18  
**Statut:** Prêt pour exécution Lot 1 - Sécurisation
