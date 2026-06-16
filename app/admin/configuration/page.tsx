"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppConfig } from "@/components/providers/app-config-provider";

interface ConfigItem {
  key: string;
  value: string;
  type: string;
  category: string;
  description: string | null;
  isPublic: boolean;
  metadata: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  branding: "Identité de l'outil",
  theme: "Apparence & thème",
  behavior: "Comportement",
  scoring: "Moteur de scoring",
  screens: "Écrans & formulaires",
};

const CATEGORY_ORDER = ["branding", "theme", "behavior", "scoring", "screens"];

export default function ConfigurationPage() {
  const router = useRouter();
  const { refresh } = useAppConfig();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiGet("/api/admin/configuration");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.status === 403) {
          router.push("/admin");
          return;
        }
        const json = await res.json();
        setConfigs(json.data?.configs ?? []);
      } catch {
        setError("Impossible de charger la configuration.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleSave = async (key: string) => {
    const value = drafts[key];
    if (value === undefined) return;
    setSaving(key);
    setError(null);
    try {
      const res = await apiPut(`/api/admin/configuration/${key}`, { value });
      if (!res.ok) {
        setError("Échec de l'enregistrement.");
        return;
      }
      const json = await res.json();
      setConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, value: json.data.value } : c))
      );
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await refresh();
      setSaved(key);
      setTimeout(() => setSaved((s) => (s === key ? null : s)), 2000);
    } catch {
      setError("Échec de l'enregistrement.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: configs.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Paramétrage</h1>
          <p className="mt-1 text-muted-foreground">
            Nom de l&apos;outil, couleurs, police et thème — appliqués en direct.
          </p>
        </div>
      </div>

      {error && (
        <Card className="mb-6 p-4 bg-destructive/10 border-destructive/40">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <div className="space-y-8">
        {byCategory.map((group) => (
          <section key={group.category}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              {CATEGORY_LABELS[group.category] ?? group.category}
            </h2>
            <Card className="divide-y divide-border">
              {group.items.map((item) => {
                const current = drafts[item.key] ?? item.value;
                const dirty = drafts[item.key] !== undefined && drafts[item.key] !== item.value;
                const options = item.type === "enum" && item.metadata
                  ? (JSON.parse(item.metadata) as string[])
                  : null;

                return (
                  <div key={item.key} className="p-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor={item.key} className="block mb-1">
                        {item.description || item.key}
                      </Label>
                      <p className="text-xs text-muted-foreground mb-2 font-mono">{item.key}</p>

                      {options ? (
                        <select
                          id={item.key}
                          value={current}
                          onChange={(e) =>
                            setDrafts((p) => ({ ...p, [item.key]: e.target.value }))
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {options.map((opt) => (
                            <option key={opt} value={opt} className="bg-background">
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : item.type === "bool" ? (
                        <select
                          id={item.key}
                          value={current === "true" ? "true" : "false"}
                          onChange={(e) =>
                            setDrafts((p) => ({ ...p, [item.key]: e.target.value }))
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="true" className="bg-background">Activé</option>
                          <option value="false" className="bg-background">Désactivé</option>
                        </select>
                      ) : item.type === "json" ? (
                        <textarea
                          id={item.key}
                          value={current}
                          rows={4}
                          spellCheck={false}
                          onChange={(e) =>
                            setDrafts((p) => ({ ...p, [item.key]: e.target.value }))
                          }
                          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {item.type === "color" && (
                            <span
                              className="h-9 w-9 shrink-0 rounded-md border border-border"
                              style={{ background: current || "transparent" }}
                            />
                          )}
                          <Input
                            id={item.key}
                            value={current}
                            placeholder={item.type === "color" ? "oklch(0.55 0.13 250)" : ""}
                            onChange={(e) =>
                              setDrafts((p) => ({ ...p, [item.key]: e.target.value }))
                            }
                            className={item.type === "color" ? "font-mono" : ""}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSave(item.key)}
                      disabled={!dirty || saving === item.key}
                      variant={dirty ? "default" : "outline"}
                      size="sm"
                      className="sm:w-32 shrink-0"
                    >
                      {saving === item.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : saved === item.key ? (
                        <>
                          <Check className="h-4 w-4 mr-1" /> Enregistré
                        </>
                      ) : (
                        "Enregistrer"
                      )}
                    </Button>
                  </div>
                );
              })}
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
