# Guide d'Import dans Google Sheets

## Étape 1: Préparation du fichier
Le fichier `PF_SCORING_SPECIFICATIONS_TRACKING.csv` est prêt à l'import.

## Étape 2: Import dans Google Sheets

### Option A: Importer depuis Google Drive
1. Allez sur https://drive.google.com
2. Cliquez "Nouveau" → "Google Sheets" → "À partir d'un fichier"
3. Téléchargez le fichier CSV
4. Google Sheets créera automatiquement les colonnes

### Option B: Import direct dans Google Sheets existant
1. Ouvrez votre Google Sheet
2. Menu "Fichier" → "Importer"
3. Sélectionnez "Télécharger" ou "Google Drive"
4. Choisissez le mode d'import:
   - ✅ "Remplacer la feuille actuelle" (recommandé pour une nouvelle feuille)
   - ☐ "Ajouter à la feuille actuelle"

### Option C: Copy-paste
1. Ouvrez le CSV dans Excel ou un editeur texte
2. Sélectionnez tout (Ctrl+A)
3. Copiez (Ctrl+C)
4. Allez à Google Sheets
5. Collez (Ctrl+V)

## Étape 3: Mise en Format (Formatting)

### En-têtes (Headers)
```
BLOC | CATÉGORIE | ÉLÉMENT | DESCRIPTION | SPÉCIFICATION | STATUT | TYPE_CHANGEMENT | NOTES | COMPLÉTION_% | DATE_COMPLÉTION
```

### Formatage Personnalisé

