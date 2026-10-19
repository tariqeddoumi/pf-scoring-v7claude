"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPost } from "@/lib/api-client";
import { useAppConfig } from "@/components/providers/app-config-provider";

function LoginPageContent() {
  const router = useRouter();
  // Même nom et même logo que la barre latérale (paramétrage de l'outil).
  const { config } = useAppConfig();
  const nomAppli = config.APP_NAME || "Scoring PF";
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Retour de la connexion externe (OAuth) : le jeton arrive dans le fragment d'URL.
  useEffect(() => {
    const f = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const jeton = f.get("jeton");
    if (!jeton) return;
    localStorage.setItem("auth_token", jeton);
    window.history.replaceState(null, "", "/login");
    router.replace(f.get("changer") ? "/changer-mot-de-passe" : "/dashboard");
  }, [router]);

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
      // Attempt login directly without health check blocking it
      // The login endpoint will handle database errors properly
      const response = await apiPost("/api/auth/login", { email, password });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage for API requests
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }
        // Mot de passe provisoire : il doit être remplacé avant tout autre écran.
        router.push(data.mustChangePassword ? "/changer-mot-de-passe" : "/dashboard");
      } else {
        // Afficher le code d'erreur s'il existe pour plus de détails
        const errorMessage = data.errorCode
          ? `${data.error || "Erreur"} (${data.errorCode})`
          : data.error || "Erreur lors de la connexion";

        // Special handling for server errors
        if (response.status >= 500) {
          setError(`⚠️ ${errorMessage}`);
        } else {
          setError(errorMessage);
        }
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Erreur de connexion au serveur";
      setError(`Erreur réseau: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    setLoading(true);
    try {
      const response = await apiPost("/api/auth/oauth-init", { provider });

      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setError("Erreur lors de l'authentification");
      }
    } catch {
      setError("Erreur lors de la redirection");
    } finally {
      setLoading(false);
    }
  };

  // Bypass login removed for security - all access requires authentication

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {config.APP_LOGO_URL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.APP_LOGO_URL} alt="" className="h-10 w-10 rounded-md object-contain" />
            ) : (
              <span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                {nomAppli.split(/\s+/).map((m) => m[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            )}
            <h1 className="text-3xl font-bold text-foreground">{nomAppli}</h1>
          </div>
          <p className="text-muted-foreground">
            Application de Scoring Project Finance
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-lg shadow-xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Connexion à votre compte
          </h2>
          <p className="text-muted-foreground mb-6">
            Accédez à votre tableau de bord de scoring
          </p>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/50 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthLogin("google")}
              disabled={loading}
              className="w-full px-4 py-3 bg-card border border-border text-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer avec Google
            </button>

            <button
              onClick={() => handleOAuthLogin("microsoft")}
              disabled={loading}
              className="w-full px-4 py-3 bg-card border border-border text-foreground rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer avec Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Ou</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Adresse e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@banque.ma"
                disabled={loading}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full px-4 py-2 bg-muted border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>


        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-muted-foreground text-sm">
          <p>Scoring Project Finance conforme IFC, BERD, Bâle et Bank Al-Maghrib</p>
          <p className="mt-2">Montants en dirhams (MAD)</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center">
          Chargement...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
