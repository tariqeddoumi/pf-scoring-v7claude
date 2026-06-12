# MIGRATION CHECKLIST — V8 → V9

> Étapes pas-à-pas. La V9 est **additive** : elle réutilise le socle V7++ et la
> couche sectorielle V8 (renommée/étendue). Aucune donnée d'évaluation existante
> n'est détruite.

---

## Phase 0 — Préparation

- [ ] Sauvegarde Supabase (snapshot DB) avant toute migration.
- [ ] Créer une **branche Supabase** de développement (MCP `create_branch`) pour
      tester les migrations avant `merge`.
- [ ] Geler la version du socle V7++ (le « 336 lignes » : 9/28/84/336) et vérifier
      les comptes actuels : `SELECT nodeType, count(*) FROM BP_PF_v7pp_scoring_nodes GROUP BY 1`.
- [ ] Récupérer le classeur Excel V9 et le convertir en `v9_source_data.json`
      (voir `EXCEL_MAPPING.md`).

## Phase 1 — Schéma V9 (base de données)

- [ ] Ajouter au `prisma/schema.prisma` les modèles V9 (voir `prisma/schema.v9.prisma`) :
      `V9ScoringModel`, `V9Sector`, `V9SectorThreshold`, `V9SectorDomainWeight`,
      `V9RedFlag`, `V9Indicator`, `V9StressTest`, `V9MalusBonus`, `V9AntiDoubleCount`,
      `AppConfiguration`, `AppConfigHistory`.
- [ ] Générer la migration : `npx prisma migrate dev --name v9_sectoral_and_config`.
- [ ] **Migrer V8 → V9** : copier `BP_PF_v8_sectors` → `BP_PF_v9_sectors`,
      `BP_PF_v8_sector_domain_weights` → `BP_PF_v9_sector_domain_weights`
      (les 12 secteurs + 108 poids existent déjà — réutilisation directe).
- [ ] `npx prisma generate` + `npm run type-check`.

## Phase 2 — Données sectorielles (depuis Excel)

- [ ] `BP_PF_v9_sector_thresholds` — 144 lignes (Calibrage sectoriel).
- [ ] `BP_PF_v9_red_flags` — 96 lignes (8/secteur).
- [ ] `BP_PF_v9_indicators` — 72 lignes (6/secteur).
- [ ] `BP_PF_v9_stress_tests` — 24 lignes.
- [ ] `BP_PF_v9_malus_bonus` — barème + plafonds + non-cumul.
- [ ] `BP_PF_v9_anti_double_count` — 72 lignes (8×9).
- [ ] Tous les INSERT en `ON CONFLICT DO UPDATE` (idempotents).

## Phase 3 — Paramétrage global

- [ ] Créer `BP_PF_app_configuration` + `BP_PF_app_config_history`.
- [ ] Seed des clés par défaut (`APP_NAME`, `PRIMARY_COLOR`, `FONT_FAMILY`, …).
- [ ] Implémenter `lib/services/app-config-service.ts` (cache + audit).
- [ ] API : `GET /api/v9/configuration` (public), `GET/PUT /api/admin/configuration[/{key}]` (admin).
- [ ] `AppConfigProvider` + `useAppConfig` + `ThemeWrapper` dans `app/layout.tsx`.
- [ ] Page `/admin/configuration` (formulaire auto + preview live).

## Phase 4 — Moteur de scoring V9

- [ ] Étendre le moteur (`lib/scoring-engine-v8.ts` → `scoring-engine-v9.ts`) :
  - [ ] charger seuils/poids/red flags/indicateurs/stress par secteur ;
  - [ ] appliquer le barème **malus-bonus** (0.10/0.25/No-Go) avec plafonds + non-cumul ;
  - [ ] appliquer **l'anti-double-comptage** (neutraliser SECONDARY/EXCLUDED) ;
  - [ ] déclenchement **No-Go** sur red flag `is_no_go`.
- [ ] Tests unitaires sur un secteur de référence (réutiliser
      `__tests__/fixtures/solar-maroc-case.ts`).

## Phase 5 — Design system « Banque Simple »

- [ ] Mettre à jour `app/globals.css` (palette sobre, accent unique, tokens).
- [ ] Créer `components/bank/*` (`BankButton`, `BankCard`, `BankTable`, …).
- [ ] Retirer emojis/accents multicolores de `app/admin/scoring/page.tsx` et
      `lib/ui-constants.ts` (passer aux tokens sémantiques).
- [ ] Redesign Navbar/Sidebar/Login + branding depuis config.

## Phase 6 — Contrôle & recette

- [ ] `GET /api/v9/control` vérifie : 9/28/84/336 (socle), 12 secteurs,
      144/108/96/72/24 (sectoriel), 72 (anti-double-comptage).
- [ ] Recalculer 2-3 évaluations témoins et comparer V8 vs V9 (écarts attendus
      documentés).
- [ ] `get_advisors` (Supabase) — vérifier sécurité/perf (RLS, index).
- [ ] `npm run build` + `npm run lint` + `npm run type-check` au vert.

## Phase 7 — Mise en production

- [ ] `merge_branch` Supabase (dev → prod) après validation.
- [ ] Déploiement Vercel.
- [ ] Vérifier `/admin/configuration` (changer une couleur → effet immédiat).
- [ ] Activer le modèle V9 (`BP_PF_v9_scoring_models.is_active = true`),
      conserver V8 désactivé pour rollback.

## Rollback

- [ ] V9 additive ⇒ rollback = repasser `is_active` sur le modèle V8 et restaurer
      le snapshot Phase 0 si nécessaire. Les tables `v9_*` peuvent rester en base
      sans impact sur V8.
