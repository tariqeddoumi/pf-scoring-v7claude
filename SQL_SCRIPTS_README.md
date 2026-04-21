# Scripts SQL — Seed Complet de la Base Supabase

## Vue d'ensemble

Ces scripts SQL régénèrent la hiérarchie **complète** du modèle de scoring PF V3 :

```
Level 0 (Depth 0) : DOMAIN nodes
  ↓
Level 1 (Depth 1) : GROUP nodes (critères)
  ↓
Level 2 (Depth 2) : SUB_CRITERION nodes (sous-critères)
  ↓
OPTIONS / RANGES (éléments de notation)
```

## Fichiers

| Fichier | Contenu | Ordre |
|---------|---------|-------|
| `SUPABASE_V3_COMPLETE_SEED.sql` | Structure hiérarchique complète (domaines → critères → sous-critères) | **1er** |
| `SUPABASE_V3_OPTIONS_RANGES.sql` | Options et plages de notation pour chaque sous-critère | **2e** |

## Structure créée

### **Domaines (9 DOMAIN nodes — depth 0)**

| Code | Label | Description |
|------|-------|-------------|
| D1 | Risque Financier | Flux, endettement, liquidité, couverture |
| D2 | Risque Technique | Technologie, EPC/O&M, équipements |
| D3 | Risque Marché | Demandeur d'électricité, demande, prix |
| D4 | Risque Env./Social | EIA, impact social, engagement communautaire |
| D5 | Risque Gouvernance | Sponsor, board, contrôles financiers |
| D6 | Risque Juridique | SPV, régulation, permis/licences |
| D7 | Risque Pays | Risque souverain, change, assurance PRI |
| D8 | Risque Structure | Covenants, force majeure |
| D9 | Tests de Stress | Résilience P50/P90, surcoûts/revenus |

### **Critères (30 GROUP nodes — depth 1)**

Chaque domaine contient **3-4 critères**, ex :
- D1 (Risque Fin) → C1 (Endettement), C2 (DSCR), C3 (Int./Cov), C4 (Réserves), C5 (FDR)

### **Sous-critères (68 SUB_CRITERION nodes — depth 2)**

Chaque critère contient **2 sous-critères** :

**Exemples :**
- `D1_C1_S1` : Ratio Endettement/Capitaux Propres (NUMERIC_RANGE)
- `D1_C1_S2` : Analyse Couverture Capitaux (OPTION_SINGLE)
- `D1_C2_S1` : DSCR — Cas Base P50 (NUMERIC_RANGE)
- `D1_C2_S2` : DSCR — Minimum P90 (NUMERIC_RANGE)

### **Options (scoring qualitatif)**

Pour les nodes `OPTION_SINGLE`, 5 options standard :

- 🟢 **Excellent** (100 pts) : Crédit AAA, Contrat long-terme ferme
- 🟢 **Fort** (85 pts) : Crédit AA, Contrat ferme
- 🟡 **Moyen** (65 pts) : Crédit A, Contrat standard
- 🟠 **Faible** (45 pts) : Crédit BBB, Contrat conditionnel
- 🔴 **Très Faible** (20 pts) : Crédit < BBB, pas de contrat

### **Ranges (scoring numérique)**

Pour les nodes `NUMERIC_RANGE`, plages paramétrables :

**Exemple DSCR :**
- `0.8 ≤ DSCR < 1.0` → 30 pts (très faible)
- `1.0 ≤ DSCR < 1.2` → 50 pts (faible)
- `1.2 ≤ DSCR < 1.5` → 70 pts (moyen)
- `1.5 ≤ DSCR < 2.0` → 85 pts (bon)
- `DSCR ≥ 2.0` → 95 pts (excellent)

## Comment utiliser

### **Option 1 : Exécuter dans Supabase SQL Editor** (Recommandé)

1. Aller sur [Supabase Console](https://app.supabase.com/)
2. Sélectionner votre projet
3. Ouvrir **SQL Editor** → **New Query**
4. **Copier-coller le contenu** de `SUPABASE_V3_COMPLETE_SEED.sql`
5. Cliquer **Run** ▶️
6. Attendre ~15 secondes
7. **Répéter pour** `SUPABASE_V3_OPTIONS_RANGES.sql`

### **Option 2 : Via PostgreSQL CLI** (avancé)

```bash
# Télécharger les fichiers
curl -O https://raw.githubusercontent.com/your-repo/SUPABASE_V3_COMPLETE_SEED.sql
curl -O https://raw.githubusercontent.com/your-repo/SUPABASE_V3_OPTIONS_RANGES.sql

# Exécuter les scripts
psql $DATABASE_URL < SUPABASE_V3_COMPLETE_SEED.sql
psql $DATABASE_URL < SUPABASE_V3_OPTIONS_RANGES.sql
```

## Vérification

Après exécution, vérifier dans Supabase :

```sql
-- Compter les nœuds par type
SELECT "nodeType", COUNT(*) as nombre
FROM "BP_PF_v7pp_scoring_nodes"
WHERE "versionId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_versions" 
  WHERE "versionNumber" = 3
)
GROUP BY "nodeType"
ORDER BY "nodeType";

-- Résultat attendu :
-- DOMAIN         | 9
-- GROUP          | 30
-- SUB_CRITERION  | 68
```

```sql
-- Compter les options et ranges
SELECT COUNT(*) as total_options
FROM "BP_PF_v7pp_scoring_node_option"
WHERE "nodeId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" IN (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3)
);
-- Résultat attendu : ~340 options

SELECT COUNT(*) as total_ranges
FROM "BP_PF_v7pp_scoring_node_range"
WHERE "nodeId" IN (
  SELECT id FROM "BP_PF_v7pp_scoring_nodes"
  WHERE "versionId" IN (SELECT id FROM "BP_PF_v7pp_scoring_versions" WHERE "versionNumber" = 3)
);
-- Résultat attendu : ~135 ranges
```

## Sécurité

✅ **Safe to run multiple times** — Scripts utilisent :
- `IF NOT EXISTS` pour les modèles/versions
- `WHERE NOT EXISTS` pour les nœuds/options/ranges

Aucun risque de doublons ou conflits.

## Performance

| Étape | Durée | Tables affectées |
|-------|-------|------------------|
| Seed Structure | ~15 sec | `BP_PF_v7pp_scoring_nodes` |
| Options/Ranges | ~20 sec | `BP_PF_v7pp_scoring_node_option`, `BP_PF_v7pp_scoring_node_range` |
| **Total** | **~35 sec** | |

## Support

- ❓ Questions ? Voir le commentaire du script directement
- 🐛 Bug ? Vérifier le **Deployment Guide** dans la racine du projet
- 📊 Diagnostic ? Exécuter les requêtes de vérification ci-dessus

## Prochaines étapes

Après seeding :

1. ✅ Vérifier la hiérarchie complète
2. 🎯 Créer une évaluation test → tester le scoring
3. 📋 Optionnel : Ajouter des règles (malus, NO-GO) via `BP_PF_v7pp_scoring_node_rule`
4. 🚀 Publier la version v3 : `UPDATE BP_PF_v7pp_scoring_versions SET "isPublished" = true WHERE "versionNumber" = 3`

---

**Version** : V3 (2025-04-21)  
**Compatibilité** : Prisma 5.x, Supabase PostgreSQL 15+  
**Modèle** : PF_V7PP (IFC/EBRD/Basel conforme)
