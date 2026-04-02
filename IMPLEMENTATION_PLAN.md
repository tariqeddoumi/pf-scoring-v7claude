# Plan d'Implémentation – Application PF Scoring v7

**Document de Cadrage Fonctionnel & Technique**
Date : 2 Avril 2026
Statut : EN COURS

---

## 1. Stratégie d'Implémentation

### 1.1 Approche par Phases

**Phase 1 (MVP) : Fondations (Semaines 1-2)**
- Architecture base de données
- Bloc Client (CRUD)
- Bloc Projet (CRUD)
- Authentification & Rôles basiques
- Écrans de base

**Phase 2 : Scoring (Semaines 3-4)**
- Moteur de scoring
- Modèle paramétrable
- Calcul automatique
- Restitution scores

**Phase 3 : Workflow & Gouvernance (Semaines 5-6)**
- Workflow de validation
- Règles de no-go
- Audit trail complet
- Justifications obligatoires

**Phase 4 : Administration & Pilotage (Semaines 7-8)**
- Gestion utilisateurs/rôles avancée
- Paramétrage du modèle
- Portefeuille & dashboards
- Notifications

**Phase 5 : Reporting & Premium (Semaines 9-10)**
- Exports PDF/Excel/Word
- Notes comité
- Graphiques avancés
- Monitoring post-octroi

---

## 2. Architecture Base de Données

### 2.1 Schéma Prisma (A Créer/Compléter)

**Tables Principales :**

```
Users
├── id (UUID)
├── email (String unique)
├── password (String hashed)
├── nom, prenom
├── role (enum)
├── perimetre (String)
├── actif (Boolean)
├── createdAt, updatedAt

Roles
├── id (UUID)
├── code (String unique)
├── label (String)
├── permissions (JSON)

Clients
├── id (UUID)
├── raison_sociale (String)
├── radical_client (String unique)
├── secteur (String)
├── pays (String)
├── charge_affaires (String)
├── notation_interne (String)
├── creePar (UUID -> Users)
├── createdAt, updatedAt
├── historique (JSON)

Projects
├── id (UUID)
├── nom (String)
├── client_id (UUID -> Clients)
├── type_projet (String)
├── secteur (String)
├── pays (String)
├── montant_total (Float)
├── montant_financer (Float)
├── devise (String default: MAD)
├── statut (enum: brouillon, en_cours, soumis, valide, rejete, archive)
├── status_cycle (enum: preparation, evaluation, validation, close)
├── analyste (String)
├── creePar (UUID -> Users)
├── createdAt, updatedAt
├── dateMiseAJour (DateTime)

Project_Details
├── project_id (UUID -> Projects)
├── localisation (JSON)
├── parties_prenantes (JSON)
├── caracteristiques_techniques (JSON)
├── calendrier (JSON)
├── financement (JSON)
├── revenus_contrats (JSON)
├── construction (JSON)
├── exploitation (JSON)
├── juridique (JSON)
├── esg (JSON)
├── garanties (JSON)
├── documents (JSON)

Evaluations
├── id (UUID)
├── project_id (UUID -> Projects)
├── type_evaluation (enum)
├── version_modele (String)
├── analyste (String)
├── statut (enum: brouillon, soumis, rejete, valide)
├── score_global (Float)
├── score_brut (Float)
├── score_ajuste (Float)
├── note_finale (String)
├── pd_indicative (Float)
├── classe_risque (String)
├── recommandation (String)
├── commentaires (Text)
├── red_flags (JSON array)
├── overrides (JSON array)
├── createdAt, updatedAt

EvaluationDomainScores
├── id (UUID)
├── evaluation_id (UUID -> Evaluations)
├── domain_code (String)
├── domain_label (String)
├── score (Float)
├── poids (Float)
├── commentaire (Text)

EvaluationAnswers
├── id (UUID)
├── evaluation_id (UUID -> Evaluations)
├── criterion_code (String)
├── reponse (String)
├── valeur_numerique (Float)
├── justification (Text)
├── score (Float)

ScoringModel
├── id (UUID)
├── version (String unique)
├── label (String)
├── date_effet (DateTime)
├── domaines (JSON array)
├── criteres (JSON array)
├── regles_no_go (JSON array)
├── ponderations (JSON)
├── actif (Boolean)
├── createdAt

Workflow_Steps
├── id (UUID)
├── evaluation_id (UUID -> Evaluations)
├── etape (String enum)
├── date_transition (DateTime)
├── utilisateur (String)
├── action (String)
├── commentaire (Text)
├── ancien_statut (String)
├── nouveau_statut (String)

AuditLog
├── id (UUID)
├── utilisateur (String)
├── action (String)
├── module (String)
├── object_type (String: client, project, evaluation, etc)
├── object_id (String)
├── ancienne_valeur (JSON)
├── nouvelle_valeur (JSON)
├── motif (String)
├── createdAt

Notifications
├── id (UUID)
├── utilisateur_id (UUID -> Users)
├── type (String)
├── titre (String)
├── message (Text)
├── lien_action (String)
├── lu (Boolean)
├── createdAt

Documents
├── id (UUID)
├── object_type (String: client, project, evaluation)
├── object_id (UUID)
├── nom_fichier (String)
├── type_document (String)
├── chemin_stockage (String)
├── taille (Int)
├── creePar (String)
├── createdAt
```

