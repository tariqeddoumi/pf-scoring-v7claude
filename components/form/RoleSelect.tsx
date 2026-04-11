/**
 * Reusable Role Select Component
 * Used in user management pages
 */

import { ROLE_LABELS } from "@/lib/ui-constants";

interface RoleSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function RoleSelect({
  value,
  onChange,
  error,
  required,
  disabled,
}: RoleSelectProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-2">
        Rôle {required && "*"}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 ${
          error ? "border-red-500" : "border-slate-600"
        }`}
      >
        <option value="viewer">{ROLE_LABELS.viewer}</option>
        <option value="analyst">{ROLE_LABELS.analyst}</option>
        <option value="manager">{ROLE_LABELS.manager}</option>
        <option value="admin">{ROLE_LABELS.admin}</option>
      </select>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
