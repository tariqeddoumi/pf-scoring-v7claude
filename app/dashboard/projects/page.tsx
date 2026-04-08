'use client';

import React, { useState } from 'react';
import { useProjects, useMutation } from '@/lib/hooks/useApi';
import { DataTable } from '@/components/crud/DataTable';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormBuilder } from '@/components/crud/FormBuilder';
import { createProjectSchema } from '@/lib/validation-schemas';

interface Project {
  id: string;
  nom: string;
  secteur: string;
  montant: number;
  status: string;
  scoreGlobal: number | null;
  client?: { id: string; nom: string; email?: string } | null;
}

export default function ProjectsPage() {
  const { data, loading, error, execute } = useProjects(1, 50);
  const { mutate: createProject, loading: creatingProject, error: createError } = useMutation(
    '/api/projects',
    'POST'
  );
  const [open, setOpen] = useState(false);

  const projects: Project[] = data?.data || [];

  const handleCreateProject = async (formData: any) => {
    try {
      await createProject(formData);
      setOpen(false);
      await execute();
    } catch (err: unknown) {
      // Error handling
    }
  };

  const columns: Array<{ key: keyof Project; label: string; render?: (value: any) => React.ReactNode }> = [
    { key: 'nom', label: 'Project Name' },
    { key: 'secteur', label: 'Sector' },
    {
      key: 'client',
      label: 'Client',
      render: (value: Project['client']) => value?.nom || '-',
    },
    {
      key: 'montant',
      label: 'Amount (MAD)',
      render: (value: number) => new Intl.NumberFormat('fr-MA', {
        style: 'currency',
        currency: 'MAD'
      }).format(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const colors: Record<string, string> = {
          brouillon: 'bg-gray-100 text-gray-800',
          en_cours: 'bg-blue-100 text-blue-800',
          en_revue: 'bg-yellow-100 text-yellow-800',
          approuve: 'bg-green-100 text-green-800',
          rejete: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded text-sm font-medium ${colors[value] || colors.brouillon}`}>
            {value}
          </span>
        );
      },
    },
    {
      key: 'scoreGlobal',
      label: 'Score',
      render: (value: number | null) => value ? `${value.toFixed(1)}/10` : '-',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">Manage and track project evaluations</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Add a new project to the system
              </DialogDescription>
            </DialogHeader>
            <FormBuilder
              schema={createProjectSchema}
              fields={[
                { name: 'nom', label: 'Project Name', type: 'text', placeholder: 'Project name' },
                { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Project description' },
                { name: 'secteur', label: 'Sector', type: 'text', placeholder: 'e.g., Infrastructure' },
                { name: 'montant', label: 'Amount (MAD)', type: 'number', placeholder: '0' },
                {
                  name: 'countryCode',
                  label: 'Country',
                  type: 'select',
                  options: [
                    { label: 'Morocco (MA)', value: 'MA' },
                    { label: 'Senegal (SN)', value: 'SN' },
                    { label: 'Tunisia (TN)', value: 'TN' },
                  ],
                  defaultValue: 'MA',
                },
              ]}
              onSubmit={handleCreateProject}
              submitLabel="Create Project"
              loading={creatingProject}
              error={createError || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Total Projects</p>
          <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">In Review</p>
          <p className="text-2xl font-bold text-yellow-600">
            {projects.filter((p: any) => p.status === 'en_revue').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Approved</p>
          <p className="text-2xl font-bold text-green-600">
            {projects.filter((p: any) => p.status === 'approuve').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Rejected</p>
          <p className="text-2xl font-bold text-red-600">
            {projects.filter((p: any) => p.status === 'rejete').length}
          </p>
        </div>
      </div>

      <DataTable
        data={projects}
        columns={columns}
        loading={loading}
        emptyMessage="No projects found"
      />
    </div>
  );
}
