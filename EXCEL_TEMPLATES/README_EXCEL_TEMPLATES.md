# 📊 EXCEL TEMPLATES – PF SCORING V7++

**Purpose:** Interactive templates for analysts, risk managers, and deal teams  
**Format:** CSV (universal format for Excel & Google Sheets)  
**Status:** Ready to import

---

## 📋 FILES INCLUDED

### **1. Domain Summary** (`01_DOMAIN_SUMMARY.csv`)

- Quick reference of all 9 domains
- Weight %, focus area, key risks, red flag thresholds
- **Use:** Dashboard, onboarding, quick lookup
- **Import:** Google Sheets → File → Import → Select file

### **2. Scoring Scales Reference** (`02_SCORING_SCALES.csv`)

- Score 1-10 mapping for each criterion
- Descriptions for all scoring levels (10 = best, 1-3 = reject)
- **Use:** Analyst training, consistent scoring
- **Import:** Excel → Data tab → Import from text file

### **3. NO-GO Rules Matrix** (`03_NO_GO_RULES.csv`)

- All 21 automatic rejection conditions
- Category, severity, description, workarounds
- **Use:** Deal evaluation checklist
- **Use Case:** "Does this project have any NO-GOs?"

### **4. MALUS Rules Matrix** (`04_MALUS_RULES.csv`)

- All ~20 score reduction conditions
- Penalty points, trigger levels, mitigations
- **Use:** Score adjustment reference
- **Use Case:** "What penalties apply to this project?"

### **5. Case Study – Solar Maroc** (`05_CASE_STUDY_SOLAR_MAROC.csv`)

- Complete worked example with calculations
- Base case metrics, all 6 stress scenarios, results
- **Use:** Training, validation, expected output reference
- **Use Case:** "What does a good project look like?"

### **6. Stress Test Template (Blank)** (`06_STRESS_TEST_TEMPLATE.csv`)

- Interactive template for analysts to fill in
- Formulas for DSCR stress calculations
- Guidance for each scenario
- **Use:** Deal evaluation, stress testing
- **Use Case:** "Run stress tests on my project"

---

## 🚀 HOW TO USE

### **Option A: Google Sheets** (Recommended for collaboration)

**Step 1: Create new Google Sheet**

```
Google Drive → New → Google Sheets → Blank spreadsheet
Name it: "PF_SCORING_V7PLUS_TEMPLATES"
```

**Step 2: Import CSV files**

```
File → Import → Upload → Select CSV file
When prompted: "Replace spreadsheet" or "Insert new sheet"
Choose "Insert new sheet" to keep all in one file
```

**Step 3: Organize into tabs**

```
Sheet 1: Domain Summary
Sheet 2: Scoring Scales
Sheet 3: NO-GO Rules
Sheet 4: MALUS Rules
Sheet 5: Case Study
Sheet 6: Stress Test Template
```

**Step 4: Share with team**

```
Click "Share" → Add emails → Adjust permissions (edit/view)
```

### **Option B: Excel** (For desktop users)

**Step 1: Create new workbook**

```
Excel → Blank workbook → File → Save as "PF_SCORING_V7PLUS_TEMPLATES.xlsx"
```

**Step 2: Import CSV files into different sheets**

```
Sheet tab → Import (or manually copy-paste from CSV)
Repeat for each CSV file
```

**Step 3: Add formulas** (for interactive templates)

```
Case Study sheet → Add formula: =SUM(D1:D9 scores) for global score
Stress Test sheet → Add formulas for DSCR calculations
```

**Step 4: Share file**

```
File → Share → Share with team members
```

---

## 📊 INTERACTIVE FORMULAS

### **Case Study Sheet – Key Formulas**

```excel
Cell [Weighted Score D1] = 20% × Score_D1
Cell [Global Score] = (D1_weighted + D2_weighted + ... + D9_weighted) / 1.35

Cell [DSCR Stress D1] = €90M (stressed revenue) / €7M (debt service)
Cell [Status D1] = IF(DSCR_stress > 1.25, "PASS", "FAIL")

Cell [Final Score] = Global_score - SUM(MALUS penalties)
```

### **Stress Test Template – Key Formulas**

```excel
Cell [Revenue_stress] = Revenue_base × 0.90  (for -10% scenario)
Cell [DSCR_stress] = Revenue_stress / Debt_Service
Cell [Margin to minimum] = DSCR_stress - 1.10

Cell [Combined Stress] = (Revenue - 0.08×margin) + (Cost + 0.03×margin) + ...
```

---

## 💡 USAGE EXAMPLES

### **For Deal Evaluation (Analyst)**

**Workflow:**

