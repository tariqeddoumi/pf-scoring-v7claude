# COPIL Presentation Generators

Trois versions professionnelles pour générer des présentations PowerPoint de comités de pilotage à partir de données PF Scoring.

---

## 📊 Comparaison des Versions

| Caractéristique      | v2.0 Standard | v2.1 Enhanced  | v3.0 Banking Pro    | v3.1.0 Ultra Pro     |
| -------------------- | ------------- | -------------- | ------------------- | -------------------- |
| **Slides**           | 6             | 6              | 7                   | 9                    |
| **Design**           | Basique       | Amélioré       | Ultra Pro           | Ultra Pro+           |
| **Couleurs**         | Bleu/Orange   | Bleu/Orange    | Navy/Gold           | Navy/Gold            |
| **Target**           | General       | General        | Banques             | Banques (C-Level)    |
| **Conformité**       | -             | -              | IFC/EBRD/Basel      | IFC/EBRD/Basel       |
| **Contenu**          | KPIs          | KPIs + Details | Executive Summary   | Executive + Strategy |
| **Risques**          | Basique       | Basique        | Détaillé (IFC/EBRD) | Détaillé (IFC/EBRD)  |
| **Action Plan**      | Non           | Non            | Oui                 | Oui                  |
| **Détails par Bloc** | Non           | Non            | Non                 | Oui                  |
| **Recommandations**  | Non           | Non            | Non                 | Oui                  |

---

## 🚀 Version 2.0 - Standard Generator

**Fichier:** `scripts/copil_generator.py`  
**Version:** 2.0.0

### Usage:

```bash
python scripts/copil_generator.py PF_SCORING_SPECIFICATIONS_TRACKING.csv
python scripts/copil_generator.py data.csv output.pptx
```

### Contenu des 6 slides:

1. **Titre** - Couverture professionnelle
2. **KPIs** - Cartes de statut colorées (INTÉGRÉ/EN COURS/PLANIFIÉ/BLOQUÉ)
3. **Avancement** - Graphique en barres par bloc
4. **Complétude** - Jauge avec barre de progression
5. **Risques** - Liste des items bloqués/critiques
6. **Prochaines Étapes** - Timeline des phases (9-12)

### Caractéristiques:

- ✅ Type hints et docstrings
- ✅ Gestion d'erreurs robuste
- ✅ Logging professionnel
- ✅ Code modulaire

---

## ✨ Version 2.1 - Enhanced Design

**Fichier:** `scripts/copil_generator.py`  
**Version:** 2.1.0  
**Amélioration de:** v2.0

### Améliorations principales:

- 🎨 **Titre:** Barre d'accent orange, décoration, badge de statut
- 📊 **KPIs:** Header bleu, cards améliorées avec descriptions, box de synthèse
- 📈 **Complétude:** Barre de progression, status badges (✅/⚠️/❌), statistiques détaillées

### Usage:

```bash
python scripts/copil_generator.py PF_SCORING_SPECIFICATIONS_TRACKING.csv
```

---

## 🏦 Version 3.0 - Banking Professional Edition

**Fichier:** `scripts/copil_generator_banking.py`  
**Version:** 3.0.0  
**Target:** Banques, institutions financières, COPIL C-level

### Usage:

```bash
python scripts/copil_generator_banking.py PF_SCORING_SPECIFICATIONS_TRACKING.csv
python scripts/copil_generator_banking.py data.csv COPIL_Banking_Report.pptx
```

### Contenu des 7 slides ULTRA PRO:

#### 1️⃣ **Couverture Professionnelle**

- Logo banking en haut
- Titre + Subtitle
- Badges de conformité réglementaire
- Date et avancement global

#### 2️⃣ **Résumé Exécutif** (C-Level)

- Métriques clés en boîtes colorées
- Statut général du projet
- Compliance framework
- Risques de dépassement de délais
- Items critiques (< 30% complétude)

#### 3️⃣ **Analyse de Risque** (IFC/EBRD)

- Catégories de risque bancaires:
  - Financial Risk
  - Technical Risk
  - Market Risk
  - Operational Risk
- Recommendations d'escalade
- Validation governance

#### 4️⃣ **Tableau de Bord KPIs**

- 4 cartes colorées (Green/Yellow/Orange/Red)
- Intégré / En Cours / Planifié / Bloqué
- Indicateurs clés:
  - Taux de complétion vs objectif
  - % livré / total
  - Items en retard
  - Items critiques

#### 5️⃣ **Plan d'Action Stratégique**

- 4 niveaux d'urgence:
  - **IMMÉDIAT (0-2 sem)** - Escalade + Risques
  - **COURT TERME (2-4 sem)** - Accélération ressources
  - **MOYEN TERME (1-2 mois)** - Completion conformité
  - **LONG TERME (2+ mois)** - Déploiement production

#### 6️⃣ **Gauge Complétude Global**

- Pourcentage géant avec couleur
- Status: ✅ EXCELLENT / ⚠️ ACCEPTABLE / 🔴 À AMÉLIORER
- Barre de progression
- Détails complets (total, intégrés, retard, critiques)

