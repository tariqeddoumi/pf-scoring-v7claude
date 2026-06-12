# ARCHITECTURE V9 — Socle V7++ + Couches Sectorielles + Paramétrage Global

> Plan de migration vers V9. Construit sur l'existant V7++ (9 domaines, modèle de
> scoring gouverné) et V8 (couche sectorielle, 12 secteurs). V9 formalise le
> calibrage sectoriel, les red flags nominatifs, les indicateurs, les stress tests,
> le barème malus-bonus, l'anti-double-comptage, et ajoute un **paramétrage global
> de l'application** (nom, logo, couleurs, typographie).

---

## 1. Constat de l'existant (ce qui est déjà en base)

| Couche | Tables existantes | Statut V9 |
|--------|-------------------|-----------|
| Socle scoring gouverné | `BP_PF_v7pp_scoring_models`, `_versions`, `_nodes`, `_options`, `_ranges`, `_rules` | **Réutilisé tel quel** (le « socle V7++ inchangé ») |
| Couche sectorielle V8 | `BP_PF_v8_sectors`, `_sector_domain_weights`, `_sector_stress_tests`, `_sector_red_flags`, `_sector_domain_impacts`, `_integration_rules` | **Étendu / renommé v9** |
| Paramétrage scoring | `BP_PF_v7pp_answer_types`, `_aggregation_methods`, `_rating_scales`, … | Réutilisé |
| Paramétrage application | *(aucune — nouveau besoin)* | **Nouveau : `BP_PF_app_configuration`** |

Le socle hiérarchique `ScoringNode` est **universel** (DOMAIN → CRITERION →
SUB_CRITERION → option/range). Les 9 domaines / 28 critères / 84 sous-critères /
336 options de V9 s'insèrent **dans ce socle existant** — pas besoin de tables
dédiées `v9_domains`/`v9_criteria`/etc. Le découpage en tables séparées demandé
dans la mission est représenté ci-dessous comme **vues logiques** du socle
`ScoringNode` filtré par `depth`/`nodeType`, ce qui évite la duplication.

---

## 2. Vue d'ensemble — diagramme de couches

