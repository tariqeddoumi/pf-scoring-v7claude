"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Edit2,
  Loader2,
  Building2,
  MapPin,
  Briefcase,
  Shield,
  Users,
  BarChart3,
} from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { apiGet } from "@/lib/api-client";

interface Client {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  secteur?: string;
  pays?: string;
  type?: string;
  description?: string;
  status: string;
  createdAt: string;
  // Extended fields
  raisonSociale?: string;
  nomCommercial?: string;
  typeClient?: string;
  formeJuridique?: string;
  segmentClientele?: string;
  effectifs?: number;
  capitalSocial?: number;
  chiffreAffaires?: number;
  ville?: string;
  adresse?: string;
  codePostal?: string;
  website?: string;
  centreAffaires?: string;
  gestionnaire?: string;
  ratingInterne?: string;
  statutBancaire?: string;
  dateRelation?: string;
  exposition?: number;
  statusKYC?: string;
  statusConformite?: string;
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const resolveAndFetch = async () => {
      try {
        const { id } = await params;
        setClientId(id);
        const response = await apiGet(`/api/clients/${id}`);
        if (!response.ok) throw new Error("Failed to fetch client");
        const data = await response.json();
        setClient(data.data || data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load client");
        setClient(null);
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

  if (error || !client) {
    return (
      <div className="space-y-6">
        <Link
          href="/clients"
          className="inline-flex items-center space-x-2 text-slate-400 hover:text-white"
        >
          <ArrowLeft size={20} />
          <span>Retour aux clients</span>
        </Link>
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error || "Client non trouvé"}
        </div>
      </div>
    );
  }

  const renderFieldValue = (value: any) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-slate-500 italic">Non renseigné</span>;
    }
    if (typeof value === "object" && value.toLocaleDateString) {
      return new Date(value).toLocaleDateString("fr-FR");
    }
    return value;
  };

  const tabs = [
    {
      id: "identity",
      label: "Identité & Admin",
      icon: <Building2 size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Nom du client
              </label>
              <p className="text-white">{renderFieldValue(client.nom)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Raison sociale
              </label>
              <p className="text-white">{renderFieldValue(client.raisonSociale)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Nom commercial
              </label>
              <p className="text-white">{renderFieldValue(client.nomCommercial)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Type de client
              </label>
              <p className="text-white">{renderFieldValue(client.typeClient)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Forme juridique
              </label>
              <p className="text-white">{renderFieldValue(client.formeJuridique)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Statut
              </label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                client.status === "Actif"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {renderFieldValue(client.status)}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "organisation",
      label: "Organisation & Secteur",
      icon: <Briefcase size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Secteur
              </label>
              <p className="text-white">{renderFieldValue(client.secteur)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Segment clientèle
              </label>
              <p className="text-white">{renderFieldValue(client.segmentClientele)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Effectifs
              </label>
              <p className="text-white">{renderFieldValue(client.effectifs)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Capital social (MAD)
              </label>
              <p className="text-white">{client.capitalSocial ? client.capitalSocial.toLocaleString("fr-FR") : renderFieldValue(null)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Chiffre d&apos;affaires (MAD)
              </label>
              <p className="text-white">{client.chiffreAffaires ? client.chiffreAffaires.toLocaleString("fr-FR") : renderFieldValue(null)}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Description / Activités
            </label>
            <p className="text-white whitespace-pre-wrap">{renderFieldValue(client.description)}</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Pays
              </label>
              <p className="text-white">{renderFieldValue(client.pays)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Ville
              </label>
              <p className="text-white">{renderFieldValue(client.ville)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Code postal
              </label>
              <p className="text-white">{renderFieldValue(client.codePostal)}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Adresse
            </label>
            <p className="text-white whitespace-pre-wrap">{renderFieldValue(client.adresse)}</p>
          </div>
        </div>
      ),
    },
    {
      id: "contact",
      label: "Contact",
      icon: <Users size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Email
              </label>
              <p className="text-white break-all">{renderFieldValue(client.email)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Téléphone
              </label>
              <p className="text-white">{renderFieldValue(client.telephone)}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Site web
              </label>
              <p className="text-white break-all">{renderFieldValue(client.website)}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "banking",
      label: "Relations Bancaires",
      icon: <BarChart3 size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Centre d&apos;affaires
              </label>
              <p className="text-white">{renderFieldValue(client.centreAffaires)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Gestionnaire
              </label>
              <p className="text-white">{renderFieldValue(client.gestionnaire)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Rating interne
              </label>
              <p className="text-white">{renderFieldValue(client.ratingInterne)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Statut bancaire
              </label>
              <p className="text-white">{renderFieldValue(client.statutBancaire)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Date du début de relation
              </label>
              <p className="text-white">{client.dateRelation ? new Date(client.dateRelation).toLocaleDateString("fr-FR") : renderFieldValue(null)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Exposition (MAD)
              </label>
              <p className="text-white">{client.exposition ? client.exposition.toLocaleString("fr-FR") : renderFieldValue(null)}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "kyc",
      label: "KYC & Conformité",
      icon: <Shield size={18} />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Statut KYC
              </label>
              <p className="text-white">{renderFieldValue(client.statusKYC)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                Statut conformité
              </label>
              <p className="text-white">{renderFieldValue(client.statusConformite)}</p>
            </div>
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
            href="/clients"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{client.nom}</h1>
            <p className="text-slate-400 mt-1 text-sm">ID: {client.id}</p>
          </div>
        </div>
        <button
          onClick={() => clientId && router.push(`/clients/${clientId}/edit`)}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Edit2 size={20} />
          <span>Modifier</span>
        </button>
      </div>

      {/* Tabs Content */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <Tabs tabs={tabs} defaultTab="identity" />
      </div>

      {/* Meta Information */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Informations système</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Créé le
            </label>
            <p className="text-white">
              {new Date(client.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Identifiant
            </label>
            <p className="text-white font-mono text-sm">{client.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
