-- Fix SECURITY DEFINER views - remove the SECURITY DEFINER flag
-- SECURITY DEFINER views allow bypassing RLS, which is a security risk
-- These views should be fixed to use proper RLS policies instead

-- Recreate views without SECURITY DEFINER to respect RLS

-- 1. v_facilities_details view
DROP VIEW IF EXISTS "public"."v_facilities_details" CASCADE;

CREATE VIEW "public"."v_facilities_details" AS
SELECT
  cf.id,
  cf.reference,
  cf.label,
  cf.status,
  cf.created_at,
  cf.updated_at,
  cf.facility_type_id,
  cf.client_id,
  cf.currency,
  cf.facility_amount,
  cf.tenor,
  cf.rate,
  cf.spread,
  cf.fees,
  cf.financial_advisor,
  cf.currency_code
FROM credit_facilities cf;

-- 2. v_pf_dashboard view
DROP VIEW IF EXISTS "public"."v_pf_dashboard" CASCADE;

CREATE VIEW "public"."v_pf_dashboard" AS
SELECT
  p.id,
  p.reference,
  p.label,
  p.status,
  p.created_at,
  p.updated_at,
  COUNT(DISTINCT cf.id) as facility_count,
  COALESCE(SUM(cf.facility_amount), 0) as total_facility_amount,
  COUNT(DISTINCT e.id) as evaluation_count
FROM "BP_PF_projects" p
LEFT JOIN credit_facilities cf ON cf.client_id = p.client_id
LEFT JOIN "BP_PF_evaluations" e ON e.project_id = p.id
GROUP BY p.id, p.reference, p.label, p.status, p.created_at, p.updated_at;

-- 3. v_facility_outstanding view
DROP VIEW IF EXISTS "public"."v_facility_outstanding" CASCADE;

CREATE VIEW "public"."v_facility_outstanding" AS
SELECT
  cf.id,
  cf.reference,
  cf.label,
  cf.facility_amount,
  cf.status,
  cf.created_at,
  cf.updated_at,
  COALESCE(SUM(fcf.amount), 0) as outstanding_amount,
  (cf.facility_amount - COALESCE(SUM(fcf.amount), 0)) as remaining_amount
FROM credit_facilities cf
LEFT JOIN facility_cashflows fcf ON fcf.facility_id = cf.id AND fcf.paid = true
GROUP BY cf.id, cf.reference, cf.label, cf.facility_amount, cf.status, cf.created_at, cf.updated_at;

-- Enable RLS on these views (optional, as views don't have RLS directly)
-- The underlying tables have RLS enabled, so access will be controlled through them
