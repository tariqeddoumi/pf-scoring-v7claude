"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SECTEURS } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    secteur: SECTEURS[0],
    montant: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "montant" ? parseFloat(value) || "" : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de la création");
      }

      const data = await res.json();
      alert("Projet créé avec succès !");
      router.push(`/projects`);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la création du projet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/projects" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nouveau projet</h1>
          <p className="mt-2 text-muted-foreground">
            Créez un nouveau projet de financement
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom du projet */}
            <div>
              <label htmlFor="nom" className="block text-sm font-medium mb-2">
                Nom du projet *
              </label>
              <Input
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex: Parc Éolien Taourirt"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez le projet en détail..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                rows={4}
                required
              />
            </div>

            {/* Secteur */}
            <div>
              <label htmlFor="secteur" className="block text-sm font-medium mb-2">
                Secteur *
              </label>
              <select
                id="secteur"
                name="secteur"
                value={formData.secteur}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                required
              >
                {SECTEURS.map((secteur) => (
                  <option key={secteur} value={secteur}>
                    {secteur}
                  </option>
                ))}
              </select>
            </div>

            {/* Montant */}
            <div>
              <label htmlFor="montant" className="block text-sm font-medium mb-2">
                Montant (MAD) *
              </label>
              <Input
                id="montant"
                name="montant"
                type="number"
                value={formData.montant}
                onChange={handleChange}
                placeholder="Ex: 500000000"
                required
              />
              {formData.montant && (
                <p className="text-xs text-muted-foreground mt-2">
                  {(parseInt(String(formData.montant)) / 1000000).toFixed(0)}M MAD
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Création..." : "Créer le projet"}
              </Button>
              <Link href="/projects" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Annuler
                </Button>
              </Link>
            </div>
          </form>
        </Card>

        {/* Info */}
        <Card className="mt-6 p-4 bg-secondary/50">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Une fois créé, vous pourrez scorer le projet selon les 8 catégories de risque (Financier, Technique, Marché, Environnemental, Social, Gouvernance, Juridique, Pays).
          </p>
        </Card>
      </div>
    </div>
  );
}
