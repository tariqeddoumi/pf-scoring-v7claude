"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { apiCall } from "@/lib/api-client";

export default function AuthSettingsPage() {
  const [settings, setSettings] = useState({
    passwordMinLength: 8,
    sessionTimeoutMinutes: 120,
    enablePassword: true,
    enableOAuth: false,
    enableSAML: false,
  });

  const handleSave = async () => {
    try {
      const res = await apiCall("/api/admin/config/auth", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        alert("Paramètres sauvegardés avec succès");
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la sauvegarde");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              Paramètres d&apos;Authentification
            </h1>
            <p className="mt-2 text-muted-foreground">
              Configurez les méthodes et politiques d&apos;authentification
            </p>
          </div>
        </div>

        {/* Password Settings */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4 text-lg">
            Politique de Mot de Passe
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enablePassword}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    enablePassword: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span className="font-medium">
                Authentification par mot de passe
              </span>
            </label>

            {settings.enablePassword && (
              <div className="ml-7">
                <label className="block text-sm font-medium mb-2">
                  Longueur minimale du mot de passe
                </label>
                <input
                  type="number"
                  min="6"
                  max="32"
                  value={settings.passwordMinLength}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      passwordMinLength: parseInt(e.target.value),
                    })
                  }
                  className="w-32 rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Session Settings */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4 text-lg">Paramètres de Session</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Délai d&apos;expiration de la session (minutes)
              </label>
              <input
                type="number"
                min="15"
                max="1440"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sessionTimeoutMinutes: parseInt(e.target.value),
                  })
                }
                className="w-32 rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
          </div>
        </Card>

        {/* OAuth Settings */}
        <Card className="p-6 mb-6 opacity-50 pointer-events-none">
          <h2 className="font-semibold mb-4 text-lg">OAuth 2.0 (À venir)</h2>
          <p className="text-sm text-muted-foreground">
            La configuration OAuth sera disponible dans une future mise à jour.
          </p>
        </Card>

        {/* SAML Settings */}
        <Card className="p-6 mb-6 opacity-50 pointer-events-none">
          <h2 className="font-semibold mb-4 text-lg">SAML 2.0 (À venir)</h2>
          <p className="text-sm text-muted-foreground">
            La configuration SAML sera disponible dans une future mise à jour.
          </p>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={handleSave}>Sauvegarder</Button>
          <Link href="/admin">
            <Button variant="outline">Retour</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
