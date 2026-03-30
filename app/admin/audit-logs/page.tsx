"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AuditEntry {
  id: string;
  action: string;
  details: string;
  utilisateurId: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) =>
    log.action.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Journal d'Audit</h1>
            <p className="mt-2 text-muted-foreground">
              Consultez l'historique complet des modifications système
            </p>
          </div>
        </div>

        {/* Filter */}
        <Card className="mb-6 p-4">
          <Input
            placeholder="Rechercher une action..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </Card>

        {/* Logs Table */}
        <Card className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold">Action</th>
                <th className="text-left py-3 px-4 font-semibold">Détails</th>
                <th className="text-left py-3 px-4 font-semibold">Utilisateur</th>
                <th className="text-left py-3 px-4 font-semibold">Date/Heure</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    Aucun enregistrement trouvé
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 font-medium">{log.action}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-xs">{log.utilisateurId}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Button onClick={fetchAuditLogs} variant="outline">
            Actualiser
          </Button>
          <Link href="/admin">
            <Button variant="outline">Retour</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
