# Guide de Paramétrisation - PF Scoring v7

## Vue d'Ensemble

L'application a été complètement restructurée pour supporter une architecture entièrement paramétrable. Le système de scoring, l'authentification et tous les paramètres d'application peuvent maintenant être configurés sans modification de code.

## Architecture Paramétrable

### 1. Domaines de Scoring Configurables

**Modèle de Données: `ScoreDomain`**

Les domaines de scoring sont maintenant stockés dans la base de données et peuvent être:
- ✅ Activés/désactivés dynamiquement
- ✅ Leurs poids ajustés en temps réel
- ✅ Réorganisés via `orderIndex`

**Domaines par Défaut:**
1. Risque Financier (25% weight)
2. Risque Technique (15% weight)
3. Risque de Marché (15% weight)
4. Risque Environnemental (10% weight - IFC)
5. Risque Social (10% weight - EBRD)
6. Risque de Gouvernance (10% weight)
7. Risque Juridique (8% weight)
8. Risque Pays (7% weight)

**Configuration via Admin Panel:**
```
/admin/scoring-config
```

- Activez/désactivez les domaines avec des toggles
- Ajustez les poids en pourcentage
- L'application valide automatiquement que le total des poids = 100%
- Les modifications sont immédiatement appliquées aux nouveaux projets

### 2. Critères et Options de Notation

**Modèles de Données:**
- `ScoreCriterion` - Critères par domaine
- `ScoreOption` - Options pour critères de type OPTION
- `ScoreRange` - Plages pour critères de type RANGE

**Types de Critères:**
```typescript
type CriterionType = "OPTION" | "RANGE"
```

**Exemple - Risque Financier:**
- Critère: "Ratio d'endettement"
- Type: RANGE
- Plages:
  - 0-1: Score 100 (Très faible)
  - 1-2: Score 80 (Faible)
  - 2-3: Score 60 (Modéré)
  - 3-5: Score 40 (Élevé)
  - 5-10: Score 20 (Très élevé)

**Exemple - Risque Technique:**
- Critère: "Faisabilité technique"
- Type: OPTION
- Options:
  - "Éprouvée et testée" → 100
  - "Bien documentée" → 80
  - "Nouvelle mais prometteuse" → 60
  - "Expérimentale" → 40
  - "Non testée" → 20

### 3. Risque Pays - Deux Modes

#### Mode 1: Assignation Automatique (AUTO_ASSIGN) - Par Défaut

Les scores de risque pays sont automatiquement assignés basés sur la sélection du pays lors de la création du projet.

**Modèle de Données: `Country`**
```
{
  code: "MA",
  label: "Maroc",
  riskScore: 45.0  // Convertir en score d'évaluation: 100 - 45 = 55
}
```

**Configuration:**
```
/admin/country-risk
```

- Sélectionnez le mode: AUTO_ASSIGN ou MANUAL
- Ajustez les scores de risque par pays (0-100)
- Visualisation par graphiques à barres (rouge = élevé, vert = faible)

#### Mode 2: Assignation Manuelle (MANUAL)

Les évaluateurs assignent manuellement le score de risque pays lors de l'évaluation du projet.

### 4. Authentification Paramétrable

**Configuration:**
```
/admin/auth-settings
```

**Paramètres Disponibles:**
- Longueur minimale du mot de passe (6-32 caractères)
- Délai d'expiration de session (15-1440 minutes)
- Méthodes d'authentification:
  - ✅ Mot de passe (implémenté)
  - 🔲 OAuth 2.0 (À venir)
  - 🔲 SAML 2.0 (À venir)

**Stockage:**
Tous les paramètres sont sauvegardés dans la table `pf_scoring_system_config`:
```
{
  key: "PASSWORD_MIN_LENGTH",
  value: "8",
  description: "Minimum password length"
}
```

## API Routes Admin

### Domaines
```
GET  /api/admin/domains
     → Liste tous les domaines avec leurs paramètres

PATCH /api/admin/domains/:id
     → Mettre à jour isActive ou weight
```

### Critères
```
GET  /api/admin/domains/:domainId/criteria
     → Liste les critères d'un domaine avec options et plages
```

### Pays
```
GET  /api/admin/countries
     → Liste tous les pays avec leurs scores de risque

PATCH /api/admin/countries/:id
     → Mettre à jour le score de risque d'un pays (0-100)
```

### Configuration Système
```
GET  /api/admin/config/country-risk-mode
     → Récupère le mode actuel (AUTO_ASSIGN ou MANUAL)

PATCH /api/admin/config/country-risk-mode
     → Change le mode
```

## Moteur de Scoring v2

Le fichier `lib/scoring-engine-v2.ts` fournit les fonctions pour le calcul de score paramétrable:

