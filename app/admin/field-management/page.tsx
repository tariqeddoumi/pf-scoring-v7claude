'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from 'lucide-react';

interface FormSection {
  id: string;
  entity: string;
  title: string;
  icon?: string;
  description?: string;
  columns: number;
  orderIndex: number;
  visible: boolean;
  fields?: FieldConfig[];
}

interface FieldConfig {
  id: string;
  entity: string;
  fieldName: string;
  label: string;
  fieldType: string;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  sectionId?: string;
  orderIndex: number;
  visible: boolean;
  editable: boolean;
}

const ENTITIES = [
  { label: 'Clients', value: 'client' },
  { label: 'Projets', value: 'project' },
  { label: 'Évaluations', value: 'evaluation' },
  { label: 'Utilisateurs', value: 'user' },
];

const FIELD_TYPES = [
  { label: 'Texte', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Téléphone', value: 'tel' },
  { label: 'Nombre', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Sélection', value: 'select' },
  { label: 'Texte long', value: 'textarea' },
  { label: 'Case à cocher', value: 'checkbox' },
  { label: 'Bouton radio', value: 'radio' },
];

export default function FieldManagementPage() {
  const [selectedEntity, setSelectedEntity] = useState<string>('client');
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewFieldForm, setShowNewFieldForm] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newField, setNewField] = useState({
    fieldName: '',
    label: '',
    fieldType: 'text',
    required: false,
    placeholder: '',
    helpText: '',
  });

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) return { Authorization: `Bearer ${token}` };
    return {};
  };

  // Fetch sections and fields
  useEffect(() => {
    fetchSections();
  }, [selectedEntity]);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/field-configurations?entity=${selectedEntity}&type=sections`,
        { headers: { ...getAuthHeaders() } }
      );
      if (!response.ok) throw new Error('Failed to fetch sections');
      const data = await response.json();
      setSections(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleAddField = async (sectionId: string) => {
    if (!newField.fieldName || !newField.label) {
      setError('Field name and label are required');
      return;
    }

    try {
      const response = await fetch('/api/admin/field-configurations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          type: 'field',
          entity: selectedEntity,
          sectionId,
          ...newField,
          orderIndex: (sections.find((s) => s.id === sectionId)?.fields?.length || 0) + 1,
        }),
      });

      if (!response.ok) throw new Error('Failed to add field');

      setSuccess('Field added successfully');
      setShowNewFieldForm(null);
      setNewField({
        fieldName: '',
        label: '',
        fieldType: 'text',
        required: false,
        placeholder: '',
        helpText: '',
      });
      fetchSections();
    } catch (err: any) {
      setError(err.message || 'Failed to add field');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const response = await fetch(`/api/admin/field-configurations/${fieldId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });

      if (!response.ok) throw new Error('Failed to delete field');

      setSuccess('Field deleted successfully');
      setDeleteConfirm(null);
      fetchSections();
    } catch (err: any) {
      setError(err.message || 'Failed to delete field');
    }
  };

  const handleToggleFieldVisibility = async (fieldId: string, visible: boolean) => {
    try {
      const response = await fetch(`/api/admin/field-configurations/${fieldId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ visible: !visible }),
      });

      if (!response.ok) throw new Error('Failed to update field');

      setSuccess('Field visibility updated');
      fetchSections();
    } catch (err: any) {
      setError(err.message || 'Failed to update field');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Gestion des Champs
            </h1>
            <p className="text-slate-400 mt-1">
              Personnalisez les champs de saisie pour chaque entité
            </p>
          </div>
        </div>
      </div>

      {/* Entity Selector */}
      <div className="flex gap-2">
        {ENTITIES.map((entity) => (
          <button
            key={entity.value}
            onClick={() => setSelectedEntity(entity.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedEntity === entity.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {entity.label}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 flex gap-2">
          <AlertCircle size={20} className="flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 flex gap-2">
          <CheckCircle size={20} className="flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-slate-400">Chargement des champs...</p>
          </div>
        </div>
      )}

      {/* Sections and Fields */}
      {!loading && sections.length > 0 && (
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <div>
                    <h3 className="font-semibold text-white">{section.title}</h3>
                    {section.description && (
                      <p className="text-sm text-slate-400">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">
                    {section.fields?.length || 0} champs
                  </span>
                  {expandedSections.has(section.id) ? (
                    <ChevronUp size={20} className="text-slate-400" />
                  ) : (
                    <ChevronDown size={20} className="text-slate-400" />
                  )}
                </div>
              </button>

              {/* Section Fields */}
              {expandedSections.has(section.id) && (
                <div className="border-t border-slate-700 p-4 space-y-3">
                  {section.fields?.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-white">{field.label}</p>
                        <p className="text-sm text-slate-400">
                          {field.fieldName} ({field.fieldType})
                          {field.required && (
                            <span className="text-red-400"> *</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleToggleFieldVisibility(field.id, field.visible)
                          }
                          className="p-2 text-slate-400 hover:text-white transition-colors"
                          title={field.visible ? 'Masquer' : 'Afficher'}
                        >
                          {field.visible ? (
                            <Eye size={18} />
                          ) : (
                            <EyeOff size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingField(field.id)}
                          className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(field.id)}
                          className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add New Field Form */}
                  {showNewFieldForm === section.id && (
                    <div className="p-4 bg-slate-700 rounded-lg space-y-3">
                      <h4 className="font-medium text-white mb-3">
                        Ajouter un nouveau champ
                      </h4>

                      <div className="grid gap-3">
                        <div>
                          <label className="block text-sm font-medium text-white mb-1">
                            Nom du champ *
                          </label>
                          <input
                            type="text"
                            value={newField.fieldName}
                            onChange={(e) =>
                              setNewField({
                                ...newField,
                                fieldName: e.target.value,
                              })
                            }
                            placeholder="Ex: nomCommercial"
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white mb-1">
                            Libellé *
                          </label>
                          <input
                            type="text"
                            value={newField.label}
                            onChange={(e) =>
                              setNewField({
                                ...newField,
                                label: e.target.value,
                              })
                            }
                            placeholder="Ex: Nom Commercial"
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white mb-1">
                            Type
                          </label>
                          <select
                            value={newField.fieldType}
                            onChange={(e) =>
                              setNewField({
                                ...newField,
                                fieldType: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          >
                            {FIELD_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex gap-2">
                          <label className="flex items-center gap-2 text-white">
                            <input
                              type="checkbox"
                              checked={newField.required}
                              onChange={(e) =>
                                setNewField({
                                  ...newField,
                                  required: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            Obligatoire
                          </label>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleAddField(section.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus size={18} />
                          Ajouter
                        </button>
                        <button
                          onClick={() => setShowNewFieldForm(null)}
                          className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add Field Button */}
                  {showNewFieldForm !== section.id && (
                    <button
                      onClick={() => setShowNewFieldForm(section.id)}
                      className="w-full px-3 py-2 text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Ajouter un champ
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-sm p-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Supprimer ce champ ?
            </h3>
            <p className="text-slate-400 mb-6">
              Cette action est irréversible.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDeleteField(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Supprimer
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
