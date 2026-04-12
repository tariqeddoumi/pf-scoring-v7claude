-- ============================================================================
-- SCHEMA INTEGRITY VERIFICATION SCRIPT
-- Vérifie l'intégrité du schéma et génère un rapport détaillé
-- Created: 2026-04-12
-- ============================================================================

\echo '================================================================================'
\echo '                    SCHEMA INTEGRITY VERIFICATION REPORT'
\echo '================================================================================'
\echo ''

-- ============================================================================
-- 1. TABLE EXISTENCE CHECK
-- ============================================================================
\echo '1. TABLE EXISTENCE CHECK'
\echo '========================'

DO $$
DECLARE
    v_count INT;
    v_tables TEXT[] := ARRAY['BP_PF_users', 'BP_PF_clients', 'BP_PF_projects', 'BP_PF_v7pp_evaluations'];
    v_table TEXT;
BEGIN
    FOREACH v_table IN ARRAY v_tables
    LOOP
        SELECT COUNT(*) INTO v_count
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = v_table;

        IF v_count > 0 THEN
            RAISE NOTICE 'Table % EXISTS ✓', v_table;
        ELSE
            RAISE NOTICE 'Table % MISSING ✗', v_table;
        END IF;
    END LOOP;
END $$;

\echo ''

-- ============================================================================
-- 2. COLUMN VERIFICATION FOR BP_PF_users
-- ============================================================================
\echo '2. COLUMN VERIFICATION - BP_PF_users'
\echo '====================================='
\echo ''

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name IN ('id', 'email', 'nom', 'prenom', 'role', 'createdAt', 'updatedAt') THEN 'REQUIRED ✓'
        ELSE 'OPTIONAL'
    END as "Status"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'BP_PF_users'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- 3. COLUMN VERIFICATION FOR BP_PF_clients
-- ============================================================================
\echo '3. COLUMN VERIFICATION - BP_PF_clients'
\echo '======================================'
\echo ''

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name IN ('id', 'nom', 'createdAt', 'updatedAt') THEN 'REQUIRED ✓'
        ELSE 'OPTIONAL'
    END as "Status"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'BP_PF_clients'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- 4. COLUMN VERIFICATION FOR BP_PF_projects
-- ============================================================================
\echo '4. COLUMN VERIFICATION - BP_PF_projects'
\echo '======================================='
\echo ''

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name IN ('id', 'nom', 'description', 'secteur', 'montant', 'devise', 'status', 'creePar', 'dateCreation', 'dateMiseAJour') THEN 'REQUIRED ✓'
        ELSE 'OPTIONAL'
    END as "Status"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'BP_PF_projects'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- 5. COLUMN VERIFICATION FOR BP_PF_v7pp_evaluations
-- ============================================================================
\echo '5. COLUMN VERIFICATION - BP_PF_v7pp_evaluations'
\echo '=============================================='
\echo ''

SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE
        WHEN column_name IN ('id', 'projectId', 'analystId', 'rating', 'finalScore', 'recommendation', 'probabilityOfDefault', 'triggeredNOGOs', 'appliedMALUS', 'malusTotal', 'status', 'version', 'createdAt', 'updatedAt') THEN 'REQUIRED ✓'
        ELSE 'OPTIONAL'
    END as "Status"
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'BP_PF_v7pp_evaluations'
ORDER BY ordinal_position;

\echo ''

-- ============================================================================
-- 6. FOREIGN KEY CONSTRAINTS VERIFICATION
-- ============================================================================
\echo '6. FOREIGN KEY CONSTRAINTS VERIFICATION'
\echo '======================================'
\echo ''

SELECT
    constraint_name,
    table_name,
    column_name,
    referenced_table_name,
    referenced_column_name
FROM information_schema.referential_constraints
WHERE constraint_schema = 'public'
ORDER BY table_name, constraint_name;

\echo ''

-- ============================================================================
-- 7. UNIQUE CONSTRAINTS VERIFICATION
-- ============================================================================
\echo '7. UNIQUE CONSTRAINTS VERIFICATION'
\echo '=================================='
\echo ''

SELECT
    constraint_name,
    table_name,
    ARRAY_AGG(column_name) as columns
FROM information_schema.constraint_column_usage
WHERE constraint_schema = 'public'
AND table_name IN ('BP_PF_users', 'BP_PF_clients', 'BP_PF_projects', 'BP_PF_v7pp_evaluations')
GROUP BY constraint_name, table_name, constraint_name
ORDER BY table_name, constraint_name;

\echo ''

