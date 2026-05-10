"use client";

import React, { useState } from "react";
import { useUsers, useMutation } from "@/lib/hooks/useApi";
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
import { createUserSchema } from "@/lib/validation-schemas";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { data, loading, error, execute } = useUsers(1, 50);
  const {
    mutate: createUser,
    loading: creatingUser,
    error: createError,
  } = useMutation("/api/users", "POST");
  const [open, setOpen] = useState(false);

  const users: User[] = data?.data || [];

  const handleCreateUser = async (formData: any) => {
    try {
      await createUser(formData);
      setOpen(false);
      await execute();
    } catch (err: unknown) {
      // Error handling
    }
  };

  interface User {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    createdAt: string;
  }

  const columns: Array<{
    key: keyof User;
    label: string;
    render?: (value: any) => React.ReactNode;
  }> = [
    { key: "email", label: "Email" },
    { key: "nom", label: "Last Name" },
    { key: "prenom", label: "First Name" },
    {
      key: "role",
      label: "Role",
      render: (value: string) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
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
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-1">
            Manage system users and their roles
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            <FormBuilder
              schema={createUserSchema}
              fields={[
                {
                  name: "email",
                  label: "Email",
                  type: "email",
                  placeholder: "user@example.com",
                },
                {
                  name: "prenom",
                  label: "First Name",
                  type: "text",
                  placeholder: "John",
                },
                {
                  name: "nom",
                  label: "Last Name",
                  type: "text",
                  placeholder: "Doe",
                },
                {
                  name: "password",
                  label: "Password",
                  type: "password",
                  placeholder: "Min 8 characters",
                },
                {
                  name: "role",
                  label: "Role",
                  type: "select",
                  options: [
                    { label: "Super Admin", value: "system_admin" },
                    { label: "Admin Scoring", value: "scoring_admin" },
                    { label: "Gestionnaire Risque", value: "risk_manager" },
                    { label: "Membre Comité", value: "committee_member" },
                    { label: "Analyste Risque", value: "risk_analyst" },
                    { label: "Auditeur", value: "auditor" },
                    { label: "Lecture seule", value: "read_only" },
                  ],
                  defaultValue: "risk_analyst",
                },
              ]}
              onSubmit={handleCreateUser}
              submitLabel="Create User"
              loading={creatingUser}
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

      <DataTable
        data={users}
        columns={columns}
        loading={loading}
        emptyMessage="No users found"
      />
    </div>
  );
}
