# 📋 CHECKLIST D'IMPLÉMENTATION – PF Scoring v7++

**Dernière mise à jour :** 2 Avril 2026
**Statut Global :** 0% (À DÉMARRER)

---

## 🎯 TABLEAU DE PILOTAGE GLOBAL

| Phase | Nom | % Complet | Statut | Deadline |
|-------|-----|----------|--------|----------|
| 1 | Fondations & BD | 0% | ⚪ Pending | Semaine 1 |
| 2 | Bloc Client & Projet | 0% | ⚪ Pending | Semaine 2 |
| 3 | Moteur de Scoring | 0% | ⚪ Pending | Semaine 3-4 |
| 4 | Workflow & Validation | 0% | ⚪ Pending | Semaine 5 |
| 5 | Admin & Rôles | 0% | ⚪ Pending | Semaine 6 |
| 6 | Portefeuille & Dashboards | 0% | ⚪ Pending | Semaine 7 |
| 7 | Reporting | 0% | ⚪ Pending | Semaine 8 |
| 8 | Tests & Polissage | 0% | ⚪ Pending | Semaine 9 |

**TOTAL GLOBAL : 0%**

---

## PHASE 1 : FONDATIONS & BASE DE DONNÉES
**Objectif :** Architecturer la BD, créer les migrations, configurer l'auth

### 1.1 Schéma Prisma Complet
- [ ] **Lire spec complète** (SPECIFICATION.md)
- [ ] **Créer/Mettre à jour schema.prisma**
  - [ ] Model User (avec rôles)
  - [ ] Model Role
  - [ ] Model Client
  - [ ] Model Project
  - [ ] Model ProjectDetails (JSON rich)
  - [ ] Model Evaluation
  - [ ] Model EvaluationDomainScore
  - [ ] Model EvaluationAnswer
  - [ ] Model ScoringModel (paramétrable)
  - [ ] Model WorkflowStep
  - [ ] Model AuditLog
  - [ ] Model Notification
  - [ ] Model Document
  - [ ] Model ScoringDomain
  - [ ] Model ScoringCriterion
  - [ ] Model ScoringOption
  - [ ] Relations correctes
  - [ ] Indexes de performance
- [ ] **Valider schéma** (vérifier cohérence)

### 1.2 Migrations Supabase
- [ ] **Générer migrations Prisma**
  - `npm run prisma migrate dev --name init_schema`
- [ ] **Appliquer migrations** dans Supabase
- [ ] **Vérifier tables créées** dans Supabase Dashboard
- [ ] **Créer index additionnels** si nécessaire
- [ ] **Backup initial** de la BD

### 1.3 Authentification & Sécurité
- [ ] **Implémenter JWT custom** ou Supabase Auth
- [ ] **Hash password** (bcrypt configuré)
- [ ] **Gestion sessions** (cookies sécurisés)
- [ ] **Middleware auth** sur les routes protégées
- [ ] **Tests login/logout**

### 1.4 Gestion des Rôles & Permissions
- [ ] **Définir 7 rôles** (Admin, Manager, Analyste, Risk, Comité, Lecteur, Audit)
- [ ] **Créer fichier lib/permissions.ts**
- [ ] **Implémenter système de droits**
  - [ ] Droits par module
  - [ ] Droits par objet
  - [ ] Périmètre (entité, pays, secteur)
- [ ] **Middleware de vérification droits**

### 1.5 Données de Référence
- [ ] **Créer fichiers constants.ts**
  - [ ] Secteurs & sous-secteurs
  - [ ] Types de projets
  - [ ] Pays & régions
  - [ ] Statuts workflow
  - [ ] Listes déroulantes
- [ ] **Seed données initiales**
  - [ ] Rôles de base
  - [ ] Utilisateur admin
  - [ ] Référentiels pays/secteur

### 1.6 Structure Fichiers & Folders
- [ ] **Créer arborescence complète**
  - [ ] `/app/(auth)/`
  - [ ] `/app/(dashboard)/`
  - [ ] `/app/api/`
  - [ ] `/components/`
  - [ ] `/lib/`
  - [ ] `/types/`