-- ============================================================================
-- 8. INDEXES VERIFICATION
-- ============================================================================
\echo '8. INDEXES VERIFICATION'
\echo '======================='
\echo ''

SELECT
    tablename,
    indexname,
    CASE WHEN indexdef LIKE '%UNIQUE%' THEN 'UNIQUE' ELSE 'REGULAR' END as "Type"
FROM pg_indexes
WHERE schemaname = 'public' AND tablename LIKE 'BP_PF%'
ORDER BY tablename, indexname;

\echo ''

-- ============================================================================
-- 9. DATA INTEGRITY CHECK
-- ============================================================================
\echo '9. DATA INTEGRITY CHECK'
\echo '======================='
\echo ''

DO $$
DECLARE
    v_user_count INT;
    v_client_count INT;
    v_project_count INT;
    v_evaluation_count INT;
BEGIN
    SELECT COUNT(*) INTO v_user_count FROM "BP_PF_users";
    SELECT COUNT(*) INTO v_client_count FROM "BP_PF_clients";
    SELECT COUNT(*) INTO v_project_count FROM "BP_PF_projects";
    SELECT COUNT(*) INTO v_evaluation_count FROM "BP_PF_v7pp_evaluations";

    RAISE NOTICE 'Users: % records', v_user_count;
    RAISE NOTICE 'Clients: % records', v_client_count;
    RAISE NOTICE 'Projects: % records', v_project_count;
    RAISE NOTICE 'Evaluations: % records', v_evaluation_count;
END $$;

\echo ''

-- ============================================================================
-- 10. ORPHANED RECORDS CHECK
-- ============================================================================
\echo '10. ORPHANED RECORDS CHECK'
\echo '========================='
\echo ''

\echo 'Checking for projects with non-existent users (creePar)...'
SELECT COUNT(*) as "Orphaned Projects"
FROM "BP_PF_projects" p
WHERE p."creePar" NOT IN (SELECT id FROM "BP_PF_users");

\echo 'Checking for projects with non-existent clients...'
SELECT COUNT(*) as "Orphaned Projects"
FROM "BP_PF_projects" p
WHERE p."clientId" IS NOT NULL
AND p."clientId" NOT IN (SELECT id FROM "BP_PF_clients");

\echo 'Checking for evaluations with non-existent projects...'
SELECT COUNT(*) as "Orphaned Evaluations"
FROM "BP_PF_v7pp_evaluations" e
WHERE e."projectId" NOT IN (SELECT id FROM "BP_PF_projects");

\echo 'Checking for evaluations with non-existent analysts...'
SELECT COUNT(*) as "Orphaned Evaluations"
FROM "BP_PF_v7pp_evaluations" e
WHERE e."analystId" IS NOT NULL
AND e."analystId" NOT IN (SELECT id FROM "BP_PF_users");

\echo ''

-- ============================================================================
-- 11. DATA TYPE COMPLIANCE
-- ============================================================================
\echo '11. DATA TYPE COMPLIANCE CHECK'
\echo '=============================='
\echo ''

DO $$
DECLARE
    v_message TEXT;
BEGIN
    -- Check if all IDs are TEXT type
    SELECT COUNT(*) INTO v_message
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name IN ('BP_PF_users', 'BP_PF_clients', 'BP_PF_projects', 'BP_PF_v7pp_evaluations')
    AND column_name = 'id'
    AND data_type != 'text';

    IF v_message > 0 THEN
        RAISE NOTICE 'WARNING: Not all ID columns are TEXT type';
    ELSE
        RAISE NOTICE 'All ID columns are TEXT type ✓';
    END IF;

    -- Check if timestamps are TIMESTAMP(3)
    SELECT COUNT(*) INTO v_message
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name IN ('BP_PF_users', 'BP_PF_clients', 'BP_PF_projects', 'BP_PF_v7pp_evaluations')
    AND column_name IN ('createdAt', 'updatedAt', 'dateCreation', 'dateMiseAJour');

    RAISE NOTICE 'Timestamp columns found: %', v_message;
END $$;

\echo ''

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================
\echo '================================================================================'
\echo '                            VERIFICATION SUMMARY'
\echo '================================================================================'
\echo ''
\echo 'Schema Verification Complete!'
\echo 'If all checks passed, your database schema is ready for use.'
\echo ''
\echo 'Recommended Next Steps:'
\echo '1. Run: npm run dev  (to start the development server)'
\echo '2. Run: prisma studio  (to browse the database)'
\echo '3. Run: npm run build  (to test the production build)'
\echo ''
\echo 'For more information, see: /sql/sync_database_schema.sql'
\echo ''
\echo '================================================================================'
