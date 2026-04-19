'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Filter, ChevronRight, AlertCircle } from 'lucide-react';

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
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-purple-100 text-purple-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800'
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
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch('/api/admin/scoring/workflows?limit=100', {
        headers
      });

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Workflows de Scoring</h1>
          <p className="text-gray-600 mt-2">Gestion des évaluations en cours et approuvées</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-3xl font-bold text-gray-900">{workflows.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600">En revue</p>
            <p className="text-3xl font-bold text-yellow-600">
              {workflows.filter(w => w.status === 'UNDER_REVIEW').length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600">En attente d'approbation</p>
            <p className="text-3xl font-bold text-blue-600">{pendingApprovals}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Approuvées</p>
            <p className="text-3xl font-bold text-green-600">
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
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un projet ou analyste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
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
            <p className="text-gray-600 mt-4">Chargement des workflows...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Erreur</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">Aucun workflow trouvé</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <Link
                key={workflow.id}
                href={`/workflows/${workflow.id}`}
                className="group block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
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
                        <p className="text-gray-600">Analyste</p>
                        <p className="font-medium text-gray-900">
                          {workflow.evaluation?.analyst?.prenom} {workflow.evaluation?.analyst?.nom}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Étape actuelle</p>
                        <p className="font-medium text-gray-900">{workflow.currentStep}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Score</p>
                        <p className="font-medium text-gray-900">
                          {workflow.evaluation?.finalScore?.toFixed(1) || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Créée le</p>
                        <p className="font-medium text-gray-900">
                          {new Date(workflow.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
