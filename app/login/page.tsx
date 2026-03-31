"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useBypass, setUseBypass] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/dashboard");
      } else {
        setError(data.error || "Erreur lors de la connexion");
      }
    } catch (err: any) {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/oauth-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError("Erreur lors de l'authentification");
      }
    } catch (err: any) {
      setError("Erreur lors de la redirection");
    } finally {
      setLoading(false);
    }
  };

  const handleBypassLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/projects-bypass");

      if (response.ok) {
        router.push("/dashboard");
      } else {
        setError("Erreur lors de l'accès au tableau de bord");
      }
    } catch (err: any) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-4xl">📊</div>
            <h1 className="text-3xl font-bold text-white">PF Scoring</h1>
          </div>
          <p className="text-slate-400">
            Application de Scoring Project Finance
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-2">
            Connexion à votre compte
          </h2>
          <p className="text-slate-400 mb-6">
            Accédez à votre tableau de bord de scoring
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
              className="w-full px-4 py-3 bg-white text-slate-900 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-slate-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>🔵</span>
              Continuer avec Google
            </button>

            <button
              onClick={() => handleOAuthLogin("microsoft")}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>⊞</span>
              Continuer avec Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-400">Ou</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pf-scoring.ma"
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-300 mb-2">
              <span className="font-medium">Compte de test :</span>
            </p>
            <p className="text-xs text-slate-400">
              📧 admin@pf-scoring.ma<br />
              🔑 Admin123!
            </p>
          </div>

          {/* Bypass Mode */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useBypass}
                onChange={(e) => setUseBypass(e.target.checked)}
                className="w-4 h-4 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-400">
                Mode test (contourner l'authentification)
              </span>
            </label>

            {useBypass && (
              <button
                onClick={handleBypassLogin}
                disabled={loading}
                className="w-full mt-3 px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Accès..." : "Accéder au tableau de bord"}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>
            PF Scoring • Scoring Project Finance Conforme IFC, EBRD, Basel
          </p>
          <p className="mt-2">
            Banque Marocaine • Monnaie: MAD
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">Chargement...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
