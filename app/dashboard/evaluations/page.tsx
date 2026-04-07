'use client';

import React, { useState } from 'react';
import { useEvaluations, useMutation } from '@/lib/hooks/useApi';
import { DataTable } from '@/components/crud/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormBuilder } from '@/components/crud/FormBuilder';
import { createEvaluationSchema } from '@/lib/validation-schemas';

export default function EvaluationsPage() {
  const { data, loading, error, execute } = useEvaluations(1, 50);
  const { mutate: createEval, loading: creating, error: createError } = useMutation(
    '/api/evaluations',
    'POST'
  );
  const [open, setOpen] = useState(false);

  const evaluations = data?.data || [];

  const handleCreateEvaluation = async (formData: any) => {
    try {
      await createEval(formData);
      setOpen(false);
      await execute();
    } catch (err: unknown) {
      // Error handling
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valide':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejete':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'soumis':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const columns = [
    {
      key: 'projectId' as const,
      label: 'Project',
      render: (value: string) => value.substring(0, 8) + '...',
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <span className="capitalize">{value}</span>
        </div>
      ),
    },
    {
      key: 'finalScore' as const,
      label: 'Score',
      render: (value: number | null) => value ? `${value.toFixed(1)}/10` : '-',
    },
    {
      key: 'rating' as const,
      label: 'Rating',
      render: (value: string | null) => value || '-',
    },
    {
      key: 'createdAt' as const,
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const statusCounts = {
    brouillon: evaluations.filter((e: any) => e.status === 'brouillon').length,
    soumis: evaluations.filter((e: any) => e.status === 'soumis').length,
    valide: evaluations.filter((e: any) => e.status === 'valide').length,
    rejete: evaluations.filter((e: any) => e.status === 'rejete').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Evaluations</h1>
          <p className="text-gray-600 mt-1">Manage project evaluations and workflow</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Evaluation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Evaluation</DialogTitle>
              <DialogDescription>
                Start a new project evaluation
              </DialogDescription>
            </DialogHeader>
            <FormBuilder
              schema={createEvaluationSchema}
              fields={[
                {
                  name: 'projectId',
                  label: 'Project ID',
                  type: 'text',
                  placeholder: 'Select a project',
                },
                {
                  name: 'finalScore',
                  label: 'Initial Score',
                  type: 'number',
                  placeholder: '0-10',
                },
              ]}
              onSubmit={handleCreateEvaluation}
              submitLabel="Create Evaluation"
              loading={creating}
              error={createError}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Workflow Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Draft</p>
          <p className="text-2xl font-bold text-gray-900">{statusCounts.brouillon}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Submitted</p>
          <p className="text-2xl font-bold text-yellow-600">{statusCounts.soumis}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Validated</p>
          <p className="text-2xl font-bold text-green-600">{statusCounts.valide}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-600">{statusCounts.rejete}</p>
        </div>
      </div>

      {/* Evaluation Workflow */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evaluation Workflow</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center">
            <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold">1</div>
            <span className="ml-2">Create (Draft)</span>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex items-center">
            <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center font-bold">2</div>
            <span className="ml-2">Submit</span>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-white">3</div>
            <span className="ml-2">Validate (Manager)</span>
          </div>
          <div className="text-gray-400">→</div>
          <div className="flex items-center">
            <div className="bg-green-500 rounded-full w-8 h-8 flex items-center justify-center font-bold text-white">✓</div>
            <span className="ml-2">Approved</span>
          </div>
        </div>
      </div>

      <DataTable
        data={evaluations}
        columns={columns}
        loading={loading}
        emptyMessage="No evaluations found"
      />
    </div>
  );
}