```typescript
// Calculer le score global basé sur les domaines actifs
calculateGlobalScoreV2(composantes: ComposanteScore[]): Promise<ScoringResult>

// Déterminer le grade (AAA → D) basé sur le score
determineGradeV2(score: number): string

// Vérifier les règles d'arrêt (hard stops)
checkHardStopRules(domainScores): Promise<boolean>

// Obtenir le score de risque pays auto-assigné
getCountryRiskScore(countryCode: string): Promise<number>

// Récupérer tous les domaines disponibles
getAvailableDomains(): Promise<ScoreDomain[]>

// Vérifier si le domaine "Risque Pays" est actif
isCountryRiskActive(): Promise<boolean>

// Obtenir le mode de configuration du risque pays
getCountryRiskMode(): Promise<"AUTO_ASSIGN" | "MANUAL">
```

## Initialisation de la Base de Données

### Seeder

Le fichier `prisma/seed.ts` initialise la base de données avec:
- 8 domaines de scoring avec poids par défaut
- Critères pour chaque domaine
- Options et plages de notation
- 13 pays avec scores de risque initials
- Configuration système par défaut

### Exécution

```bash
# Instaler les dépendances
npm install

# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:push

# Remplir la base de données
npm run db:seed
```

## Panneau d'Administration

### Page Principale
```
/admin
```

Accès centralisé à 6 sections:

1. **Configuration du Scoring** (`/admin/scoring-config`)
   - Activer/désactiver les domaines
   - Ajuster les poids
   - Voir la validation du total des poids
   - Consulter les critères de chaque domaine

2. **Risque Pays** (`/admin/country-risk`)
   - Sélectionner le mode (AUTO_ASSIGN ou MANUAL)
   - Mettre à jour les scores par pays
   - Visualiser le niveau de risque par couleur
   - Rechercher des pays

3. **Authentification** (`/admin/auth-settings`)
   - Configurer la longueur min du mot de passe
   - Définir le délai d'expiration de session
   - Activer/désactiver les méthodes auth
   - Futur: OAuth 2.0 et SAML 2.0

4. **Paramètres Système** (`/admin/system-settings`)
   - Voir les infos d'application
   - Vérifier la conformité (IFC, EBRD, Basel, Bank Al-Maghrib)
   - Gérer les sauvegardes

5. **Gestion des Utilisateurs** (`/admin/users`)
   - Ajouter des utilisateurs
   - Assigner les rôles (admin, manager, analyste, lecteur)
   - Afficher la référence des permissions par rôle

6. **Journal d'Audit** (`/admin/audit-logs`)
   - Voir toutes les modifications système
   - Filtrer par type d'action
   - Traçabilité complète de qui a changé quoi

## Sécurité et Conformité

### Audit Trail
Toutes les modifications via l'admin panel sont enregistrées dans `pf_scoring_audit_logs`:
```
{
  action: "DOMAIN_WEIGHT_UPDATED",
  details: "Domaine 'financier' poids changé de 0.25 à 0.20",
  utilisateurId: "user-uuid",
  timestamp: "2026-03-30T14:30:00Z"
}
```

### Conformité Standards
L'architecture maintient la conformité avec:
- ✅ **IFC Performance Standards 2012** - Environnemental
- ✅ **EBRD Environmental & Social Policy 2015** - Social
- ✅ **Basel III Framework** - Grading System (AAA → D)
- ✅ **Bank Al-Maghrib Standards** - Maroc

## Intégration avec l'Application Existante

### Mise à jour des Routes API Existantes

Les routes API existantes doivent être mises à jour pour utiliser le nouvel engine:

**Avant (hardcoded):**
```typescript
import { calculateScoringResult } from "@/lib/scoring-engine"
```

**Après (paramétrable):**
```typescript
import { calculateGlobalScoreV2, isCountryRiskActive } from "@/lib/scoring-engine-v2"

const result = await calculateGlobalScoreV2(composantes)
const countryRiskActive = await isCountryRiskActive()
```

### Formulaire de Création de Projet

Le formulaire de création doit maintenant inclure:
```typescript
countryCode?: string  // Pour AUTO_ASSIGN du risque pays
```

### Formulaire d'Évaluation

Le formulaire d'évaluation doit:
1. Récupérer les domaines actifs via `getActiveDomains()`
2. Afficher uniquement les critères des domaines actifs
3. Si AUTO_ASSIGN et countryCode fourni → pré-remplir le risque pays
4. Si MANUAL → laisser l'utilisateur assigner le risque pays

## Structure de Schéma Prisma

### Nouveaux Modèles