#### 7️⃣ **Closing Slide Professionnel**

- "Merci"
- "Questions & Discussion"
- Footer avec conformité réglementaire

### Caractéristiques Uniques v3.0:

🏦 **Banking-Specific:**

- ✅ Langage 100% bancaire français
- ✅ Conformité IFC/EBRD/Basel/Bank Al-Maghrib
- ✅ Catégories de risque standards bancaires
- ✅ Executive summary pour C-level
- ✅ Action plan stratégique 4 niveaux
- ✅ Palettes de couleurs professionnelles (Navy + Gold)

🎯 **Professionnalisme:**

- ✅ Schéma couleur bancaire (Navy #003366 + Gold #FF9900)
- ✅ Risk colors standardisés (Green/Yellow/Orange/Red)
- ✅ Typography professionnelle
- ✅ Badges de conformité réglementaire
- ✅ Recommandations actionables
- ✅ Timing/urgence dans plan d'action

---

## ⭐ Version 3.1.0 - Ultra Pro Edition (9 Slides)

**Fichier:** `scripts/copil_generator_v3_1.py`  
**Version:** 3.1.0  
**Target:** Banques, institutions financières, COPIL C-level + Strategic Planning

### Usage:

```bash
python scripts/copil_generator_v3_1.py PF_SCORING_SPECIFICATIONS_TRACKING.csv
python scripts/copil_generator_v3_1.py data.csv COPIL_Banking_Presentation_v3_1.pptx
```

### Contenu des 9 slides ULTRA PRO+:

#### 1️⃣ **Couverture Professionnelle Améliorée**

- Gold header bar + Navy background
- Logo "PF SCORING SYSTEM" prominent
- Titre géant en or
- Subtitle "Comité de Pilotage - COPIL"
- Versioning (v3.1.0) + Date
- Badges de conformité réglementaire (IFC • EBRD • Basel • Bank Al-Maghrib)

#### 2️⃣ **Résumé Exécutif** (C-Level)

- 4 cartes de métriques clés colorées:
  - **Complétude %** (Green/Orange/Red based on threshold)
  - **Intégrés** (count + %)
  - **En Cours** (Dev status)
  - **Bloqués** (Alert indicator)
- Statut général du projet
- Compliance summary
- Risques de dépassement de délais
- Items critiques (< 30% complétude)

#### 3️⃣ **Analyse de Risque Détaillée** (IFC/EBRD)

- Catégories de risque bancaires avec barres visuelles:
  - **Financial Risk** - Risques financiers
  - **Technical Risk** - Risques techniques
  - **Market Risk** - Risques de marché
  - **Operational Risk** - Risques opérationnels
- Barres de progression colorées (Green/Orange/Red)
- Recommandations d'escalade critiques
- Validation governance immédiate

#### 4️⃣ **Tableau de Bord KPIs Professionnel**

- 4 cartes grandes et colorées:
  - **INTÉGRÉ** (Green) - Livré / % complet
  - **EN COURS** (Yellow) - Dev en cours
  - **PLANIFIÉ** (Orange) - Prévu
  - **BLOQUÉ** (Red) - Nécessite escalade
- Indicateurs clés détaillés:
  - Taux de complétion vs objectif (100%)
  - Velocity (% livré / total)
  - Items en retard
  - Items critiques
  - Blockers identifiés

#### 5️⃣ **Plan d'Action Stratégique Détaillé**

- 4 niveaux d'urgence avec timeline:
  - **🔴 IMMÉDIAT (0-2 sem)** - Escalade + Risk review + Validation governance
  - **🟠 COURT TERME (2-4 sem)** - Accélération ressources + Replan
  - **🟡 MOYEN TERME (1-2 mois)** - Completion conformité + Testing & QA
  - **🟢 LONG TERME (2+ mois)** - Déploiement production + Support
- Boîtes avec borders colorés pour chaque niveau

#### 6️⃣ **Gauge Complétude Global Professionnel**

- Pourcentage géant (format: "85%")
- Status avec emoji: ✅ EXCELLENT / ⚠️ ACCEPTABLE / 🔴 À AMÉLIORER
- Barre de progression visuelle colorée
- Détails complets:
  - Total éléments
  - Intégrés et %
  - En retard
  - Critiques (< 30%)

#### 7️⃣ **Détails par Bloc** (NEW)

- Résumé par bloc de travail
- Affichage: "BLOC: XX% (N items)"
- Jusqu'à 4 blocs principaux
- Visualisation de complétude par bloc

#### 8️⃣ **Recommandations Stratégiques** (NEW)

- **PRIORITÉ 1:** Résoudre items bloqués - Impact: Critique - Timeline: IMMÉDIAT
- **PRIORITÉ 2:** Accélérer items en retard - Impact: Haut - Timeline: 2-4 semaines
- **PRIORITÉ 3:** Identifier/mitiguer risques critiques - Impact: Moyen - Timeline: En cours
- Objectif: Atteindre 100% de complétude
- Checkpoint hebdomadaire en COPIL

#### 9️⃣ **Closing Slide Professionnel**

- "Merci" en grande typographie (80pt, Gold)
- "Questions & Discussion" (32pt, White)
- Footer avec date, version et badges de conformité

### Caractéristiques Uniques v3.1.0:

🏦 **Banking-Specific + Strategic:**

- ✅ 9 slides pour couverture complète
- ✅ Détails par bloc de travail
- ✅ Recommandations stratégiques actionables
- ✅ Langue 100% bancaire français
- ✅ Conformité IFC/EBRD/Basel/Bank Al-Maghrib
- ✅ Catégories de risque standards bancaires
- ✅ Executive summary pour C-level executives
- ✅ Action plan stratégique 4 niveaux avec timeline

🎯 **Professionnalisme Avancé:**

- ✅ Schéma couleur bancaire (Navy #003366 + Gold #FF9900)
- ✅ Risk colors standardisés (Green/Yellow/Orange/Red)
- ✅ Typography professionnelle et lisible
- ✅ Badges de conformité réglementaire
- ✅ Recommandations prioritaires actionables
- ✅ Timing/urgence dans plan d'action
- ✅ Helper functions pour réutilisabilité:
  - `add_title_bar()` - Barre de titre Navy/Gold standard
  - `create_metric_card()` - Cartes de métriques colorées
  - `calc_stats()` - Calcul de statistiques détaillées

📊 **Données Enrichies:**

- ✅ Statistiques par bloc de travail
- ✅ Analyse de risque par catégorie (IFC/EBRD)
- ✅ Items critiques identifiés (< 30% complétude)
- ✅ Items en retard (50% < complétude < 100%)
- ✅ Breakdown de statut complet

---

## 📖 Exemples d'Utilisation

### Générer présentation standard:

```bash
python scripts/copil_generator.py PF_SCORING_SPECIFICATIONS_TRACKING.csv
# Génère: COPIL_Presentation.pptx
```

### Générer présentation banking pro (7 slides):

```bash
python scripts/copil_generator_banking.py PF_SCORING_SPECIFICATIONS_TRACKING.csv
# Génère: COPIL_Banking_Presentation.pptx
```

### Générer présentation ultra pro (9 slides) - v3.1.0:

```bash
python scripts/copil_generator_v3_1.py PF_SCORING_SPECIFICATIONS_TRACKING.csv
# Génère: COPIL_Banking_Presentation_v3_1.pptx
```

### Avec nom de fichier personnalisé:

```bash
python scripts/copil_generator_banking.py data.csv Mon_COPIL_2026_04.pptx
python scripts/copil_generator_v3_1.py data.csv Mon_COPIL_Ultra_2026_04.pptx
```

---

## 🔧 Installation des Dépendances

```bash
pip install python-pptx
```

---

## 📋 Format du CSV Attendu

Le CSV doit contenir les colonnes suivantes:

| Colonne         | Format                                      | Exemple                                  |
| --------------- | ------------------------------------------- | ---------------------------------------- |
| BLOC            | Text                                        | "DOMAINES SCORING"                       |
| CATÉGORIE       | Text                                        | "Financier", "Technique", "Marché", etc. |
| ÉLÉMENT         | Text                                        | "Sponsor Strength"                       |
| DESCRIPTION     | Text                                        | Description détaillée                    |
| SPÉCIFICATION   | Text                                        | Spécifications techniques                |
| STATUT          | "INTÉGRÉ"\|"EN COURS"\|"PLANIFIÉ"\|"BLOQUÉ" | "INTÉGRÉ"                                |
| TYPE_CHANGEMENT | Text                                        | "Minor", "Major", etc.                   |
| NOTES           | Text                                        | Commentaires additionnels                |
| COMPLÉTION\_%   | "0-100%"                                    | "85%", "100%", "50%"                     |
| DATE_COMPLÉTION | Date                                        | "2026-04-06"                             |

---

## 🌍 Conformité Réglementaire

**v3.0 Banking Edition** respecte les standards:

- 🏛️ **IFC** - International Finance Corporation
- 🏛️ **EBRD** - European Bank for Reconstruction and Development
- 🏛️ **Basel** - Basel Committee on Banking Supervision
- 🏛️ **BAM** - Bank Al-Maghrib (Banque centrale du Maroc)

Catégories de risque IFC/EBRD:

- Financial Risk
- Technical Risk
- Market Risk
- Operational Risk
- Environmental Risk (optional)
- Social Risk (optional)

---

## 📞 Support

Pour questions ou améliorations, consultez la documentation du projet.

---

**Latest Version:** 3.1.0  
**Date:** 2026-04-06  
**Langage:** Python 3.7+  
**Dépendances:** python-pptx

### Historique des Versions:

- **v2.0.0** - Standard Generator (6 slides)
- **v2.1.0** - Enhanced Design (6 slides, improved styling)
- **v3.0.0** - Banking Professional Edition (7 slides, IFC/EBRD/Basel compliance)
- **v3.1.0** - Ultra Pro Edition (9 slides, strategic + detailed breakdowns)

🏦 **Prêt pour vos présentations COPIL professionnelles en v3.1.0!**
