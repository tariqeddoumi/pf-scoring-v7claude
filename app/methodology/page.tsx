"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { apiGet } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { ratingBadgeClass, scoreTextClass } from "@/lib/score-colors";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { REGISTRE_TEXTES, statutTexte } from "@/lib/referentiel-reglementaire";

interface Methodologie {
  version: {
    id: string;
    numero: number;
    label?: string | null;
    publieLe?: string | null;
    modele?: string | null;
  };
  domaines: {
    code: string;
    label: string;
    description?: string | null;
    weight: number | null;
    criteres: number;
  }[];
  volumetrie: {
    domaines: number;
    criteres: number;
    sousCriteres: number;
    pointsNotes: number;
    options: number;
  };
  bareme: {
    source: "referentiel" | "repli";
    paliers: { note: string; min: number; max: number; description?: string | null }[];
  };
  seuilsLecture: { favorable: number; vigilance: number };
  regles: {
    code: string;
    label: string;
    description?: string | null;
    type: string;
    gravite: string;
    action: string;
    bloquante: boolean;
    malus?: number | null;
    condition: string;
  }[];
}

/**
 * Méthodologie.
 *
 * La page décrivait des constantes du code et non le modèle appliqué : huit familles
 * de risque pondérées 25/15/15/10/10/10/8/7 %, un barème « AA 85-94 », et pas un mot
 * des conditions rédhibitoires. Le moteur, lui, applique neuf domaines, le barème de
 * la base et des règles bloquantes. Un analyste qui lisait cette page ne pouvait pas
 * expliquer la note d'un dossier. Tout est lu maintenant de la version publiée.
 */
