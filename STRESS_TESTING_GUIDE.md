# 📊 STRESS TESTING GUIDE – PROJECT FINANCE V7++

**Purpose:** Validate project viability under adverse scenarios  
**Frequency:** Mandatory for all projects scoring > 6.0  
**Audience:** Risk managers, financial analysts, credit committees

---

## TABLE OF CONTENTS

1. [Overview](#overview)
2. [Stress Scenarios](#stress-scenarios)
3. [DSCR Stress Methodology](#dscr-stress-methodology)
4. [Pass/Fail Criteria](#passfail-criteria)
5. [Reporting](#reporting)

---

## OVERVIEW

### Why Stress Testing?

In Project Finance, we cannot rely on base-case assumptions alone:

- ✅ Markets change (demand, pricing)
- ✅ Costs increase unexpectedly
- ✅ Construction delays occur
- ✅ Interest rates fluctuate
- ✅ External shocks (COVID, geopolitical, climate)

**Stress testing validates:** Can the project still repay debt under adverse conditions?

### Stress Testing Hierarchy

```
TIER 1: Sensitivity Analysis (single variable shock)
  └─ Revenue -10%, Cost +5%, Rate +200bps, etc.

TIER 2: Combined Stress (2-3 variables simultaneously)
  └─ Revenue -8% + Cost +3% + Delay 3m

TIER 3: Perfect Storm (extreme combined stress)
  └─ Revenue -15% + Cost +8% + Rate +300bps + FX -10%
```

**Minimum requirement:** TIER 1 + TIER 2

---

## STRESS SCENARIOS

### 📌 SCENARIO 1: Revenue Decline (-10%)

**Assumption:** Offtaker demand drops / marché deteriorates / volume reduction

**Trigger:**

- PPA volume decrease
- Market downturn
- Offtaker cash problems
- Demand lower than forecast

**Calculation:**

```
Base Case Revenue = €100M/year
Stress Case Revenue = €100M × 0.90 = €90M/year

DSCR_stress = 90M / DebtService (all other items constant)
DSCR_stress = DSCR_base × 0.90 (approximately)

Example:
DSCR_base = 1.45x
DSCR_stress = 1.45 × 0.90 = 1.31x ✓ PASS (if > 1.25x)
```

**Pass Threshold:**
| Year 1-5 | Year 5-20 | Minimum |
|----------|-----------|---------|
| > 1.30x | > 1.25x | > 1.10x |

**Output:**

```json
{
  "scenario": "Revenue -10%",
  "dscr_stress": 1.31,
  "status": "PASS",
  "margin_to_minimum": 0.21
}
```

**Impact on Score:**

- Pass > 1.25x: No penalty
- Pass 1.10-1.25x: MALUS -2 pts
- Fail < 1.10x: NOGO_7A (reject)

---

### 📌 SCENARIO 2: Cost Inflation (+5%)

**Assumption:** Operating costs increase (labor, materials, utilities)

**Trigger:**

- General inflation
- Supplier price increases
- Labor cost escalation
- Energy cost rise

**Calculation:**

```
Base Case OPEX = €20M/year
Stress Case OPEX = €20M × 1.05 = €21M/year

Additional Cost = €1M/year
EBITDA_stress = EBITDA_base - €1M

DSCR_stress = EBITDA_stress / DebtService
DSCR_stress = DSCR_base - (ΔCost / DebtService)

Example:
DSCR_base = 1.45x
Impact per €1M cost increase = -0.10-0.15x DSCR
DSCR_stress = 1.45 - 0.10 = 1.35x ✓ PASS
```

**Pass Threshold:**
| Magnitude | Threshold |
|-----------|-----------|
| Cost +5% | DSCR > 1.20x |
| Cost +10% | DSCR > 1.15x |
| Cost +15% | DSCR > 1.10x |

**Impact on Score:**

- Pass > 1.20x: No penalty
- Pass 1.10-1.20x: MALUS -2 pts
- Fail < 1.10x: NOGO (reject)

---

### 📌 SCENARIO 3: Construction Delay (+6 months)

**Assumption:** Project commissioning delayed 6 months

**Trigger:**

- EPC execution delays
- Permit delays
- Technical issues
- Weather/force majeure

**Calculation:**

```
Base Case: COD Year 1, Revenue Year 1 = €100M full year
Stress Case: COD Year 1.5, Revenue Year 1.5 = €50M (half year)

Year 1 DSCR_stress:
- Revenue compressed to 6 months
- Interest accrual for extra 6 months of construction
- Debt Service starts year 1.5 (vs year 1)

Impact:
• Year 1 DSCR down significantly (partial revenue + full interest)
• Year 2 DSCR recovers (full revenue, full debt service)

Test Requirement:
DSCR_Year2_stress > 1.15x (must recover after ramp)
```

**Pass Threshold:**

```
Delay 3-6 months: Year 2 DSCR > 1.15x
Delay 6-12 months: Year 2 DSCR > 1.10x (or refinance)
Delay > 12 months: NOGO (refinancing risk critical)
```

---

### 📌 SCENARIO 4: Interest Rate Increase (+200 bps)

**Assumption:** Floating rate debt increases 2% (or fixed-rate refinance at higher rates)

**Trigger:**

- Central bank rate hikes
- Spread widening (risk premium)
- Refinancing at higher rates
- Floating rate exposure

**Calculation:**

```
Base Case Debt Service = Interest @ 5% + Principal repayment
Stress Case Debt Service = Interest @ 7% + Principal repayment

Additional Interest = Debt × 2% = €90M × 2% = €1.8M/year

DSCR_stress = (EBITDA - Existing Debt Service) / New Debt Service
DSCR_stress = DSCR_base - (ΔInterest / DebtService)

Example:
DSCR_base = 1.45x
Impact = €1.8M / €70M debt service = -0.026x
DSCR_stress = 1.45 - 0.026 = 1.42x ✓ PASS

BUT: If debt is UNHEDGED:
DSCR_stress = 1.45 - 0.10 = 1.35x (larger impact)
```

**Pass Threshold:**

```
Hedged > 80%: +200bps → DSCR > 1.25x
Hedged 50-80%: +200bps → DSCR > 1.20x
Unhedged < 50%: +200bps → DSCR > 1.30x base (stringent!)
```

**Red Flag:**

- ❌ Unhedged floating > 50% of debt + DSCR_stress < 1.25x → MALUS -2 pts
- ❌ Unhedged floating > 50% of debt + no hedging plan → MALUS -3 pts

---

### 📌 SCENARIO 5: FX Depreciation (-10%)

**Assumption:** Local currency depreciates 10% vs. financing currency (USD/EUR)

**Trigger:**

- Central bank intervention / inflation
- External shocks (commodity prices, political risk)
- Carry trade unwinding

**Applies to:** Projects with FX mismatch (revenues in local, debt in foreign)

**Calculation:**

```
Base Case:
• Revenue: €100M/year (in MAD, convert at 11 MAD/EUR)
• Debt Service: €70M/year (in EUR, no conversion)
• DSCR = €100M / €70M = 1.43x

Stress Case: MAD/EUR moves from 11 to 12.1 (FX depreciation)
• Revenue: €100M nominal (in MAD) = €82.6M in EUR (100/12.1)
• Debt Service: €70M/year (unchanged in EUR)
• DSCR = €82.6M / €70M = 1.18x

DSCR_stress = DSCR_base × (1 - 10%) = 1.43 × 0.90 = 1.29x
```

**Pass Threshold:**

```
Unhedged FX exposure:
• FX -10%: DSCR > 1.30x (stringent)
• FX -5%: DSCR > 1.25x

Partially hedged (50%):
• FX -10%: DSCR > 1.20x
• FX -5%: DSCR > 1.18x

Fully hedged (100%):
• No FX stress applicable (perfect hedge)
```

**Red Flags:**

- ❌ Unhedged FX > 50% + revenues in local currency → MALUS -3 pts
- ❌ FX mismatch 90%+ + DSCR_base < 1.35x → NOGO_6A (FX risk)

---

### 📌 SCENARIO 6: Market Decay (-2% CAGR)

**Assumption:** Underlying market demand declines 2% annually (vs. base case growth of +2%)

**Trigger:**

- Structural market decline (tech substitution, secular trends)
- Competition increases
- Consumer behavior shift

**Calculation:**

```
Base Case: Revenue growing +2% CAGR
Year 1: €100M
Year 10: €100M × 1.02^9 = €119M
Year 20: €100M × 1.02^19 = €146M

Stress Case: Revenue declining -2% CAGR
Year 1: €100M
Year 10: €100M × 0.98^9 = €83M
Year 20: €100M × 0.98^19 = €66M

Gap accumulation:
By year 20, revenue is 66% of base case (vs 146%)!

LLCR Impact (Long-term coverage):
LLCR_base = 1.5x (strong)
LLCR_stress = 1.15x (weak) → refinancing risk!
```

**Pass Threshold:**

```
Decay -2% CAGR:
• LLCR_stress > 1.25x → PASS
• LLCR_stress 1.15-1.25x → MALUS -3 pts
• LLCR_stress < 1.15x → Refinancing risk flagged
```

**Testing Requirement:**

- Calculate LLCR for stress scenario
- Verify debt can be refinanced (check market conditions)
- Flag if refinancing risk becomes critical

---

## DSCR STRESS METHODOLOGY

### Step-by-Step Calculation

#### **Step 1: Base Case DSCR**

```
DSCR_base = CFADS / Annual Debt Service

Where:
CFADS = Gross Revenue
        - Operating Expenses
        - Taxes
        - Other obligations
        = Available for Debt Service

Annual Debt Service = Interest + Principal repayment
```

#### **Step 2: Identify Applicable Scenarios**

```
FOR EACH PROJECT:

IF Project is solar/renewable:
  ✓ Scenario 1: Revenue -10% (demand risk)
  ✓ Scenario 4: Rate +200bps (if floating debt)
  ✓ Scenario 5: FX -10% (if FX mismatch)
  ✓ Scenario 3: Construction delay (if not COD)

IF Project is water/utility:
  ✓ Scenario 1: Revenue -10% (demand + offtaker risk)
  ✓ Scenario 2: Cost +5% (OPEX risk)
  ✓ Scenario 4: Rate +200bps
  ✓ Scenario 5: FX -10%

IF Project is corporate/BTS:
  ✓ Scenario 1: Revenue -10%
  ✓ Scenario 2: Cost +5%
  ✓ Scenario 4: Rate +200bps
  ✓ Scenario 6: Market decay -2% CAGR
```

#### **Step 3: Calculate Stress DSCR**

```
DSCR_stress = CFADS_stress / Debt Service_stress

Adjust CFADS:
• Revenue scenarios: Revenue × (1 - stress %)
• Cost scenarios: OPEX × (1 + stress %)
• FX scenarios: Revenue_in_local / (FX_rate × 1.10)

Adjust Debt Service:
• Rate scenarios: Interest × (1 + rate increase)
• Delay scenarios: Additional interest accrual
```

#### **Step 4: Compare to Threshold**

```
IF DSCR_stress > Threshold:
  Status = "PASS"
  Margin = DSCR_stress - Threshold
  Impact_on_Score = No penalty

ELSE IF DSCR_stress > Minimum (1.10x):
  Status = "PASS WITH CAUTION"
  Margin = DSCR_stress - 1.10x
  Impact_on_Score = MALUS -2 to -5 pts

ELSE:
  Status = "FAIL"
  Margin = negative
  Impact_on_Score = NOGO (reject)
```

---

## PASS/FAIL CRITERIA

### Summary Table

| Scenario        | Pass Threshold | Fail Threshold | MALUS        |
| --------------- | -------------- | -------------- | ------------ |
| Revenue -10%    | > 1.25x        | < 1.10x        | -2 to -4 pts |
| Cost +5%        | > 1.20x        | < 1.10x        | -2 to -3 pts |
| Delay 6m        | Year2 > 1.15x  | < 1.10x        | -3 to -5 pts |
| Rate +200bps    | > 1.20-1.30x   | < 1.10x        | -2 to -4 pts |
| FX -10%         | > 1.20-1.30x   | < 1.10x        | -3 pts       |
| Market -2% CAGR | LLCR > 1.25x   | LLCR < 1.15x   | -3 pts       |

---

## REPORTING

### Stress Test Report Template

```markdown
# STRESS TEST REPORT

**Project:** [Name]  
**Date:** [Date]  
**Analyst:** [Name]

## BASE CASE METRICS

| Metric       | Value |
| ------------ | ----- |
| DSCR Average | 1.45x |
| DSCR Minimum | 1.35x |
| LLCR         | 1.55x |
| Rating       | A     |

## STRESS RESULTS

### Scenario 1: Revenue Decline -10%

| Year           | DSCR_base | DSCR_stress | Status   |
| -------------- | --------- | ----------- | -------- |
| 1-5            | 1.50x     | 1.35x       | ✓ PASS   |
| 6-20           | 1.40x     | 1.26x       | ✓ PASS   |
| **Conclusion** | -         | -           | **PASS** |

### Scenario 2: Cost Inflation +5%

| Year           | DSCR_base | DSCR_stress | Status   |
| -------------- | --------- | ----------- | -------- |
| 1-20           | 1.45x     | 1.35x       | ✓ PASS   |
| **Conclusion** | -         | -           | **PASS** |

...

## COMBINED STRESS
```

Scenario: Revenue -8% + Cost +3% + Delay 3m + Rate +150bps

DSCR_combined_stress = 1.05x
Status: ⚠️ MARGINAL (below 1.10x minimum)
Recommendation: Monitor closely / increase DSRA

```

## SUMMARY
- ✓ Scenario 1: PASS (margin 0.10x)
- ✓ Scenario 2: PASS (margin 0.15x)
- ⚠️ Scenario 4: PASS MARGINAL (margin -0.05x)
- ✓ Scenario 5: PASS (margin 0.05x)
- ⚠️ Combined: CRITICAL (DSCR = 1.05x)

**Overall Assessment:** Project resilient under single-variable stress, but combined scenarios pose risk.
**Recommendation:** Approve with enhanced monitoring + potential DSRA increase.
**Malus Applied:** -3 pts (combined stress risk)
```

---

## TOOLS & TEMPLATES

### Excel Stress Testing Template

```
Column A: Scenario name
Column B: Variable (Revenue, Cost, Rate, FX, etc.)
Column C: Base case
Column D: Stress case
Column E: Impact (%)
Column F: DSCR_base
Column G: DSCR_stress
Column H: Status (PASS/FAIL)
Column I: Margin to minimum
Column J: Notes
```

### Stress Testing Checklist

```
☐ Base case DSCR calculated & verified
☐ Applicable scenarios identified (sector-specific)
☐ Stress parameters documented (source)
☐ DSCR calculations double-checked
☐ All scenarios tested + results documented
☐ Combined stress calculated
☐ Pass/Fail thresholds applied
☐ MALUS adjustments noted
☐ Report formatted & signed
☐ Credit committee presented
```

---

**Document version:** 1.0  
**Last updated:** April 2026  
**Next review:** Q3 2026
