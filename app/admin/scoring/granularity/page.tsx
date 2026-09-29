"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, Save } from "lucide-react";
import { apiGet, apiPut } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";

type Niveau = "DOMAIN" | "CRITERION" | "SUB_CRITERION";

interface ConfigGranularite {
  [codeDomaine: string]: Niveau;
}

interface Domaine {
  id: string;
  code: string;
  label: string;
  depth: number;
  scoreLeafDepth?: number | null;
  /** Nombre de critères et de sous-critères du domaine. */
  criteres: number;
  sousCriteres: number;
}

const NIVEAUX: { valeur: Niveau; libelle: string; description: string }[] = [
  {
    valeur: "DOMAIN",
    libelle: "Domaine",
    description: "Une seule note pour tout le domaine.",
  },
  {
    valeur: "CRITERION",
    libelle: "Critère",
    description: "Une note par critère du domaine.",
  },
  {
    valeur: "SUB_CRITERION",
    libelle: "Sous-critère",
    description: "Une note par sous-critère : le niveau le plus fin.",
  },
];

/** Niveau appliqué par le moteur lorsque le domaine n'est pas dans la configuration. */
function niveauParDefaut(d: Domaine): Niveau {
  // Le moteur se replie sur la profondeur propre du nœud, et non sur « critère » :
  // l'écran annonçait « Au niveau du critère (par défaut) » pour des domaines que le
  // moteur saisit au sous-critère.
  const profondeur = d.scoreLeafDepth ?? 1;
  if (profondeur <= 0) return "DOMAIN";
  if (profondeur === 1) return "CRITERION";
  return "SUB_CRITERION";
}

function nbEntrees(d: Domaine, niveau: Niveau): number {
  if (niveau === "DOMAIN") return 1;
  if (niveau === "CRITERION") return d.criteres;
  return d.sousCriteres || d.criteres;
}

/**
 * Granularité de saisie, domaine par domaine.
 *
 * Les options du menu annonçaient les totaux du modèle entier — « Au niveau du
 * critère (28 entrées) », « (9 entrées totales) », « (84+ entrées) » — et non ceux du
 * domaine réglé : pour D1 on attend 1, 3 ou 9. Un domaine absent de la configuration
 * s'affichait « Au niveau du critère (par défaut) » alors que le moteur se replie sur
 * la profondeur propre du nœud. Rien n'avertissait enfin qu'un changement touche les
 * saisies en cours.
 */
