'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConfigurationDropdown } from './ConfigurationDropdown';
import { apiGet, apiPut } from '@/lib/api-client';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ModelConfigurationPanelProps {
  versionId: string;
  onConfigUpdate?: () => void;
  /** Une version publiée ne se modifie plus : le panneau se met en lecture seule. */
  lectureSeule?: boolean;
}

interface ConfigurationModele {
  aggregationMethod: string;
  weightMode: string;
  scoreScale: string;
}

/**
 * Configuration d'une version du modèle : méthode d'agrégation, mode de poids,
 * échelle de score.
 *
 * Le panneau affichait des valeurs codées en dur — « WEIGHTED_AVERAGE », « RELATIVE »,
 * « 0_100 » — sans jamais lire la configuration de la version : il annonçait donc
 * toujours la même chose, quelle que soit la version affichée, et un simple
 * enregistrement écrivait ces valeurs par-dessus les vraies.
 */
export function ModelConfigurationPanel({
  versionId,
  onConfigUpdate,
  lectureSeule,
}: ModelConfigurationPanelProps) {
  const [config, setConfig] = useState<ConfigurationModele>({
    aggregationMethod: 'WEIGHTED_AVERAGE',
    weightMode: 'RELATIVE',
    scoreScale: '0_100',
  });
  const [chargement, setChargement] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      const res = await apiGet(
        `/api/admin/scoring/model-config?versionId=${versionId}`
      );
      if (res.ok) {
        const data = (await res.json()).data;
        if (data) setConfig(data);
      }
    } catch {
      /* la configuration reste sur ses valeurs par défaut, signalées comme telles */
    } finally {
      setChargement(false);
    }
  }, [versionId]);

  useEffect(() => {
    charger();
  }, [charger]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');

      // Save configuration to database
      // L'appel partait en fetch nu, sans en-tête d'autorisation.
      const response = await apiPut(
        `/api/admin/scoring/model-config?versionId=${versionId}`,
        config
      );

      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? "Cette version est publiée : sa configuration ne peut plus être modifiée."
            : "Enregistrement de la configuration impossible."
        );
      }

      setSaveStatus('success');
      setSaveMessage('Configuration enregistrée.');
      onConfigUpdate?.();

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(
        error instanceof Error ? error.message : 'Enregistrement impossible.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Configuration du modèle
          {chargement && (
            <Loader2 size={14} className="ml-2 inline animate-spin text-muted-foreground" />
          )}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ConfigurationDropdown
          label="Méthode d'agrégation"
          value={config.aggregationMethod}
          onChange={(value) => setConfig({ ...config, aggregationMethod: value })}
          configType="aggregationMethods"
          placeholder="Sélectionner une méthode..."
        />

        <ConfigurationDropdown
          label="Mode de poids"
          value={config.weightMode}
          onChange={(value) => setConfig({ ...config, weightMode: value })}
          configType="weightModes"
          placeholder="Sélectionner un mode..."
        />

        <ConfigurationDropdown
          label="Échelle de score"
          value={config.scoreScale}
          onChange={(value) => setConfig({ ...config, scoreScale: value })}
          configType="scoreScales"
          placeholder="Sélectionner une échelle..."
        />
      </div>

      {saveStatus === 'success' && (
        <div className="rounded-lg bg-success/10 border border-success/30 p-3 flex items-center gap-2 text-success">
          <CheckCircle2 size={18} />
          <span className="text-sm">{saveMessage}</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 flex items-center gap-2 text-destructive">
          <AlertCircle size={18} />
          <span className="text-sm">{saveMessage}</span>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving || chargement || lectureSeule}
          title={lectureSeule ? "Version publiée : configuration figée" : undefined}
          className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer la configuration'}
        </button>
      </div>
    </div>
  );
}
