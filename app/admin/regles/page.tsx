"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Ban, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  SEVERITE_LABELS,
  TYPES_REGLE,
  actionRegle,
  estBloquante,
  typeRegle,
  type Severite,
} from "@/lib/services/scoring/rule-vocabulary";
import {
  validateConditionExpression,
  extractConditionFields,
} from "@/lib/services/scoring/condition-evaluator";
import { champReconnu } from "@/lib/services/scoring/condition-context";
import { conditionEnFrancais } from "@/lib/services/scoring/condition-phrasing";
import { sansGeneration } from "@/lib/libelle-modele";

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

const TONS_SEVERITE: Record<string, string> = {
  CRITICAL: "bg-destructive-subtle text-destructive",
  HIGH: "bg-warning-subtle text-warning",
  MEDIUM: "bg-muted text-muted-foreground",
  LOW: "bg-muted text-muted-foreground",
};

/**
 * Vue d'ensemble des règles du modèle, seuils rédhibitoires compris.
 *
 * L'écran mettait en avant l'expression brute — « criteres.D7_SC3_SSC1.valeur < 1.10 »,
 * « !criteres.D9_SC1_SSC1.repondu » — soit la seule forme que le moteur comprenne,
 * mais pas celle qu'un responsable des risques peut relire : il ne pouvait donc pas
 * vérifier qu'une règle dit ce que la doctrine demande. Les règles sans effet étaient
 * annoncées en tête mais rien ne les distinguait dans la liste, et aucune ne menait
 * au critère qu'elle vise.
 */
