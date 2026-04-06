'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Shield, Eye, Download, Lock, Trash2, Clock, Users } from 'lucide-react';

interface ComplianceItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: 'compliant' | 'in-progress' | 'non-compliant';
  lastReview?: Date;
  evidence?: string;
}

interface DataCategory {
  name: string;
  retention: string;
  purpose: string;
  legal_basis: string;
}

const COMPLIANCE_CHECKLIST: ComplianceItem[] = [
  {
    id: 'dpia',
    category: 'GDPR',
    title: 'Data Protection Impact Assessment (DPIA)',
    description: 'Analyse d\'impact sur la protection des données effectuée',
    status: 'compliant',
    lastReview: new Date('2026-03-15'),
    evidence: 'DPIA_2026_v2.pdf',
  },
  {
    id: 'dpo',
    category: 'GDPR',
    title: 'Data Protection Officer (DPO)',
    description: 'DPO désigné et coordonnées publiques disponibles',
    status: 'compliant',
    lastReview: new Date('2026-02-01'),
    evidence: 'DPO_Contact.pdf',
  },
  {
    id: 'consent',
    category: 'GDPR',
    title: 'Consentement Explicite',
    description: 'Mécanisme de consentement pour données sensibles',
    status: 'compliant',
    lastReview: new Date('2026-03-20'),
    evidence: 'Consent_Template.pdf',
  },
  {
    id: 'privacy-policy',
    category: 'GDPR',
    title: 'Politique de Confidentialité',
    description: 'Politique accessible, claire et en français',
    status: 'compliant',
    lastReview: new Date('2026-03-10'),
    evidence: 'PrivacyPolicy_2026.pdf',
  },
  {
    id: 'data-access',
    category: 'GDPR',
    title: 'Droit d\'accès aux données',
    description: 'Mécanisme d\'export et d\'accès aux données personnelles',
    status: 'compliant',
    lastReview: new Date('2026-03-18'),
    evidence: 'DataAccess_Procedures.pdf',
  },
  {
    id: 'data-deletion',
    category: 'GDPR',
    title: 'Droit à l\'oubli',
    description: 'Capacité à supprimer les données personnelles',
    status: 'compliant',
    lastReview: new Date('2026-03-12'),
    evidence: 'DeletionPolicy.pdf',
  },
  {
    id: 'breach-notification',
    category: 'GDPR',
    title: 'Notification des violations',
    description: 'Procédure pour notifier les violations de données',
    status: 'compliant',
    lastReview: new Date('2026-02-28'),
    evidence: 'BreachNotificationPlan.pdf',
  },
  {
    id: 'third-party',
    category: 'GDPR',
    title: 'Contrats de Traitement Tiers',
    description: 'Accords de traitement des données signés avec fournisseurs',
    status: 'in-progress',
    lastReview: new Date('2026-03-01'),
    evidence: 'DPA_Template.pdf',
  },
  {
    id: 'encryption',
    category: 'Sécurité',
    title: 'Chiffrement des Données',
    description: 'Données en transit et au repos chiffrées',
    status: 'compliant',
    lastReview: new Date('2026-03-05'),
    evidence: 'Encryption_Standards.pdf',
  },
  {
    id: 'access-control',
    category: 'Sécurité',
    title: 'Contrôle d\'accès basé sur les rôles',
    description: 'RBAC implémenté et audit des accès',
    status: 'compliant',
    lastReview: new Date('2026-03-22'),
    evidence: 'RBAC_Implementation.pdf',
  },
  {
    id: 'audit-logs',
    category: 'Audit',
    title: 'Journalisation Complète',
    description: 'Tous les accès et modifications enregistrés',
    status: 'compliant',
    lastReview: new Date('2026-03-20'),
    evidence: 'AuditLog_Standards.pdf',
  },
  {
    id: 'retention-policy',
    category: 'Rétention',
    title: 'Politique de Rétention des Données',
    description: 'Règles claires pour la conservation des données',
    status: 'compliant',
    lastReview: new Date('2026-03-15'),
    evidence: 'RetentionPolicy_2026.pdf',
  },
];

