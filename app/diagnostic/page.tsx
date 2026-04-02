"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, CheckCircle2, AlertCircle, XCircle, Lock } from "lucide-react";

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
  // Password from environment variable (can be disabled by setting DIAGNOSTIC_ENABLED=false)
  const DIAGNOSTIC_PASSWORD = process.env.NEXT_PUBLIC_DIAGNOSTIC_PASSWORD || "diagnostic2024";
  const DIAGNOSTIC_ENABLED = process.env.NEXT_PUBLIC_DIAGNOSTIC_ENABLED !== "false";

  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [envVars, setEnvVars] = useState<EnvironmentVar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If diagnostic is disabled, show a disabled message
  if (!DIAGNOSTIC_ENABLED) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Diagnostic Désactivé</h1>
            <p className="text-slate-300">
              L'outil de diagnostic est actuellement désactivé. Contactez l'administrateur pour plus d'informations.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const handlePasswordSubmit = () => {
    if (password === DIAGNOSTIC_PASSWORD) {
      setAuthenticated(true);
      setPasswordError("");
      runDiagnostics();
    } else {
      setPasswordError("Mot de passe incorrect");
      setPassword("");
    }
  };

  const runDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/diagnostic/full");
      const data = await response.json();

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
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/10 border-green-500/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "error":
        return "bg-red-500/10 border-red-500/30";
      default:
        return "bg-slate-500/10 border-slate-500/30";
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="h-6 w-6 text-blue-400" />
            <h1 className="text-2xl font-bold">Diagnostic Système</h1>
          </div>
          <p className="text-slate-300 mb-6">Accès réservé aux super users</p>

          {passwordError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{passwordError}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                placeholder="Entrez le mot de passe"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <Button
              onClick={handlePasswordSubmit}
              className="w-full"
            >
              Accéder aux Diagnostiques
            </Button>
          </div>

          <p className="text-xs text-slate-400 mt-6">
            ⚠️ Interface temporaire - sera désactivée une fois l&apos;outil opérationnel
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Diagnostic Système</h1>
            <Button
              onClick={() => runDiagnostics()}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
          <p className="text-slate-400">Tests de santé et configuration de l&apos;application</p>
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
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Variables d&apos;Environnement</h2>
          <div className="grid gap-3">
            {envVars.map((envVar) => (
              <Card
                key={envVar.name}
                className={`p-4 border ${
                  envVar.defined ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm font-medium">{envVar.name}</p>
                    {envVar.value && (
                      <p className="text-xs text-slate-400 mt-1">{envVar.value}</p>
                    )}
                  </div>
                  {getStatusIcon(envVar.defined ? "success" : "error")}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Diagnostic Tests */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Tests de Diagnostic</h2>
          <div className="grid gap-3">
            {tests.map((test, idx) => (
              <Card
                key={idx}
                className={`p-4 border ${getStatusColor(test.status)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-slate-300 mt-1">{test.message}</p>
                    {test.details && (
                      <pre className="text-xs bg-slate-900 p-2 rounded mt-2 overflow-auto max-h-48 text-slate-300">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        {tests.length > 0 && (
          <Card className="mt-8 p-4 border-slate-700 bg-slate-800">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400">Succès</p>
                <p className="text-2xl font-bold text-green-400">
                  {tests.filter((t) => t.status === "success").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Avertissements</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {tests.filter((t) => t.status === "warning").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Erreurs</p>
                <p className="text-2xl font-bold text-red-400">
                  {tests.filter((t) => t.status === "error").length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-2xl font-bold">{tests.length}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