- [ ] **Fichiers TypeScript types**
  - [ ] types/client.ts
  - [ ] types/project.ts
  - [ ] types/evaluation.ts
  - [ ] types/scoring.ts
  - [ ] types/workflow.ts

**Progress Phase 1 : 0%**
**Status : ⚪ Pending**

---

## PHASE 2 : BLOC CLIENT & PROJET
**Objectif :** CRUD Client, CRUD Projet, signalétique

### 2.1 Bloc Client
- [ ] **API Endpoints**
  - [ ] GET /api/clients (liste, filtres)
  - [ ] POST /api/clients (créer)
  - [ ] GET /api/clients/[id] (détail)
  - [ ] PUT /api/clients/[id] (modifier)
  - [ ] DELETE /api/clients/[id] (archiver)
  - [ ] GET /api/clients/search (recherche multicritère)
- [ ] **Composants UI**
  - [ ] ClientsTable.tsx (liste)
  - [ ] ClientForm.tsx (création/édition)
  - [ ] ClientDetail.tsx (fiche complète)
  - [ ] ClientSearch.tsx
- [ ] **Écrans**
  - [ ] /clients (liste)
  - [ ] /clients/new (créer)
  - [ ] /clients/[id] (détail)
  - [ ] /clients/[id]/edit (modifier)
- [ ] **Validations**
  - [ ] Schéma Zod pour Client
  - [ ] Vérifications unicité
  - [ ] Droits d'accès
- [ ] **Historisation**
  - [ ] Tracker modifications
  - [ ] Audit log intégré

### 2.2 Bloc Projet
- [ ] **API Endpoints**
  - [ ] GET /api/projects (liste)
  - [ ] POST /api/projects (créer)
  - [ ] GET /api/projects/[id] (détail)
  - [ ] PUT /api/projects/[id] (modifier)
  - [ ] DELETE /api/projects/[id] (archiver)
  - [ ] PUT /api/projects/[id]/status (changer statut)
- [ ] **Composants UI**
  - [ ] ProjectsTable.tsx
  - [ ] ProjectForm.tsx (multi-step si long)
  - [ ] ProjectDetail.tsx
  - [ ] ProjectSummary.tsx
- [ ] **Écrans**
  - [ ] /projects (liste)
  - [ ] /projects/new (créer)
  - [ ] /projects/[id] (détail avec onglets)
  - [ ] /projects/[id]/edit (modifier)
- [ ] **Onglets Détail Projet**
  - [ ] Synthèse
  - [ ] Identification
  - [ ] Localisation
  - [ ] Parties prenantes
  - [ ] Technique
  - [ ] Calendrier
  - [ ] Financement
  - [ ] Revenus/Contrats
  - [ ] Construction
  - [ ] Exploitation
  - [ ] Juridique
  - [ ] ESG
  - [ ] Documents
  - [ ] Historique
- [ ] **Validations & Droits**
  - [ ] Schémas Zod
  - [ ] Vérifications métier
  - [ ] Contrôle d'accès

### 2.3 Gestion Documents
- [ ] **API**
  - [ ] POST /api/documents (upload)
  - [ ] GET /api/documents/[id] (télécharger)
  - [ ] DELETE /api/documents/[id] (supprimer)
- [ ] **Composant Upload**
  - [ ] DocumentUpload.tsx
  - [ ] DocumentList.tsx
- [ ] **Stockage**
  - [ ] Intégration Supabase Storage ou local

**Progress Phase 2 : 0%**
**Status : ⚪ Pending**

---

## PHASE 3 : MOTEUR DE SCORING
**Objectif :** Implémente le moteur de scoring V7++ avec tous domaines

### 3.1 Modèle de Scoring V7++
- [ ] **Fichier lib/scoring-engine.ts**
  - [ ] Class ScoringEngine
  - [ ] Méthode calculateDomainScore()
  - [ ] Méthode calculateGlobalScore()
  - [ ] Méthode applyRules()
  - [ ] Méthode convertToRating()
  - [ ] Méthode detectRedFlags()
