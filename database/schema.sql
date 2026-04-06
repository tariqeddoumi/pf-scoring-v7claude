-- PF Scoring V7++ - Supabase PostgreSQL Schema
-- Complete database setup for Project Finance Scoring Application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users & Authentication
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'analyst',
  department VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients (Signataire)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id VARCHAR(50) UNIQUE NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255),
  type VARCHAR(100),
  legal_form VARCHAR(100),
  sector VARCHAR(100),
  sub_sector VARCHAR(255),
  country VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  postal_code VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  business_center VARCHAR(255),
  account_manager VARCHAR(255),
  segment VARCHAR(100),
  employees INT,
  capital_amount BIGINT,
  rating VARCHAR(10),
  banking_status VARCHAR(100),
  relationship_start_date DATE,
  exposure BIGINT,
  kyc_status VARCHAR(100),
  kyc_last_update DATE,
  compliance_status VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects (12 sections: identification, localisation, stakeholders, technical,
-- calendar, financing, revenue, construction, exploitation, legal, ESG, guarantees)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sponsor_id UUID REFERENCES public.clients(id),
  client_id UUID REFERENCES public.clients(id),
  sector VARCHAR(100),
  country VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  site_address TEXT,
  coordinates VARCHAR(100),
  description TEXT,
  spv_name VARCHAR(255),
  spv_jurisdiction VARCHAR(100),
  -- Stakeholders
  epc_contractor VARCHAR(255),
  om_operator VARCHAR(255),
  off_taker VARCHAR(255),
  legal_advisor VARCHAR(255),
  technical_advisor VARCHAR(255),
  insurance_advisor VARCHAR(255),
  -- Technical
  technology VARCHAR(255),
  capacity DECIMAL(10,2),
  capacity_unit VARCHAR(50),
  availability_target DECIMAL(5,2),
  design_life INT DEFAULT 25,
  -- Calendar
  construction_start DATE,
  construction_end DATE,
  cod_date DATE,
  concession_end DATE,
  construction_duration INT,
  operational_duration INT DEFAULT 25,
  -- Financing
  cost BIGINT,
  equity_amount BIGINT,
  equity_ratio DECIMAL(5,2),
  debt_amount BIGINT,
  financing_amount BIGINT,
  interest_rate DECIMAL(5,2),
  tenor_years INT,
  grace_period INT,
  dscr DECIMAL(5,3),
  llcr DECIMAL(5,3),
  leverage DECIMAL(5,2),
  -- Revenue/Contracts
  ppa_type VARCHAR(50),
  ppa_tenor INT,
  ppa_price DECIMAL(12,6),
  tariff_escalation DECIMAL(5,2),
  contract_status VARCHAR(50),
  -- Construction
  epc_contract_type VARCHAR(50),
  epc_amount BIGINT,
  epc_guarantees TEXT,
  completion_guarantee BOOLEAN DEFAULT FALSE,
  liquidated_damages BOOLEAN DEFAULT FALSE,
  performance_bond DECIMAL(5,2),
  -- Exploitation
  om_contract_type VARCHAR(50),
  om_duration INT,
  om_cost_annual BIGINT,
  major_maintenance_reserve BIGINT,
  insurance_coverage TEXT,
  -- Legal
  governing_law VARCHAR(100),
  arbitration VARCHAR(100),
  security_package TEXT,
  step_in_rights BOOLEAN DEFAULT FALSE,
  assignment_rights BOOLEAN DEFAULT FALSE,
  -- ESG
  esg_category VARCHAR(10),
  environmental_impact VARCHAR(50),
  social_impact VARCHAR(50),
  climate_risk VARCHAR(50),
  carbon_reduction DECIMAL(12,2),
  community_benefits TEXT,
  -- Guarantees
  collateral_type VARCHAR(50),
  pledge_assets TEXT,
  guarantee_amount BIGINT,
  reserve_accounts TEXT,
  insurance_assignment BOOLEAN DEFAULT FALSE,
  -- Meta
  status VARCHAR(50) DEFAULT 'brouillon' CHECK (status IN ('brouillon','en_cours','en_revue','approuve','rejete')),
  rating VARCHAR(10),
  score DECIMAL(4,2),
  financial_close_date DATE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Evaluations
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  type VARCHAR(50),
  analyst_id UUID REFERENCES public.users(id),
  analyst_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'brouillon' CHECK (status IN ('brouillon','soumis','valide','rejete')),
  score DECIMAL(4,2),
  rating VARCHAR(10),
  pd_min DECIMAL(5,3),
  pd_max DECIMAL(5,3),
  recommendation VARCHAR(255),
  no_go_triggered BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP,
  submitted_by UUID REFERENCES public.users(id),
  validated_at TIMESTAMP,
  validated_by UUID REFERENCES public.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scoring Responses (Criteria answers)
