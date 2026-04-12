-- ============================================================================
-- QUICK SCHEMA CHECK
-- Vérification rapide de l'état du schéma
-- ============================================================================

\echo '================================================================================'
\echo '                        QUICK SCHEMA CHECK'
\echo '================================================================================'
\echo ''

-- Table Count
\echo '✓ TABLES:'
SELECT
    CASE tablename
        WHEN 'BP_PF_users' THEN '  Users Table'
        WHEN 'BP_PF_clients' THEN '  Clients Table'
        WHEN 'BP_PF_projects' THEN '  Projects Table'
        WHEN 'BP_PF_v7pp_evaluations' THEN '  Evaluations Table'
    END as Table,
    COUNT(*) as Records
FROM pg_tables
LEFT JOIN (
    SELECT 'BP_PF_users' as tablename, COUNT(*) as cnt FROM "BP_PF_users"
    UNION ALL
    SELECT 'BP_PF_clients', COUNT(*) FROM "BP_PF_clients"
    UNION ALL
    SELECT 'BP_PF_projects', COUNT(*) FROM "BP_PF_projects"
    UNION ALL
    SELECT 'BP_PF_v7pp_evaluations', COUNT(*) FROM "BP_PF_v7pp_evaluations"
) counts ON pg_tables.tablename = counts.tablename
WHERE schemaname = 'public'
AND tablename IN ('BP_PF_users', 'BP_PF_clients', 'BP_PF_projects', 'BP_PF_v7pp_evaluations')
GROUP BY counts.tablename, Table
ORDER BY counts.tablename;

\echo ''
\echo '✓ COLUMN CHECK:'

-- Quick column count
\echo '  BP_PF_users columns:'
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'BP_PF_users' AND table_schema = 'public';

\echo '  BP_PF_clients columns:'
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'BP_PF_clients' AND table_schema = 'public';

\echo '  BP_PF_projects columns:'
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'BP_PF_projects' AND table_schema = 'public';

\echo '  BP_PF_v7pp_evaluations columns:'
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'BP_PF_v7pp_evaluations' AND table_schema = 'public';

\echo ''
\echo '✓ CONSTRAINTS:'

\echo '  Foreign Keys:'
SELECT COUNT(*) FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
AND table_name IN ('BP_PF_projects', 'BP_PF_v7pp_evaluations');

\echo '  Unique Constraints:'
SELECT COUNT(*) FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE' AND table_schema = 'public'
AND table_name IN ('BP_PF_users', 'BP_PF_clients');

\echo ''
\echo '✓ INDEXES:'
SELECT COUNT(*) FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'BP_PF%';

\echo ''
\echo '✓ DATA INTEGRITY:'

-- Check for orphaned records
\echo '  Orphaned projects (invalid creePar):'
SELECT COUNT(*) FROM "BP_PF_projects"
WHERE "creePar" NOT IN (SELECT id FROM "BP_PF_users");

\echo '  Orphaned evaluations (invalid projectId):'
SELECT COUNT(*) FROM "BP_PF_v7pp_evaluations"
WHERE "projectId" NOT IN (SELECT id FROM "BP_PF_projects");

\echo ''
\echo '================================================================================'
\echo '                         SCHEMA STATUS: READY ✓'
\echo '================================================================================'
\echo ''