export default function GranularitePage() {
  const router = useRouter();
  const [chargement, setChargement] = useState(true);
  const [domaines, setDomaines] = useState<Domaine[]>([]);
  const [config, setConfig] = useState<ConfigGranularite>({});
  const [brouillons, setBrouillons] = useState<{ nom: string; avancement?: string }[]>([]);
  const [modifications, setModifications] = useState<ConfigGranularite>({});
  const [enregistrement, setEnregistrement] = useState(false);
  const [enregistre, setEnregistre] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resQuestionnaire = await apiGet("/api/scoring/questionnaire");
        if (resQuestionnaire.status === 401) return router.push("/login");
        if (resQuestionnaire.status === 403) return router.push("/admin");
        const questionnaire = await resQuestionnaire.json();
        const versionId = questionnaire.modelVersionId;

        // Les compteurs viennent de l'arbre réel du modèle, domaine par domaine.
        const resNoeuds = await apiGet(
          `/api/admin/scoring/nodes?versionId=${versionId}&format=light`
        );
        const plats: { id: string; code: string; label: string; depth: number }[] =
          resNoeuds.ok ? ((await resNoeuds.json()).data ?? []) : [];

        const liste: Domaine[] = plats
          .filter((n) => n.depth === 0)
          .map((n) => ({
            id: n.id,
            code: n.code,
            label: n.label,
            depth: 0,
            criteres: plats.filter(
              (x) => x.depth === 1 && x.code.startsWith(`${n.code}_`)
            ).length,
            sousCriteres: plats.filter(
              (x) => x.depth === 2 && x.code.startsWith(`${n.code}_`)
            ).length,
          }));
        setDomaines(liste);

        const resConfig = await apiGet(
          "/api/admin/configuration/SCORING_DOMAIN_GRANULARITY"
        );
        if (resConfig.ok) {
          const data = await resConfig.json();
          setConfig(data.data?.value ? JSON.parse(data.data.value) : {});
        }

        // Les saisies en cours sont les premières touchées par un changement.
        const resEvals = await apiGet("/api/evaluations?limit=200");
        if (resEvals.ok) {
          const evaluations = (await resEvals.json()).data ?? [];
          setBrouillons(
            evaluations
              .filter(
                (e: { status: string; isArchived?: boolean }) =>
                  e.status === "brouillon" && !e.isArchived
              )
              .map(
                (e: {
                  project?: { nom?: string };
                  avancement?: { repondues: number; total: number };
                }) => ({
                  nom: e.project?.nom ?? "Dossier",
                  avancement: e.avancement
                    ? `${e.avancement.repondues}/${e.avancement.total}`
                    : undefined,
                })
              )
          );
        }
      } catch {
        setErreur("Erreur lors du chargement des données.");
      } finally {
        setChargement(false);
      }
    })();
  }, [router]);

  const enregistrer = async () => {
    setEnregistrement(true);
    setErreur(null);
    try {
      const majs = { ...config, ...modifications };
      const res = await apiPut("/api/admin/configuration/SCORING_DOMAIN_GRANULARITY", {
        value: JSON.stringify(majs),
      });
      if (!res.ok) {
        setErreur("Échec de l'enregistrement.");
        return;
      }
      const json = await res.json();
      setConfig(JSON.parse(json.data.value));
      setModifications({});
      setEnregistre(true);
      setTimeout(() => setEnregistre(false), 2500);
    } catch {
      setErreur("Échec de l'enregistrement.");
    } finally {
      setEnregistrement(false);
    }
  };

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  const nbModifications = Object.keys(modifications).length;
  const totalEntrees = domaines.reduce(
    (s, d) =>
      s + nbEntrees(d, modifications[d.code] ?? config[d.code] ?? niveauParDefaut(d)),
    0
  );

  return (
    <div className="pb-20">
      <PageHeader
        titre="Granularité de la saisie"
        description="Le niveau auquel l'analyste note chaque domaine : le domaine entier, ses critères, ou ses sous-critères."
        retour={{ href: "/admin", libelle: "Paramétrage" }}
      />

      {erreur && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      )}

      {nbModifications > 0 && brouillons.length > 0 && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning-subtle px-4 py-3 text-sm text-warning">
          <p className="inline-flex items-center gap-2 font-semibold">
            <AlertTriangle size={15} />
            {brouillons.length} saisie{brouillons.length > 1 ? "s" : ""} en cours
          </p>
          <p className="mt-1">
            Changer la granularité modifie les questions posées :{" "}
            {brouillons
              .map((b) => `${b.nom}${b.avancement ? ` (${b.avancement})` : ""}`)
              .join(", ")}
            . Les réponses déjà saisies à un niveau qui disparaît ne sont plus prises
            en compte au calcul ; elles restent enregistrées.
          </p>
        </div>
      )}

      <SectionCard sansPadding className="mb-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Domaine", "Niveau de saisie", "Questions posées"].map((t, i) => (
                <th
                  key={i}
                  className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domaines.map((d) => {
              const defaut = niveauParDefaut(d);
              const courant = modifications[d.code] ?? config[d.code] ?? defaut;
              const absent = config[d.code] === undefined;
              return (
                <tr key={d.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <span className="block font-medium text-foreground">{d.label}</span>
                    <span className="block text-[11.5px] text-muted-foreground">
                      {d.code} · {d.criteres} critères · {d.sousCriteres} sous-critères
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      id={`niveau-${d.code}`}
                      value={courant}
                      onChange={(e) =>
                        setModifications((prec) => ({
                          ...prec,
                          [d.code]: e.target.value as Niveau,
                        }))
                      }
                      aria-label={`Niveau de saisie de ${d.label}`}
                      className="h-9 w-64 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-ring focus:outline-none"
                    >
                      {NIVEAUX.map((n) => (
                        <option key={n.valeur} value={n.valeur}>
                          {n.libelle} — {nbEntrees(d, n.valeur)} question
                          {nbEntrees(d, n.valeur) > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-[11.5px] text-muted-foreground">
                      {NIVEAUX.find((n) => n.valeur === courant)?.description}
                      {absent && ` Non configuré : le moteur applique ce niveau.`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-foreground tabulaire">
                    {nbEntrees(d, courant)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionCard>

      <p className="text-[12.5px] text-muted-foreground">
        Au total, une évaluation comportera {totalEntrees} question
        {totalEntrees > 1 ? "s" : ""} notées.
      </p>

      <div className="sticky bottom-0 z-10 -mx-1 mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
        <span className="mr-auto text-[12.5px] text-muted-foreground">
          {nbModifications > 0
            ? `${nbModifications} domaine${nbModifications > 1 ? "s" : ""} modifié${nbModifications > 1 ? "s" : ""}`
            : "Aucune modification"}
        </span>
        {enregistre && (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-success">
            <Check size={14} />
            Enregistré
          </span>
        )}
        <button
          onClick={enregistrer}
          disabled={nbModifications === 0 || enregistrement}
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enregistrement ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}
          Enregistrer
        </button>
      </div>
    </div>
  );
}
