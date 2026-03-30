"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

const ROLES = [
  { value: "admin", label: "Administrateur" },
  { value: "manager", label: "Gestionnaire" },
  { value: "analyste", label: "Analyste" },
  { value: "lecteur", label: "Lecteur" },
];

export default function UsersPage() {
  const [users] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");

  const handleAddUser = async () => {
    if (!newUserEmail) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newUserEmail }),
      });

      if (res.ok) {
        setNewUserEmail("");
        alert("Utilisateur ajouté avec succès");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'ajout de l'utilisateur");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
            <p className="mt-2 text-muted-foreground">
              Gérez les utilisateurs et assignez les rôles
            </p>
          </div>
        </div>

        {/* Add User */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4">Ajouter un Nouvel Utilisateur</h2>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Adresse e-mail"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddUser}>Ajouter</Button>
          </div>
        </Card>

        {/* Users List */}
        <Card className="p-6">
          <h2 className="font-semibold mb-4 text-lg">Utilisateurs Existants</h2>

          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucun utilisateur configuré</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {user.prenom} {user.nom}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <select
                    value={user.role}
                    onChange={(e) => {
                      // Update role
                    }}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Role Reference */}
        <Card className="mt-6 p-6 bg-secondary/50">
          <h3 className="font-semibold mb-3 text-sm">Référence des Rôles</h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="font-medium text-foreground">Administrateur</p>
              <p className="text-muted-foreground">Accès complet à tous les paramètres</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Gestionnaire</p>
              <p className="text-muted-foreground">
                Gestion des projets et des utilisateurs
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Analyste</p>
              <p className="text-muted-foreground">
                Créer et évaluer les projets
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Lecteur</p>
              <p className="text-muted-foreground">Consultez les projets en lecture seule</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Link href="/admin">
            <Button variant="outline">Retour</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
