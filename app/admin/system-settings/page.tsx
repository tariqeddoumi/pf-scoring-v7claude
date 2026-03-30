"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SystemSettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/admin"
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Paramètres Système</h1>
            <p className="mt-2 text-muted-foreground">
              Configurez les paramètres généraux de l'application
            </p>
          </div>
        </div>

        {/* Application Info */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4 text-lg">Informations de l'Application</h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Version</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Environnement</p>
              <p className="font-medium">Production</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Base de Données</p>
              <p className="font-medium">PostgreSQL (Supabase)</p>
            </div>
          </div>
        </Card>

        {/* Compliance */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4 text-lg">Conformité</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">IFC Performance Standards</p>
                <p className="text-xs text-muted-foreground">2012 (Latest)</p>
              </div>
              <span className="text-xs bg-green-100/20 text-green-200 px-2 py-1 rounded">
                Conforme
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">EBRD Environmental and Social Policy</p>
                <p className="text-xs text-muted-foreground">2015 (Latest)</p>
              </div>
              <span className="text-xs bg-green-100/20 text-green-200 px-2 py-1 rounded">
                Conforme
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Basel III Framework</p>
                <p className="text-xs text-muted-foreground">2010</p>
              </div>
              <span className="text-xs bg-green-100/20 text-green-200 px-2 py-1 rounded">
                Conforme
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Bank Al-Maghrib Standards</p>
                <p className="text-xs text-muted-foreground">Latest</p>
              </div>
              <span className="text-xs bg-green-100/20 text-green-200 px-2 py-1 rounded">
                Conforme
              </span>
            </div>
          </div>
        </Card>

        {/* Backup & Maintenance */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold mb-4 text-lg">Maintenance</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Dernière sauvegarde
              </p>
              <p className="font-medium">2026-03-30 14:30 UTC</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                Créer une sauvegarde
              </Button>
              <Button variant="outline" disabled>
                Restaurer une sauvegarde
              </Button>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/admin">
            <Button variant="outline">Retour</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
