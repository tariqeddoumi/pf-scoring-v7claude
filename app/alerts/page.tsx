"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  Info,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { useAlerts } from "@/lib/alert-context";

export default function AlertsPage() {
  const { alerts, unreadCount, markAsRead, markAllAsRead, deleteAlert } =
    useAlerts();

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "border-destructive/50 bg-destructive/10",
      warning: "border-yellow-500/50 bg-warning/10",
      info: "border-ring/50 bg-primary/10",
    };
    return colors[severity] || "border-input bg-muted";
  };

  const getSeverityIcon = (severity: string) => {
    const icons: Record<string, React.ReactNode> = {
      critical: <AlertCircle className="text-destructive" size={20} />,
      warning: <AlertCircle className="text-warning" size={20} />,
      info: <Info className="text-primary" size={20} />,
    };
    return icons[severity] || <Info size={20} />;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      score_low: "Score Faible",
      nogo_triggered: "NO-GO Déclenché",
      dscr_breach: "Breache DSCR",
      equity_low: "Equity Faible",
      deadline: "Deadline",
      document_missing: "Document Manquant",
    };
    return labels[type] || type;
  };

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Alertes & Notifications
          </h1>
          <p className="text-muted-foreground mt-2">Gerez vos alertes système</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg transition-all"
          >
            Marquer tout comme lu
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          label="Total Alertes"
          value={alerts.length.toString()}
          icon="🔔"
        />
        <Card label="Non Lues" value={unreadCount.toString()} icon="⚠️" />
        <Card label="Critiques" value={criticalCount.toString()} icon="🔴" />
        <Card
          label="Avertissements"
          value={warningCount.toString()}
          icon="🟡"
        />
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <CheckCircle className="mx-auto text-success mb-3" size={32} />
            <p className="text-foreground font-semibold">Aucune alerte</p>
            <p className="text-muted-foreground text-sm mt-1">Vous êtes à jour!</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-4 transition-all ${getSeverityColor(alert.severity)} ${
                !alert.read ? "ring-2 ring-cyan-500" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {alert.projectName}
                      </span>
                      {!alert.read && (
                        <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-secondary-foreground">{alert.message}</p>
                    <div className="flex items-center space-x-2 mt-2 text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-1 rounded">
                        {getTypeLabel(alert.type)}
                      </span>
                      <span>
                        {new Date(alert.createdAt).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {alert.actionUrl && (
                    <Link
                      href={alert.actionUrl}
                      className="p-2 text-primary hover:bg-accent rounded-lg transition-colors"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      if (!alert.read) markAsRead(alert.id);
                      deleteAlert(alert.id);
                    }}
                    className="p-2 text-destructive hover:bg-accent rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-lg bg-gradient-to-br from-background to-muted border border-border p-6">
      <p className="text-sm text-muted-foreground mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <p className="text-3xl font-bold text-foreground">{value}</p>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
