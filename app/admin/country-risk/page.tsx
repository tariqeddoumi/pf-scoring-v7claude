"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Country {
  id: string;
  code: string;
  label: string;
  riskScore: number;
}

interface CountryRiskConfig {
  mode: "AUTO_ASSIGN" | "MANUAL";
}

export default function CountryRiskPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [config, setConfig] = useState<CountryRiskConfig>({ mode: "AUTO_ASSIGN" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCountries();
    fetchConfig();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await fetch("/api/admin/countries");
      if (res.ok) {
        const data = await res.json();
        setCountries(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/admin/config/country-risk-mode");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const updateCountryRisk = async (countryId: string, newScore: number) => {
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/countries/${countryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riskScore: newScore }),
      });

      if (res.ok) {
        const updatedCountries = countries.map((c) =>
          c.id === countryId ? { ...c, riskScore: newScore } : c
        );
        setCountries(updatedCountries);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const updateMode = async (newMode: "AUTO_ASSIGN" | "MANUAL") => {
    try {
      setSaving(true);
      const res = await fetch("/api/admin/config/country-risk-mode", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });

      if (res.ok) {
        setConfig({ mode: newMode });
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const filteredCountries = countries.filter((c) =>
    c.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold">Risque Pays</h1>
            <p className="mt-2 text-muted-foreground">
              Configurez les scores de risque par pays
            </p>
          </div>
        </div>

        {/* Mode Configuration */}
        <Card className="mb-8 p-6">
          <h2 className="font-semibold mb-4">Mode de Configuration</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="AUTO_ASSIGN"
                checked={config.mode === "AUTO_ASSIGN"}
                onChange={() => updateMode("AUTO_ASSIGN")}
                disabled={saving}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium">Assignation Automatique</p>
                <p className="text-sm text-muted-foreground">
                  Le score de risque pays est automatiquement assigné basé sur le
                  pays sélectionné lors de la création du projet
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="MANUAL"
                checked={config.mode === "MANUAL"}
                onChange={() => updateMode("MANUAL")}
                disabled={saving}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium">Assignation Manuelle</p>
                <p className="text-sm text-muted-foreground">
                  Les évaluateurs doivent manuellement assigner le score de risque
                  pays pendant l&apos;évaluation
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* Countries List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-lg">Scores de Risque Pays</h2>
            <div className="w-64">
              <Input
                placeholder="Rechercher un pays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredCountries.map((country) => (
              <div
                key={country.id}
                className="border rounded-lg p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
              >
                <div>
                  <p className="font-medium">{country.label}</p>
                  <p className="text-xs text-muted-foreground">{country.code}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={country.riskScore.toFixed(1)}
                        onChange={(e) => {
                          const newScore = parseFloat(e.target.value) || 0;
                          updateCountryRisk(country.id, newScore);
                        }}
                        disabled={saving}
                        className="w-20"
                      />
                      <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden min-w-32">
                        <div
                          className={`h-full transition-all ${
                            country.riskScore > 70
                              ? "bg-red-500"
                              : country.riskScore > 40
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${country.riskScore}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {country.riskScore.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCountries.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aucun pays trouvé
            </p>
          )}
        </Card>

        {/* Legend */}
        <Card className="mt-6 p-4 bg-secondary/50">
          <p className="text-xs text-muted-foreground mb-3 font-medium">
            Légende
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Faible risque (0-40)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Risque modéré (40-70)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Risque élevé (70-100)</span>
            </div>
          </div>
        </Card>

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
