'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ConfigurationOption {
  id: string;
  label: string;
  description?: string;
  displayOrder?: number;
}

interface ConfigurationDropdownProps {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  configType: 'answerTypes' | 'aggregationMethods' | 'weightModes' | 'scoreScales' | 'ratingScales';
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function ConfigurationDropdown({
  label,
  value,
  onChange,
  configType,
  placeholder = `Choisir…`,
  disabled = false,
  error,
}: ConfigurationDropdownProps) {
  const [options, setOptions] = useState<ConfigurationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfiguration = async () => {
      try {
        setLoading(true);
        setFetchError(null);

        // apiGet joint le jeton de session : un fetch nu était refusé (401) et la
        // liste restait vide (« Failed to load … options »).
        const response = await apiGet(`/api/admin/scoring/configuration?type=${configType}`);

        if (!response.ok) {
          throw new Error(`Chargement impossible (${response.status})`);
        }

        const data = await response.json();

        if (data.success) {
          setOptions(data.data || []);
        } else {
          setFetchError(data.error || 'Liste indisponible');
        }
      } catch (error) {
        console.error(`Error fetching ${configType}:`, error);
        setFetchError(`Liste « ${label} » indisponible`);
      } finally {
        setLoading(false);
      }
    };

    fetchConfiguration();
  }, [configType, label]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-secondary-foreground">{label}</label>
      <Select value={value || ''} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
              {option.description && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({option.description})
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loading && <p className="text-xs text-muted-foreground">Chargement…</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {fetchError && <p className="text-xs text-destructive">{fetchError}</p>}
    </div>
  );
}
