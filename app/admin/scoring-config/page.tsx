"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Domain {
  id: string;
  code: string;
  label: string;
  description?: string;
  isActive: boolean;
  weight: number;
  orderIndex: number;
}

interface Criterion {
  id: string;
  code: string;
  label: string;
  type: string;
  isActive: boolean;
  domainId: string;
}

export default function ScoringConfigPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const res = await fetch("/api/admin/domains");
      if (res.ok) {
        const data = await res.json();
        setDomains(data);
        if (data.length > 0) {
          setSelectedDomain(data[0]);
          fetchCriteria(data[0].id);
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCriteria = async (domainId: string) => {
    try {
      const res = await fetch(`/api/admin/domains/${domainId}/criteria`);
      if (res.ok) {
        const data = await res.json();
        setCriteria(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const toggleDomain = async (domainId: string, isActive: boolean) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/domains/${domainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        const updatedDomains = domains.map((d) =>
          d.id === domainId ? { ...d, isActive: !isActive } : d
        );
        setDomains(updatedDomains);
        if (selectedDomain?.id === domainId) {
          setSelectedDomain({ ...selectedDomain, isActive: !isActive });
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const updateWeight = async (domainId: string, newWeight: number) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/domains/${domainId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight: newWeight }),
      });

      if (res.ok) {
        const updatedDomains = domains.map((d) =>
          d.id === domainId ? { ...d, weight: newWeight } : d
        );
        setDomains(updatedDomains);
        if (selectedDomain?.id === domainId) {
          setSelectedDomain({ ...selectedDomain, weight: newWeight });
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = domains.reduce((sum, d) => sum + (d.isActive ? d.weight : 0), 0);
  const isWeightValid = Math.abs(totalWeight - 1.0) < 0.01; // Allow small rounding errors

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Configuration du Scoring</h1>
            <p className="mt-2 text-muted-foreground">
              Activez/désactivez les domaines et ajustez leurs poids
            </p>
          </div>
        </div>

        {/* Weight Status */}
        <Card
          className={`mb-8 p-6 ${
            isWeightValid
              ? "bg-green-950/30 border-green-700"
              : "bg-red-950/30 border-red-700"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              isWeightValid ? "text-green-200" : "text-red-200"
            }`}
          >
            {isWeightValid
              ? `✅ Total des poids: ${totalWeight.toFixed(3)}`
              : `❌ Total des poids: ${totalWeight.toFixed(3)} (doit être 1.0)`}
          </p>
        </Card>

        {/* Domains Table */}
        <Card className="p-6">
          <h2 className="font-semibold mb-6 text-lg">Domaines de Scoring</h2>

          <div className="space-y-4">
            {domains.map((domain) => (
              <div
                key={domain.id}
                className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={domain.isActive}
                        onChange={() =>
                          toggleDomain(domain.id, domain.isActive)
                        }
                        disabled={saving}
                        className="w-4 h-4 rounded cursor-pointer"
                      />
                      <div>
                        <h3 className="font-semibold">{domain.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {domain.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {domain.isActive && (
                      <div className="inline-block bg-green-100/20 text-green-200 px-2 py-1 rounded text-xs font-medium">
                        Actif
                      </div>
                    )}
                  </div>
                </div>

                {domain.isActive && (
                  <div className="ml-7 flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground">
                        Poids ({(domain.weight * 100).toFixed(1)}%)
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={domain.weight.toFixed(3)}
                          onChange={(e) => {
                            const newWeight = parseFloat(e.target.value) || 0;
                            updateWeight(domain.id, newWeight);
                          }}
                          disabled={saving}
                          className="w-24"
                        />
                        <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (domain.weight / (totalWeight || 1)) * 100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Criteria Details */}
        {selectedDomain && (
          <Card className="mt-8 p-6">
            <h2 className="font-semibold mb-6 text-lg">
              Critères - {selectedDomain.label}
            </h2>

            {criteria.length === 0 ? (
              <p className="text-muted-foreground">
                Aucun critère configuré pour ce domaine
              </p>
            ) : (
              <div className="space-y-3">
                {criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className="border rounded p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{criterion.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Type: {criterion.type}
                      </p>
                    </div>
                    {!criterion.isActive && (
                      <span className="text-xs bg-red-100/20 text-red-200 px-2 py-1 rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Link href="/admin">
            <Button variant="outline">Retour</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