1. Open "Scoring Scales Reference" → Understand criteria
2. Open "Stress Test Template" → Create copy for your project
3. Fill in base case data from financial model
4. Run all 6 stress scenarios
5. Check against "NO-GO Rules" → Any triggers?
6. Check against "MALUS Rules" → Any penalties?
7. Verify against "Case Study" → Compare to Solar Maroc example
8. Document in "Domain Summary" for committee

### **For Committee Presentation**

**Workflow:**

1. Use "Domain Summary" → Show all 9 scores on slide
2. Reference "Case Study" → Compare project vs Solar Maroc
3. Show stress test results → Demonstrate resilience
4. Flag any "MALUS Rules" triggered → Transparency
5. Confirm no "NO-GO Rules" → Deal-breakers addressed

### **For Risk Manager Monitoring**

**Workflow:**

1. Open "Stress Test Template" (annual review)
2. Update actual data from financial reports
3. Recalculate DSCR vs. covenant thresholds
4. Check for any degradation (DSCR declining over time?)
5. Update "MALUS Rules" if new risks emerged
6. Report to lender management

---

## 🎓 TRAINING SEQUENCE

**Day 1 – Fundamentals (1 hour)**

- Review "Domain Summary" (understand 9 domains)
- Review "Scoring Scales" (understand 1-10 mapping)

**Day 2 – Rules** (1 hour)

- Study "NO-GO Rules" (what causes rejection)
- Study "MALUS Rules" (what causes penalties)
- Practice identifying rules from sample project descriptions

**Day 3 – Application** (2 hours)

- Review "Case Study – Solar Maroc" in detail
- Replicate calculations in "Stress Test Template"
- Verify outputs match expected results

**Day 4 – Practice** (4 hours)

- Analyst works on practice project
- Uses all 6 templates
- Presents findings to mentor

**Day 5 – Certification** (ongoing)

- Analyst scores 3 real projects
- Results reviewed by risk manager
- Certified when >95% accuracy vs. benchmark

---

## 📈 MAINTENANCE & UPDATES

### **When to Update Templates**

| Event                    | Action                               | Frequency   |
| ------------------------ | ------------------------------------ | ----------- |
| New NO-GO rule defined   | Update 03_NO_GO_RULES.csv            | As needed   |
| New MALUS rule           | Update 04_MALUS_RULES.csv            | As needed   |
| Scoring scales change    | Update 02_SCORING_SCALES.csv         | Quarterly   |
| New case study completed | Add to 05_CASE_STUDY_SOLAR_MAROC.csv | Per project |
| Template improvements    | Update 06_STRESS_TEST_TEMPLATE.csv   | Quarterly   |

### **Version Control**

Keep a folder in Google Drive:

```
/PF_SCORING_V7PLUS_TEMPLATES/
  ├─ v1.0_2026_Q1/ (Initial)
  ├─ v1.1_2026_Q2/ (Rules updates)
  └─ CURRENT/ (Latest active)
```

---

## 🔗 INTEGRATION WITH METHODOLOGY

**Each template links to Methodology Note:**

- **Domain Summary** → See METHODOLOGY_NOTE_V7PLUS.md: "ARCHITECTURE"
- **Scoring Scales** → See METHODOLOGY_NOTE_V7PLUS.md: "DOMAINS DÉTAILLÉS"
- **NO-GO Rules** → See METHODOLOGY_NOTE_V7PLUS.md: "RULES ENGINE"
- **MALUS Rules** → See METHODOLOGY_NOTE_V7PLUS.md: "RULES ENGINE"
- **Case Study** → See METHODOLOGY_NOTE_V7PLUS.md: "EXEMPLE D'APPLICATION"
- **Stress Test** → See STRESS_TESTING_GUIDE.md: "STRESS SCENARIOS"

---

## ❓ TROUBLESHOOTING

### **"CSV won't import into Google Sheets"**

→ Make sure you're using File → Import, not File → Open  
→ Select "Insert new sheet" when prompted

### **"Formulas not working"**

→ After importing, check cells contain formulas (=...) not text  
→ In Excel: Format → AutoCalulate enabled  
→ In Google Sheets: Format → Numbers → Number

### **"Data looks misaligned"**

→ CSV uses commas as separators; if data has commas, they may shift columns  
→ Solution: Use Google Sheets (handles this better)

### **"Can't edit template"**

→ Make sure you have "Edit" permissions (ask Google Drive owner)  
→ Or make a copy: File → Make a copy → Edit your version

---

## 📞 QUESTIONS?

**For specific domain:** See METHODOLOGY_NOTE_V7PLUS.md  
**For stress formulas:** See STRESS_TESTING_GUIDE.md  
**For implementation:** See IMPLEMENTATION_CHECKLIST_PHASE2.md

---

**Last Updated:** April 2026  
**Version:** 1.0  
**Status:** Ready for use ✅