#### A. Colonne STATUT - Conditional Formatting
1. Sélectionnez toute la colonne "STATUT"
2. Format → Conditional formatting
3. Règles:
   - **INTÉGRÉ** = Fond vert (#34A853), texte blanc
   - **EN COURS** = Fond orange (#F9AB00), texte noir
   - **PLANIFIÉ** = Fond bleu (#4285F4), texte blanc
   - **AJOUT** = Fond cyan (#1D9E74), texte blanc

#### B. Colonne COMPLÉTION_% - Barre de Progression
1. Sélectionnez la colonne "COMPLÉTION_%"
2. Format → Conditional formatting
3. Style: "Barre de données à color gradient"
4. Couleur: Vert à Orange à Rouge (0-100%)

#### C. Filtrage Automatique
1. Sélectionnez la ligne d'en-têtes
2. Données → Créer un filtre

#### D. Triangles de Couleur (Triangle indicator)
Dans la colonne "TYPE_CHANGEMENT":
- 🔴 "AJOUT" = Highlight en rouge (NEW FEATURE)
- 🟢 "FIX" = Highlight en vert (BUG FIX)
- 🔵 "ENHANCEMENT" = Highlight en bleu (IMPROVEMENT)
- ⚪ "" = Pas de changement (STANDARD)

### Groupage par Bloc
1. Données → Grouper les lignes → Par colonne "BLOC"
2. Cela créera des expandables (+/-) pour chaque bloc

### Largeur des Colonnes
Largeur recommandée:
- BLOC: 200px
- CATÉGORIE: 150px
- ÉLÉMENT: 180px
- DESCRIPTION: 300px
- SPÉCIFICATION: 350px
- STATUT: 100px
- TYPE_CHANGEMENT: 120px
- NOTES: 250px
- COMPLÉTION_%: 100px
- DATE_COMPLÉTION: 120px

## Étape 4: Partage et Collaboration

### Permissions
1. Cliquez "Partager" (coin supérieur droit)
2. Ajouter des collaborateurs:
   - Product Manager: Peut éditer
   - Tech Lead: Peut éditer
   - Stakeholders: Peut visualiser (Viewer)

### Notifications
2. ☑ "Notifier les personnes" = envoie email automatiquement
3. Ajouter un commentaire pour contexte

### Audit Trail
Google Sheets enregistre automatiquement:
- Qui a changé quoi
- Quand
- Ancien et nouveau contenu

Voir l'historique: Menu → "Historique des versions"

## Étape 5: Maintenance Quotidienne

### Chaque jour de travail:
1. Ouvrez le Google Sheet PMO
2. Mettez à jour COMPLÉTION_%:
   - 0% = Pas commencé
   - 25% = Planification en cours
   - 50% = Implémentation en cours
   - 75% = Testing en cours
   - 90% = Quasi-finalisé
   - 100% = Complété & Validé

3. Mettez à jour STATUT:
   - PLANIFIÉ → EN COURS (quand travail commence)
   - EN COURS → INTÉGRÉ (quand finalisé & validé)
   - EN COURS → BLOQUÉ (si problème critique)

4. Ajoutez NOTES si changements ou problèmes

5. Mettez à jour DATE_COMPLÉTION quand % = 100%

### Hebdomadaire:
1. Analyser les colonnes COMPLÉTION_%:
   - Moyenne générale = Progress global
   - Identifiez les items bloquants (0% depuis >3 jours)
   
2. Créer un graphique d'avancement:
   - Insérer → Graphique
   - Type: "Colonne groupée" ou "Radar"
   - Axe X: BLOC
   - Axe Y: COMPLÉTION_%

3. Status meeting: Présenter le graphique aux stakeholders

## Étape 6: Métriques et Dashboards

### Vue Synthétique (Summary Tab)

Créer un nouvel onglet "Résumé" avec les formules:

```
=COUNTIF('Suivi'!F:F,"INTÉGRÉ")        → Tâches complétées
=COUNTIF('Suivi'!F:F,"EN COURS")       → Tâches en cours
=COUNTIF('Suivi'!F:F,"PLANIFIÉ")       → Tâches prévues
=COUNTIF('Suivi'!F:F,"BLOQUÉ")         → Tâches bloquées

=AVERAGE('Suivi'!I:I)                  → Complétion moyenne (%)

=UNIQUE('Suivi'!A:A)                   → Liste des blocs
=SUMIF('Suivi'!A:A,A2,'Suivi'!I:I)/COUNTIF('Suivi'!A:A,A2) → Complétion par bloc
```

### Graphiques Recommandés:
1. **Pie Chart**: % Intégré vs EN COURS vs PLANIFIÉ vs BLOQUÉ
2. **Line Chart**: Complétion globale par jour (progress tracking)
3. **Bar Chart**: Complétion par BLOC (par domaine de scoring)
4. **Gauge Chart**: Complétion globale du projet (0-100%)

## Alternatives à Google Sheets

Si vous voulez un outil PMO plus robuste:

### 1. **Notion** (Recommandé pour agile/PMO)
- Gratuit pour 10 utilisateurs
- Database views (Table, Timeline, Kanban, Calendar)
- Relations et roll-ups
- Import depuis Excel/CSV facile
- https://notion.so

### 2. **Asana** (Enterprise PMO)
- Timeline (Gantt)
- Board (Kanban) 
- Workload balancing
- Custom fields et workflows
- https://asana.com

### 3. **Jira** (Si vous utilisez déjà GitHub/Dev Workflow)
- Épics = Phases (0-10)
- Stories = Spécifications
- Tasks = Éléments détaillés
- Burndown charts
- https://www.atlassian.com/software/jira

### 4. **Monday.com** (Visual Project Management)
- No-code interface
- Gantt, Kanban, Timeline views
- Automation workflows
- Budget & Resource tracking
- https://monday.com

## Recommandation Finale

**Pour un PMO bancaire strict** → Notion ou Excel (Google Sheets)
- Simplicité
- Traçabilité (audit trail)
- Pas de dépendances externes

**Pour un Scrum/Agile lean** → Jira + GitHub
- Intégration dev workflow
- Automatisation CI/CD
- Burndown charts

**Pour un vision complète multi-stakeholder** → Asana ou Monday.com
- Timeline (Gantt) pour gouvernance
- Resource allocation
- Budget tracking

## Notes Importantes

⚠️ **N'oubliez pas:**
1. Backuper le Google Sheet régulièrement (télécharger en Excel)
2. Créer des versions snapshots chaque semaine (File → Save version)
3. Partager l'accès READ-ONLY aux stakeholders externes
4. Documenter les blocages dans NOTES (pour audit post-projet)
5. Mettre à jour DATE_COMPLÉTION uniquement quand 100% finalisé