- [ ] **Domaines (7 domaines)**
  - [ ] Domain 1: Project Fundamentals (20%)
  - [ ] Domain 2: Host Country (10%)
  - [ ] Domain 3: Construction Phase (15%)
  - [ ] Domain 4: Operation Phase (15%)
  - [ ] Domain 5: Revenue & Market (15%)
  - [ ] Domain 6: Financial Structure (15%)
  - [ ] Domain 7: ESG & Climate Risk (10%)

### 3.2 Paramétrage du Modèle
- [ ] **Fichier lib/scoring-rules.ts**
  - [ ] Rules engine (NO-GO, MALUS, BONUS)
  - [ ] Liste NO-GO conditions
  - [ ] MALUS conditions & valeurs
  - [ ] Heatmap mapping (score → couleur)
- [ ] **Configuration modèle V7++**
  - [ ] Poids domaines
  - [ ] Critères par domaine
  - [ ] Barèmes (1-10)
  - [ ] Formules de conversion
  - [ ] PD mapping
  - [ ] Rating mapping

### 3.3 API de Calcul
- [ ] **POST /api/evaluations/[id]/score**
  - [ ] Recevoir réponses
  - [ ] Calculer scores
  - [ ] Appliquer règles
  - [ ] Retourner résultat JSON
- [ ] **POST /api/evaluations/[id]/recalculate**
  - [ ] Recalcul avec override

### 3.4 Création d'Évaluation
- [ ] **GET /api/evaluations** (liste)
- [ ] **POST /api/evaluations** (créer)
  - [ ] Lier à projet
  - [ ] Choisir version modèle
  - [ ] Initialiser statut brouillon
- [ ] **GET /api/evaluations/[id]** (détail)
- [ ] **PUT /api/evaluations/[id]** (modifier brouillon)

### 3.5 Interface Saisie Scoring
- [ ] **Écran /projects/[id]/evaluation/[evalId]/score**
  - [ ] Afficher domaines
  - [ ] Formulaire par domaine
  - [ ] Saisie réponses
  - [ ] Commentaires libres
  - [ ] Auto-calcul instantané
  - [ ] Affichage score partiel
- [ ] **Composants**
  - [ ] DomainScoringForm.tsx
  - [ ] CriterionInput.tsx
  - [ ] ScoringProgressBar.tsx

### 3.6 Restitution Score
- [ ] **Écran /projects/[id]/evaluation/[evalId]/restitution**
  - [ ] Score global & note
  - [ ] PD indicative
  - [ ] Classe risque
  - [ ] Heatmap domaines
  - [ ] Red flags list
  - [ ] Recommandation
  - [ ] Comparatif vs éval précédente
- [ ] **Composants**
  - [ ] ScoreCard.tsx
  - [ ] ScoreRadar.tsx (graphique)
  - [ ] ScoreHeatmap.tsx
  - [ ] RedFlagsList.tsx

**Progress Phase 3 : 0%**
**Status : ⚪ Pending**

---

## PHASE 4 : WORKFLOW & VALIDATION
**Objectif :** Encadrer circulation évaluation, traçabilité

### 4.1 Gestion Workflow
- [ ] **Statuts Évaluation**
  - [ ] brouillon
  - [ ] soumis
  - [ ] rejete
  - [ ] valide
- [ ] **Transitions Autorisées**
  - [ ] brouillon → soumis (analyste)
  - [ ] soumis → rejete (manager/risk)
  - [ ] soumis → valide (comité)
  - [ ] rejete → brouillon (analyste après correction)
  - [ ] valide → archivé (admin)

### 4.2 API Workflow
- [ ] **POST /api/evaluations/[id]/submit**
  - [ ] Valider complétude
  - [ ] Changer statut soumis
  - [ ] Notifier manager
- [ ] **POST /api/evaluations/[id]/approve**
  - [ ] Valider (risk/comité selon config)
  - [ ] Signer