CREATE TABLE IF NOT EXISTS public.scoring_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE,
  criteria_id VARCHAR(50) NOT NULL,
  response_value VARCHAR(255),
  numeric_value DECIMAL(12,6),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Domain Scores
CREATE TABLE IF NOT EXISTS public.domain_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE,
  domain_id VARCHAR(10),
  domain_name VARCHAR(255),
  score DECIMAL(4,2),
  weight DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id VARCHAR(50) UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  type VARCHAR(50),
  severity VARCHAR(50),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id),
  user_name VARCHAR(255),
  action VARCHAR(255),
  module VARCHAR(50),
  severity VARCHAR(50),
  entity_id VARCHAR(50),
  entity_name VARCHAR(255),
  details TEXT,
  changes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments & Discussions
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id VARCHAR(50) UNIQUE NOT NULL,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id),
  author_name VARCHAR(255),
  content TEXT,
  mentions TEXT[],
  parent_comment_id UUID REFERENCES public.comments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved Filters
CREATE TABLE IF NOT EXISTS public.saved_filters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  filter_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring Data (Post-close)
CREATE TABLE IF NOT EXISTS public.monitoring_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) NOT NULL,
  reporting_date DATE NOT NULL,
  dscr DECIMAL(5,3),
  equity_ratio DECIMAL(5,2),
  leverage DECIMAL(5,2),
  ebitda BIGINT,
  total_debt BIGINT,
  cash_reserve BIGINT,
  covenant_status JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, reporting_date)
);

-- Indexes for Performance
CREATE INDEX idx_projects_sector ON public.projects(sector);
CREATE INDEX idx_projects_country ON public.projects(country);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_evaluations_project ON public.evaluations(project_id);
CREATE INDEX idx_evaluations_status ON public.evaluations(status);
CREATE INDEX idx_evaluations_analyst ON public.evaluations(analyst_id);
CREATE INDEX idx_scoring_responses_evaluation ON public.scoring_responses(evaluation_id);
CREATE INDEX idx_domain_scores_evaluation ON public.domain_scores(evaluation_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX idx_alerts_project ON public.alerts(project_id);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_comments_evaluation ON public.comments(evaluation_id);
CREATE INDEX idx_monitoring_project ON public.monitoring_data(project_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view their own data and public data
CREATE POLICY users_view_self ON public.users
  FOR SELECT USING (auth.uid() = id OR role = 'viewer');

CREATE POLICY users_update_self ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies - Projects and Evaluations (role-based)
CREATE POLICY projects_view_all ON public.projects
  FOR SELECT USING (true);

CREATE POLICY projects_insert_analyst ON public.projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('analyst', 'manager', 'admin')
    )
  );

CREATE POLICY evaluations_view_all ON public.evaluations
  FOR SELECT USING (true);

CREATE POLICY evaluations_insert ON public.evaluations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('analyst', 'manager', 'admin')
    )
  );

-- Triggers for audit logging
CREATE OR REPLACE FUNCTION log_evaluation_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    log_id, user_id, user_name, action, module, severity,
    entity_id, entity_name, details, created_at
  ) VALUES (
    'audit_' || gen_random_uuid()::text,
    auth.uid(),
    'Current User',
    CASE WHEN TG_OP = 'INSERT' THEN 'Created'
         WHEN TG_OP = 'UPDATE' THEN 'Modified'
         WHEN TG_OP = 'DELETE' THEN 'Deleted'
    END,
    'evaluation',
    'info',
    NEW.id::text,
    NEW.evaluation_id,
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    ),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evaluation_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.evaluations
FOR EACH ROW EXECUTE FUNCTION log_evaluation_change();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT INSERT, UPDATE ON public.evaluations TO authenticated;
GRANT INSERT, UPDATE ON public.projects TO authenticated;
GRANT INSERT, UPDATE ON public.comments TO authenticated;

-- Seed initial data (optional - can be run separately)
-- INSERT INTO public.users (email, name, role, department) VALUES
-- ('admin@pfscoring.ma', 'Administrator', 'admin', 'IT'),
-- ('analyst@pfscoring.ma', 'Analyst', 'analyst', 'Risk');
