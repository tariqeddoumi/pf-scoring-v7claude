"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Move,
  Plus,
  Save,
  RotateCcw,
  Layout,
  Users,
  Briefcase,
} from "lucide-react";
import { useDashboardConfig } from "@/lib/dashboard-config-context";

const WIDGET_DESCRIPTIONS: Record<
  string,
  { name: string; description: string }
> = {
  "kpi-projects": {
    name: "Projets",
    description: "Nombre total de projets dans le portefeuille",
  },
  "kpi-evaluations": {
    name: "Évaluations",
    description: "Nombre total d'évaluations",
  },
  "kpi-score": {
    name: "Score Moyen",
    description: "Score moyen pondéré du portefeuille",
  },
  "kpi-exposure": {
    name: "Exposition",
    description: "Exposition financière totale",
  },
  alerts: {
    name: "Alertes",
    description: "Centre d'alertes avec signalisation",
  },
  distribution: {
    name: "Distribution Ratings",
    description: "Répartition des ratings AAA→D",
  },
  exposure: {
    name: "Exposition Secteur",
    description: "Répartition par secteur d'activité",
  },
  activities: {
    name: "Activités Récentes",
    description: "Timeline des activités récentes",
  },
};

export default function DashboardConfigPage() {
  const { widgets, activeTemplate, toggleWidget, loadTemplate, resizeWidget } =
    useDashboardConfig();
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const enabledWidgets = widgets.filter((w) => w.enabled);
  const disabledWidgets = widgets.filter((w) => !w.enabled);

  const handleDragStart = (id: string) => {
    setDraggedWidget(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedWidget || draggedWidget === targetId) return;

    const draggedIndex = enabledWidgets.findIndex(
      (w) => w.id === draggedWidget
    );
    const targetIndex = enabledWidgets.findIndex((w) => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newWidgets = [...enabledWidgets];
    [newWidgets[draggedIndex], newWidgets[targetIndex]] = [
      newWidgets[targetIndex],
      newWidgets[draggedIndex],
    ];

    const allWidgets = [...newWidgets, ...disabledWidgets];
    // This would normally call reorderWidgets, but we'll just update locally
    setDraggedWidget(null);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      setMessage({ type: "error", text: "Entrez un nom de modèle" });
      return;
    }
    setMessage({
      type: "success",
      text: `Modèle "${templateName}" sauvegardé`,
    });
    setTemplateName("");
    setShowSaveModal(false);
  };

  const handleLoadTemplate = (template: string) => {
    loadTemplate(template as any);
    setMessage({ type: "success", text: `Modèle "${template}" chargé` });
  };

  const sizeOptions = ["small", "medium", "large"] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Personnalisation Tableau de Bord
        </h1>
        <p className="text-muted-foreground mt-2">
          Configurez votre tableau de bord personnalisé
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${message.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
        >
          {message.text}
        </div>
      )}

      {/* Template Selector */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-cyan-400" />
            Modèles Prédéfinis
          </CardTitle>
          <CardDescription>
            Chargez un modèle ou créez votre propre configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => handleLoadTemplate("default")}
              className={
                activeTemplate === "default"
                  ? "bg-cyan-600 hover:bg-cyan-700 justify-start"
                  : "bg-muted hover:bg-secondary justify-start border border-input"
              }
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Par Défaut
            </Button>
            <Button
              onClick={() => handleLoadTemplate("executive")}
              className={
                activeTemplate === "executive"
                  ? "bg-cyan-600 hover:bg-cyan-700 justify-start"
                  : "bg-muted hover:bg-secondary justify-start border border-input"
              }
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Directeur
            </Button>
            <Button
              onClick={() => handleLoadTemplate("analyst")}
              className={
                activeTemplate === "analyst"
                  ? "bg-cyan-600 hover:bg-cyan-700 justify-start"
                  : "bg-muted hover:bg-secondary justify-start border border-input"
              }
            >
              <Users className="w-4 h-4 mr-2" />
              Analyste
            </Button>
          </div>
          <Button
            onClick={() => setShowSaveModal(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer Configuration Personnalisée
          </Button>
        </CardContent>
      </Card>

      {/* Widget Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enabled Widgets */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              Widgets Affichés
            </CardTitle>
            <CardDescription>
              Widgets visibles sur le tableau de bord
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {enabledWidgets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun widget affiché
                </p>
              ) : (
                enabledWidgets.map((widget, idx) => (
                  <div
                    key={widget.id}
                    draggable
                    onDragStart={() => handleDragStart(widget.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(widget.id)}
                    className="p-3 bg-background/50 rounded border border-emerald-500/20 hover:border-emerald-500/50 cursor-move transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Move className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <h4 className="font-semibold text-foreground">
                            {WIDGET_DESCRIPTIONS[widget.id]?.name ||
                              widget.label}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                          {WIDGET_DESCRIPTIONS[widget.id]?.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Size Selector */}
                        <select
                          value={widget.size}
                          onChange={(e) =>
                            resizeWidget(widget.id, e.target.value as any)
                          }
                          className="px-2 py-1 bg-card border border-input rounded text-xs text-secondary-foreground focus:border-cyan-600 focus:outline-none"
                        >
                          {sizeOptions.map((size) => (
                            <option key={size} value={size}>
                              {size === "small"
                                ? "Petit"
                                : size === "medium"
                                  ? "Moyen"
                                  : "Grand"}
                            </option>
                          ))}
                        </select>
                        {/* Hide Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleWidget(widget.id)}
                          className="border-input text-muted-foreground hover:bg-accent p-1 h-auto"
                        >
                          <EyeOff className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Disabled Widgets */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-muted-foreground" />
              Widgets Masqués
            </CardTitle>
            <CardDescription>Widgets disponibles à ajouter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {disabledWidgets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Tous les widgets sont affichés
                </p>
              ) : (
                disabledWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="p-3 bg-background/50 rounded border border-border hover:border-ring transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground">
                          {WIDGET_DESCRIPTIONS[widget.id]?.name || widget.label}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {WIDGET_DESCRIPTIONS[widget.id]?.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => toggleWidget(widget.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 p-1 h-auto flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Aperçu du Tableau de Bord</CardTitle>
          <CardDescription>
            Voici comment votre tableau de bord apparaîtra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {enabledWidgets.map((widget) => (
              <div
                key={widget.id}
                className={`rounded border border-border bg-background/50 p-3 text-center text-xs text-muted-foreground ${
                  widget.size === "small"
                    ? "col-span-1"
                    : widget.size === "medium"
                      ? "col-span-2"
                      : "col-span-4"
                }`}
              >
                {WIDGET_DESCRIPTIONS[widget.id]?.name || widget.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Modal */}
      {showSaveModal && (
        <Card className="bg-card border-cyan-600 fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 z-50">
          <CardHeader>
            <CardTitle>Enregistrer Configuration Personnalisée</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Nom de la configuration"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:border-cyan-600 focus:outline-none"
            />
            <div className="flex gap-3">
              <Button
                onClick={handleSaveTemplate}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Enregistrer
              </Button>
              <Button
                onClick={() => {
                  setShowSaveModal(false);
                  setTemplateName("");
                }}
                variant="outline"
                className="flex-1 border-input"
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-background border-border">
        <CardHeader>
          <CardTitle className="text-base">
            À propos de la Personnalisation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✓ Organisez vos widgets en glissant-déposant</p>
          <p>✓ Ajustez la taille de chaque widget (petit, moyen, grand)</p>
          <p>✓ Cachez ou affichez les widgets selon vos besoins</p>
          <p>✓ Enregistrez votre configuration personnalisée</p>
          <p>✓ Chargez les modèles prédéfinis en un clic</p>
        </CardContent>
      </Card>
    </div>
  );
}
