# 📊 DOMAINES DE SCORING – Integration Plan

**Status:** En cours de réception des spécifications détaillées

---

## Domaines reçus ✅

### D1 – Project Fundamentals (20%)
**Status:** ✅ COMPLÈTEMENT SPÉCIFIÉ  
**Sous-domaines:** 3  
**Critères:** 9  
**Implémentation:** À démarrer

- D1.1 Sponsor Strength (35%)
  - Financial Solidity (40%)
  - Sector Experience (30%)
  - Sponsor Engagement (30%)

- D1.2 Project Structure & Contracts (35%)
  - SPV Structure (30%)
  - Key Contracts (40%)
  - Risk Allocation (30%)

- D1.3 Permits & Land (30%)
  - Permits & Authorizations (40%)
  - Land Security (40%)
  - Social & Environmental Risk (20%)

---

### D2 – Host Country (10%)
**Status:** ✅ COMPLÈTEMENT SPÉCIFIÉ  
**Sous-domaines:** 3  
**Critères:** 9  
**Implémentation:** À démarrer

- D2.1 Regulatory Environment (35%)
  - PPP Legal Framework (40%)
  - Regulatory Stability (30%)
  - Permit Process (30%)

- D2.2 FX & Repatriation Risk (35%)
  - Currency Convertibility (50%)
  - FX Volatility (30%)
  - Hedging Availability (20%)

- D2.3 Sovereign & Institutional Support (30%)
  - Sovereign Guarantee (40%)
  - Institutional Commitment (30%)
  - State Track Record (30%)

---

## Domaines en attente de spécification 📋

### D3 – Construction Phase (15%)
**Status:** ⏳ EN ATTENTE  
**Sujets couverts:** EPC completion risk, interfaces, insurance, stress testing

### D4 – Market Risk (10%)
**Status:** ⏳ EN ATTENTE  
**Sujets couverts:** Revenue stability, offtake, market exposure

### D5 – Operational Risk (10%)
**Status:** ⏳ EN ATTENTE  
**Sujets couverts:** O&M, technology reliability, maintenance

### D6 – Counterparty Risk (10%)
**Status:** ⏳ EN ATTENTE  
**Sujets couverts:** EPC contractor, O&M operator, offtaker quality

### D7 – Financial Structure & Cash Flow (15%)
**Status:** ⏳ EN ATTENTE  
**Sujets couverts:** DSCR, LLCR, leverage, hedging, waterfall

### D8 – Legal & Documentation (10%)
**Status:** ⏳ EN ATTENTE  
**Sujets couverts:** Security package, covenants, step-in rights

### D9 – ESG & Climate (10%)
**Status:** ⏳ EN ATTENTE  
**Sujets couverts:** Environmental, social, governance, climate risk

---

## Plan d'Intégration Proposé

### Phase A – Domaines 1 & 2 (Fondations)
**Durée:** Semaine 1-2  
**Domaines:** D1, D2  
**Actions:**
1. Implémenter structure complète D1 dans config
2. Implémenter structure complète D2 dans config
3. Créer formulaires saisie D1 & D2
4. Tester calculs scores

### Phase B – Domaines 3-5 (Risques Opérationnels)
**Durée:** Semaine 3  
**Domaines:** D3, D4, D5  
**Pré-requis:** Recevoir spécifications complètes

### Phase C – Domaines 6-9 (Risques Financiers & Structurels)
**Durée:** Semaine 4  
**Domaines:** D6, D7, D8, D9  
**Pré-requis:** Recevoir spécifications complètes

---

## Format Standardisé pour les Domaines

Chaque domaine doit inclure :

```
DOMAINE X – [Intitulé]
├── Poids global : X%
├── Objectif : 1-2 phrases
├── Sous-domaines (2-4)
│   ├── Intitulé
│   ├── Poids
│   ├── Critères détaillés (3-4 chacun)
│   │   ├── Code
│   │   ├── Label
│   │   ├── Poids dans sous-domaine
│   │   ├── Type (Qualitative/Quantitative)
│   │   ├── Échelle (1-10)
│   │   ├── Red flag threshold
│   │   ├── NO-GO threshold
│   │   └── Sources & données
│   ├── Red flags
│   └── NO-GO conditions
├── Formule de calcul
├── Notes risk manager
└── Règles V7++ (NO-GO, MALUS)
```

---

## Intégration dans le Code

### Fichier : `lib/scoring-model-v7-config.ts`

```typescript
export const DOMAINS = {
  D1: { /* Domaine 1 complet */ },
  D2: { /* Domaine 2 complet */ },
  D3: { /* Domaine 3 (à recevoir) */ },
  // ...
  D9: { /* Domaine 9 (à recevoir) */ }
}
```

### Fichier : `lib/scoring-domains/`

Structure proposée :
```
lib/scoring-domains/
├── d1-project-fundamentals.ts
├── d2-host-country.ts
├── d3-construction.ts
├── d4-market.ts
├── d5-operations.ts
├── d6-counterparty.ts
├── d7-financial-structure.ts
├── d8-legal.ts
└── d9-esg-climate.ts
```

Chaque fichier exports :
- Configuration domaine
- Types associés
- Calculateurs de score
- Détecteurs RED FLAGS
- Validateurs NO-GO

---

## Prochaines Étapes

1. **En attente :** Spécifications D3-D9
2. **Actions :** Dès réception, créer fichier de config pour chaque domaine
3. **Intégration :** Tester chaque domaine avant de passer au suivant
4. **Validation :** Vérifier formules et calculs

---

**Note:** Ce document sera mis à jour au fur et à mesure de la réception des spécifications.
