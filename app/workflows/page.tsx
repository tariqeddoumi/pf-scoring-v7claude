'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import { apiGet } from '@/lib/api-client';

interface Workflow {
  id: string;
  evaluationId: string;
  status: string;
  currentStep: number;
  evaluation?: {
    project?: { nom: string };
    analyst?: { prenom: string; nom: string };
    finalScore?: number;
  };
  steps?: Array<{ stepNumber: number; status: string }>;
  approvals?: Array<{ status: string }>;
  createdAt: string;
}

const statusColor = {
  DRAFT: 'bg-muted text-foreground',
  SUBMITTED: 'bg-primary/10 text-blue-800',
  UNDER_REVIEW: 'bg-warning/10 text-warning',
  REVIEWED: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-destructive/10 text-destructive'
};

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    filterWorkflows();
  }, [workflows, searchQuery, statusFilter]);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const response = await apiGet('/api/admin/scoring/workflows?limit=100');

      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }

      const data = await response.json();
      if (data.success) {
        setWorkflows(data.data);
      } else {
        setError(data.error || 'Failed to fetch workflows');
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError('Erreur lors du chargement des workflows');
    } finally {
      setIsLoading(false);
    }
  };

  const filterWorkflows = () => {
    let filtered = workflows;

    if (statusFilter) {
      filtered = filtered.filter(w => w.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w =>
        w.evaluation?.project?.nom?.toLowerCase().includes(query) ||
        w.evaluation?.analyst?.nom?.toLowerCase().includes(query) ||
        w.id.toLowerCase().includes(query)
      );
    }

    setFilteredWorkflows(filtered);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Brouillon',
      SUBMITTED: 'Soumis',
      UNDER_REVIEW: 'En revue',
      REVIEWED: 'Examiné',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté'
    };
    return labels[status] || status;
  };

  const pendingApprovals = workflows.filter(w =>
    w.approvals?.some(a => a.status === 'PENDING')
  ).length;

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-foreground">Workflows de Scoring</h1>
          <p className="text-secondary-foreground mt-2">Gestion des évaluations en cours et approuvées</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-border">
            <p className="text-sm font-medium text-secondary-foreground">Total</p>
            <p className="text-3xl font-bold text-foreground">{workflows.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-border">
            <p className="text-sm font-medium text-secondary-foreground">En revue</p>
            <p className="text-3xl font-bold text-warning">
              {workflows.filter(w => w.status === 'UNDER_REVIEW').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-border">
            <p className="text-sm font-medium text-secondary-foreground">En attente d'approbation</p>
            <p className="text-3xl font-bold text-primary">{pendingApprovals}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-border">
            <p className="text-sm font-medium text-secondary-foreground">Approuvées</p>
            <p className="text-3xl font-bold text-success">
              {workflows.filter(w => w.status === 'APPROVED').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un projet ou analyste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="DRAFT">Brouillon</option>
              <option value="SUBMITTED">Soumis</option>
              <option value="UNDER_REVIEW">En revue</option>
              <option value="REVIEWED">Examiné</option>
              <option value="APPROVED">Approuvé</option>
              <option value="REJECTED">Rejeté</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-secondary-foreground mt-4">Chargement des workflows...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Erreur</h3>
              <p className="text-destructive text-sm">{error}</p>
            </div>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-border">
            <p className="text-muted-foreground">Aucun workflow trouvé</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className="group block bg-white border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                        {workflow.evaluation?.project?.nom || 'Projet sans nom'}
                      </h3>
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
                        statusColor[workflow.status as keyof typeof statusColor]
                      }`}>
                        {getStatusLabel(workflow.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-secondary-foreground">Analyste</p>
                        <p className="font-medium text-foreground">
                          {workflow.evaluation?.analyst?.prenom} {workflow.evaluation?.analyst?.nom}
                        </p>
                      </div>
                      <div>
                        <p className="text-secondary-foreground">Étape actuelle</p>
                        <p className="font-medium text-foreground">{workflow.currentStep}</p>
                      </div>
                      <div>
                        <p className="text-secondary-foreground">Score</p>
                        <p className="font-medium text-foreground">
                          {workflow.evaluation?.finalScore?.toFixed(1) || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-secondary-foreground">Créée le</p>
                        <p className="font-medium text-foreground">
                          {new Date(workflow.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
