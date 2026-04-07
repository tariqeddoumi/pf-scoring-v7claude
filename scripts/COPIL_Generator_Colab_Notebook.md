# COPIL Presentation Generator - Google Colab Notebook

## Installation et Utilisation

### Option 1: Via API (Recommandée)

```python
# Installer les dépendances
!pip install python-pptx requests

# Importer le script
import sys
sys.path.append('/content/drive/MyDrive/pf-scoring')

from scripts.copil_generator_v4_colab import main

# Générer le COPIL depuis l'API
api_url = "https://votre-app.vercel.app"  # URL de votre application
auth_token = "votre_token_jwt"  # Token JWT (optionnel)

main(api_url=api_url, auth_token=auth_token, output_file="COPIL_Presentation.pptx")

# Télécharger le fichier
from google.colab import files
files.download("COPIL_Presentation.pptx")
```

### Option 2: Via Fichier CSV (Suivi de Spécifications)

```python
# Installer les dépendances
!pip install python-pptx

# Importer le script
import sys
sys.path.append('/content/drive/MyDrive/pf-scoring')

from scripts.copil_generator_v4_colab import main

# Télécharger votre fichier CSV
from google.colab import files
uploaded = files.upload()

csv_file = list(uploaded.keys())[0]

# Générer le COPIL depuis le CSV
main(csv_file=csv_file, output_file="COPIL_Presentation.pptx")

# Télécharger le fichier
files.download("COPIL_Presentation.pptx")
```

## Structure du CSV pour Option 2

Le fichier CSV doit contenir les colonnes suivantes:

| ÉLÉMENT | BLOC | STATUT | COMPLÉTION_% | DESCRIPTION |
|---------|------|--------|--------------|-------------|
| Feature 1 | Module A | INTÉGRÉ | 100% | Description |
| Feature 2 | Module A | EN COURS | 75% | Description |
| Feature 3 | Module B | PLANIFIÉ | 0% | Description |

**Valeurs STATUT acceptées:**
- INTÉGRÉ (100% complété)
- EN COURS (en développement)
- PLANIFIÉ (prévu)
- BLOQUÉ (bloqué par un problème)

## Données Générées par l'API

### Utilisateurs (Users)
- Récupère le nombre total d'utilisateurs
- Compte par rôle: admin, manager, analyst, guest, viewer
- Génère un graphique de distribution par rôle

### Projets (Projects)
- Récupère le nombre total de projets
- Compte par statut: draft, in_review, approved, rejected
- Génère un graphique de distribution par statut

### Évaluations (Evaluations)
- Récupère le nombre total d'évaluations
- Compte par statut du flux de travail:
  - Draft (Brouillon)
  - Submitted (Soumise)
  - Validated (Validée)
  - Approved (Approuvée)
  - Rejected (Rejetée)
- Génère un graphique du flux de travail

## Slides Générées

### Option 1 (API)
1. **Titre** - Couverture du rapport
2. **Gestion des Utilisateurs** - Distribution par rôle
3. **Gestion des Projets** - Distribution par statut
4. **Flux des Évaluations** - Workflow des évaluations
5. **Prochaines Étapes** - Phases futures (9-12)

### Option 2 (CSV)
1. **Titre** - Couverture du rapport
2. **Résumé Exécutif** - KPIs généraux
3. **Avancement par Bloc** - Graphique de complétude
4. **Complétude Globale** - Jauge de progression
5. **Risques & Blocages** - Top 5 risques
6. **Prochaines Étapes** - Phases futures (9-12)

## Authentification API

### Sans Authentification (données publiques)
```python
main(api_url="https://votre-app.vercel.app", auth_token=None)
```

### Avec JWT Token (données sécurisées)
```python
# Récupérer un token JWT depuis votre application
auth_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
main(api_url="https://votre-app.vercel.app", auth_token=auth_token)
```

## Personnalisation

### Changer les couleurs
Modifiez les variables RGB dans le script:

```python
PRIMARY_BLUE = RGBColor(0, 51, 102)      # #003366
ACCENT_ORANGE = RGBColor(255, 153, 0)   # #FF9900
GREEN = RGBColor(76, 175, 80)
RED = RGBColor(244, 67, 54)
```

### Ajouter des slides personnalisées
Créez une nouvelle fonction et appelez-la dans `create_presentation()`:

```python
def add_custom_slide(prs, stats):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    # Personnalisez votre slide
    pass

# Dans create_presentation():
add_custom_slide(prs, stats)
```

## Dépannage

### Erreur: "API Error"
- Vérifiez que l'URL est correcte et accessible
- Vérifiez que le token JWT est valide
- Vérifiez que l'API retourne du JSON

### Erreur: "CSV file not found"
- Assurez-vous d'avoir téléchargé le fichier CSV
- Vérifiez que le nom du fichier est correct

### Erreur: "Module not found"
- Installez python-pptx: `!pip install python-pptx`
- Installez requests: `!pip install requests` (pour API)

## Versions

- **v4** (actuelle): Intégration API + support CSV hérité
- **v3.1**: Support CSV uniquement
- **v2**: Première version générateur PPT

## Support

Pour les questions ou problèmes:
1. Vérifiez les logs de sortie (messages avec 📥, ✅, ❌)
2. Consultez les exemples ci-dessus
3. Modifiez le script selon vos besoins
