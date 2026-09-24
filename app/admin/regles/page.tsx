"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Ban, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import {
  SEVERITE_LABELS,
  TYPES_REGLE,
  actionRegle,
  estBloquante,
  typeRegle,
  type Severite,
} from "@/lib/services/scoring/rule-vocabulary";
import { validateConditionExpression } from "@/lib/services/scoring/condition-evaluator";
import { champReconnu } from "@/lib/services/scoring/condition-context";
import { extractConditionFields } from "@/lib/services/scoring/condition-evaluator";

interface Regle {
  id: string;
  code: string;
  label: string;
  ruleType: string;
  actionType: string;
  severity: string;
  penaltyValue: number | null;
  conditionExpression: string | null;
  blocking?: boolean | null;
  messageUser?: string | null;
  node?: { id: string; code: string; label: string } | null;
}

interface Version {
  id: string;
  versionNumber?: number;
  label?: string;
  status?: string;
  isPublished?: boolean;
}

/**
 * Vue d'ensemble des règles du modèle, seuils NO-GO compris.
 *
 * Les seuils rédhibitoires étaient saisis dans un écran qui les rangeait dans le
 * navigateur de l'administrateur et qu'aucun calcul ne relisait : ils n'ont jamais
 * bloqué un dossier. Ils sont désormais des règles comme les autres, évaluées par le
 * moteur — mais elles ne se voyaient qu'une par une, au fond de l'éditeur de grille.
 * Cet écran les rassemble et signale celles qui ne se déclencheront jamais.
 */