export default function MethodologiePage() {
  const [m, setM] = useState<Methodologie | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiGet("/api/methodology");
        if (!res.ok) {
          const corps = await res.json().catch(() => ({}));
          throw new Error(
            corps.error === "Aucune version de modèle publiée"
              ? "Aucune version du modèle n'est publiée : aucune méthode n'est donc appliquée."
              : "Lecture du modèle impossible."
          );
        }
        setM((await res.json()).data);
      } catch (e) {
        setErreur(e instanceof Error ? e.message : "Lecture impossible.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  if (chargement) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
      </div>
    );
  }

  if (erreur || !m) {
    return (
      <div>
        <PageHeader titre="Méthodologie" />
        <div className="rounded-lg border border-destructive/40 bg-destructive-subtle px-4 py-3 text-sm text-destructive">
          {erreur}
        </div>
      </div>
    );
  }

  const bloquantes = m.regles.filter((r) => r.bloquante);
  const malus = m.regles.filter((r) => !r.bloquante && r.malus);
  const sommePoids = m.domaines.reduce((s, d) => s + (d.weight ?? 0), 0);

  return (
    <div>
      <PageHeader
        titre="Méthodologie"
        description={`Modèle appliqué : ${m.version.label ?? `version ${m.version.numero}`}${
          m.version.publieLe ? `, publié le ${formatDate(m.version.publieLe)}` : ""
        }`}
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tuile libelle="Domaines" valeur={m.volumetrie.domaines} />
        <Tuile libelle="Critères" valeur={m.volumetrie.criteres} />
        <Tuile libelle="Sous-critères" valeur={m.volumetrie.sousCriteres} />
        <Tuile libelle="Points notés" valeur={m.volumetrie.pointsNotes} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            titre="Comment le score est calculé"
            description={`Chaque domaine est noté sur 100 puis pondéré. Somme des poids : ${sommePoids
              .toFixed(2)
              .replace(".", ",")} %.`}
          >
            <ul className="space-y-2">
              {m.domaines.map((d) => (
                <li key={d.code} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-[12.5px] text-muted-foreground">
                    {d.code}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-foreground">
                    {d.label}
                    <span className="ml-2 text-[11.5px] text-muted-foreground">
                      {d.criteres} critère{d.criteres > 1 ? "s" : ""}
                    </span>
                  </span>
                  <span className="w-28 shrink-0">
                    <span className="mb-0.5 block text-right text-[12.5px] font-semibold text-foreground tabulaire">
                      {(d.weight ?? 0).toFixed(2).replace(".", ",")} %
                    </span>
                    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (d.weight ?? 0) * 5)}%` }}
                      />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-border pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              Le score d&apos;un domaine est la moyenne pondérée de ses critères, chacun
              étant la moyenne pondérée de ses sous-critères. Le score final est la
              somme des scores de domaine multipliés par leur poids, sur 100.
            </p>
          </SectionCard>

          <SectionCard
            titre="Conditions rédhibitoires"
            description="Une seule suffit à bloquer le dossier, quel que soit le score obtenu."
          >
            {bloquantes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune condition bloquante n&apos;est active sur cette version.
              </p>
            ) : (
              <ul className="space-y-3">
                {bloquantes.map((r) => (
                  <li key={r.code} className="flex gap-3">
                    <ShieldAlert
                      size={16}
                      className="mt-0.5 shrink-0 text-destructive"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {r.label}
                        <span className="ml-2 text-[11.5px] font-normal text-muted-foreground">
                          {r.code}
                        </span>
                      </p>
                      {r.description && (
                        <p className="text-[12.5px] text-muted-foreground">
                          {r.description}
                        </p>
                      )}
                      <code className="mt-1 block break-all rounded bg-surface px-2 py-1 text-[11.5px] text-muted-foreground">
                        {r.condition}
                      </code>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {malus.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="mb-2 text-[12.5px] font-semibold text-foreground">
                  Malus appliqués au score
                </p>
                <ul className="space-y-1.5">
                  {malus.map((r) => (
                    <li
                      key={r.code}
                      className="flex items-baseline justify-between gap-3 text-[12.5px]"
                    >
                      <span className="text-foreground">{r.label}</span>
                      <span className="shrink-0 text-warning tabulaire">
                        −{r.malus} pts
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>

          <SectionCard
            titre="Cadre de référence"
            description="Registre des textes et de leur traduction dans l'outil — à valider par la Conformité et le Juridique."
          >
            <ul className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
              {REGISTRE_TEXTES.map((t) => (
                <li key={t.code}>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <strong className="text-foreground">
                      {t.emetteur} — {t.type} {t.intitule}
                    </strong>
                    <span className="text-[12px]">
                      {[t.date ? `du ${t.date.split("-").reverse().join("/")}` : null, t.articles]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                  <div className="text-[12px]">
                    {statutTexte(t)} · dans l&apos;outil : {t.etatOutil}
                  </div>
                  <div>{t.consequence}</div>
                </li>
              ))}
              <li>
                <strong className="text-foreground">Normes de performance de la SFI (IFC) et BERD</strong> —
                évaluation des risques environnementaux, sociaux et de gouvernance du projet.
              </li>
            </ul>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            titre="Du score à la note"
            description={
              m.bareme.source === "repli"
                ? "Barème de repli : le référentiel de notation est vide en base."
                : "Barème du référentiel, modifiable en paramétrage."
            }
          >
            <ul className="space-y-1">
              {m.bareme.paliers.map((p) => (
                <li
                  key={p.note}
                  className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-b-0"
                >
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[12.5px] font-bold ${ratingBadgeClass(p.note)}`}
                  >
                    {p.note}
                  </span>
                  <span className="text-[12.5px] text-muted-foreground tabulaire">
                    {p.min.toFixed(0)} – {p.max.toFixed(0)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard titre="Lecture du score">
            <ul className="space-y-2 text-[12.5px]">
              <li className={scoreTextClass(90)}>
                ≥ {m.seuilsLecture.favorable} — profil favorable
              </li>
              <li className={scoreTextClass(60)}>
                {m.seuilsLecture.vigilance} à {m.seuilsLecture.favorable - 1} — vigilance
              </li>
              <li className={scoreTextClass(10)}>
                &lt; {m.seuilsLecture.vigilance} — profil dégradé
              </li>
            </ul>
            <p className="mt-3 border-t border-border pt-3 text-[12px] text-muted-foreground">
              Ces seuils commandent la couleur des scores dans toute l&apos;application.
              Ils ne remplacent pas le barème de notation ci-contre.
            </p>
          </SectionCard>

          <SectionCard titre="Version appliquée">
            <dl className="space-y-2 text-[12.5px]">
              <div>
                <dt className="text-muted-foreground">Modèle</dt>
                <dd className="text-foreground">{m.version.modele ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Version</dt>
                <dd className="text-foreground">
                  {m.version.label ?? `Version ${m.version.numero}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Publiée le</dt>
                <dd className="text-foreground">
                  {m.version.publieLe ? formatDate(m.version.publieLe) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Options de réponse</dt>
                <dd className="text-foreground tabulaire">{m.volumetrie.options}</dd>
              </div>
            </dl>
            <p className="mt-3 border-t border-border pt-3 text-[12px] text-muted-foreground">
              Une évaluation reste attachée à la version qui l&apos;a produite : une
              publication ultérieure ne modifie aucune note déjà calculée.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Tuile({ libelle, valeur }: { libelle: string; valeur: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {libelle}
      </p>
      <p className="mt-1 text-[19px] font-semibold text-foreground tabulaire">{valeur}</p>
    </div>
  );
}