```prisma
model ScoreDomain {
  id: String @id @default(uuid())
  code: String @unique         # financier, technique, etc.
  label: String               # Risque Financier, etc.
  isActive: Boolean          # Peut être désactivé
  weight: Float              # Poids (0-1)
  criteria: ScoreCriterion[]
  evaluationDomainScores: EvaluationDomainScore[]
}

model ScoreCriterion {
  id: String @id @default(uuid())
  domainId: String
  code: String
  label: String
  type: String              # OPTION ou RANGE
  hardStopIfBelow: Float?   # Seuil d'arrêt (optional)
  options: ScoreOption[]
  ranges: ScoreRange[]
  evaluationAnswers: EvaluationAnswer[]
}

model ScoreOption {
  id: String @id @default(uuid())
  criterionId: String
  label: String            # "Éprouvée et testée"
  score: Float             # 100
}

model ScoreRange {
  id: String @id @default(uuid())
  criterionId: String
  minValue: Float
  maxValue: Float
  score: Float
  label: String?
}

model Country {
  id: String @id @default(uuid())
  code: String @unique      # MA, FR, etc.
  label: String
  riskScore: Float          # 0-100
}

model SystemConfig {
  id: String @id @default(uuid())
  key: String @unique       # COUNTRY_RISK_MODE, etc.
  value: String
}

model EvaluationDomainScore {
  domainId: String
  scoringId: String
  score: Float             # Score du domaine
  weight: Float            # Poids appliqué
}

model EvaluationAnswer {
  criterionId: String
  scoringId: String
  answerType: String       # OPTION ou RANGE
  optionValue: String?     # ID ou valeur de l'option
  rangeValue: Float?       # Valeur numérique
  score: Float?            # Score calculé
}
```

## Prochaines Étapes

1. **Mise à jour des Routes API Existantes**
   - Intégrer `scoring-engine-v2`
   - Gérer le risque pays auto-assigné
   - Enregistrer les réponses d'évaluation dans `EvaluationAnswer`

2. **Mise à Jour du Formulaire d'Évaluation**
   - Générer dynamiquement les champs basés sur les domaines/critères actifs
   - Afficher les options et plages selon la configuration
   - Pré-remplir le risque pays en mode AUTO_ASSIGN

3. **Implémentation OAuth 2.0 et SAML 2.0**
   - Ajouter les fournisseurs d'identité
   - Activer via le panneau admin

4. **Gestion Avancée des Utilisateurs**
   - Import en masse (CSV/Excel)
   - Synchronisation LDAP/Active Directory
   - Rôles personnalisés

## Fichiers Modifiés/Créés

### Modifiés
- `prisma/schema.prisma` - Ajout des nouveaux modèles
- `package.json` - Ajout des scripts DB et tsx
- `components/layout/navigation.tsx` - Lien vers admin panel

### Créés
- `lib/scoring-engine-v2.ts` - Moteur de scoring paramétrable
- `prisma/seed.ts` - Initialisation de la base de données
- `app/admin/page.tsx` - Dashboard admin principal
- `app/admin/scoring-config/page.tsx` - Configuration du scoring
- `app/admin/country-risk/page.tsx` - Configuration du risque pays
- `app/admin/auth-settings/page.tsx` - Paramètres d'authentification
- `app/admin/system-settings/page.tsx` - Paramètres système
- `app/admin/users/page.tsx` - Gestion des utilisateurs
- `app/admin/audit-logs/page.tsx` - Journal d'audit
- `app/api/admin/domains/route.ts` - API domaines
- `app/api/admin/domains/[id]/route.ts` - Mise à jour domaines
- `app/api/admin/domains/[id]/criteria/route.ts` - Critères d'un domaine
- `app/api/admin/countries/route.ts` - API pays
- `app/api/admin/countries/[id]/route.ts` - Mise à jour pays
- `app/api/admin/config/country-risk-mode/route.ts` - Configuration risque pays

## Questions Fréquemment Posées

**Q: Comment désactiver le domaine "Risque Pays"?**
A: Via `/admin/scoring-config`, cliquez le checkbox pour "Risque Pays". Les poids se réajusteront automatiquement.

**Q: Comment changer le mode d'assignation du risque pays?**
A: Via `/admin/country-risk`, sélectionnez "Assignation Manuelle" ou "Assignation Automatique".

**Q: Les changements de paramètres affectent-ils les projets existants?**
A: Non, les paramètres s'appliquent uniquement aux nouveaux projets/évaluations créés après la modification.

**Q: Comment restaurer les paramètres par défaut?**
A: Exécutez `npm run db:seed` pour réinitialiser tous les paramètres.

---

**Dernière mise à jour:** 2026-03-30
**Version:** 1.0.0 - Architecture Paramétrable
