"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@/lib/hooks/useApi";
import { DataTable } from "@/components/crud/DataTable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormBuilder } from "@/components/crud/FormBuilder";
import { createClientSchema } from "@/lib/validation-schemas";

interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  secteur?: string;
  pays?: string;
  type?: string;
  status: string;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    mutate: createClient,
    loading: creatingClient,
    error: createError,
  } = useMutation("/api/clients", "POST");
  const [open, setOpen] = useState(false);

  // Load clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch clients");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (formData: any) => {
    try {
      await createClient(formData);
      setOpen(false);
      await fetchClients();
    } catch (err: unknown) {
      // Error handling via mutation error state
    }
  };

  const columns: Array<{
    key: keyof Client;
    label: string;
    render?: (value: any) => React.ReactNode;
  }> = [
    { key: "nom", label: "Client Name" },
    { key: "email", label: "Email" },
    { key: "telephone", label: "Phone" },
    { key: "secteur", label: "Sector" },
    { key: "pays", label: "Country" },
    {
      key: "type",
      label: "Type",
      render: (value: string | undefined) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
          {value || "Entreprise"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded text-sm font-medium ${
            value === "Actif"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage project clients</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription>
                Add a new client to the system
              </DialogDescription>
            </DialogHeader>
            <FormBuilder
              schema={createClientSchema}
              fields={[
                {
                  name: "nom",
                  label: "Client Name",
                  type: "text",
                  placeholder: "Company name",
                  required: true,
                },
                {
                  name: "email",
                  label: "Email",
                  type: "email",
                  placeholder: "contact@company.com",
                },
                {
                  name: "telephone",
                  label: "Phone",
                  type: "text",
                  placeholder: "+212 6 XX XX XX XX",
                },
                {
                  name: "secteur",
                  label: "Sector",
                  type: "text",
                  placeholder: "e.g., Agriculture, Energy",
                },
                {
                  name: "pays",
                  label: "Country",
                  type: "text",
                  placeholder: "e.g., Morocco",
                },
                {
                  name: "type",
                  label: "Client Type",
                  type: "select",
                  options: [
                    { label: "Entreprise", value: "Entreprise" },
                    { label: "PME", value: "PME" },
                    { label: "TPME", value: "TPME" },
                    { label: "Start-up", value: "Start-up" },
                    { label: "Gouvernement", value: "Gouvernement" },
                  ],
                  defaultValue: "Entreprise",
                },
                {
                  name: "description",
                  label: "Description",
                  type: "textarea",
                  placeholder: "Client description",
                },
              ]}
              onSubmit={handleCreateClient}
              submitLabel="Create Client"
              loading={creatingClient}
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
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Total Clients</p>
          <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {clients.filter((c: any) => c.status === "Actif").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-sm">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">
            {clients.filter((c: any) => c.status !== "Actif").length}
          </p>
        </div>
      </div>

      <DataTable
        data={clients}
        columns={columns}
        loading={loading}
        emptyMessage="No clients found"
      />
    </div>
  );
}
