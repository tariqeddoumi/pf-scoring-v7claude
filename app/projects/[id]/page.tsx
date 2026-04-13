"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  Loader2,
  FileText,
  MapPin,
  DollarSign,
  Zap,
  Users,
  BarChart3,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";

interface Project {
  id: string;
  nom: string;
  description?: string;
  secteur?: string;
  pays?: string;
  montant?: string;
  devise?: string;
  status: string;
  createdAt: string;
  countryCode?: string;
  coutTotal?: string;
  financement?: string;
  apportPropre?: string;
  taux?: string;
  dureeCredit?: string;
  typeCredit?: string;
  tauxCouverture?: string;
  ratio?: string;
  sponsorPrincipal?: string;
  nomSPV?: string;
  constructeurEPC?: string;
  operateurOM?: string;
  technologie?: string;
  capaciteInstallee?: string;
  dureeProjet?: string;
  periodeAmorce?: string;
  periodeRemboursement?: string;
  debutConstruction?: string;
  finConstruction?: string;
  structureCapitalePrincipale?: string;
  scoreGlobal?: string;
  grade?: string;
}

function ReadOnlyField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300">
        {value || "-"}
      </div>
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setProjectId(id);
        const response = await fetch(`/api/projects/${id}`);
        if (!response.ok) throw new Error("Failed to fetch project");
        const data = await response.json();
        setProject(data.data || data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load project");
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    resolveAndFetch();
  }, [params]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-400" size={40} />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
          <span>Retour aux projets</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || "Projet non trouvé"}
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "identification",
      label: "Identification",
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <ReadOnlyField label="Nom du projet" value={project.nom} />
            </div>
            <div className="md:col-span-2">
              <ReadOnlyField label="Description" value={project.description} />
            </div>
            <ReadOnlyField label="Secteur" value={project.secteur} />
            <ReadOnlyField
              label="Statut"
              value={project.status}
            />
            <ReadOnlyField label="Code pays" value={project.countryCode} />
          </div>
        </div>
      ),
    },
    {
      id: "localisation",
      label: "Localisation",
      icon: <MapPin size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Pays" value={project.pays} />
          </div>
        </div>
      ),
    },
    {
      id: "finances",
      label: "Finances",
      icon: <DollarSign size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Montant (MAD)" value={project.montant?.toString()} />
            <ReadOnlyField label="Devise" value={project.devise} />
            <ReadOnlyField label="Coût total (MAD)" value={project.coutTotal?.toString()} />
            <ReadOnlyField label="Financement (MAD)" value={project.financement?.toString()} />
            <ReadOnlyField label="Apport propre (MAD)" value={project.apportPropre?.toString()} />
            <ReadOnlyField label="Taux (%)" value={project.taux?.toString()} />
            <ReadOnlyField label="Type de crédit" value={project.typeCredit} />
            <ReadOnlyField label="Durée du crédit (ans)" value={project.dureeCredit?.toString()} />
            <ReadOnlyField label="Taux de couverture (%)" value={project.tauxCouverture?.toString()} />
            <ReadOnlyField label="Ratio" value={project.ratio?.toString()} />
          </div>
        </div>
      ),
    },
    {
      id: "technique",
      label: "Technique",
      icon: <Zap size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Sponsor principal" value={project.sponsorPrincipal} />
            <ReadOnlyField label="Nom du SPV" value={project.nomSPV} />
            <ReadOnlyField label="Constructeur EPC" value={project.constructeurEPC} />
            <ReadOnlyField label="Opérateur O&M" value={project.operateurOM} />
            <ReadOnlyField label="Technologie" value={project.technologie} />
            <ReadOnlyField label="Capacité installée (MW)" value={project.capaciteInstallee?.toString()} />
            <ReadOnlyField label="Durée du projet (ans)" value={project.dureeProjet?.toString()} />
            <ReadOnlyField label="Période d'amorce (ans)" value={project.periodeAmorce?.toString()} />
            <ReadOnlyField label="Période de remboursement (ans)" value={project.periodeRemboursement?.toString()} />
          </div>
        </div>
      ),
    },
    {
      id: "dates",
      label: "Calendrier",
      icon: <FileText size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Début de construction" value={project.debutConstruction} />
            <ReadOnlyField label="Fin de construction" value={project.finConstruction} />
          </div>
        </div>
      ),
    },
    {
      id: "structure",
      label: "Structure Capital",
      icon: <Users size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <ReadOnlyField label="Structure capitaleprincipale" value={project.structureCapitalePrincipale} />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "evaluation",
      label: "Évaluation",
      icon: <BarChart3 size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReadOnlyField label="Score global" value={project.scoreGlobal?.toString()} />
            <ReadOnlyField label="Grade" value={project.grade} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/projects"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{project.nom}</h1>
            <p className="text-slate-400 mt-1 text-sm">ID: {project.id}</p>
          </div>
        </div>
        <button
          onClick={() =>
            projectId && router.push(`/projects/${projectId}/edit`)
          }
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Edit2 size={20} />
          <span>Modifier</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <Tabs tabs={tabs} defaultTab="identification" />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Link
          href="/projects"
          className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour</span>
        </Link>
      </div>
    </div>
  );
}