- [ ] **POST /api/evaluations/[id]/reject**
  - [ ] Motif obligatoire
  - [ ] Revenir brouillon
  - [ ] Notifier analyste
- [ ] **GET /api/evaluations/[id]/workflow**
  - [ ] Historique workflow

### 4.3 Interface Workflow
- [ ] **Écran /workflow**
  - [ ] Liste évaluations par statut
  - [ ] Filtres (date, analyste, projet)
  - [ ] Actions rapides (approuver, rejeter)
- [ ] **Composants**
  - [ ] WorkflowTimeline.tsx
  - [ ] ValidationStep.tsx
  - [ ] WorkflowActions.tsx
- [ ] **Notifications**
  - [ ] Soumission créée
  - [ ] Validation en attente
  - [ ] Rejet avec motif
  - [ ] Approbation finale

### 4.4 Audit Trail & Traçabilité
- [ ] **Fichier lib/audit.ts**
  - [ ] Function logAction()
  - [ ] Stocker dans AuditLog
  - [ ] Horodater, user, motif
- [ ] **Écran /admin/audit**
  - [ ] Consulter logs
  - [ ] Filtrer par date/user/projet/action
  - [ ] Export

**Progress Phase 4 : 0%**
**Status : ⚪ Pending**

---

## PHASE 5 : ADMINISTRATION & RÔLES
**Objectif :** Gestion utilisateurs, paramétrages, droits fins

### 5.1 Gestion Utilisateurs
- [ ] **API /api/admin/users**
  - [ ] CRUD complet
  - [ ] Activation/désactivation
  - [ ] Changement rôle
  - [ ] Reset accès
- [ ] **Écran /admin/users**
  - [ ] Tableau utilisateurs
  - [ ] Création
  - [ ] Édition rôle/périmètre
  - [ ] Historique

### 5.2 Gestion Rôles & Droits
- [ ] **API /api/admin/roles**
  - [ ] CRUD rôles
  - [ ] Matrice droits
- [ ] **Écran /admin/roles**
  - [ ] Définir rôles
  - [ ] Assigner droits par module
  - [ ] Matrice visuelle
- [ ] **7 Rôles à créer**
  - [ ] Administrateur
  - [ ] Risk Manager
  - [ ] Manager Crédit
  - [ ] Analyste
  - [ ] Comité / Décisionnaire
  - [ ] Lecteur
  - [ ] Auditeur

### 5.3 Paramétrage du Modèle de Scoring
- [ ] **Écran /admin/model**
  - [ ] Voir/éditer domaines
  - [ ] Voir/éditer critères
  - [ ] Modifier pondérations
  - [ ] Gérer versions
- [ ] **API /api/admin/model**
  - [ ] GET model complet
  - [ ] PUT modifier domaine
  - [ ] POST nouvelle version
- [ ] **Versioning**
  - [ ] Conserver anciens modèles
  - [ ] Indications quel modèle utilisé

### 5.4 Références & Listes
- [ ] **Écran /admin/references**
  - [ ] Gérer listes déroulantes
  - [ ] Ajouter/supprimer valeurs
  - [ ] Éditer libellés
- [ ] **API /api/admin/references**
- [ ] **Éléments à paramétrer**
  - [ ] Secteurs
  - [ ] Types projets
  - [ ] Pays/régions
  - [ ] Types contrats
  - [ ] Catégories garanties

**Progress Phase 5 : 0%**
**Status : ⚪ Pending**

---

## PHASE 6 : PORTEFEUILLE & DASHBOARDS
**Objectif :** Vue consolidée, KPIs, alertes

### 6.1 Vue Portefeuille
- [ ] **Écran /portefeuille**
  - [ ] Nombre total projets
  - [ ] Répartition par statut
  - [ ] Répartition par note
  - [ ] Score moyen
  - [ ] Heatmap agrégée
  - [ ] Top red flags
  - [ ] Dossiers sensibles
- [ ] **Composants**
  - [ ] PortfolioSummary.tsx
  - [ ] RiskDistribution.tsx
  - [ ] SectorAnalysis.tsx
  - [ ] SensitiveDossiers.tsx