export default function ReglesPage() {
  const router = useRouter();
  const [regles, setRegles] = useState<Regle[]>([]);
  const [version, setVersion] = useState<Version | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    try {
      const resModeles = await apiGet("/api/admin/scoring/models");
      if (resModeles.status === 401) return router.push("/login");
      if (resModeles.status === 403) return router.push("/");

      const modeles = (await resModeles.json()).data ?? [];
      if (modeles.length === 0) {
        setErreur("Aucun modèle de scoring n'est défini.");
        return;
      }

      const resVersions = await apiGet(
        `/api/admin/scoring/models/${modeles[0].id}/versions`
      );
      const versions: Version[] = (await resVersions.json()).data ?? [];
      const publiee = versions.find((v) => v.isPublished) ?? versions[0];
      if (!publiee) {
        setErreur("Ce modèle ne comporte aucune version.");
        return;
      }
      setVersion(publiee);

      const resRegles = await apiGet(
        `/api/admin/scoring/rules?versionId=${publiee.id}`
      );
      setRegles((await resRegles.json()).data ?? []);
    } catch {
      setErreur("Impossible de charger les règles.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    charger();
  }, [charger]);

  /** Règles qui ne produiront jamais d'effet, et pourquoi. */
  const inertes = useMemo(() => {
    const out: { regle: Regle; raison: string }[] = [];
    for (const r of regles) {
      const condition = validateConditionExpression(r.conditionExpression);
      if (!condition.valid) {
        out.push({ regle: r, raison: `condition illisible — ${condition.error}` });
        continue;
      }
      const inconnus = extractConditionFields(r.conditionExpression).filter(
        (c) => !champReconnu(c)
      );
      if (inconnus.length > 0) {
        out.push({
          regle: r,
          raison: `champ inexistant : ${inconnus.map((c) => `« ${c} »`).join(", ")}`,
        });
        continue;
      }
      if (r.conditionExpression?.trim().toLowerCase() === "true") {
        out.push({
          regle: r,
          raison: "condition toujours vraie — la règle s'applique à tous les dossiers",
        });
        continue;
      }
      const action = actionRegle(r.actionType);
      if (!typeRegle(r.ruleType)) {
        out.push({ regle: r, raison: `type « ${r.ruleType} » inconnu du moteur` });
      } else if (!action) {
        out.push({ regle: r, raison: `action « ${r.actionType} » inconnue du moteur` });
      } else if (action.exigeMalus && !r.penaltyValue) {
        out.push({ regle: r, raison: "malus à zéro : aucun effet sur la note" });
      }
    }
    return out;
  }, [regles]);

  const parType = useMemo(() => {
    const groupes = new Map<string, Regle[]>();
    for (const r of regles) {
      const liste = groupes.get(r.ruleType) ?? [];
      liste.push(r);
      groupes.set(r.ruleType, liste);
    }
    return groupes;
  }, [regles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          Paramétrage
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">
          Règles et seuils rédhibitoires
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Toutes les règles du modèle{" "}
          {version?.label ?? `version ${version?.versionNumber ?? "?"}`}, quel que soit
          le critère auquel elles sont rattachées. Les règles s&apos;éditent depuis{" "}
          <Link
            href="/admin/scoring-grid-v7pp"
            className="text-primary hover:underline"
          >
            l&apos;éditeur de grille
          </Link>
          , sur le critère concerné.
        </p>
      </div>

      {erreur && (
        <Card className="border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {erreur}
        </Card>
      )}

      {inertes.length > 0 && (
        <Card className="border-warning/40 bg-warning/10 p-4">
          <div className="flex items-center gap-2 text-warning font-medium mb-2">
            <AlertTriangle size={16} />
            {inertes.length} règle{inertes.length > 1 ? "s" : ""} sans effet
          </div>
          <ul className="text-sm text-warning/90 space-y-1">
            {inertes.map(({ regle, raison }) => (
              <li key={regle.id}>
                <code className="text-xs">{regle.code}</code> — {raison}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {regles.length === 0 && !erreur && (
        <Card className="p-6 text-center">
          <p className="text-foreground font-medium">Aucune règle n&apos;est définie.</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            Aucun seuil rédhibitoire n&apos;est donc opposable aujourd&apos;hui : un
            dossier ne peut être bloqué que par la décision d&apos;un analyste. Les
            seuils se créent sur le critère concerné depuis{" "}
            <Link
              href="/admin/scoring-grid-v7pp"
              className="text-primary hover:underline"
            >
              l&apos;éditeur de grille
            </Link>
            , onglet « Règles ».
          </p>
        </Card>
      )}

      {TYPES_REGLE.filter((t) => parType.has(t.code)).map((type) => (
        <div key={type.code} className="space-y-2">
          <div>
            <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
              {type.bloquant && <Ban size={14} className="text-destructive" />}
              {type.label}
              <span className="text-muted-foreground font-normal">
                ({parType.get(type.code)!.length})
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">{type.effet}</p>
          </div>

          {parType.get(type.code)!.map((r) => {
            const action = actionRegle(r.actionType);
            const malus = action?.exigeMalus ? (r.penaltyValue ?? 0) : 0;
            return (
              <Card key={r.id} className="p-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-foreground font-medium">
                    {r.label || r.code}
                  </span>
                  <code className="text-xs text-muted-foreground">{r.code}</code>
                  {r.node && (
                    <span className="text-xs text-muted-foreground">
                      · {r.node.code} {r.node.label}
                    </span>
                  )}
                  {estBloquante(r) && (
                    <span className="text-xs bg-destructive/15 text-destructive px-2 py-0.5 rounded">
                      Bloquante
                    </span>
                  )}
                  {malus > 0 && (
                    <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded">
                      −{malus} pts
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {SEVERITE_LABELS[r.severity as Severite] ?? r.severity}
                  </span>
                </div>
                <code className="block mt-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 break-all">
                  {r.conditionExpression || "— aucune condition —"}
                </code>
                {r.messageUser && (
                  <p className="text-xs text-muted-foreground mt-1">{r.messageUser}</p>
                )}
              </Card>
            );
          })}
        </div>
      ))}

      {/* Les types que le moteur ne connaît pas ne figurent dans aucun groupe ci-dessus. */}
      {Array.from(parType.keys())
        .filter((code) => !typeRegle(code))
        .map((code) => (
          <Card key={code} className="border-destructive/40 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              {parType.get(code)!.length} règle
              {parType.get(code)!.length > 1 ? "s" : ""} de type « {code} », que le
              moteur ne reconnaît pas : elles sont enregistrées mais sans effet.
            </p>
          </Card>
        ))}
    </div>
  );
}
