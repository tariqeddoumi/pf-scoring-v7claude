-- ============================================================================
-- Vérifier les tables existantes dans Supabase
-- ============================================================================

-- Liste toutes les tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Compter les tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';

-- Vérifier les tables de scoring spécifiquement
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'BP_PF%'
ORDER BY table_name;

-- Vérifier le nombre d'enregistrements par table
SELECT
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
AND tablename LIKE 'BP_PF%'
ORDER BY tablename;

-- Vérifier si les tables principales existent
SELECT
    'BP_PF_users' as table_name,
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_users') as exists
UNION ALL
SELECT 'BP_PF_projects', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_projects')
UNION ALL
SELECT 'BP_PF_clients', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_clients')
UNION ALL
SELECT 'BP_PF_scorings', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_scorings')
UNION ALL
SELECT 'BP_PF_v7pp_scoring_models', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_v7pp_scoring_models')
UNION ALL
SELECT 'BP_PF_v7pp_scoring_evaluations', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_v7pp_scoring_evaluations')
UNION ALL
SELECT 'BP_PF_v7pp_scoring_workflows', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_v7pp_scoring_workflows')
UNION ALL
SELECT 'BP_PF_scoring_criteria', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_scoring_criteria')
UNION ALL
SELECT 'BP_PF_scoring_grilles', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_scoring_grilles')
UNION ALL
SELECT 'BP_PF_sectors', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='BP_PF_sectors');
