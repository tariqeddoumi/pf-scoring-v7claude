"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: string;
  projectId?: string;
  utilisateurId: string;
  action: string;
  details: string;
  timestamp: Date;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch("/api/audit");
        const data = await res.json();
        setLogs(
          data.map((log: Record<string, unknown>) => ({
            ...log,
            timestamp: new Date(log.timestamp as string),
          })) as AuditLog[]
        );
      } catch {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Journal d&apos;audit</h1>
        <p className="mt-2 text-muted-foreground">
          Historique complet des modifications et actions
        </p>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </Card>
      ) : logs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucun enregistrement d&apos;audit
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-semibold capitalize">
                    {log.action}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.utilisateurId}
                  </TableCell>
                  <TableCell className="text-sm">{log.details}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.projectId || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(log.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
