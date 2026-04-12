-- ============================================================================
-- TEST DATA SEED SCRIPT
-- Injecte des données de test pour vérifier l'intégrité du schéma
-- ATTENTION: À exécuter UNIQUEMENT en développement/test!
-- Created: 2026-04-12
-- ============================================================================

\echo 'WARNING: This script will insert TEST DATA into your database!'
\echo 'Use only for development/testing purposes.'
\echo ''

-- ============================================================================
-- 1. INSERT TEST USERS
-- ============================================================================
\echo 'Inserting test users...'

INSERT INTO "BP_PF_users" ("id", "email", "password", "nom", "prenom", "role", "createdAt", "updatedAt")
VALUES
    ('user-admin-001', 'admin@example.com', 'hashed_password_123', 'Admin', 'Test', 'admin', NOW(), NOW()),
    ('user-manager-001', 'manager@example.com', 'hashed_password_123', 'Manager', 'Test', 'manager', NOW(), NOW()),
    ('user-analyst-001', 'analyst@example.com', 'hashed_password_123', 'Analyst', 'Test', 'analyst', NOW(), NOW()),
    ('user-viewer-001', 'viewer@example.com', 'hashed_password_123', 'Viewer', 'Test', 'viewer', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

SELECT COUNT(*) as "Users Created" FROM "BP_PF_users";

-- ============================================================================
-- 2. INSERT TEST CLIENTS
-- ============================================================================
\echo 'Inserting test clients...'

INSERT INTO "BP_PF_clients" ("id", "nom", "email", "telephone", "secteur", "pays", "type", "description", "status", "createdAt", "updatedAt")
VALUES
    ('client-001', 'Société Générale Maroc', 'contact@sgmaroc.com', '+212 5XX XXX XXX', 'Finance', 'Maroc', 'Entreprise', 'Banque commerciale', 'Actif', NOW(), NOW()),
    ('client-002', 'Énergies Renouvelables SA', 'info@energies-renew.com', '+212 5XX XXX XXX', 'Énergie', 'Maroc', 'Entreprise', 'Production énergie solaire', 'Actif', NOW(), NOW()),
    ('client-003', 'Infrastructure Transport Ltd', 'admin@transport-infra.com', '+212 5XX XXX XXX', 'Transport', 'Maroc', 'Entreprise', 'Gestion infrastructures', 'Inactif', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

SELECT COUNT(*) as "Clients Created" FROM "BP_PF_clients";

-- ============================================================================
-- 3. INSERT TEST PROJECTS
-- ============================================================================
\echo 'Inserting test projects...'

INSERT INTO "BP_PF_projects"
("id", "nom", "description", "secteur", "montant", "devise", "status", "creePar", "clientId", "countryCode", "dateCreation", "dateMiseAJour")
VALUES
    (
        'proj-001',
        'Centrale Solaire Agadir',
        'Construction et exploitation d''une centrale solaire photovoltaïque de 100 MW à Agadir',
        'Énergie - Solaire',
        500000000,
        'MAD',
        'brouillon',
        'user-analyst-001',
        'client-002',
        'MA',
        NOW(),
        NOW()
    ),
    (
        'proj-002',
        'Parc Éolien Tarfaya',
        'Développement d''un parc éolien offshore de 500 MW au large de Tarfaya',
        'Énergie - Éolien',
        2000000000,
        'MAD',
        'en_cours',
        'user-analyst-001',
        'client-002',
        'MA',
        NOW(),
        NOW()
    ),
    (
        'proj-003',
        'Autoroute Casablanca - Fès',
        'Construction d''une autoroute à 4 voies reliant Casablanca à Fès',
        'Infrastructure - Transport',
        15000000000,
        'MAD',
        'approuve',
        'user-manager-001',
        'client-003',
        'MA',
        NOW(),
        NOW()
    )
ON CONFLICT ("id") DO NOTHING;

SELECT COUNT(*) as "Projects Created" FROM "BP_PF_projects";

-- ============================================================================
-- 4. INSERT TEST EVALUATIONS
-- ============================================================================
\echo 'Inserting test evaluations...'

INSERT INTO "BP_PF_v7pp_evaluations"
("id", "projectId", "analystId", "rating", "finalScore", "recommendation", "probabilityOfDefault", "triggeredNOGOs", "appliedMALUS", "malusTotal", "status", "version", "createdAt", "updatedAt")
VALUES
    (
        'eval-001',
        'proj-001',
        'user-analyst-001',
        'AA',
        85.5,
        'APPROVE',
        0.05,
        '[]'::JSONB,
        '[]'::JSONB,
        0,
        'brouillon',
        '7.0',
        NOW(),
        NOW()
    ),
    (
        'eval-002',
        'proj-002',
        'user-analyst-001',
        'A',
        80.0,
        'APPROVE_WITH_CONDITIONS',
        0.10,
        '[]'::JSONB,
        '[]'::JSONB,
        0,
        'soumis',
        '7.0',
        NOW(),
        NOW()
    ),
    (
        'eval-003',
        'proj-003',
        'user-manager-001',
        'AAA',
        95.0,
        'APPROVE',
        0.02,
        '[]'::JSONB,
        '[]'::JSONB,
        0,
        'valide',
        '7.0',
        NOW(),
        NOW()
    )
ON CONFLICT ("id") DO NOTHING;

SELECT COUNT(*) as "Evaluations Created" FROM "BP_PF_v7pp_evaluations";

-- ============================================================================
-- 5. VERIFY RELATIONSHIPS
-- ============================================================================
\echo ''
\echo 'Verifying Relationships...'
\echo ''

\echo 'Projects with their creators and clients:'
SELECT
    p."nom" as "Project",
    u."nom" as "Creator",
    c."nom" as "Client",
    p."status" as "Status"
FROM "BP_PF_projects" p
LEFT JOIN "BP_PF_users" u ON p."creePar" = u."id"
LEFT JOIN "BP_PF_clients" c ON p."clientId" = c."id"
ORDER BY p."dateCreation" DESC;

\echo ''
\echo 'Evaluations with their projects and analysts:'
SELECT
    e."id" as "Evaluation ID",
    p."nom" as "Project",
    u."nom" as "Analyst",
    e."rating" as "Rating",
    e."status" as "Status"
FROM "BP_PF_v7pp_evaluations" e
LEFT JOIN "BP_PF_projects" p ON e."projectId" = p."id"
LEFT JOIN "BP_PF_users" u ON e."analystId" = u."id"
ORDER BY e."createdAt" DESC;

-- ============================================================================
-- SUMMARY
-- ============================================================================
\echo ''
\echo '================================================================================'
\echo '                        TEST DATA INSERTION COMPLETE'
\echo '================================================================================'
\echo ''

DO $$
DECLARE
    v_users INT;
    v_clients INT;
    v_projects INT;
    v_evaluations INT;
BEGIN
    SELECT COUNT(*) INTO v_users FROM "BP_PF_users";
    SELECT COUNT(*) INTO v_clients FROM "BP_PF_clients";
    SELECT COUNT(*) INTO v_projects FROM "BP_PF_projects";
    SELECT COUNT(*) INTO v_evaluations FROM "BP_PF_v7pp_evaluations";

    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Users: %', v_users;
    RAISE NOTICE '  - Clients: %', v_clients;
    RAISE NOTICE '  - Projects: %', v_projects;
    RAISE NOTICE '  - Evaluations: %', v_evaluations;
    RAISE NOTICE '';
    RAISE NOTICE 'All relationships are properly established!';
END $$;

\echo ''
\echo 'Next steps:'
\echo '1. Test the API endpoints with this data'
\echo '2. Verify frontend displays the data correctly'
\echo '3. Run: npm run dev  to start the development server'
\echo ''
\echo '================================================================================'
