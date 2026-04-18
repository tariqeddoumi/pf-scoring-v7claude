'use client';

import { useEffect, useState } from 'react';
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
  placeholder = `Select ${label}...`,
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

        const response = await fetch(
          `/api/admin/scoring/configuration?type=${configType}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch ${configType}`);
        }

        const data = await response.json();

        if (data.success) {
          setOptions(data.data || []);
        } else {
          setFetchError(data.error || 'Failed to load options');
        }
      } catch (error) {
        console.error(`Error fetching ${configType}:`, error);
        setFetchError(`Failed to load ${label} options`);
      } finally {
        setLoading(false);
      }
    };

    fetchConfiguration();
  }, [configType, label]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <Select value={value || ''} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
              {option.description && (
                <span className="text-xs text-gray-500 ml-2">
                  ({option.description})
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {loading && <p className="text-xs text-gray-500">Loading...</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {fetchError && <p className="text-xs text-red-500">{fetchError}</p>}
    </div>
  );
}
