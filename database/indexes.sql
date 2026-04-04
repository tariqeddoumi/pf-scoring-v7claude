-- Performance Indexes for PF Scoring

-- Evaluations
CREATE INDEX idx_evaluations_project_id ON public.evaluations(project_id);
CREATE INDEX idx_evaluations_status ON public.evaluations(status);
CREATE INDEX idx_evaluations_created_at ON public.evaluations(created_at DESC);

-- Projects
CREATE INDEX idx_projects_sector ON public.projects(sector);
CREATE INDEX idx_projects_status ON public.projects(status);

-- Clients
CREATE INDEX idx_clients_sector ON public.clients(sector);
CREATE INDEX idx_clients_rating ON public.clients(rating);

-- Audit Logs
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_module ON public.audit_logs(module);

-- Comments
CREATE INDEX idx_comments_evaluation_id ON public.comments(evaluation_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);

-- Scoring Responses
CREATE INDEX idx_scoring_responses_evaluation_id ON public.scoring_responses(evaluation_id);

-- Domain Scores
CREATE INDEX idx_domain_scores_evaluation_id ON public.domain_scores(evaluation_id);

-- Composite indexes for common queries
CREATE INDEX idx_evaluations_project_status ON public.evaluations(project_id, status);
CREATE INDEX idx_domain_scores_eval_domain ON public.domain_scores(evaluation_id, domain_id);

-- Full text search
CREATE INDEX idx_clients_search ON public.clients USING GIN (
  to_tsvector('french', coalesce(legal_name, '') || ' ' || coalesce(trade_name, ''))
);

CREATE INDEX idx_projects_search ON public.projects USING GIN (
  to_tsvector('french', coalesce(name, '') || ' ' || coalesce(description, ''))
);
