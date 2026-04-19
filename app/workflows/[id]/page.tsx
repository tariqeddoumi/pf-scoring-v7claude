import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import Link from 'next/link';
import { WorkflowTimeline } from '@/components/scoring/WorkflowTimeline';
import { WorkflowDecisionPanel } from '@/components/scoring/WorkflowDecisionPanel';
import { WorkflowCommentThread } from '@/components/scoring/WorkflowCommentThread';
import { DocumentUploadPanel } from '@/components/scoring/DocumentUploadPanel';
import { OverrideManagement } from '@/components/scoring/OverrideManagement';

interface WorkflowPageProps {
  params: Promise<{ id: string }>;
}

async function getWorkflowData(workflowId: string) {
  try {
    const token = process.env.INTERNAL_API_TOKEN;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/scoring/workflows/${workflowId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch workflow');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch workflow');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return null;
  }
}

async function getEvaluationNodes(evaluationId: string) {
  try {
    const token = process.env.INTERNAL_API_TOKEN;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/scoring/nodes?evaluationId=${evaluationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        next: { revalidate: 0 }
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.success ? data.data : [];
  } catch (error) {
    console.error('Error fetching nodes:', error);
    return [];
  }
}

function WorkflowHeader({ workflow }: { workflow: any }) {
  const statusColor = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SUBMITTED: 'bg-blue-100 text-blue-800',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
    REVIEWED: 'bg-purple-100 text-purple-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Workflow de Scoring
          </h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Statut</p>
            <span className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-medium ${
              statusColor[workflow.status as keyof typeof statusColor]
            }`}>
              {workflow.status === 'DRAFT' && 'Brouillon'}
              {workflow.status === 'SUBMITTED' && 'Soumis'}
              {workflow.status === 'UNDER_REVIEW' && 'En revue'}
              {workflow.status === 'REVIEWED' && 'Examiné'}
              {workflow.status === 'APPROVED' && 'Approuvé'}
              {workflow.status === 'REJECTED' && 'Rejeté'}
            </span>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Étape actuelle</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{workflow.currentStep}</p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Projet</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {workflow.evaluation?.project?.nom}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 uppercase">Analyste</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {workflow.evaluation?.analyst?.prenom} {workflow.evaluation?.analyst?.nom}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = await params;
  const workflow = await getWorkflowData(id);

  if (!workflow) {
    notFound();
  }

  const nodes = await getEvaluationNodes(workflow.evaluation?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <WorkflowHeader workflow={workflow} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Workflow Timeline */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Progression du Workflow
              </h2>
              <WorkflowTimeline
                steps={workflow.steps}
                currentStep={workflow.currentStep}
                status={workflow.status}
              />
            </section>

            {/* Comments Thread */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader className="w-6 h-6 animate-spin" /></div>}>
                <WorkflowCommentThread
                  comments={workflow.comments || []}
                  onAddComment={async (content, type, isInternal) => {
                    'use server';
                    // Comment submission will be handled by client component
                  }}
                />
              </Suspense>
            </section>

            {/* Documents */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader className="w-6 h-6 animate-spin" /></div>}>
                <DocumentUploadPanel
                  evaluationId={workflow.evaluation?.id}
                  onUpload={async (data) => {
                    'use server';
                    // Upload will be handled by client component
                  }}
                  existingDocuments={[]}
                />
              </Suspense>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Decision Panel */}
            {workflow.status !== 'APPROVED' && workflow.status !== 'REJECTED' && (
              <section className="bg-white rounded-lg border border-gray-200 p-6">
                <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader className="w-6 h-6 animate-spin" /></div>}>
                  <WorkflowDecisionPanel
                    workflowId={id}
                    onSubmit={async (data) => {
                      'use server';
                      // Decision submission will be handled by client component
                    }}
                  />
                </Suspense>
              </section>
            )}

            {/* Approvals Status */}
            {workflow.approvals && workflow.approvals.length > 0 && (
              <section className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Approbations ({workflow.approvals.length})
                </h3>
                <div className="space-y-3">
                  {workflow.approvals.map((approval: any) => (
                    <div key={approval.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {approval.approvalType}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          approval.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          approval.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          approval.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {approval.status}
                        </span>
                      </div>
                      {approval.dueDate && (
                        <p className="text-xs text-gray-600">
                          Échéance: {new Date(approval.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Score Overrides */}
            <section className="bg-white rounded-lg border border-gray-200 p-6">
              <Suspense fallback={<div className="flex items-center justify-center h-32"><Loader className="w-6 h-6 animate-spin" /></div>}>
                <OverrideManagement
                  evaluationId={workflow.evaluation?.id}
                  overrides={[]}
                  nodes={nodes.map((n: any) => ({
                    id: n.id,
                    label: n.label,
                    code: n.code
                  }))}
                />
              </Suspense>
            </section>

            {/* Evaluation Summary */}
            {workflow.evaluation && (
              <section className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Résumé d'évaluation
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-600">Score final</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {workflow.evaluation.finalScore?.toFixed(1) || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">Note de rating</p>
                    <p className="text-lg font-bold text-gray-900">
                      {workflow.evaluation.rating || '-'}
                    </p>
                  </div>
                  {workflow.evaluation.recommendation && (
                    <div>
                      <p className="text-xs font-medium text-gray-600">Recommandation</p>
                      <p className="text-sm text-gray-700">{workflow.evaluation.recommendation}</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
