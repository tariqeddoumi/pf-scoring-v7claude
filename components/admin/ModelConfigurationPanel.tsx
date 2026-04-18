'use client';

import { useState, useEffect } from 'react';
import { ConfigurationDropdown } from './ConfigurationDropdown';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ModelConfigurationPanelProps {
  versionId: string;
  onConfigUpdate?: () => void;
}

export function ModelConfigurationPanel({
  versionId,
  onConfigUpdate,
}: ModelConfigurationPanelProps) {
  const [config, setConfig] = useState({
    aggregationMethod: 'WEIGHTED_AVERAGE',
    weightMode: 'RELATIVE',
    scoreScale: '0_100',
  });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');

      // Save configuration to database
      const response = await fetch(
        `/api/admin/scoring/model-config?versionId=${versionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      setSaveStatus('success');
      setSaveMessage('Configuration saved successfully');
      onConfigUpdate?.();

      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(
        error instanceof Error ? error.message : 'Failed to save configuration'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Configuration du Modèle</h3>
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
        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3 flex items-center gap-2 text-green-400">
          <CheckCircle2 size={18} />
          <span className="text-sm">{saveMessage}</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 flex items-center gap-2 text-red-400">
          <AlertCircle size={18} />
          <span className="text-sm">{saveMessage}</span>
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-slate-700">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-medium transition-colors disabled:opacity-50"
        >
          {saving ? 'Sauvegarde...' : 'Enregistrer Configuration'}
        </button>
      </div>
    </div>
  );
}
