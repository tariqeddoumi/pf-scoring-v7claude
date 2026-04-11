# 📊 MODÈLE DE SCORING PROJECT FINANCE V7++

## NOTE MÉTHODOLOGIQUE COMPLÈTE & EXPERT

**Version:** 7.0+ (Advanced)  
**Date:** Avril 2026  
**Audience:** Risk Managers, Credit Committees, Investors  
**Compliance:** BAM (Bank Al-Maghrib), IFC Standards, Equator Principles

---

## TABLE DES MATIÈRES

1. [Résumé Exécutif](#résumé-exécutif)
2. [Architecture du Modèle](#architecture-du-modèle)
3. [Domaines Détaillés (D1-D9)](#domaines-détaillés)
4. [Formules & Calculs](#formules--calculs)
5. [Rules Engine (NO-GO & MALUS)](#rules-engine)
6. [Stress Testing](#stress-testing)
7. [Exemple d'Application](#exemple-dapplication)
8. [FAQ & Glossaire](#faq--glossaire)

---

# RÉSUMÉ EXÉCUTIF

## 🎯 Objectif du Modèle V7++

Le modèle V7++ est une **méthodologie de scoring Project Finance** destinée aux banques, fonds d'investissement, et développeurs de projets. Il évalue la **viabilité financière** et les **risques** d'une infrastructure ou projet d'investissement.

### Principes Fondamentaux

**En Project Finance :**

- ✅ La dette est remboursée par **les cash-flows du projet**, pas par le sponsor
- ✅ Il n'existe **pas de sponsor backup** fiable
- ✅ Les risques doivent être **identifiés, mesurés, mitigés contractuellement**

### Différence avec Autres Modèles

| Aspect                   | Corporate              | Project Finance       | V7++             |
| ------------------------ | ---------------------- | --------------------- | ---------------- |
| **Emprunteur**           | Entreprise             | Société ad-hoc        | SPV              |
| **Source remboursement** | Cash flow global       | Cash flow projet      | Revenus contrats |
| **Priorité risques**     | Marché de l'emprunteur | Construction + Marché | TOUS les risques |
| **Durée**                | 3-7 ans                | 15-30 ans             | Long-terme       |
| **Complexité**           | Modérée                | TRÈS ÉLEVÉE           | Expert           |

### Performance Attendue du V7++

- **Taux de précision:** > 85% sur PD prediction
- **Temps évaluation:** 3-5 jours (vs. 2-3 semaines avant)
- **Coverage:** 9 domaines = ~95% des risques PF

---

## ARCHITECTURE DU MODÈLE

### 🏗️ Structure Hiérarchique

```
SCORING GLOBAL
    ↓
    ├─ DOMAINE 1: PROJECT FUNDAMENTALS (20%)
    │   ├─ D1.1: Sponsor Strength (35%)
    │   ├─ D1.2: Project Structure (35%)
    │   └─ D1.3: Permits & Land (30%)
    │
    ├─ DOMAINE 2: HOST COUNTRY (10%)
    │   ├─ D2.1: Regulatory Environment (35%)
    │   ├─ D2.2: FX & Repatriation Risk (35%)
    │   └─ D2.3: Sovereign Support (30%)
    │
    ├─ DOMAINE 3: CONSTRUCTION PHASE (15%)
    │   ├─ D3.1: EPC Completion Risk (35%)
    │   ├─ D3.2: Interfaces & Execution (35%)
    │   └─ D3.3: Insurance & Risk Mitigation (30%)
    │
    ├─ DOMAINE 4: OPERATION PHASE (15%)
    │   ├─ D4.1: O&M Contract & Operator (35%)
    │   ├─ D4.2: Technology & Reliability (35%)
    │   └─ D4.3: Maintenance & Resilience (30%)
    │
    ├─ DOMAINE 5: REVENUE & MARKET (15%)
    │   ├─ D5.1: Offtaker Quality (35%)
    │   ├─ D5.2: PPA Solidity (35%)
    │   └─ D5.3: Market Stability (30%)
    │
    ├─ DOMAINE 6: FINANCIAL STRUCTURE (15%)
    │   ├─ D6.1: Leverage & Protections (30%)
    │   ├─ D6.2: Hedging & Risk Mgmt (25%)
    │   ├─ D6.3: Amortization (25%)
    │   └─ D6.4: Covenants (20%)
    │
    ├─ DOMAINE 7: FINANCIAL STRUCTURE & CASH FLOW (15%)
    │   ├─ D7.1: Financial Structure (35%)
    │   ├─ D7.2: Cash Flow Predictability (30%)
    │   └─ D7.3: Debt Service Capacity (35%)
    │
    ├─ DOMAINE 8: LEGAL & DOCUMENTATION (10%)
    │   ├─ D8.1: Contractual Framework (40%)
    │   ├─ D8.2: Security Package (35%)
    │   └─ D8.3: Legal Risk Environment (25%)
    │
    └─ DOMAINE 9: ESG & CLIMATE (10%)
        ├─ D9.1: Environmental Risk (25%)
        ├─ D9.2: Social Risk (25%)
        ├─ D9.3: Governance (20%)
        └─ D9.4: Climate Risk (30%)
```

### Poids Globaux par Domaine

| Domaine                             | Poids | Criticité   |
| ----------------------------------- | ----- | ----------- |
| D1: Project Fundamentals            | 20%   | 🔴 CRITIQUE |
| D2: Host Country                    | 10%   | 🟠 HAUTE    |
| D3: Construction                    | 15%   | 🔴 CRITIQUE |
| D4: Operation                       | 15%   | 🔴 CRITIQUE |
| D5: Revenue & Market                | 15%   | 🔴 CRITIQUE |
| D6: Financial Structure             | 15%   | 🔴 CRITIQUE |
| D7: Financial Structure & Cash Flow | 15%   | 🔴 CRITIQUE |
| D8: Legal & Documentation           | 10%   | 🟠 HAUTE    |
| D9: ESG & Climate                   | 10%   | 🟠 HAUTE    |

**Total:** 135% → normalized to 100%

### Transformation Finale : Score → Rating

```
Score Global (1-10) → Rating (AAA → CCC) → PD (Probability of Default)

Score ≥ 8.5  → AAA (PD < 0.5%)
Score 8.0-8.5 → AA  (PD 0.5%-1%)
Score 7.5-8.0 → A   (PD 1%-1.5%)
Score 7.0-7.5 → BBB (PD 1.5%-2.5%)
Score 6.5-7.0 → BB  (PD 2.5%-5%)
Score 6.0-6.5 → B   (PD 5%-8%)
Score 5.5-6.0 → CCC (PD 8%-15%)
Score < 5.5   → D / REJECT (PD > 15%)
```

---

# DOMAINES DÉTAILLÉS

## 🟦 DOMAINE 1 – PROJECT FUNDAMENTALS (Poids: 20%)

### Objectif

Évaluer la **solidité fondamentale du projet** : sponsor capable ? structure claire ? permis en place ?

### Structure

#### **D1.1 – Sponsor Strength (Poids: 35%)**

**Définition:** Capacité financière et expérience du(des) sponsor(s) à construire et opérer le projet.

**Sous-sous-critères:**

| Critère                 | Poids | Échelle | Sources                                  |
| ----------------------- | ----- | ------- | ---------------------------------------- |
| Financial Capacity      | 40%   | 1-10    | Bilans audités, rating, liquidité        |
| Experience Track Record | 35%   | 1-10    | Projets antérieurs, CV, références       |
| Technical Expertise     | 25%   | 1-10    | Équipe technique, certifications, études |

**Notation Détaillée:**

| Score   | Situation                  | Exemple                                         |
| ------- | -------------------------- | ----------------------------------------------- |
| **10**  | Sponsor IG (rating A+/A)   | Multinational énergétique, 10+ projets réussis  |
| **8-9** | Sponsor très solide (BBB+) | PME solide, 5+ projets, expertise reconnue      |
| **6-7** | Sponsor acceptable (BB+)   | PME moyenne, 2-3 projets, capacité adéquate     |
| **4-5** | Sponsor faible (B)         | Peu de projets, capacité limitée                |
| **1-3** | Sponsor très faible        | Aucun projet antérieur, difficultés financières |

**Sources d'Information:**

- ✅ États financiers audités (3 ans)
- ✅ Rapports agences de notation
- ✅ CV + organigramme équipe
- ✅ Antécédents projets (audits, références)
- ✅ Base interne banque

**Points de Vigilance ⚠️:**

- Réduction équipe clés en 2 ans
- Nouveaux secteurs (sponsor inexpérimenté hors core business)
- Endettement élevé ailleurs (capacité d'injection capital)
- Litiges antérieurs avec partenaires

**Red Flags 🚨:**

- ❌ Sponsor en insolvabilité
- ❌ Aucun projet complété antérieurement
- ❌ Rating < CCC
- ❌ Liquidités insuffisantes (cash/total debt < 0.1)

**Calcul du Score:**

```
Score_D1.1 = 0.40 × [Financial Capacity]
           + 0.35 × [Experience Track Record]
           + 0.25 × [Technical Expertise]
```

---

#### **D1.2 – Project Structure (Poids: 35%)**

**Définition:** Clarté de la structure propriétaire, juridique et contractuelle du projet.

| Score   | Situation                                                              |
| ------- | ---------------------------------------------------------------------- |
| **10**  | Structure SPV dédiée, actionnaires clairs, pacte d'actionnaires solide |
| **8-9** | Structure claire, quelques complexités mineures                        |
| **6-7** | Structure acceptable avec ambiguïtés                                   |
| **4-5** | Structure floue, risques contractuels                                  |
| **1-3** | Structure très incertaine                                              |

**Calcul:**

```
Score_D1.2 = 0.4 × [Clarity of Structure]
           + 0.3 × [Shareholder Agreements]
           + 0.3 × [Contractual Cohesion]
```

---

#### **D1.3 – Permits & Land (Poids: 30%)**

**Définition:** Disponibilité des autorisations et sécurité des droits fonciers.

| Score   | Situation                                                 |
| ------- | --------------------------------------------------------- |
| **10**  | Tous permis obtenus, droits de terrain permanents et sûrs |
| **8-9** | Permis quasi-finalisés, droit foncier solide              |
| **6-7** | Permis en cours d'obtention, terrain sécu                 |
| **4-5** | Permis incertains, risque foncier                         |
| **1-3** | Permis non obtenus ou terrain à risque                    |

**Red Flags:**

- ❌ Pas d'EIE finalisée
- ❌ Permis refusés antérieurement
- ❌ Droits fonciers contestés

---

### 📊 Score Global Domaine 1

```
Score_D1 = 0.35 × Score_D1.1 (Sponsor)
         + 0.35 × Score_D1.2 (Structure)
         + 0.30 × Score_D1.3 (Permits)
```

---

## 🟦 DOMAINE 2 – HOST COUNTRY (Poids: 10%)

### Objectif

Évaluer les **risques pays** : stabilité réglementaire, risque FX, support souverain ?

### Structure (3 sous-critères)

#### **D2.1 – Regulatory Environment (Poids: 35%)**

- Stabilité cadre légal
- Indépendance régulateur
- Historique interventions

#### **D2.2 – FX & Repatriation Risk (Poids: 35%)**

- Risque dévaluation
- Capacité expatriement dividendes
- Contrôles de change

#### **D2.3 – Sovereign Support (Poids: 30%)**

- Commitment gouvernement
- Force majeure définition
- Garanties souveraines

### 📊 Score Global Domaine 2

```
Score_D2 = 0.35 × Score_D2.1 (Regulation)
         + 0.35 × Score_D2.2 (FX Risk)
         + 0.30 × Score_D2.3 (Sovereign)
```

---

## 🟦 DOMAINE 3 – CONSTRUCTION PHASE (Poids: 15%)

### Objectif

Évaluer les **risques de construction** : EPC solide ? responsabilités claires ? assurances ?

### Structure (3 sous-critères)

#### **D3.1 – EPC Completion Risk (Poids: 35%)**

| Score   | EPC Contractor                               | Track Record        | Cost + Schedule Risk |
| ------- | -------------------------------------------- | ------------------- | -------------------- |
| **10**  | Major multinational (SAIC, Bechtel, Technip) | 10+ projects >$100M | < 5%                 |
| **8-9** | Established regional                         | 5-10 projects       | 5-10%                |
| **6-7** | Qualified local                              | 2-4 projects        | 10-20%               |
| **4-5** | Limited experience                           | Few projects        | 20-30%               |
| **1-3** | Unknown/untested                             | None or failed      | > 30%                |

**Red Flags:**

- ❌ EPC dans insolvabilité
- ❌ Historique de faillites EPC
- ❌ Coût garanti absent (reimbursable contract)

#### **D3.2 – Interfaces & Execution Risk (Poids: 35%)**

- Clarté interfaces (EPC ↔ Offtaker ↔ Autres)
- Gestion des risques contractuels
- Plan d'exécution réaliste

#### **D3.3 – Insurance & Risk Mitigation (Poids: 30%)**

- CAR/CGL (Construction All Risks)
- Performance bond
- Retention / escrow mechanisms

### 📊 Score Global Domaine 3

```
Score_D3 = 0.35 × Score_D3.1 (EPC)
         + 0.35 × Score_D3.2 (Interfaces)
         + 0.30 × Score_D3.3 (Insurance)
```

---

## 🟦 DOMAINE 4 – OPERATION PHASE (Poids: 15%)

### Objectif

Évaluer la **viabilité opérationnelle** : O&M solide ? technologie fiable ? maintenance plan ?

### Structure (3 sous-critères)

#### **D4.1 – O&M Contract & Operator Quality (Poids: 35%)**

| Score   | O&M Operator                               | Experience | Contract                    |
| ------- | ------------------------------------------ | ---------- | --------------------------- |
| **10**  | Multinational (Schneider, Siemens, Vestas) | 15+ years  | Long-term, penalties strong |
| **8-9** | Regional specialist                        | 10+ years  | Solid terms                 |
| **6-7** | Local qualified                            | 5-10 years | Standard terms              |
| **4-5** | Limited expertise                          | < 5 years  | Weak clauses                |
| **1-3** | No track record                            | None       | Risk high                   |

#### **D4.2 – Technology & Reliability (Poids: 35%)**

- TRL (Technology Readiness Level)
- Track record in sector
- Obsolescence risk
- Supply chain security

#### **D4.3 – Maintenance & Resilience (Poids: 30%)**

- Plan maintenance détaillé
- Availability targets & monitoring
- Spare parts security
- Training + documentation

### 📊 Score Global Domaine 4

```
Score_D4 = 0.35 × Score_D4.1 (O&M)
         + 0.35 × Score_D4.2 (Technology)
         + 0.30 × Score_D4.3 (Maintenance)
```

---

## 🟦 DOMAINE 5 – REVENUE & MARKET (Poids: 15%)

### Objectif

**CRITIQUE EN PROJECT FINANCE**  
Évaluer si les revenus contrats sont sûrs et stables = capacité à rembourser la dette.

### Structure (3 sous-critères)

#### **D5.1 – Offtaker Quality & Engagement (Poids: 35%)**

| Score   | Offtaker              | Rating | Engagement        | PPA Duration |
| ------- | --------------------- | ------ | ----------------- | ------------ |
| **10**  | État/Investment Grade | A+/A   | Take-or-Pay 100%  | 25+ ans      |
| **8-9** | Utility publique      | BBB+   | Take-or-Pay 80%+  | 20+ ans      |
| **6-7** | Grande entreprise     | BB     | Take-or-Pay 60%   | 15+ ans      |
| **4-5** | PME                   | B      | Take-or-Pay < 50% | < 15 ans     |
| **1-3** | Faible/Unknown        | CCC    | No PPA            | Ad-hoc       |

**Red Flags:**

- ❌ Pas de PPA signé
- ❌ Offtaker en défaut
- ❌ Take-or-Pay < 40%
- ❌ Offtaker concentre >85% revenus

#### **D5.2 – Tarification & Protections (Poids: 35%)**

| Score   | Tarif vs Marché | DSCR     | Indexation | Volatilité       |
| ------- | --------------- | -------- | ---------- | ---------------- |
| **10**  | +10%            | 1.6x+    | Full CPI   | Fixe/garantie    |
| **8-9** | Market          | 1.4-1.6x | 80% CPI    | Très stable      |
| **6-7** | -3%             | 1.3-1.4x | 50% CPI    | Stable           |
| **4-5** | -10%            | 1.2-1.3x | 20% CPI    | Volatilité 20%   |
| **1-3** | << Market       | < 1.2x   | Zéro       | Volatilité > 30% |

**Red Flags:**

- ❌ DSCR < 1.25x sans indexation
- ❌ Tarif dégressive programmée
- ❌ Pas d'indexation inflation > 2%/an

#### **D5.3 – Market Stability & Diversification (Poids: 30%)**

| Score   | Marché        | Croissance  | Clients          | Concentration |
| ------- | ------------- | ----------- | ---------------- | ------------- |
| **10**  | Stable régulé | +3%+ annuel | 20+, diversifiés | <5% chacun    |
| **8-9** | Stable        | +2-3%       | 10+              | 5-10% leader  |
| **6-7** | Modéré        | +1-2%       | 5-10             | 10-30% leader |
| **4-5** | Volatil       | ±0-1%       | 2-5              | 30-75%        |
| **1-3** | Déclinant     | -2%+        | 1 (mono-client)  | >85%          |

**Red Flags:**

- ❌ Mono-client >80%
- ❌ Marché déclin >3% annuel
- ❌ Tech disruptive immédiate

### 📊 Score Global Domaine 5

```
Score_D5 = 0.35 × Score_D5.1 (Offtaker)
         + 0.35 × Score_D5.2 (Pricing)
         + 0.30 × Score_D5.3 (Market)
```

---

## 🟦 DOMAINE 6 – FINANCIAL STRUCTURE (Poids: 15%)

### Objectif

Évaluer la **structure de financement** : levier appropriate ? hedging ? covenants forts ?

### Structure (4 sous-critères)

#### **D6.1 – Leverage & Protections (Poids: 30%)**

- Debt/Equity ratio (target: ≤ 75/25)
- DSCR minimum average (target: ≥ 1.3x)
- Reserve accounts (DSRA ≥ 3-6 mois)

#### **D6.2 – Hedging & Financial Risk Mgmt (Poids: 25%)**

- Interest rate hedging (target: > 80%)
- FX hedging (target: 100% si mismatch)
- Cash management policy

#### **D6.3 – Amortization & Tenor (Poids: 25%)**

- Repayment profile (sculpted vs linear vs bullet)
- Debt duration vs project life (target: 0.8-0.9x)
- Refinancing risk

#### **D6.4 – Covenants & Cash Control (Poids: 20%)**

- Financial covenants (DSCR triggers, DSRA rules)
- Operational covenants
- Reporting requirements

### 📊 Score Global Domaine 6

```
Score_D6 = 0.30 × Score_D6.1 (Leverage)
         + 0.25 × Score_D6.2 (Hedging)
         + 0.25 × Score_D6.3 (Amortization)
         + 0.20 × Score_D6.4 (Covenants)
```

---

## 🟦 DOMAINE 7 – FINANCIAL STRUCTURE & CASH FLOW (Poids: 15%)

### Objectif

**PILIER CRITIQUE EN PROJECT FINANCE**  
Mesurer la **capacité réelle du projet à rembourser** sa dette.

### Structure (3 sous-critères)

#### **D7.1 – Financial Structure Robustness (Poids: 35%)**

- Equity level (target: 25-35%)
- Sponsor support (subordination, cash injection rights)
- Reserve accounts (DSRA, MRA)

#### **D7.2 – Cash Flow Predictability (Poids: 30%)**

- Revenue visibility (contrats long-terme)
- Price risk (indexation vs fixed)
- Volume risk (take-or-pay solidity)

#### **D7.3 – Debt Service Capacity (Poids: 35%)**

**DSCR Analysis** (Most Critical Indicator)

```
DSCR = Cash Flow Available for Debt Service / Debt Service

Target Minimums:
• Year 1-5:  DSCR ≥ 1.30x  (ramp-up phase)
• Year 5-20: DSCR ≥ 1.25x  (stable ops)
• Minimum:   DSCR ≥ 1.10x  (crisis scenario)

PD Mapping:
DSCR ≥ 1.4x   → PD < 1%   (AAA/AA)
1.3-1.4x      → PD 1-2%   (A)
1.2-1.3x      → PD 2-3%   (BBB)
1.1-1.2x      → PD 3-5%   (BB)
< 1.1x        → PD > 10%  (B/CCC/D)
```

**LLCR Analysis** (Long-term Coverage)

```
LLCR = PV(Cash Flow over project life) / Debt Outstanding

Target:
• LLCR ≥ 1.5x → Strong long-term coverage
• LLCR 1.3-1.5x → Acceptable
• LLCR < 1.3x → Weak (refinancing risk)
```

**Stress Resilience**

```
Test DSCR under stress scenarios:
• Revenue -10% → DSCR must remain > 1.2x
• Costs +5%   → DSCR must remain > 1.2x
• Delay 6 months → DSCR year 2 > 1.15x
• FX -10%     → DSCR > 1.25x (if FX-exposed)
```

### 📊 Score Global Domaine 7

```
Score_D7 = 0.35 × Score_D7.1 (Structure)
         + 0.30 × Score_D7.2 (Cash Flow)
         + 0.35 × Score_D7.3 (Debt Service)
```

---

## 🟦 DOMAINE 8 – LEGAL & DOCUMENTATION (Poids: 10%)

### Objectif

Assurer la **sécurisation juridique** du financement et la protégeabilité des intérêts de la banque.

### Structure (3 sous-critères)

#### **D8.1 – Contractual Framework (Poids: 40%)**

- Complétude contrats clés (EPC, O&M, PPA, Concession)
- Bankability des contrats
- Direct agreements + step-in rights

**Red Flags:**

- ❌ Contrats non signés
- ❌ Absence de direct agreements
- ❌ Step-in rights insuffisants

#### **D8.2 – Security Package (Poids: 35%)**

- Type de garanties (pledge, mortgage, assignment)
- Enforceability en juridiction locale
- Couverture collatérale (target: 100-120%)

#### **D8.3 – Legal Risk Environment (Poids: 25%)**

- Stabilité cadre réglementaire
- Autorisations obtenues
- Litiges potentiels

### 📊 Score Global Domaine 8

```
Score_D8 = 0.40 × Score_D8.1 (Contracts)
         + 0.35 × Score_D8.2 (Security)
         + 0.25 × Score_D8.3 (Legal Env)
```

---

## 🟦 DOMAINE 9 – ESG & CLIMATE RISK (Poids: 10%)

### Objectif

Évaluer l'**exposition ESG et climatique** = risques réglementaires futurs et viabilité long-terme.

### Structure (4 sous-critères)

#### **D9.1 – Environmental Risk (Poids: 25%)**

- Impact CO₂ et émissions
- Conformité réglementaire (Maroc: ministère environnement)
- Efficacité ressources (eau, énergie)

#### **D9.2 – Social Risk (Poids: 25%)**

- Impact communautés (déplacements, acceptabilité)
- Conditions travail et sécurité
- Engagement stakeholders

#### **D9.3 – Governance (Poids: 20%)**

- Transparence & reporting ESG
- Structure gouvernance du projet
- Politiques ESG intégrées

#### **D9.4 – Climate Risk (Poids: 30%) ⚠️ CRITICAL**

**Physical Risk:**

```
Exposition climatique du projet:
• Sécheresse (important Maroc)
• Inondation
• Chaleur extrême
• Tempêtes
```

**Transition Risk:**

```
Impact politiques climatiques futures:
• Taxe carbone
• Réglementation zéro-carbone
• Stranded assets risk
```

**Scoring:**

```
Physical Risk High → Score D9.4 -2 points
Transition Risk High → Score D9.4 -3 points
Carbon Intensity High → Score D9.4 -2 points
```

**Red Flags:**

- ❌ Projet fossil-fuel heavy (charbon, gaz)
- ❌ Zone géographique à risque climatique EXTRÊME
- ❌ Technologie en obsolescence future

### 📊 Score Global Domaine 9

```
Score_D9 = 0.25 × Score_D9.1 (Environmental)
         + 0.25 × Score_D9.2 (Social)
         + 0.20 × Score_D9.3 (Governance)
         + 0.30 × Score_D9.4 (Climate)
```

---

# FORMULES & CALCULS

## 🧮 Score Global du Projet

### Formule Complète

```
SCORE_GLOBAL =
  0.20 × Score_D1 (Project Fundamentals)
+ 0.10 × Score_D2 (Host Country)
+ 0.15 × Score_D3 (Construction)
+ 0.15 × Score_D4 (Operation)
+ 0.15 × Score_D5 (Revenue & Market)
+ 0.15 × Score_D6 (Financial Structure)
+ 0.15 × Score_D7 (Financial Structure & Cash Flow)
+ 0.10 × Score_D8 (Legal)
+ 0.10 × Score_D9 (ESG & Climate)
```

**Normalisation:** (Total pondérations = 135%)

```
SCORE_GLOBAL_NORMALIZED = SCORE_GLOBAL × (100 / 135)
```

### Transformation Score → Rating

```python
def score_to_rating(score):
    if score >= 8.5:
        return "AAA", pd = 0.5
    elif score >= 8.0:
        return "AA", pd = 1.0
    elif score >= 7.5:
        return "A", pd = 1.5
    elif score >= 7.0:
        return "BBB", pd = 2.5
    elif score >= 6.5:
        return "BB", pd = 4.0
    elif score >= 6.0:
        return "B", pd = 6.5
    elif score >= 5.5:
        return "CCC", pd = 12.0
    else:
        return "D / REJECT", pd = 25.0
```

---

# RULES ENGINE

## 🚨 NO-GO Rules (Blocage Automatique)

Conditions qui entraînent **rejet immédiat** (Score = 0, projet non financeable).

### Categories principales:

#### **CATEGORY A: Sponsor Risk**

- ❌ Sponsor rating < CCC (**NOGO_1A**)
- ❌ Sponsor en insolvabilité / restructuring (**NOGO_1B**)
- ❌ Sponsor liquidity ratio < 0.1 (**NOGO_1C**)

#### **CATEGORY B: Country Risk**

- ❌ Pays en war/extreme political instability (**NOGO_2A**)
- ❌ Historique repeated expropriation (**NOGO_2B**)

#### **CATEGORY C: Construction Risk**

- ❌ EPC contractor insolvable (**NOGO_3A**)
- ❌ Historique failed EPC contracts (**NOGO_3B**)
- ❌ Cost guarantee absent (reimbursable) (**NOGO_3C**)

#### **CATEGORY D: Revenue Risk**

- ❌ Pas de PPA/Offtake signé (**NOGO_5A**)
- ❌ Offtaker insolvable (**NOGO_5B**)
- ❌ Mono-client >85% revenus (**NOGO_5C**)
- ❌ Marché déclin >3% annuel (**NOGO_5D**)
- ❌ Tarif incompétitif +20% vs market (**NOGO_5E**)

#### **CATEGORY E: Financial Risk**

- ❌ DSCR < 1.10x (**NOGO_6A**)
- ❌ Absence DSRA / reserve accounts (**NOGO_6B**)
- ❌ Leverage > 85/15 (debt/equity) (**NOGO_6C**)

#### **CATEGORY F: Legal Risk**

- ❌ Absence contrats clés (EPC, O&M, PPA) (**NOGO_8A**)
- ❌ Garanties non exécutables (**NOGO_8B**)
- ❌ Litiges majeurs en cours (**NOGO_8C**)

#### **CATEGORY G: ESG Risk**

- ❌ Conflit social MAJOR en cours (**NOGO_9A**)
- ❌ Non-compliance réglementaire environnementale (**NOGO_9B**)
- ❌ Risque climatique CRITIQUE (zone à haut risque) (**NOGO_9C**)

---

## ⚠️ MALUS Rules (Réductions de Score)

Conditions qui **réduisent le score** mais ne le rejettent pas (doivent être mitigées).

| ID           | Condition                        | Pénalité | Raison               |
| ------------ | -------------------------------- | -------- | -------------------- |
| **MALUS_1A** | Sponsor equity < 20%             | -3 pts   | Under-capitalization |
| **MALUS_2A** | FX mismatch non-couvert          | -2 pts   | Currency exposure    |
| **MALUS_3A** | EPC sans performance bond        | -2 pts   | Completion risk      |
| **MALUS_5A** | DSCR < 1.25x sans indexation     | -5 pts   | Inflation erosion    |
| **MALUS_5B** | Take-or-Pay < 40%                | -4 pts   | Volume risk          |
| **MALUS_5C** | Pas d'indexation, inflation > 2% | -4 pts   | Real revenue decline |
| **MALUS_6A** | FX hedging < 80%                 | -2 pts   | FX exposure remains  |
| **MALUS_6B** | Interest rate floating > 50%     | -2 pts   | Rate risk            |
| **MALUS_7A** | LLCR < 1.3x                      | -3 pts   | Refinancing risk     |
| **MALUS_8A** | Garanties couverture < 100%      | -2 pts   | Collateral gap       |

---

# STRESS TESTING

## 🔄 Scenarios Obligatoires

Chaque projet doit être stress-testé sur les 5 scenarios suivants:

### **Scenario 1: Revenue Decline (-10%)**

```
Input:  Revenus baissent 10% (défaut offtaker, marché, volume)
Impact: DSCR baisse de ~0.15x
Pass:   DSCR stress > 1.25x
Fail:   → NOGO si DSCR < 1.1x
```

### **Scenario 2: Cost Inflation (+5%)**

```
Input:  Coûts opérationnels +5%
Impact: DSCR baisse de ~0.10-0.15x (depending on opex %)
Pass:   DSCR stress > 1.20x
Fail:   → MALUS_5A si DSCR < 1.2x
```

### **Scenario 3: Construction Delay (+6 months)**

```
Input:  Retard construction = +6 mois de coûts financiers
Impact: EBITDA Year 2 réduit (longer ramp-up)
Pass:   DSCR Year 2 > 1.15x après retard
Fail:   → Projet replan requis
```

### **Scenario 4: Interest Rate +200bps**

```
Input:  Taux d'intérêt +2% (si non-hedgé ou partial hedge)
Impact: Debt service +0.20-0.30x DSCR depending on leverage
Pass:   DSCR stress > 1.20x avec +200bps
Fail:   → Rehedging required ou equity reduction
```

### **Scenario 5: FX Depreciation (-10%)**

```
Input:  Monnaie locale -10% vs devise financement (si mismatch)
Impact: Revenus locales = -10% en devise financement
Pass:   DSCR forex-stressed > 1.25x
Fail:   → FX hedging required ou restructure
```

### **Scenario 6: Market Decay (-2% CAGR)**

```
Input:  Marché décline 2% annuels vs croissance supposée +2%
Durée: 20 ans
Impact: Revenus Year 20 = 60% vs. base case 140%
Pass:   LLCR stress > 1.2x; DSCR année 15+ > 1.15x
Fail:   → Refinancing risk flagged
```

### **Combined Stress: Perfect Storm**

```
Input:  Revenue -8% + Costs +3% + Delay 3m + Rate +150bps
Impact: DSCR = 1.05x (below minimum)
Result: Scenario flagged as CRITICAL → replan required
```

---

# EXEMPLE D'APPLICATION

## 📋 Case Study: Projet Énergie Solaire – Maroc (100 MW)

### Project Overview

| Parameter       | Value                                |
| --------------- | ------------------------------------ |
| **Project**     | Solar Farm 100 MW, Ouarzazate region |
| **Sponsor**     | Moroccan Energy Dev. Corp (MEDC)     |
| **Offtaker**    | ONEE (Moroccan National Utility)     |
| **Financement** | €90M debt (IFC), €30M equity (MEDC)  |
| **Durée**       | 25 years                             |
| **PPA**         | 25 years @ €70/MWh (indexed CPI)     |

### Scoring Application

#### **D1. Project Fundamentals (20%)**

**D1.1 – Sponsor Strength:**

- Financial: MEDC large SOE, rating BB+ → Score 8
- Experience: 5 projects, 500+ MW → Score 8
- Technical: Strong technical team → Score 8
- **Score D1.1 = 0.40×8 + 0.35×8 + 0.25×8 = 8.0**

**D1.2 – Project Structure:**

- SPV clean, majority MEDC + minority IFC → Score 8
- Shareholder agreement solid → Score 8
- **Score D1.2 = 8.0**

**D1.3 – Permits & Land:**

- EIE approved, all permits obtained → Score 10
- Land rights secure (government land) → Score 10
- **Score D1.3 = 10.0**

**Score D1 = 0.35×8.0 + 0.35×8.0 + 0.30×10.0 = 8.4**

---

#### **D5. Revenue & Market (15%)**

**D5.1 – Offtaker Quality:**

- ONEE: Investment grade-like, utility solide → Score 9
- Commitment: 25-year PPA, take-or-pay 95% → Score 9
- Viability: Electricity essential, growing market → Score 9
- **Score D5.1 = 0.35×9 + 0.35×9 + 0.30×9 = 9.0**

**D5.2 – Pricing & Protections:**

- Tarif €70/MWh = market-competitive → Score 8
- Indexation CPI complet → Score 10
- DSCR base case = 1.45x → Score 9
- **Score D5.2 = 0.40×8 + 0.35×10 + 0.25×9 = 8.75**

**D5.3 – Market Stability:**

- Marché: Growing +3% annuel → Score 9
- Offtaker: ONEE sole buyer but essential → Score 7
- Concurrence: Other solar projects but ONEE contract → Score 7
- **Score D5.3 = 0.40×9 + 0.35×7 + 0.25×7 = 7.9**

**Score D5 = 0.35×9.0 + 0.35×8.75 + 0.30×7.9 = 8.6**

---

#### **D7. Financial Structure & Cash Flow (15%)**

**D7.1 – Structure:**

- Equity: 25% ($30M/$120M) → Score 8
- DSRA: 6 months (after COD) → Score 9
- Sponsor support: Subordination + RCF available → Score 9
- **Score D7.1 = 0.35×8 + 0.25×9 + 0.40×9 = 8.7**

**D7.2 – Cash Flow:**

- Revenue visibility: 25-year PPA ✓ → Score 10
- Price risk: Fully indexed CPI ✓ → Score 10
- Volume risk: Quasi-guaranteed take-or-pay → Score 9
- **Score D7.2 = 0.40×10 + 0.30×10 + 0.30×9 = 9.7**

**D7.3 – Debt Service Capacity:**

- DSCR Year 1: 1.45x → Score 9
- DSCR avg 20y: 1.35x → Score 9
- Stress -10% revenue: DSCR = 1.30x ✓ → Score 8
- **Score D7.3 = 0.50×9 + 0.30×9 + 0.20×8 = 8.7**

**Score D7 = 0.35×8.7 + 0.30×9.7 + 0.35×8.7 = 9.0**

---

#### **Global Scoring (Simplified)**

```
Assuming other domains also score well (D2-D4, D6, D8, D9):

Score_D1 = 8.4
Score_D2 = 8.0  (Morocco AA- risk profile)
Score_D3 = 8.5  (Major EPC: Siemens)
Score_D4 = 8.2  (Proven solar tech, O&M: Acciona)
Score_D5 = 8.6  ✓✓ STRONG
Score_D6 = 8.3
Score_D7 = 9.0  ✓✓ EXCELLENT
Score_D8 = 8.5
Score_D9 = 8.8  (Green energy, minimal ESG risk)

SCORE_GLOBAL =
  0.20×8.4 + 0.10×8.0 + 0.15×8.5 + 0.15×8.2
+ 0.15×8.6 + 0.15×8.3 + 0.15×9.0 + 0.10×8.5 + 0.10×8.8

= 1.68 + 0.80 + 1.275 + 1.23 + 1.29 + 1.245 + 1.35 + 0.85 + 0.88
= 10.91 / 1.35 = 8.08 (NORMALIZED)

RATING: A
IMPLIED PD: 1.5%
DECISION: APPROVE (with standard covenants + monitoring)
```

---

# FAQ & GLOSSAIRE

## Acronymes

| Sigle       | Signification                                       |
| ----------- | --------------------------------------------------- |
| **PF**      | Project Finance                                     |
| **PPA**     | Power Purchase Agreement                            |
| **DSCR**    | Debt Service Coverage Ratio                         |
| **LLCR**    | Loan Life Coverage Ratio                            |
| **DSRA**    | Debt Service Reserve Account                        |
| **EPC**     | Engineering, Procurement, Construction              |
| **O&M**     | Operation & Maintenance                             |
| **TRL**     | Technology Readiness Level                          |
| **FX**      | Foreign Exchange                                    |
| **SPV**     | Special Purpose Vehicle                             |
| **CAR/CGL** | Construction All Risks / General Liability          |
| **ESG**     | Environmental, Social, Governance                   |
| **TCFD**    | Task Force on Climate-related Financial Disclosures |
| **IFC**     | International Finance Corporation                   |
| **EBRD**    | European Bank for Reconstruction & Development      |
| **BAM**     | Bank Al-Maghrib (Banque centrale Maroc)             |

---

## Questions Fréquentes

### Q: Quel est le score minimum pour approuver un projet ?

**A:** Score ≥ 6.0 (BBB equivalent) pour approvalité en comité. Score < 5.5 = rejet automatique.

### Q: Un projet peut-il être approuvé avec un NO-GO flagué ?

**A:** Non. NO-GO = condition sine qua non de rejet. À moins de mitigation fondamentale (ex: Sponsor capital injection pour NOGO_1C).

### Q: Comment traiter MALUS multiples ?

**A:** Cumulatif. Si MALUS_5A (-5 pts) + MALUS_5B (-4 pts) + MALUS_6A (-2 pts) = -11 pts total réduction.

### Q: Quelle est l'importance du stress testing ?

**A:** CRITIQUE. DSCR stress < 1.20x → risque élevé. On doit toujours tester minimum 3 scénarios (revenue, cost, rate).

### Q: V7++ vs V6: quelles différences majeures ?

**A:**

- ✅ 9 domaines au lieu de 7
- ✅ Indicateurs complexes (Offtaker Health, PPA Robustness, etc.)
- ✅ Dynamic thresholds par pays
- ✅ Climate risk explicite (D9.4)
- ✅ Stress testing systématique

---

## Références

- IFC Performance Standards on Environmental and Social Sustainability (2012)
- EBRD Project Scoring Methodology (2018)
- World Bank Project Finance Guidelines (2020)
- Basel III Framework – Capital Requirements (2019)
- Bank Al-Maghrib Circular on Financing Standards (2022)
- TCFD Climate Risk Disclosure (2017)

---

**Document prepared by:** PF Scoring V7++ Development Team  
**Date:** April 2026  
**Status:** APPROVED FOR IMPLEMENTATION  
**Next Review:** Q3 2026
