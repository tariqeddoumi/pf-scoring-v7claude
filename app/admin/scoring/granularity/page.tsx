"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Check } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface DomainGranularityConfig {
  [domainCode: string]: "DOMAIN" | "CRITERION" | "SUB_CRITERION";
}

interface DomainInfo {
  id: string;
  code: string;
  label: string;
  depth: number;
}

const GRANULARITY_LEVELS = [
  {
    value: "DOMAIN" as const,
    label: "Au niveau du domaine (9 entrées totales)",
    description: "Saisir le score directement pour le domaine entier",
  },
  {
    value: "CRITERION" as const,
    label: "Au niveau du critère (28 entrées)",
    description: "Saisir le score au niveau critère (par défaut)",
  },
  {
    value: "SUB_CRITERION" as const,
    label: "Au niveau du sous-critère (84+ entrées)",
    description: "Saisir le score aux niveaux les plus détaillés",
  },
];

export default function ScoringGranularityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [config, setConfig] = useState<DomainGranularityConfig>({});
  const [drafts, setDrafts] = useState<DomainGranularityConfig>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch domains
        const domainsRes = await apiGet("/api/scoring/domains");
        if (domainsRes.status === 401) {
          router.push("/login");
          return;
        }
        if (domainsRes.status === 403) {
          router.push("/admin");
          return;
        }
        const domainsData = await domainsRes.json();
        const domainsList = domainsData.data || [];
        setDomains(domainsList);

        // Fetch current granularity config
        const configRes = await apiGet(
          "/api/admin/configuration/SCORING_DOMAIN_GRANULARITY"
        );
        if (configRes.ok) {
          const configData = await configRes.json();
          const parsed = configData.data?.value
            ? JSON.parse(configData.data.value)
            : {};
          setConfig(parsed);
        }
      } catch (err) {
        setError("Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleLevelChange = (
    domainCode: string,
    level: "DOMAIN" | "CRITERION" | "SUB_CRITERION"
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [domainCode]: level,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Merge current config with drafts
      const updated = { ...config, ...drafts };

      // Send as JSON string
      const res = await apiPut("/api/admin/configuration/SCORING_DOMAIN_GRANULARITY", {
        value: JSON.stringify(updated),
      });

      if (!res.ok) {
        setError("Échec de l'enregistrement.");
        return;
      }

      const json = await res.json();
      const newValue = JSON.parse(json.data.value);
      setConfig(newValue);
      setDrafts({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError("Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasDrafts = Object.keys(drafts).length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Granularité du scoring</h1>
          <p className="mt-1 text-muted-foreground">
            Configurez le niveau de saisie du score pour chaque domaine
          </p>
        </div>
      </div>

      {error && (
        <Card className="mb-6 p-4 bg-destructive/10 border-destructive/40">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* Info card */}
      <Card className="mb-8 p-4 bg-primary/5 border-primary/20">
        <p className="text-sm text-foreground">
          Pour chaque domaine, sélectionnez le niveau auquel les utilisateurs saisiront les scores.
          Par défaut (Critère) : 28 entrées. Domaine : 9 entrées. Sous-critère : 84+ entrées.
        </p>
      </Card>

      {/* Domains list */}
      <div className="space-y-4">
        {domains.map((domain) => {
          const currentLevel =
            drafts[domain.code] ?? config[domain.code] ?? "CRITERION";

          return (
            <Card key={domain.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{domain.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {domain.code}
                  </p>
                </div>

                <div className="w-80">
                  <Label htmlFor={`level-${domain.code}`} className="block mb-2">
                    Niveau de saisie
                  </Label>
                  <select
                    id={`level-${domain.code}`}
                    value={currentLevel}
                    onChange={(e) =>
                      handleLevelChange(
                        domain.code,
                        e.target.value as "DOMAIN" | "CRITERION" | "SUB_CRITERION"
                      )
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {GRANULARITY_LEVELS.map((level) => (
                      <option key={level.value} value={level.value} className="bg-background">
                        {level.label}
                      </option>
                    ))}
                  </select>

                  {/* Show description of selected level */}
                  <p className="text-xs text-muted-foreground mt-2">
                    {
                      GRANULARITY_LEVELS.find((l) => l.value === currentLevel)
                        ?.description
                    }
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Save button */}
      <div className="mt-8 flex justify-end gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasDrafts || saving}
          variant={hasDrafts ? "default" : "outline"}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" /> Enregistré
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Enregistrer
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
