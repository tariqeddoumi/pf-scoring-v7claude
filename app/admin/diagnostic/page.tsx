"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface DiagnosticTest {
  name: string;
  status: "success" | "warning" | "error" | "pending";
  message: string;
  details?: Record<string, unknown>;
}

interface EnvironmentVar {
  name: string;
  defined: boolean;
  value?: string;
}

interface DiagnosticResponse {
  success: boolean;
  tests: DiagnosticTest[];
  environment: EnvironmentVar[];
  timestamp: string;
}

export default function DiagnosticPage() {
  const router = useRouter();
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [envVars, setEnvVars] = useState<EnvironmentVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/diagnostic/full");
      const data = await response.json();

      if (response.status === 401) {
        setError("Authentification requise");
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        setError("Accès refusé. Seuls les administrateurs peuvent accéder aux diagnostiques.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la récupération des diagnostiques");
      }

      const diagnosticData = data as DiagnosticResponse;
      if (diagnosticData.tests) {
        setTests(diagnosticData.tests);
      }
      if (diagnosticData.environment) {
        setEnvVars(diagnosticData.environment);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      setTests([
        {
          name: "Diagnostique",
          status: "error",
          message: "Erreur lors de la récupération des diagnostiques",
          details: { error: errorMessage },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-green-500/30 bg-green-500/5";
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/5";
      case "error":
        return "border-red-500/30 bg-red-500/5";
      default:
        return "border-blue-500/30 bg-blue-500/5";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Diagnostic Système</h1>
            <p className="text-slate-400">Tests de santé et configuration de l&apos;application</p>
          </div>
          <Button onClick={runDiagnostics} disabled={loading} className="ml-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-500/30 bg-red-500/5 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Erreur</p>
                <p className="text-sm text-slate-300">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Environment Variables */}
        <Card className="mb-6 border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Variables d&apos;Environnement</h2>
          <div className="space-y-2">
            {envVars.length > 0 ? (
              envVars.map((env) => (
                <div
                  key={env.name}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    env.defined ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {env.defined ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{env.name}</p>
                      {env.value && env.defined && (
                        <p className="text-xs text-slate-400">
                          {env.value.length > 50 ? `${env.value.substring(0, 50)}...` : env.value}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${env.defined ? "text-green-400" : "text-red-400"}`}>
                    {env.defined ? "✓ Défini" : "✗ Manquant"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-slate-400">Aucune variable d&apos;environnement testée</p>
            )}
          </div>
        </Card>

        {/* Diagnostic Tests */}
        <Card className="border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-xl font-semibold">Tests de Diagnostic</h2>
          <div className="space-y-3">
            {tests.length > 0 ? (
              tests.map((test, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${getStatusColor(test.status)}`}
                >
                  <div className="mt-1">{getStatusIcon(test.status)}</div>
                  <div className="flex-1">
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-slate-300">{test.message}</p>
                    {test.details && (
                      <details className="mt-2 text-xs text-slate-400">
                        <summary className="cursor-pointer hover:text-slate-300">Détails</summary>
                        <pre className="mt-2 overflow-auto rounded bg-slate-900 p-2">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : (
              <p className="text-slate-400">Aucun test exécuté</p>
            )}
          </div>
        </Card>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          {[
            { label: "Succès", count: tests.filter((t) => t.status === "success").length, color: "green" },
            { label: "Avertissements", count: tests.filter((t) => t.status === "warning").length, color: "yellow" },
            { label: "Erreurs", count: tests.filter((t) => t.status === "error").length, color: "red" },
            { label: "Total", count: tests.length, color: "blue" },
          ].map((item) => (
            <Card key={item.label} className={`border-${item.color}-500/30 bg-${item.color}-500/5 p-4`}>
              <p className={`text-sm text-${item.color}-400`}>{item.label}</p>
              <p className="text-2xl font-bold">{item.count}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
