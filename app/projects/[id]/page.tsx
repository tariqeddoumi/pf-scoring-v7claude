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
  Calendar,
} from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { Tabs } from "@/components/ui/Tabs";

interface Project {
  id: string;
  nom: string;
  description?: string;
  secteur?: string;
  pays?: string;
  montant?: number;
  devise?: string;
  status: string;
  dateCreation?: string;
  createdAt?: string;
  countryCode?: string;
  coutTotal?: number;
  financement?: number;
  apportPropre?: number;
  taux?: number;
  dureeCredit?: number;
  typeCredit?: string;
  tauxCouverture?: number;
  ratio?: number;
  sponsorPrincipal?: string;
  nomSPV?: string;
  constructeurEPC?: string;
  operateurOM?: string;
  technologie?: string;
  capaciteInstallee?: number;
  dureeProjet?: number;
  periodeAmorce?: number;
  periodeRemboursement?: number;
  debutConstruction?: string;
  finConstruction?: string;
  structureCapitalePrincipale?: string;
  scoreGlobal?: number;
  grade?: string;
}

const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
      {label}
    </label>
    <p className="text-white">
      {value !== null && value !== undefined && value !== "" ? value : (
        <span className="text-slate-500 italic">Non renseigné</span>
      )}
    </p>
  </div>
);

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : null;
const formatNum = (n?: number | null) =>
  n !== null && n !== undefined ? n.toLocaleString("fr-FR") : null;

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
        const response = await apiGet(`/api/projects/${id}`);
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
        <Link href="/projects" className="inline-flex items-center space-x-2 text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
          <span>Retour aux projets</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || "Projet non trouvé"}
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    brouillon: "bg-slate-500/20 text-slate-400",
    en_cours: "bg-blue-500/20 text-blue-400",
    en_revue: "bg-yellow-500/20 text-yellow-400",
    approuve: "bg-green-500/20 text-green-400",
    rejete: "bg-red-500/20 text-red-400",
  };

  const tabs = [
    {
      id: "identification",
      label: "Identification",
      icon: <FileText size={18} />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Nom du projet" value={project.nom} />
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Statut</label>
            <span className={`inline-block px-3 py-1 rounded-full text-sm ${statusColors[project.status] || "bg-slate-500/20 text-slate-400"}`}>
              {project.status}
            </span>
          </div>
          <Field label="Secteur" value={project.secteur} />
          <Field label="Code pays" value={project.countryCode} />
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Description</label>
            <p className="text-white whitespace-pre-wrap">{project.description || <span className="text-slate-500 italic">Non renseigné</span>}</p>
          </div>
        </div>
      ),
    },
    {
      id: "localisation",
      label: "Localisation",
      icon: <MapPin size={18} />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Pays" value={project.pays} />
        </div>
      ),
    },
    {
      id: "finances",
      label: "Finances",
      icon: <DollarSign size={18} />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Montant (MAD)" value={formatNum(project.montant)} />
          <Field label="Devise" value={project.devise} />
          <Field label="Coût total (MAD)" value={formatNum(project.coutTotal)} />
          <Field label="Financement (MAD)" value={formatNum(project.financement)} />
          <Field label="Apport propre (MAD)" value={formatNum(project.apportPropre)} />
          <Field label="Taux (%)" value={project.taux !== null && project.taux !== undefined ? `${project.taux}%` : null} />
          <Field label="Durée crédit (ans)" value={project.dureeCredit} />
          <Field label="Type de crédit" value={project.typeCredit} />
          <Field label="Taux de couverture" value={project.tauxCouverture} />
          <Field label="Ratio" value={project.ratio} />
        </div>
      ),
    },
    {
      id: "technique",
      label: "Technique",
      icon: <Zap size={18} />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Sponsor principal" value={project.sponsorPrincipal} />
          <Field label="Nom SPV" value={project.nomSPV} />
          <Field label="Constructeur EPC" value={project.constructeurEPC} />
          <Field label="Opérateur O&M" value={project.operateurOM} />
          <Field label="Technologie" value={project.technologie} />
          <Field label="Capacité installée (MW)" value={project.capaciteInstallee} />
          <Field label="Durée du projet (ans)" value={project.dureeProjet} />
          <Field label="Période amorce (mois)" value={project.periodeAmorce} />
          <Field label="Période remboursement (mois)" value={project.periodeRemboursement} />
        </div>
      ),
    },
    {
      id: "calendrier",
      label: "Calendrier",
      icon: <Calendar size={18} />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Début construction" value={formatDate(project.debutConstruction)} />
          <Field label="Fin construction" value={formatDate(project.finConstruction)} />
        </div>
      ),
    },
    {
      id: "structure",
      label: "Structure Capital",
      icon: <Users size={18} />,
      content: (
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Structure capitale principale
            </label>
            <p className="text-white whitespace-pre-wrap">
              {project.structureCapitalePrincipale || <span className="text-slate-500 italic">Non renseigné</span>}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "evaluation",
      label: "Évaluation",
      icon: <BarChart3 size={18} />,
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Score global" value={project.scoreGlobal} />
          <Field label="Grade" value={project.grade} />
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
          onClick={() => projectId && router.push(`/projects/${projectId}/edit`)}
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

      {/* Meta */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Informations système</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Créé le" value={formatDate(project.dateCreation || project.createdAt)} />
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Identifiant</label>
            <p className="text-white font-mono text-sm">{project.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