### 6.2 Dashboards
- [ ] **Écran /portefeuille/dashboard**
  - [ ] KPIs clés
  - [ ] Graphiques (pie, bar, line)
  - [ ] Tableaux synthétiques
  - [ ] Évolution dans le temps
- [ ] **Indicateurs**
  - [ ] Nombre évaluations par mois
  - [ ] Délais moyens traitement
  - [ ] % évaluations validées
  - [ ] Distribution notes
  - [ ] Évolution score moyen
  - [ ] Top secteurs risqués
  - [ ] Top analystes
  - [ ] Taux rotation dossiers

### 6.3 Alertes & Tâches
- [ ] **Système d'alertes**
  - [ ] Score < seuil critique
  - [ ] NO-GO détecté
  - [ ] Document obligatoire manquant
  - [ ] Retard workflow (> 5j)
  - [ ] Revue annuelle échue
- [ ] **Centre de tâches**
  - [ ] Afficher dans dashboard
  - [ ] Filter par utilisateur
  - [ ] Marquage accompli

### 6.4 Recherche Avancée
- [ ] **Moteur de recherche**
  - [ ] Recherche globale
  - [ ] Filtres multiples
  - [ ] Sauvegarde filtres
- [ ] **Écran /search ou intégré portefeuille**

**Progress Phase 6 : 0%**
**Status : ⚪ Pending**

---

## PHASE 7 : REPORTING & EXPORTS
**Objectif :** PDF, Excel, notes comité

### 7.1 Rapport Projet
- [ ] **API /api/reporting/project-report**
  - [ ] Générer PDF
  - [ ] Générer Word (.docx)
- [ ] **Contenu**
  - [ ] Fiche client
  - [ ] Fiche projet (tous détails)
  - [ ] Synthèse évaluation
  - [ ] Tableau scores
  - [ ] Commentaires
  - [ ] Documents attachés
- [ ] **Composant**
  - [ ] ReportGenerator.tsx

### 7.2 Note Comité
- [ ] **API /api/reporting/committee-note**
  - [ ] Générer PDF
  - [ ] Générer Word
- [ ] **Format Premium**
  - [ ] Page de garde
  - [ ] Logo/Entité
  - [ ] Executive summary
  - [ ] Synthèse scores
  - [ ] Red flags
  - [ ] Recommandation
  - [ ] Conditions/mitigants
  - [ ] Signaturess
- [ ] **Customisation**
  - [ ] Template paramétrable
  - [ ] Branding bancaire

### 7.3 Exports Portefeuille
- [ ] **API /api/reporting/portfolio-export**
  - [ ] Export Excel complet
  - [ ] Export CSV
- [ ] **Contenu Excel**
  - [ ] Onglet projets (synthèse)
  - [ ] Onglet scores détaillés
  - [ ] Onglet analyse secteur
  - [ ] Onglet analyse géographique
  - [ ] Onglet workflow/statuts

### 7.4 Export Audit
- [ ] **API /api/reporting/audit-export**
  - [ ] Historique actions
  - [ ] Format Excel

**Progress Phase 7 : 0%**
**Status : ⚪ Pending**

---

## PHASE 8 : TESTS, POLISSAGE & DÉPLOIEMENT
**Objectif :** QA, optimisation, déploiement Vercel

### 8.1 Tests Unitaires
- [ ] **Moteur de scoring**
  - [ ] Tests calculs domaines
  - [ ] Tests conversion notes
  - [ ] Tests NO-GO rules
- [ ] **API endpoints** (min 80% coverage)
  - [ ] Tests CRUD
  - [ ] Tests droits accès
  - [ ] Tests validations
- [ ] **Utils & helpers**
  - [ ] Tests formatage
  - [ ] Tests conversions

### 8.2 Tests d'Intégration
- [ ] **Workflow complet**
  - [ ] Création client → projet → évaluation → validation
- [ ] **Droits d'accès**
  - [ ] Vérifier isolation données par rôle/périmètre