export default function ReglesPage() {
  const router = useRouter();
  const [regles, setRegles] = useState<Regle[]>([]);
  const [noeuds, setNoeuds] = useState<Record<string, string>>({});
  const [versions, setVersions] = useState<Version[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const resModeles = await apiGet("/api/admin/scoring/models");
      if (resModeles.status === 401) return router.push("/login");
      if (resModeles.status === 403) return router.push("/");

      const modeles = (await resModeles.json()).data ?? [];
      if (modeles.length === 0) {
        setErreur("Aucun modèle de scoring n'est défini.");
        return;
      }
      // L'écran retenait le dernier modèle créé ; l'éditeur de grille, lui, cherche
      // le modèle Project Finance. Dès qu'un second modèle existait, les deux écrans
      // montraient les règles de modèles différents.
      const modele =
        modeles.find((m: { code?: string }) => m.code === "PF_V7PP") ?? modeles[0];

      const resVersions = await apiGet(
        `/api/admin/scoring/models/${modele.id}/versions`
      );
      const liste: Version[] = (await resVersions.json()).data ?? [];
      if (liste.length === 0) {
        setErreur("Ce modèle ne comporte aucune version.");
        return;
      }
      setVersions(liste);

      const choisie = versionId ?? (liste.find((v) => v.isPublished) ?? liste[0]).id;
      setVersionId(choisie);

      const [resRegles, resNoeuds] = await Promise.all([
        apiGet(`/api/admin/scoring/rules?versionId=${choisie}`),
        apiGet(`/api/admin/scoring/nodes?versionId=${choisie}&format=light`),
      ]);
      setRegles((await resRegles.json()).data ?? []);
      if (resNoeuds.ok) {
        const n: { code: string; label: string }[] = (await resNoeuds.json()).data ?? [];
        setNoeuds(Object.fromEntries(n.map((x) => [x.code, x.label])));
      }
    } catch {
      setErreur("Impossible de charger les règles.");
    } finally {
      setChargement(false);
    }
  }, [router, versionId]);

  useEffect(() => {
    charger();
  }, [charger]);

  const libelleCritere = useCallback((code: string) => noeuds[code], [noeuds]);

  /** Règles qui ne produiront jamais d'effet, et pourquoi. */
  const inertes = useMemo(() => {
    const out = new Map<string, string>();
    for (const r of regles) {
      const condition = validateConditionExpression(r.conditionExpression);
      if (!condition.valid) {
        out.set(r.id, `condition illisible — ${condition.error}`);
        continue;
      }
      const inconnus = extractConditionFields(r.conditionExpression).filter(
        (c) => !champReconnu(c)
      );
      if (inconnus.length > 0) {
        out.set(r.id, `champ inexistant : ${inconnus.map((c) => `« ${c} »`).join(", ")}`);
        continue;
      }
      // Un code de critère cité mais absent de la version ne se résoudra jamais :
      // la vérification des racines ne suffit pas à le détecter.
      const critereInconnu = extractConditionFields(r.conditionExpression)
        .filter((c) => c.startsWith("criteres."))
        .map((c) => c.split(".")[1])
        .find((code) => code && Object.keys(noeuds).length > 0 && !noeuds[code]);
      if (critereInconnu) {
        out.set(r.id, `critère « ${critereInconnu} » absent de cette version`);
        continue;
      }
      if (r.conditionExpression?.trim().toLowerCase() === "true") {
        out.set(r.id, "condition toujours vraie — la règle s'applique à tous les dossiers");
        continue;
      }
      const action = actionRegle(r.actionType);
      if (!typeRegle(r.ruleType)) out.set(r.id, `type « ${r.ruleType} » inconnu du moteur`);
      else if (!action) out.set(r.id, `action « ${r.actionType} » inconnue du moteur`);
      else if (action.exigeMalus && !r.penaltyValue) {
        out.set(r.id, "malus à zéro : aucun effet sur la note");
      }
    }
    return out;
  }, [regles, noeuds]);

  const versionActive = useMemo(
    () => versions.find((v) => v.id === versionId) ?? null,
    [versions, versionId]
  );

  const parType = useMemo(() => {
    const groupes = new Map<string, Regle[]>();
    for (const r of regles) {
      const liste = groupes.get(r.ruleType) ?? [];
      liste.push(r);
      groupes.set(r.ruleType, liste);
    }
    return groupes;
  }, [regles]);

  const compteurs = useMemo(() => {
    const bloquantes = regles.filter((r) => estBloquante(r)).length;
    const publication = regles.filter((r) => r.ruleType === "BLOCK_PUBLICATION").length;
    return { total: regles.length, bloquantes, publication, inertes: inertes.size };
  }, [regles, inertes]);

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        titre="Règles et seuils rédhibitoires"
        description="Toutes les règles du modèle, quel que soit le critère auquel elles sont rattachées."
        retour={{ href: "/admin", libelle: "Paramétrage" }}
        actions={
          versions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="version-regles" className="text-sm text-muted-foreground">
                Version
              </label>
              <select
                id="version-regles"
                value={versionId ?? ""}
                onChange={(e) => setVersionId(e.target.value)}
                className="h-9 max-w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:border-ring focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {sansGeneration(v.label) || `v${v.versionNumber}`}
                    {v.isPublished ? " — publiée" : ` — ${v.status ?? "brouillon"}`}
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {versionActive && !versionActive.isPublished && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
          Cette version n&apos;est pas publiée : ses règles ne s&apos;appliquent à aucun
          dossier tant qu&apos;elle ne l&apos;est pas.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tuile libelle="Règles" valeur={compteurs.total} />
        <Tuile libelle="Bloquantes" valeur={compteurs.bloquantes} />
        <Tuile libelle="Bloquent la publication" valeur={compteurs.publication} />
        <Tuile
          libelle="Sans effet"
          valeur={compteurs.inertes}
          alerte={compteurs.inertes > 0}
        />
      </div>

      {regles.length === 0 && !erreur ? (
        <SectionCard sansPadding>
          <EmptyState
            icone={<Ban size={28} />}
            titre="Aucune règle n'est définie"
            description="Aucun seuil rédhibitoire n'est donc opposable : un dossier ne peut être bloqué que par la décision d'un analyste. Les seuils se créent sur le critère concerné, depuis l'éditeur de grille."
            action={{ href: "/admin/grille-scoring", libelle: "Ouvrir l'éditeur de grille" }}
          />
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {TYPES_REGLE.filter((t) => parType.has(t.code)).map((type) => (
            <SectionCard
              key={type.code}
              titre={`${type.label} (${parType.get(type.code)!.length})`}
              description={type.effet}
              sansPadding
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Règle", "Critère visé", "Condition", "Effet", "Gravité"].map(
                      (t, i) => (
                        <th
                          key={i}
                          className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                        >
                          {t}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {parType.get(type.code)!.map((r) => {
                    const action = actionRegle(r.actionType);
                    const malus = action?.exigeMalus ? (r.penaltyValue ?? 0) : 0;
                    const raisonInerte = inertes.get(r.id);
                    const phrase = conditionEnFrancais(
                      r.conditionExpression,
                      libelleCritere
                    );
                    return (
                      <tr key={r.id} className="border-b border-border last:border-b-0 align-top">
                        <td className="px-4 py-2.5">
                          <span className="block font-medium text-foreground">
                            {r.label || r.code}
                          </span>
                          <span className="block text-[11.5px] text-muted-foreground">
                            {r.code}
                          </span>
                          {/* Les règles sans effet étaient annoncées en tête mais
                              rien ne les signalait dans la liste. */}
                          {raisonInerte && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-0.5 text-[11px] font-semibold text-warning">
                              <AlertTriangle size={11} />
                              Sans effet — {raisonInerte}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[12.5px]">
                          {r.node ? (
                            <Link
                              href={`/admin/grille-scoring?nodeId=${r.node.id}&tab=rules`}
                              className="text-primary hover:underline"
                            >
                              {r.node.code} — {r.node.label}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">
                              Aucun (règle orpheline)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {/* La phrase d'abord, l'expression ensuite : c'est elle que
                              le moteur évalue, mais ce n'est pas elle qui se relit. */}
                          <span className="block text-[12.5px] text-foreground">
                            {phrase ?? "—"}
                          </span>
                          <code className="mt-0.5 block break-all text-[11px] text-muted-foreground">
                            {r.conditionExpression || "— aucune condition —"}
                          </code>
                          {r.messageUser && (
                            <span className="mt-1 block text-[11.5px] text-muted-foreground">
                              Message : {r.messageUser}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-[12.5px]">
                          <span className="text-foreground">
                            {action?.label ?? r.actionType}
                          </span>
                          {estBloquante(r) && (
                            <span className="mt-1 block rounded-full bg-destructive-subtle px-2 py-0.5 text-center text-[11px] font-semibold text-destructive">
                              Bloquante
                            </span>
                          )}
                          {malus > 0 && (
                            <span className="mt-1 block text-[11.5px] text-warning">
                              −{String(malus).replace(".", ",")} pts
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              TONS_SEVERITE[r.severity] ?? "bg-muted text-muted-foreground"
                            }`}
                          >
                            {SEVERITE_LABELS[r.severity as Severite] ?? r.severity}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </SectionCard>
          ))}

          {Array.from(parType.keys())
            .filter((code) => !typeRegle(code))
            .map((code) => (
              <div
                key={code}
                className="rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive"
              >
                {parType.get(code)!.length} règle
                {parType.get(code)!.length > 1 ? "s" : ""} de type « {code} », que le
                moteur ne reconnaît pas : enregistrées, mais sans effet.
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Tuile({
  libelle,
  valeur,
  alerte,
}: {
  libelle: string;
  valeur: number;
  alerte?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {libelle}
      </p>
      <p
        className={`mt-1 text-[19px] font-semibold tabulaire ${
          alerte ? "text-warning" : "text-foreground"
        }`}
      >
        {valeur}
      </p>
    </div>
  );
}
