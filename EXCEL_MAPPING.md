# EXCEL MAPPING V9 — Des feuilles Excel vers les tables Supabase

> Mapping des 10 feuilles du classeur V9 vers les tables `BP_PF_v9_*`. Une
> méthode d'import reproductible existe déjà dans le repo (cf.
> `prisma/migrations/20260524_v7pp_complete_from_excel/source_data.json` +
> les `.sql` générés). V9 suit la même approche : Excel → JSON → SQL idempotent.

---

## 1. Vue d'ensemble feuille → table

| # | Feuille Excel | Table cible | Volume |
|---|---------------|-------------|--------|
| 1 | Mode d'emploi | *(aucune — doc)* | — |
| 2 | Socle V7++ | `BP_PF_v7pp_scoring_nodes` + `_options` (réutilisé) | 9+28+84 nodes, 336 options |
| 3 | Calibrage sectoriel | `BP_PF_v9_sector_thresholds` | 144 (12×3×4) |
| 4 | Red Flags sectoriels | `BP_PF_v9_red_flags` | 96 (12×8) |
| 5 | Indicateurs sectoriels | `BP_PF_v9_indicators` | 72 (12×6) |
| 6 | Stress tests sectoriels | `BP_PF_v9_stress_tests` | 24 |
| 7 | Malus-Bonus | `BP_PF_v9_malus_bonus` | barème |
| 8 | Anti-double comptage | `BP_PF_v9_anti_double_count` | 72 (8×9) |
| 9 | Méthodologie V9 | `BP_PF_v9_scoring_models.description` | 1 |
| 10 | Contrôle | *(checks)* `/api/v9/control` | — |

---

## 2. Feuille « Calibrage sectoriel » → `BP_PF_v9_sector_thresholds`

**Structure Excel attendue** (une ligne par secteur, colonnes par ratio×niveau) :

```
Secteur | DSCR_Excellent | DSCR_Bon | DSCR_Acceptable | DSCR_Insuffisant | LLCR_… | Leverage_…
ENR     | >=1.45         | 1.30-1.45| 1.15-1.30       | <1.15            | …      | …
```

**Transformation** : dépivoter (unpivot). Chaque cellule devient une ligne :

```
sector_id (lookup code) · ratio_type ('DSCR') · level ('EXCELLENT')
min_value · max_value · score
```

Règle de parsing des bornes : `>=1.45` → min=1.45, max=null ; `1.30-1.45` →
min=1.30, max=1.45 ; `<1.15` → min=null, max=1.15. Pour LEVERAGE (plus bas = mieux)
inverser la logique de score.

---

## 3. Feuille « Red Flags sectoriels » → `BP_PF_v9_red_flags`

**Structure Excel** : 8 lignes par secteur.

```
Secteur | N° | Red Flag (libellé nominatif)        | No-Go ? | Pénalité
ENR     | 1  | Productible P90 < 0.85 × P50        | Non     | -3
ENR     | 2  | PPA non signé à la clôture          | Oui     | NO_GO
```

**Mapping** :

```
code            = 'RF_' || sector_code || '_' || N°      -- RF_ENR_1
sector_id       = lookup(Secteur)
description      = libellé
is_no_go        = (No-Go ? == 'Oui')
penalty         = parse pénalité (null si NO_GO)
order           = N°
```

---

## 4. Feuille « Indicateurs sectoriels » → `BP_PF_v9_indicators`

**Structure Excel** : 6 indicateurs par secteur.

```
Secteur | Code | Indicateur            | Unité | Cible  | Sens
ENR     | IND1 | Facteur de charge     | %     | >=25   | HIGHER_BETTER
```

**Mapping** : direct, 1 ligne = 1 indicateur. `direction` ∈
`HIGHER_BETTER`/`LOWER_BETTER`/`RANGE`. `target_value` parsé depuis « Cible ».

---

## 5. Feuille « Stress tests sectoriels » → `BP_PF_v9_stress_tests`

```
Secteur | Code | Scénario              | Variable    | Choc   | DSCR mini requis
TRA     | ST1  | Baisse trafic -25%    | TRAFFIC     | -25%   | 1.05
```

**Mapping** : `shock_pct` = -0.25, `pass_dscr_min` = 1.05, `variable` = code
variable du modèle financier.

---

## 6. Feuille « Malus-Bonus » → `BP_PF_v9_malus_bonus`

Réutilise le format existant `EXCEL_TEMPLATES/04_MALUS_RULES.csv`
(`Rule ID, Domain, Condition, Penalty, Trigger Level, Mitigation, Rationale`),
enrichi pour V9 du barème formalisé :

```
code            = Rule ID (MALUS_5A)
scope           = 'DOMAIN' (Domain renseigné) sinon 'GLOBAL'
domain_code     = Domain (D5)
kind            = 'MALUS' | 'BONUS'
magnitude       = 0.10 | 0.25 | 'NO_GO'   (barème V9)
cap_per_domain  = plafond par domaine (col. ajoutée)
cap_global      = plafond global (col. ajoutée)
non_cumul_group = identifiant de groupe non-cumulable (col. ajoutée)
condition / rationale = Condition / Rationale
```

---

## 7. Feuille « Anti-double comptage » → `BP_PF_v9_anti_double_count`

Matrice 8 facteurs (lignes) × 9 domaines (colonnes). Chaque cellule indique où le
facteur **compte vraiment**.

```
Facteur \ Domaine | D1 | D2 | … | D9
Risque FX         | S  | P  | … | E
```

`P`=PRIMARY, `S`=SECONDARY, `E`=EXCLUDED. **Dépivoter** : 8×9 = 72 lignes
`(factor_code, domain_code, arbitration)`.

---

## 8. Pipeline d'import recommandé

```
classeur.xlsx
   │  (1) export par feuille → CSV/JSON  (script Python ou node xlsx)
   ▼
v9_source_data.json     ← une clé par feuille, valeurs typées
   │  (2) générateur → SQL idempotent (INSERT … ON CONFLICT DO UPDATE)
   ▼
prisma/migrations/2026XXXX_v9_sectoral/*.sql
   │  (3) apply_migration (Supabase MCP) ou supabase db push
   ▼
Supabase
   │  (4) GET /api/v9/control  → vérifie les comptes (144/96/72/24/72)
```

Le pattern `ON CONFLICT DO UPDATE` + résolution des `sector_id` par `code`
(comme dans `02_insert_sectors_and_weights.sql`) garantit des imports rejouables.