const DATA_RETENTION: DataCategory[] = [
  {
    name: 'Données Client',
    retention: '6 ans (conformité légale)',
    purpose: 'Gestion des relations commerciales',
    legal_basis: 'Intérêt légitime & obligation légale',
  },
  {
    name: 'Données d\'Évaluation',
    retention: '5 ans',
    purpose: 'Audit et traçabilité des décisions',
    legal_basis: 'Obligation légale & intérêt légitime',
  },
  {
    name: 'Données Personnelles des Utilisateurs',
    retention: '3 ans après départ',
    purpose: 'Gestion des accès et audit',
    legal_basis: 'Obligation légale',
  },
  {
    name: 'Documents Financiers',
    retention: '7 ans',
    purpose: 'Conformité fiscale et légale',
    legal_basis: 'Obligation légale',
  },
  {
    name: 'Logs d\'Audit',
    retention: '2 ans',
    purpose: 'Sécurité et investigation',
    legal_basis: 'Intérêt légitime en sécurité',
  },
];

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'compliant':
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    case 'non-compliant':
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Clock className="w-5 h-5 text-amber-400" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const classes = {
    compliant: 'bg-emerald-500/10 text-emerald-400',
    'non-compliant': 'bg-red-500/10 text-red-400',
    'in-progress': 'bg-amber-500/10 text-amber-400',
  };

  const labels = {
    compliant: 'Conforme',
    'non-compliant': 'Non conforme',
    'in-progress': 'En cours',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${classes[status as keyof typeof classes]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

export default function CompliancePage() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const compliantCount = COMPLIANCE_CHECKLIST.filter(c => c.status === 'compliant').length;
  const inProgressCount = COMPLIANCE_CHECKLIST.filter(c => c.status === 'in-progress').length;
  const nonCompliantCount = COMPLIANCE_CHECKLIST.filter(c => c.status === 'non-compliant').length;
  const compliancePercentage = Math.round((compliantCount / COMPLIANCE_CHECKLIST.length) * 100);

  const handleExport = () => {
    const report = `
RAPPORT DE CONFORMITÉ GDPR
Généré le ${new Date().toLocaleDateString('fr-FR')}

RÉSUMÉ EXÉCUTIF
===============
Taux de conformité: ${compliancePercentage}%
Éléments conformes: ${compliantCount}/${COMPLIANCE_CHECKLIST.length}
En cours: ${inProgressCount}
Non conformes: ${nonCompliantCount}

DÉTAIL PAR CATÉGORIE
====================
${['GDPR', 'Sécurité', 'Audit', 'Rétention']
  .map(category => {
    const items = COMPLIANCE_CHECKLIST.filter(c => c.category === category);
    return `\n${category}:\n${items.map(c => `  - ${c.title}: ${c.status.toUpperCase()}`).join('\n')}`;
  })
  .join('\n')}

POLITIQUE DE RÉTENTION DES DONNÉES
===================================
${DATA_RETENTION
  .map(d => `
${d.name}
  Durée: ${d.retention}
  Objectif: ${d.purpose}
  Base légale: ${d.legal_basis}`)
  .join('\n')}

DROITS DES PERSONNES
====================
1. Droit d'accès: Les personnes peuvent demander l'accès à leurs données
2. Droit de rectification: Les personnes peuvent corriger leurs données
3. Droit à l'oubli: Les personnes peuvent demander la suppression
4. Droit à la portabilité: Les données peuvent être exportées
5. Droit d'opposition: Les personnes peuvent s'opposer au traitement
6. Droit à limitation: Le traitement peut être limité

CONTACTS
========
Délégué à la Protection des Données (DPO): dpo@pfscoring.ma
Responsable Conformité: compliance@pfscoring.ma

---
Ce rapport est confidentiel et destiné à usage interne uniquement.
`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `compliance-report-${new Date().getTime()}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Conformité & Confidentialité</h1>
        <p className="text-slate-400 mt-2">GDPR, conformité légale et protection des données</p>
      </div>

      {/* Overall Compliance Score */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-cyan-600/30">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-5xl font-bold text-cyan-400 mb-2">{compliancePercentage}%</div>
              <p className="text-slate-400">Taux de conformité général</p>
            </div>
            <div className="flex gap-8">
              <div>
                <div className="text-2xl font-bold text-emerald-400">{compliantCount}</div>
                <p className="text-sm text-slate-400">Conformes</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">{inProgressCount}</div>
                <p className="text-sm text-slate-400">En cours</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{nonCompliantCount}</div>
                <p className="text-sm text-slate-400">Non conformes</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 space-y-2">
            <div className="flex h-2 gap-1 bg-slate-700 rounded overflow-hidden">
              <div
                className="bg-emerald-400"
                style={{ width: `${(compliantCount / COMPLIANCE_CHECKLIST.length) * 100}%` }}
              ></div>
              <div
                className="bg-amber-400"
                style={{ width: `${(inProgressCount / COMPLIANCE_CHECKLIST.length) * 100}%` }}
              ></div>
              <div
                className="bg-red-400"
                style={{ width: `${(nonCompliantCount / COMPLIANCE_CHECKLIST.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex gap-3">
        <Button onClick={handleExport} className="bg-cyan-600 hover:bg-cyan-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter le Rapport
        </Button>
      </div>

      {/* Compliance Checklist */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Checklist de Conformité</h2>
        <div className="space-y-3">
          {COMPLIANCE_CHECKLIST.map(item => (
            <Card
              key={item.id}
              className="bg-slate-800 border-slate-700 cursor-pointer hover:border-slate-600"
              onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <StatusIcon status={item.status} />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-slate-100">{item.title}</h3>
                        <StatusBadge status={item.status} />
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">{item.description}</p>
                      {item.lastReview && (
                        <p className="text-xs text-slate-500">
                          Dernière révision: {item.lastReview.toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {expandedItem === item.id && item.evidence && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-sm text-slate-400 mb-2">Pièces justificatives:</p>
                    <div className="p-3 bg-slate-900 rounded border border-slate-700 text-sm">
                      {item.evidence}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Retention Policy */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Politique de Rétention des Données</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_RETENTION.map((category, idx) => (
            <Card key={idx} className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Durée de rétention</p>
                  <p className="text-sm font-semibold text-slate-100 mt-1">{category.retention}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Objectif</p>
                  <p className="text-sm text-slate-300 mt-1">{category.purpose}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Base légale</p>
                  <p className="text-sm text-slate-300 mt-1">{category.legal_basis}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Rights Information */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Droits des Personnes Concernées
          </CardTitle>
          <CardDescription>Conformément au RGPD</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900 rounded">
              <h4 className="font-semibold text-slate-100 mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                Droit d'accès
              </h4>
              <p className="text-sm text-slate-400">
                Les personnes peuvent accéder à leurs données personnelles et obtenir une copie
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded">
              <h4 className="font-semibold text-slate-100 mb-2 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-cyan-400" />
                Droit à l'oubli
              </h4>
              <p className="text-sm text-slate-400">
                Demande de suppression des données dans les cas prévus par la loi
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded">
              <h4 className="font-semibold text-slate-100 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Droit de portabilité
              </h4>
              <p className="text-sm text-slate-400">
                Les données peuvent être exportées dans un format standard et lisible
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded">
              <h4 className="font-semibold text-slate-100 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                Droit d'opposition
              </h4>
              <p className="text-sm text-slate-400">
                Les personnes peuvent s'opposer au traitement de leurs données
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle>Questions de Conformité?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-400">
          <p><strong>Délégué à la Protection des Données:</strong> dpo@pfscoring.ma</p>
          <p><strong>Responsable Conformité:</strong> compliance@pfscoring.ma</p>
          <p><strong>Adresse:</strong> PF Scoring, Casablanca, Maroc</p>
        </CardContent>
      </Card>
    </div>
  );
}