---

## 3. Structure du Projet (Arborescence)

```
/home/user/pf-scoring-v7claude/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (dashboard principal)
│   │   ├── clients/
│   │   │   ├── page.tsx (liste)
│   │   │   ├── new/page.tsx (création)
│   │   │   └── [id]/
│   │   │       ├── page.tsx (détail)
│   │   │       └── edit/page.tsx (édition)
│   │   ├── projects/
│   │   │   ├── page.tsx (liste)
│   │   │   ├── new/page.tsx (création)
│   │   │   └── [id]/
│   │   │       ├── page.tsx (détail)
│   │   │       ├── edit/page.tsx (édition)
│   │   │       ├── evaluation/
│   │   │       │   ├── page.tsx (liste éval)
│   │   │       │   ├── new/page.tsx (créer éval)
│   │   │       │   └── [evalId]/
│   │   │       │       ├── page.tsx (détail éval)
│   │   │       │       ├── score/page.tsx (saisie scoring)
│   │   │       │       └── restitution/page.tsx (résultats)
│   │   │       └── documents/page.tsx
│   │   ├── portefeuille/
│   │   │   ├── page.tsx (vue portefeuille)
│   │   │   ├── dashboard/page.tsx (dashboards)
│   │   │   └── analytics/page.tsx (analyses)
│   │   ├── admin/
│   │   │   ├── users/page.tsx
│   │   │   ├── roles/page.tsx
│   │   │   ├── model/page.tsx (paramétrage scoring)
│   │   │   ├── references/page.tsx (listes de valeurs)
│   │   │   ├── audit/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── workflow/page.tsx (suivi validations)
│   ├── api/
│   │   ├── clients/
│   │   │   ├── route.ts (GET all, POST create)
│   │   │   └── [id]/route.ts (GET, PUT, DELETE)
│   │   ├── projects/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── evaluation/route.ts
│   │   │       └── documents/route.ts
│   │   ├── evaluations/
│   │   │   ├── route.ts (GET, POST)
│   │   │   ├── [id]/route.ts (GET, PUT)
│   │   │   ├── [id]/score/route.ts (POST calculate)
│   │   │   └── [id]/validate/route.ts (POST submit)
│   │   ├── admin/
│   │   │   ├── users/route.ts
│   │   │   ├── roles/route.ts
│   │   │   ├── model/route.ts
│   │   │   └── audit/route.ts
│   │   ├── workflow/
│   │   │   └── [id]/validate/route.ts
│   │   ├── reporting/
│   │   │   ├── project-report/route.ts
│   │   │   ├── committee-note/route.ts
│   │   │   └── portfolio-export/route.ts
│   │   └── notifications/route.ts
│   └── layout.tsx
│
├── components/
│   ├── ui/ (shadcn/ui components)
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   ├── forms/
│   │   ├── ClientForm.tsx
│   │   ├── ProjectForm.tsx
│   │   ├── EvaluationForm.tsx
│   │   ├── ScoringForm.tsx (domaine par domaine)
│   ├── scoring/
│   │   ├── ScoringWidget.tsx
│   │   ├── ScoreRadar.tsx
│   │   ├── ScoreHeatmap.tsx
│   │   ├── WaterfallChart.tsx
│   ├── tables/
│   │   ├── ClientsTable.tsx
│   │   ├── ProjectsTable.tsx
│   │   ├── EvaluationsTable.tsx
│   │   ├── AuditLogTable.tsx
│   ├── dashboard/
│   │   ├── PortfolioSummary.tsx
│   │   ├── RiskDistribution.tsx
│   │   ├── SectorAnalysis.tsx
│   │   └── KeyIndicators.tsx
│   ├── workflow/
│   │   ├── WorkflowTimeline.tsx
│   │   ├── ValidationStep.tsx
│
├── lib/
│   ├── scoring-engine.ts (moteur de calcul)
│   ├── scoring-rules.ts (règles no-go, malus, etc)
│   ├── model-manager.ts (gestion modèle paramétrable)
│   ├── workflow-manager.ts (gestion workflow)
│   ├── audit.ts (traçabilité)
│   ├── notifications.ts (système notifications)
│   ├── reporting.ts (génération rapports)
│   ├── import-export.ts
│   ├── validators.ts (validations métier)
│   ├── constants.ts
│   ├── utils.ts
│   ├── prisma-client.ts
│   ├── auth.ts (JWT, vérification token)
│   └── permissions.ts (gestion droits)
│
├── prisma/
│   ├── schema.prisma (À COMPLÉTER)
│   └── migrations/
│
├── types/
│   ├── index.ts
│   ├── client.ts
│   ├── project.ts
│   ├── evaluation.ts
│   ├── scoring.ts
│   ├── workflow.ts
│   └── api.ts
│
├── public/
│   └── (images, logos, documents statiques)
│
├── styles/
│   └── globals.css
│
├── .env.local (À configurer)
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── prisma.schema
│
├── IMPLEMENTATION_PLAN.md (ce fichier)
├── SPECIFICATION.md (spécification fonctionnelle détaillée)
├── IMPLEMENTATION_CHECKLIST.md (tableau de pilotage)
└── README.md
```

