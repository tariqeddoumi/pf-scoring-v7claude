'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiGet, apiPost, apiPut } from '@/lib/api-client';

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
      console.error('Error checking status:', error);
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
        throw new Error('Failed to update configuration');
      }

      setEnabled(!enabled);
      setMessage({
        type: 'success',
        text: `Dynamic forms ${!enabled ? 'enabled' : 'disabled'} successfully`,
      });

      // Reload config after delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update configuration',
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
        throw new Error(data.error || 'Failed to initialize database');
      }

      setInitialized(true);
      setMessage({
        type: 'success',
        text: 'Database initialized successfully with form configurations',
      });

      // Reload status after delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to initialize database',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p className="text-slate-400">Checking configuration status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dynamic Forms Management</h1>
          <p className="text-slate-400 mt-1">Configure ultra-parametrizable form rendering</p>
        </div>
        <Link href="/admin" className="inline-flex items-center space-x-2 text-slate-400 hover:text-slate-300">
          <ArrowLeft size={20} />
          <span>Back to Admin</span>
        </Link>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/50 text-green-400'
              : 'bg-red-500/10 border-red-500/50 text-red-400'
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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Feature Toggle</h3>
              <p className="text-sm text-slate-400 mt-1">
                Enable dynamic form rendering for project screens
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              enabled
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {enabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>

          <button
            onClick={toggleFeature}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
              enabled
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Updating...
              </span>
            ) : (
              `${enabled ? 'Disable' : 'Enable'} Dynamic Forms`
            )}
          </button>

          <div className="text-xs text-slate-500 space-y-1 mt-4">
            <p><strong>When enabled:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Project forms render from database configuration</li>
              <li>Forms can be customized without code changes</li>
              <li>Fallback to hardcoded forms if config missing</li>
            </ul>
          </div>
        </div>

        {/* Database Initialization Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Database Initialization</h3>
              <p className="text-sm text-slate-400 mt-1">
                Seed database from lib/field-config.ts
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              initialized
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {initialized ? 'Initialized' : 'Pending'}
            </div>
          </div>

          <button
            onClick={initializeDatabase}
            disabled={loading || initialized}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
              initialized
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Initializing...
              </span>
            ) : initialized ? (
              'Already Initialized'
            ) : (
              'Initialize Database'
            )}
          </button>

          <div className="text-xs text-slate-500 space-y-1 mt-4">
            <p><strong>This will:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Create FormSection records from PROJECT_SECTIONS</li>
              <li>Create FieldConfiguration records from each field</li>
              <li>Set up the database schema for dynamic forms</li>
              <li>Skip if already initialized</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-4">How It Works</h3>
        <div className="text-slate-300 space-y-2 text-sm">
          <p><strong>Phase 1: Database Initialization</strong></p>
          <ul className="list-disc list-inside ml-2 mb-3">
            <li>Click "Initialize Database" to seed FormSection and FieldConfiguration tables</li>
            <li>This imports field definitions from lib/field-config.ts into the database</li>
          </ul>

          <p><strong>Phase 2: Enable Feature Flag</strong></p>
          <ul className="list-disc list-inside ml-2 mb-3">
            <li>Click "Enable Dynamic Forms" to activate the feature</li>
            <li>Project screens (new/edit) will then use database configuration</li>
          </ul>

          <p><strong>Phase 3: Progressive Enhancement</strong></p>
          <ul className="list-disc list-inside ml-2">
            <li>Screens gracefully fall back to hardcoded forms if configuration is missing</li>
            <li>Non-breaking: existing functionality is preserved</li>
            <li>Admin can manage fields via database UI (coming soon)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
