'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileIcon, X, CheckCircle2 } from 'lucide-react';

export interface DocumentUploadData {
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
  documentType: string;
  description?: string;
}

interface DocumentUploadPanelProps {
  evaluationId: string;
  onUpload: (data: DocumentUploadData) => Promise<void>;
  isLoading?: boolean;
  existingDocuments?: Array<{
    id: string;
    fileName: string;
    documentType: string;
    uploadedAt: string;
  }>;
}

const DOCUMENT_TYPES = [
  { value: 'FINANCIAL_STATEMENT', label: 'État financier' },
  { value: 'TECHNICAL_SPEC', label: 'Spécification technique' },
  { value: 'BUSINESS_PLAN', label: 'Plan commercial' },
  { value: 'LEGAL_DOCUMENT', label: 'Document légal' },
  { value: 'FEASIBILITY_STUDY', label: 'Étude de faisabilité' },
  { value: 'ENVIRONMENTAL_REPORT', label: 'Rapport environnemental' },
  { value: 'SOCIAL_IMPACT', label: 'Impact social' },
  { value: 'OTHER', label: 'Autre' }
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export function DocumentUploadPanel({
  evaluationId,
  onUpload,
  isLoading = false,
  existingDocuments = []
}: DocumentUploadPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('FINANCIAL_STATEMENT');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Le fichier dépasse la taille maximale de ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Type de fichier non autorisé. Utilisez PDF, Word ou similaire.';
    }
    return null;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const error = validateFile(file);
      if (error) {
        setErrors({ file: error });
      } else {
        setSelectedFile(file);
        setErrors({});
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      const error = validateFile(file);
      if (error) {
        setErrors({ file: error });
      } else {
        setSelectedFile(file);
        setErrors({});
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setErrors({ file: 'Veuillez sélectionner un fichier' });
      return;
    }

    setIsUploading(true);
    try {
      await onUpload({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        storagePath: `/evaluations/${evaluationId}/${Date.now()}-${selectedFile.name}`,
        documentType,
        description: description || undefined
      });

      setSelectedFile(null);
      setDocumentType('FINANCIAL_STATEMENT');
      setDescription('');
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  };

  return (
    <div className="space-y-6">
      {/* Existing Documents */}
      {existingDocuments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Documents chargés ({existingDocuments.length})
          </h3>
          <div className="space-y-2">
            {existingDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-muted border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileIcon className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOCUMENT_TYPES.find(t => t.value === doc.documentType)?.label} •{' '}
                      {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-white border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Charger un nouveau document</h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive ? 'border-ring bg-primary/10' : 'border-border hover:border-border'
            } ${errors.file ? 'border-destructive bg-destructive/10' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              accept=".pdf,.doc,.docx"
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
                <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium text-foreground">
                  Glissez un fichier ici ou cliquez pour le sélectionner
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Word (max {MAX_FILE_SIZE / 1024 / 1024}MB)
                </p>
              </div>
            )}

            {errors.file && (
              <div className="mt-3 p-2 bg-destructive/10 border border-red-300 rounded">
                <p className="text-xs text-destructive">{errors.file}</p>
              </div>
            )}
          </div>

          {selectedFile && (
            <>
              {/* Document Type */}
              <div>
                <label className="block text-sm font-medium text-secondary-foreground mb-2">
                  Type de document
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-secondary-foreground mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={2}
                  placeholder="Décrivez le contenu du document..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isUploading || isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:bg-secondary transition-colors"
                >
                  {isUploading || isLoading ? 'Chargement...' : 'Charger le document'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setErrors({});
                  }}
                  className="px-4 py-2 border border-border rounded-lg text-secondary-foreground font-medium hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