```
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE 0 — PARAMÉTRAGE GLOBAL APPLICATION  (nouveau V9)             │
│  BP_PF_app_configuration   (key/value/type) → app_name, logo,       │
│  couleurs, police, thème…  +  BP_PF_app_config_history (audit)      │
└─────────────────────────────────────────────────────────────────────┘
                                  │ injecté au boot (useAppConfig)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE 1 — SOCLE V7++ (inchangé, déjà en base)                      │
│  BP_PF_v7pp_scoring_models  ──< _versions ──< _nodes (hiérarchie)    │
│                                                  │                    │
│   9 DOMAINES (depth 0)  →  28 CRITÈRES (depth 1)                     │
│        →  84 SOUS-CRITÈRES (depth 2)  →  336 OPTIONS (_options)      │
└─────────────────────────────────────────────────────────────────────┘
                                  │ rattaché par secteur
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE 2 — CALIBRAGE SECTORIEL V9  (12 secteurs)                    │
│  BP_PF_v9_sectors                                                    │
│   ├─< BP_PF_v9_sector_thresholds   (DSCR/LLCR/Leverage × 4 niveaux)  │
│   ├─< BP_PF_v9_sector_domain_weights (poids D1..D9 ajustés)          │
│   ├─< BP_PF_v9_red_flags           (8 red flags nominatifs/secteur)  │
│   ├─< BP_PF_v9_indicators          (72 indicateurs métier)           │
│   └─< BP_PF_v9_stress_tests        (24 stress tests paramétrés)      │
└─────────────────────────────────────────────────────────────────────┘
                                  │ arbitré par
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  COUCHE 3 — AJUSTEMENTS TRANSVERSAUX V9                              │
│  BP_PF_v9_malus_bonus        (barème 0.10 / 0.25 / No-Go, plafonds)  │
│  BP_PF_v9_anti_double_count  (matrice 8 facteurs × 9 domaines)       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Modèle de données V9 — tables et relations

### 3.1 Métadonnées du modèle (paramétrable)

```
BP_PF_v9_scoring_models
  id              PK
  version         text        -- "9.0.0"
  tool_name       text        -- PARAMÉTRABLE (affiché dans l'UI)
  description     text
  socle_version   text        -- "V7++" (référence au socle réutilisé)
  is_active       bool
  created_at / updated_at
```

> `tool_name` reste paramétrable ici **et** miroir dans `BP_PF_app_configuration`
> (clé `APP_NAME`). Convention V9 : `app_configuration` est la source de vérité
> pour l'affichage ; `scoring_models.tool_name` est l'étiquette interne du modèle.

### 3.2 Socle (vues logiques du socle V7++ existant)

| Table « V9 » de la mission | Implémentation réelle | Filtre |
|----------------------------|-----------------------|--------|
| `BP_PF_v9_domains` (9) | `BP_PF_v7pp_scoring_nodes` | `nodeType='DOMAIN'` (depth 0) |
| `BP_PF_v9_criteria` (28) | `BP_PF_v7pp_scoring_nodes` | `nodeType='CRITERION'` (depth 1) |
| `BP_PF_v9_subcriteria` (84) | `BP_PF_v7pp_scoring_nodes` | `nodeType='SUB_CRITERION'` (depth 2) |
| `BP_PF_v9_options` (336) | `BP_PF_v7pp_scoring_options` | par `nodeId` |

Si l'on souhaite **vraiment** des tables physiques séparées (lecture plus simple,
moins de jointures), elles sont fournies en option dans le schéma Prisma
(`V9Domain`, `V9Criterion`, `V9SubCriterion`, `V9Option`) mais la recommandation
est de **réutiliser le socle** pour ne pas dupliquer le moteur de calcul.

### 3.3 Couche sectorielle

```
BP_PF_v9_sectors (12)
  id PK · code (ENR,EAU,TRA,POR,IND,MIN,TOU,TEL,SAN,AGR,ETH,IMM) · label · order · is_active

BP_PF_v9_sector_thresholds          -- 12 secteurs × 3 ratios × 4 niveaux = 144
  id PK · sector_id FK · ratio_type ('DSCR'|'LLCR'|'LEVERAGE')
  level ('EXCELLENT'|'BON'|'ACCEPTABLE'|'INSUFFISANT')
  min_value · max_value · score · UNIQUE(sector_id, ratio_type, level)

BP_PF_v9_sector_domain_weights      -- 12 × 9 = 108 (repris de V8)
  id PK · sector_id FK · domain_code (D1..D9) · weight_adjusted · UNIQUE(sector_id,domain_code)

BP_PF_v9_red_flags                  -- 12 × 8 = 96
  id PK · sector_id FK · code (RF_ENR_1…) · description · is_no_go bool · penalty · order

BP_PF_v9_indicators                 -- 12 × 6 = 72
  id PK · sector_id FK · code · label · unit · target_value · direction ('HIGHER_BETTER'|...) · order

BP_PF_v9_stress_tests               -- 24 (≈2/secteur paramétrés)
  id PK · sector_id FK · code · description · variable · shock_pct · pass_dscr_min · order
```

### 3.4 Ajustements transversaux

```
BP_PF_v9_malus_bonus
  id PK · code (MALUS_5A…) · scope ('DOMAIN'|'GLOBAL') · domain_code?
  kind ('MALUS'|'BONUS') · condition · magnitude (0.10|0.25|'NO_GO')
  cap_per_domain · cap_global · non_cumul_group · rationale · order

BP_PF_v9_anti_double_count          -- 8 facteurs × 9 domaines
  id PK · factor_code · factor_label · domain_code (D1..D9)
  arbitration ('PRIMARY'|'SECONDARY'|'EXCLUDED')  -- où le facteur compte
  note · UNIQUE(factor_code, domain_code)
```

### 3.5 Paramétrage global (nouveau)

```
BP_PF_app_configuration
  key         PK   -- APP_NAME, APP_LOGO_URL, PRIMARY_COLOR, FONT_FAMILY, THEME_MODE…
  value       text
  type        ('string'|'color'|'url'|'enum'|'bool'|'number')
  category    ('branding'|'theme'|'behavior')
  description text
  is_public   bool -- exposé sans auth ?
  updated_at · updated_by

BP_PF_app_config_history
  id PK · key FK · old_value · new_value · changed_by · changed_at
```

---

## 4. Relations (texte ER)

```
v9_scoring_models 1───* (logique) socle v7pp_versions
v9_sectors 1───* v9_sector_thresholds
v9_sectors 1───* v9_sector_domain_weights
v9_sectors 1───* v9_red_flags
v9_sectors 1───* v9_indicators
v9_sectors 1───* v9_stress_tests
app_configuration 1───* app_config_history
malus_bonus  ─ référence domain_code (D1..D9, soft FK vers socle)
anti_double_count ─ référence domain_code (D1..D9, soft FK vers socle)
```

`domain_code` est une **clé douce** (`D1`..`D9`) plutôt qu'une FK dure : cela
permet de calibrer secteur/malus/anti-double-comptage sans dépendre des `id`
techniques des nodes, et reste stable entre versions du socle.

---

## 5. Comptage de cohérence (table « Contrôle »)

| Entité | Attendu | Formule |
|--------|---------|---------|
| Domaines | 9 | socle |
| Critères | 28 | socle |
| Sous-critères | 84 | socle |
| Options | 336 | 84 × 4 |
| Secteurs | 12 | — |
| Seuils sectoriels | 144 | 12 × 3 × 4 |
| Poids domaine/secteur | 108 | 12 × 9 |
| Red flags | 96 | 12 × 8 |
| Indicateurs | 72 | 12 × 6 |
| Stress tests | 24 | 12 × 2 |
| Anti-double-comptage | 72 | 8 × 9 |

Un endpoint `/api/v9/control` doit revérifier ces comptes au déploiement
(voir `MIGRATION_CHECKLIST.md`).

---

## 6. Flux de calcul V9 (résumé)

1. On lit le **secteur** du projet → charge poids domaine, seuils, red flags,
   indicateurs, stress tests du secteur.
2. Le **socle V7++** calcule le score brut (nodes/options/ranges, agrégation
   pondérée) avec les **poids ajustés** du secteur.
3. **Red flags** évalués : un `is_no_go=true` déclenché ⇒ recommandation No-Go.
4. **Malus/Bonus** appliqués (barème 0.10/0.25), avec plafonds par domaine et
   global, règles de non-cumul par groupe.
5. **Anti-double-comptage** : un facteur transversal n'impacte qu'au domaine
   `PRIMARY` (les `SECONDARY`/`EXCLUDED` sont neutralisés).
6. **Stress tests** sectoriels : vérifient DSCR mini sous choc.
7. Score final → grade (AAA…D) via `rating_scales` paramétrable.