- [ ] **Audit trail**
  - [ ] Tracer toutes actions

### 8.3 Tests UI
- [ ] **Chaque formulaire**
  - [ ] Création/édition complet
  - [ ] Validation côté client
  - [ ] Messages erreur clairs
- [ ] **Chaque écran**
  - [ ] Responsive
  - [ ] Performance acceptable
- [ ] **Navigation**
  - [ ] Boutons backlink
  - [ ] Menu intuitif

### 8.4 Optimisations
- [ ] **Performance BD**
  - [ ] Indexes créés
  - [ ] Requêtes optimisées (eager loading)
- [ ] **Caching**
  - [ ] Cache références (secteurs, pays)
  - [ ] Cache modèle scoring
- [ ] **Frontend**
  - [ ] Images optimisées
  - [ ] Bundle size réduit

### 8.5 Sécurité
- [ ] **Checklist sécurité**
  - [ ] Pas secrets en code
  - [ ] Validations côté serveur
  - [ ] SQL injection prévenue (Prisma)
  - [ ] XSS prévenue (React)
  - [ ] CORS configuré
- [ ] **Tests pénétration basiques**
  - [ ] Accès non-autorisé bloqué
  - [ ] Escalade privilèges impossible

### 8.6 Documentation
- [ ] **README.md complet**
- [ ] **API documentation**
- [ ] **Guide utilisateur** (optionnel)
- [ ] **Runbook déploiement**

### 8.7 Déploiement Vercel
- [ ] **Configuration Vercel**
  - [ ] Variables d'environnement
  - [ ] Domaine custom
  - [ ] SSL/HTTPS
- [ ] **Migrations Supabase appliquées**
- [ ] **Tests en staging**
- [ ] **Déploiement production**
- [ ] **Monitoring initial**

**Progress Phase 8 : 0%**
**Status : ⚪ Pending**

---

## 🔥 FONCTIONNALITÉS CRITIQUES (À NE PAS OUBLIER)

### Sécurité & Conformité
- [ ] ✅ Authentification JWT sécurisée
- [ ] ✅ Gestion sessions
- [ ] ✅ Contrôle d'accès granulaire (par rôle + périmètre)
- [ ] ✅ Audit trail complet (qui, quand, quoi)
- [ ] ✅ Suppression logique (archivage, pas d'effacement)
- [ ] ✅ Chiffrement données sensibles si requis

### Métier
- [ ] ✅ Moteur de scoring V7++ complètement implémenté
- [ ] ✅ NO-GO rules détectées automatiquement
- [ ] ✅ Red flags générées automatiquement
- [ ] ✅ Heatmap visuelle des risques
- [ ] ✅ Historique évaluations conservé
- [ ] ✅ Versioning modèle de scoring

### Usabilité
- [ ] ✅ Interfaces intuitives (TailwindCSS + shadcn/ui)
- [ ] ✅ Préremplissage intelligent (client/projet → évaluation)
- [ ] ✅ Messages d'erreur explicites
- [ ] ✅ Responsive design
- [ ] ✅ Notifications système

---

## 📊 RÉCAPITULATIF STATISTIQUES

**Nombre de**
- Écrans UI : ~25
- Endpoints API : ~40
- Composants React : ~60
- Types TypeScript : ~20
- Fonctions utilitaires : ~30
- Règles de scoring : ~15 domaines × 4 critères = 60 critères

**Taille estimée**
- Schéma Prisma : ~500 lignes
- Code métier : ~5000 lignes
- UI components : ~3000 lignes
- API routes : ~2000 lignes

---

## 🚀 PRIORITÉS IMMÉDIATES

1. **Valider schéma Prisma** avec modèle V7++
2. **Créer migrations Supabase** et tester
3. **Implémenter auth + rôles** (blocage de tout le reste)
4. **CRUD Client & Projet** (fondation)
5. **Moteur de scoring** (cœur métier)
6. **Workflow** (gouvernance)
7. Reste des fonctionnalités

---

**Fin de la checklist**

*Mise à jour fréquemment au fil de l'implémentation*