---

## 4. Tableau de Pilotage (Checklist d'Implémentation)

**Voir fichier dédié : `IMPLEMENTATION_CHECKLIST.md`**

Résumé rapide des % par phase :
- Phase 1 (Fondations) : 0% ✓
- Phase 2 (Scoring) : 0% ✓
- Phase 3 (Workflow) : 0% ✓
- Phase 4 (Admin) : 0% ✓
- Phase 5 (Reporting) : 0% ✓

---

## 5. Technologies & Stack

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript strict
- **Style** : TailwindCSS + shadcn/ui
- **ORM** : Prisma
- **DB** : Supabase (PostgreSQL)
- **Auth** : JWT (custom + Supabase Auth optionnel)
- **Reporting** : PDFKit + Excel.js
- **Charts** : Recharts ou Chart.js
- **Validation** : Zod
- **API** : REST avec Next.js App Router

---

## 6. Prochaines Étapes

1. **Confirmation du modèle de scoring** (utilisateur fournira)
2. **Finalisation du schéma Prisma**
3. **Création des migrations Supabase**
4. **Développement Phase 1**
5. **Tests d'intégration**
6. **Déploiement itéré sur Vercel**

---

## 7. Notes Importantes

- La spécification est **très complète** et nécessite une implémentation rigoureuse
- Chaque phase doit être testée avant la suivante
- Les droits d'accès et la traçabilité sont **critiques**
- Le moteur de scoring doit être **paramétrable** sans refonte technique
- Tous les changements doivent être **auditables**

---

**En attente du modèle de scoring détaillé pour avancer.**
