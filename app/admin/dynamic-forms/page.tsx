'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';
import { PageHeader } from "@/components/ui/page-header";

export default function DynamicFormsAdmin() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setCheckingStatus(true);
      const config = (await apiGet('/api/config/public').then((res) =>
        res.ok ? res.json() : {}
      )) as Record<string, any>;
      setEnabled(config?.SCREENS_DYNAMIC_FORMS_ENABLED === 'true' || config?.SCREENS_DYNAMIC_FORMS_ENABLED === '1');

      const projectConfig = await apiGet('/api/forms/configuration/project').then((res) =>
        res.ok ? res.json() : { success: false }
      );
      setInitialized(projectConfig.success === true);
    } catch (error) {
      console.error('[Formulaires dynamiques] statut :', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const toggleFeature = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const newValue = enabled ? 'false' : 'true';
      const response = await apiPut('/api/admin/configuration/SCREENS_DYNAMIC_FORMS_ENABLED', {
        value: newValue,
      });

      if (!response.ok) {
        throw new Error('Mise à jour du paramètre impossible');
      }

      setEnabled(!enabled);
      setMessage({
        type: 'success',
        text: `Formulaires dynamiques ${!enabled ? 'activés' : 'désactivés'}.`,
      });

      // Reload config after delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Mise à jour du paramètre impossible',
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDatabase = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await apiPost('/api/admin/forms/initialize', {});
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Initialisation impossible');
      }

      setInitialized(true);
      setMessage({
        type: 'success',
        text: 'Configuration des formulaires installée en base.',
      });

      // Reload status after delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Initialisation impossible',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-muted-foreground">Lecture de la configuration…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        titre="Formulaires dynamiques"
        description="Afficher les formulaires de projet à partir de leur configuration en base, modifiable sans développement."
        retour={{ href: "/admin", libelle: "Paramétrage" }}
      />

      {/* Messages */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-success/10 border-green-500/50 text-success'
              : 'bg-destructive/10 border-destructive/50 text-destructive'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Feature Toggle Card */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Activation</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Formulaires de création et de modification des projets construits depuis la base
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              enabled
                ? 'bg-success/15 text-success'
                : 'bg-warning/15 text-warning'
            }`}>
              {enabled ? 'Activés' : 'Désactivés'}
            </div>
          </div>

          <button
            onClick={toggleFeature}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
              enabled
                ? 'bg-destructive hover:bg-destructive/90 disabled:bg-secondary text-primary-foreground'
                : 'bg-primary hover:bg-primary/90 disabled:bg-secondary text-primary-foreground'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Mise à jour…
              </span>
            ) : (
              `${enabled ? 'Désactiver' : 'Activer'} les formulaires dynamiques`
            )}
          </button>

          <div className="text-xs text-muted-foreground space-y-1 mt-4">
            <p><strong>Une fois activés :</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>les formulaires de projet suivent la configuration en base ;</li>
              <li>ils se personnalisent sans développement ;</li>
              <li>sans configuration, les formulaires standard s&apos;affichent.</li>
            </ul>
          </div>
        </div>

        {/* Database Initialization Card */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Installation de la configuration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Champs et sections par défaut des formulaires de projet
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              initialized
                ? 'bg-success/15 text-success'
                : 'bg-warning/15 text-warning'
            }`}>
              {initialized ? 'Installée' : 'À installer'}
            </div>
          </div>

          <button
            onClick={initializeDatabase}
            disabled={loading || initialized}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
              initialized
                ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 disabled:bg-secondary text-primary-foreground'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Installation…
              </span>
            ) : initialized ? (
              'Déjà installée'
            ) : (
              'Installer la configuration'
            )}
          </button>

          <div className="text-xs text-muted-foreground space-y-1 mt-4">
            <p><strong>Cette opération :</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>crée les sections des formulaires de projet ;</li>
              <li>crée la configuration de chaque champ ;</li>
              <li>prépare les formulaires dynamiques ;</li>
              <li>ne fait rien si la configuration existe déjà.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-primary/10 border border-ring/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary mb-4">Mode d&apos;emploi</h3>
        <div className="text-secondary-foreground space-y-2 text-sm">
          <p><strong>1. Installer la configuration</strong></p>
          <ul className="list-disc list-inside ml-2 mb-3">
            <li>Cliquer sur « Installer la configuration ».</li>
            <li>This imports field definitions from lib/field-config.ts into the database</li>
          </ul>

          <p><strong>2. Activer</strong></p>
          <ul className="list-disc list-inside ml-2 mb-3">
            <li>Cliquer sur « Activer les formulaires dynamiques ».</li>
            <li>Les écrans de création et de modification des projets utilisent alors la configuration en base.</li>
          </ul>

          <p><strong>3. Ajuster</strong></p>
          <ul className="list-disc list-inside ml-2">
            <li>Sans configuration, les formulaires standard s&apos;affichent : rien ne casse.</li>
            <li>Les fonctions existantes sont conservées.</li>
            <li>Les champs se gèrent dans Paramétrage › Gestion des champs.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
