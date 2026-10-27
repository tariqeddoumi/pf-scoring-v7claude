"use client";

import { AlertTriangle, Download } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { cn } from "@/lib/utils";
import {
  ALEAS, ALEAS_PAR_SECTEUR, EFFETS_ALEAS, LIBELLES_ALEAS, NIVEAUX_ALEA, SCENARIOS_CLIMAT, SEUILS_CLIMAT,
  evaluerClimat, ficheClimatCsv, type CodeAlea, type NiveauAlea,
} from "@/lib/modele-pf/climat";
import { Champ, Nombre, OuiNon, Texte, Calcule, CLASSE_SAISIE, Grille2, fmtNombre, fmtX, type PropsBloc } from "./champs";
import { MarqueOrigine, ResumeOrigines } from "./origine";
import { CalculChoc } from "./CalculChoc";

const TON_NIVEAU: Record<string, string> = { Élevé: "text-destructive", Moyen: "text-warning", Faible: "text-success" };

/**
 * Bloc 14 : volet climatique (lot 1). Fiche des risques physiques par aléa, données de
 * transition, scénario climatique indicatif et fiche 2/W/2025. Sans effet sur la note :
 * la case « site à risque climatique élevé » du bloc 2 reste la donnée du moteur.
 */
export function BlocClimat({ s, modifier, r, P, lecture, voirScores, projet }: PropsBloc & { projet: { nom: string; codeProjet: string | null } }) {
  const c = s.climat;
  const e = evaluerClimat(c, s.secteur, s.climatEleve, r.periodes.filter((p) => p.service > 0), r.seuils);
  const presel = s.secteur ? ALEAS_PAR_SECTEUR[s.secteur] : [];
  const autres = ALEAS.filter((a) => !presel.includes(a));
  const ref = s.secteur ? SCENARIOS_CLIMAT[s.secteur] : null;
  // Lot 2 actif : la fiche entre dans la note ; sinon elle est seulement analysée.
  const lot2 = r.climat;
  const aleaVide = () => ({ niveau: null, source: "", adaptation: null });
  const ecrireAlea = (a: CodeAlea, f: (l: { niveau: NiveauAlea | null; source: string; adaptation: "Oui" | "Non" | null }) => void) =>
    modifier((x) => { f((x.climat.aleas[a] ??= aleaVide())); });

  function telecharger() {
    const csv = ficheClimatCsv(c, e, { Projet: projet.nom, "Code projet": projet.codeProjet ?? "", Secteur: s.secteur ?? "", "Date d'extraction": new Date().toLocaleDateString("fr-FR") });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `fiche-climat-${projet.codeProjet ?? "projet"}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  }

  const ligneAlea = (a: CodeAlea) => {
    const l = c.aleas[a];
    return (
      <tr key={a} className="border-t border-border align-top">
        <td className="px-3 py-2">
          <span className="flex items-center gap-1.5 font-medium text-foreground">
            <MarqueOrigine cles={[`climat.alea.${a}.niveau`, `climat.alea.${a}.source`, `climat.alea.${a}.adaptation`]} />
            {LIBELLES_ALEAS[a]}
          </span>
          <span className="block text-[11.5px] text-muted-foreground">{EFFETS_ALEAS[a]}</span>
        </td>
        <td className="px-3 py-2">
          <select aria-label={`Exposition : ${LIBELLES_ALEAS[a]}`} value={l?.niveau ?? ""} disabled={lecture}
            onChange={(ev) => ecrireAlea(a, (x) => { x.niveau = (ev.target.value || null) as NiveauAlea | null; })}
            className={cn(CLASSE_SAISIE, "w-32", l?.niveau && TON_NIVEAU[l.niveau])}>
            <option value="">Non évalué</option>
            {NIVEAUX_ALEA.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </td>
        <td className="px-3 py-2">
          <input aria-label={`Source : ${LIBELLES_ALEAS[a]}`} value={l?.source ?? ""} disabled={lecture} maxLength={300}
            placeholder="Étude d'impact p. 42, carte d'aléas…" onChange={(ev) => ecrireAlea(a, (x) => { x.source = ev.target.value; })} className={CLASSE_SAISIE} />
        </td>
        <td className="px-3 py-2">
          <OuiNon cible={`climat-adaptation-${a}`} valeur={l?.adaptation ?? null} lecture={lecture}
            onChange={(v) => ecrireAlea(a, (x) => { x.adaptation = v; })} />
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-4">
      {lot2 ? (
        <div className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-[12.5px] text-muted-foreground">
          Volet climatique, lot 2 actif : la fiche <strong className="text-foreground">entre dans la note</strong>. L&apos;exposition retenue est déduite des aléas
          (à défaut, la case du bloc 2) ; D9.5 « risque de transition » est calculé ; C11, C16 et C17 s&apos;appliquent ; sur un site exposé,
          le scénario climatique entre dans le DSCR stressé (N2). La fiche constitue aussi la fiche de la directive BAM 2/W/2025.
        </div>
      ) : (
        <div className="rounded-md border border-border bg-surface px-4 py-3 text-[12.5px] text-muted-foreground">
          Volet climatique, lot 1 : ces données sont collectées et analysées <strong className="text-foreground">sans effet sur la note</strong>.
          Elles éclairent la case « site à risque climatique élevé » du bloc 2 et constituent la fiche de la directive BAM 2/W/2025 (grands emprunteurs).
          Seuils et scénarios : valeurs candidates, à valider par le comité de validation du modèle.
        </div>
      )}

      <SectionCard titre="Bloc 14 · Risques physiques par aléa"
        description={s.secteur ? `Aléas présélectionnés pour le secteur ${s.secteur} ; évaluez les autres s'ils concernent le site.` : "Choisissez d'abord le secteur (onglet Identification) pour présélectionner les aléas."}
        sansPadding>
        <ResumeOrigines prefixe={/^climat\.alea\./} />
        <div className="px-4 py-3">
          <Champ cible="climat.localisation" libelle="Localisation du site" aide="Commune, province ou coordonnées : sert à lire les cartes d'aléas.">
            <input id="pf-champ-climat.localisation" value={c.localisation} disabled={lecture} maxLength={200}
              onChange={(ev) => modifier((x) => { x.climat.localisation = ev.target.value; })} className={CLASSE_SAISIE} />
          </Champ>
        </div>
        <div id="pf-climat.aleas" className="scroll-mt-40 overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead className="bg-surface text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-3 py-2">Aléa</th><th className="px-3 py-2">Exposition du site</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Adaptation financée ?</th></tr>
            </thead>
            <tbody>
              {presel.map(ligneAlea)}
              {autres.length > 0 && (
                <tr className="border-t border-border bg-surface/60"><td colSpan={4} className="px-3 py-1.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">Autres aléas, si le site y est exposé</td></tr>
              )}
              {autres.map(ligneAlea)}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 border-t border-border px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <Calcule libelle="Exposition déduite de la fiche" valeur={e.expositionDeduite === null ? "—" : e.expositionDeduite ? "Élevée" : "Non élevée"}
              ton={e.expositionDeduite ? "alerte" : e.expositionDeduite === false ? "favorable" : undefined} />
            {lot2 ? (
              <Calcule libelle="Exposition retenue par le moteur" valeur={lot2.expositionRetenue === "Oui" ? "Site exposé" : lot2.expositionRetenue === "Non" ? "Site non exposé" : "Non renseignée"}
                ton={lot2.expositionRetenue === "Oui" ? "alerte" : undefined} />
            ) : (
              <Calcule libelle="Case du bloc 2 (donnée du moteur)" valeur={s.climatEleve === "Oui" ? "Site exposé" : s.climatEleve === "Non" ? "Site non exposé" : "Non renseignée"} />
            )}
            <Calcule libelle="Aléas élevés sans adaptation" valeur={e.aleasElevesSansAdaptation.length ? e.aleasElevesSansAdaptation.map((a) => LIBELLES_ALEAS[a]).join(", ") : "Aucun"}
              ton={e.aleasElevesSansAdaptation.length ? "alerte" : undefined} />
          </div>
          {e.incoherence && !lot2 && (
            <p role="alert" className="flex items-start gap-1.5 rounded border border-warning/50 bg-warning/10 px-3 py-2 text-[12.5px] text-foreground">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" /> {e.incoherence}
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard titre="Bloc 14 · Risque de transition" description="Exposition du projet aux politiques climatiques : émissions, prix du carbone, mécanisme d'ajustement carbone aux frontières de l'UE (MACF), actifs fossiles. Le niveau s'établit quand les émissions, les exportations MACF et l'actif fossile sont renseignés.">
        <Grille2>
          <Champ cible="climat.emissions" libelle="Émissions annuelles, scopes 1 et 2"
            aide={`Repères : quantification au-delà de ${SEUILS_CLIMAT.emissionsQuantification.toLocaleString("fr-FR")} t (SFI), analyse des alternatives au-delà de ${SEUILS_CLIMAT.emissionsAlternatives.toLocaleString("fr-FR")} t (Principes de l'Équateur).`}>
            <Nombre cible="climat.emissions" valeur={c.emissions} suffixe="tCO₂e/an" min={0} lecture={lecture}
              onChange={(v) => modifier((x) => { x.climat.emissions = v === null ? null : Math.max(0, v); })} />
          </Champ>
          <Champ cible="climat.export_macf" libelle="Exportations vers l'UE soumises au MACF" aide="Part du chiffre d'affaires : ciment, fer et acier, aluminium, engrais, hydrogène, électricité.">
            <Nombre cible="climat.export_macf" valeur={c.exportMacf === null ? null : Math.round(c.exportMacf * 1000) / 10} suffixe="% du CA" min={0} max={100} lecture={lecture}
              onChange={(v) => modifier((x) => { x.climat.exportMacf = v === null ? null : Math.min(1, Math.max(0, v / 100)); })} />
          </Champ>
          <Champ cible="climat.actif_fossile" libelle="Actif dépendant des énergies fossiles ?">
            <OuiNon cible="climat.actif_fossile" valeur={c.actifFossile} lecture={lecture} onChange={(v) => modifier((x) => { x.climat.actifFossile = v; })} />
          </Champ>
          <Champ cible="climat.plan_transition" libelle="Plan de transition crédible et financé ?">
            <OuiNon cible="climat.plan_transition" valeur={c.planTransition} lecture={lecture} onChange={(v) => modifier((x) => { x.climat.planTransition = v; })} />
          </Champ>
        </Grille2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Calcule libelle="Niveau de transition (indicatif)" valeur={e.niveauTransition ?? "—"}
            ton={e.niveauTransition === "Élevé" ? "alerte" : e.niveauTransition === "Moyen" ? "vigilance" : e.niveauTransition ? "favorable" : undefined} />
          <Calcule libelle="Motifs" valeur={e.motifsTransition.length ? e.motifsTransition.join(" ; ") : "—"} />
        </div>
      </SectionCard>

      <SectionCard titre={`Bloc 14 · Scénario climatique${lot2 ? "" : " (indicatif)"}`}
        description={lot2 ? "Un aléa plausible pour ce site, chiffré en baisse du CFADS : sur un site exposé, le DSCR stressé retenu pour N2 est le plus bas des deux scénarios." : "Un aléa plausible pour ce site, chiffré en baisse du CFADS : le DSCR qui en résulte est affiché, sans effet sur la note."}>
        <div className="space-y-4">
          {ref ? (
            <div className="rounded border border-border bg-surface px-3 py-2.5 text-[12.5px]">
              <p className="font-semibold text-foreground">Scénario climatique de référence du secteur</p>
              <p className="mt-0.5 text-foreground">{ref.description}</p>
              {!lecture && (
                <button type="button" onClick={() => modifier((x) => {
                  x.climat.descriptionClimatique = ref.description;
                  x.origines["climat.choc.description"] = { type: "reference", valeur: ref.description, source: `Scénario climatique de référence du secteur ${s.secteur}`,
                    detail: "Valeurs candidates, à valider par le comité de validation du modèle.", confiance: null, le: new Date().toISOString(), par: "" };
                })} className="mt-1.5 text-[12.5px] font-semibold text-primary hover:underline">
                  Reprendre cette description
                </button>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">Choisissez le secteur du projet pour afficher son scénario climatique de référence.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <Champ cible="climat.choc" libelle="Baisse du CFADS">
              <Nombre cible="climat.choc" valeur={c.chocClimatique === null ? null : Math.round(c.chocClimatique * 1000) / 10} suffixe="%" min={0} max={95} lecture={lecture}
                onChange={(v) => modifier((x) => { x.climat.chocClimatique = v === null ? null : Math.min(0.95, v / 100); })} />
            </Champ>
            <Champ cible="climat.choc.description" libelle="Description du scénario climatique">
              <Texte cible="climat.choc.description" valeur={c.descriptionClimatique} max={500} lignes={2} lecture={lecture}
                placeholder="Ex. sécheresse sur deux campagnes consécutives : récolte − 35 %"
                onChange={(v) => modifier((x) => { x.climat.descriptionClimatique = v; })} />
            </Champ>
          </div>
          {!lecture && (
            <CalculChoc prefixe="climat-aide" reference={s.secteur} baisseRef={ref?.baisseRecettes ?? null} hausseRef={ref?.hausseCharges ?? null}
              onAppliquer={(choc, source, detail) => modifier((x) => {
                x.climat.chocClimatique = choc;
                x.origines["climat.choc"] = { type: "calcul", valeur: choc, source, detail, confiance: null, le: new Date().toISOString(), par: "" };
              })} />
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <Calcule libelle="DSCR minimum central" valeur={fmtX(r.dscrMin)} />
            <Calcule libelle="DSCR minimum climatique" valeur={fmtX(e.dscrMinClimatique)}
              ton={e.classeClimatique === "Critique" ? "alerte" : e.classeClimatique === "Vigilance" ? "vigilance" : e.classeClimatique ? "favorable" : undefined} />
            <Calcule libelle={lot2 ? "Scénario retenu pour N2" : "Classe (seuils du dossier)"}
              valeur={lot2 ? (lot2.stressRetenu === "climatique" ? "Climatique" : lot2.stressRetenu === "financier" ? "Financier" : "—") : e.classeClimatique ?? (r.periodes.length ? "—" : "Échéancier à saisir")} />
          </div>
        </div>
      </SectionCard>

      <SectionCard titre="Bloc 14 · Synthèse et fiche 2/W/2025"
        actions={(
          <button type="button" onClick={telecharger} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline">
            <Download size={14} /> Télécharger la fiche climat (CSV)
          </button>
        )}>
        <div className="space-y-3 text-[12.5px]">
          <p>
            Complétude de la fiche : <strong>{e.completude.faits} / {e.completude.attendus}</strong> données
            {e.completude.faits < e.completude.attendus && " — complétez les aléas présélectionnés, les données de transition et le scénario climatique."}
          </p>
          {lot2 ? (
            <div>
              <p className="font-semibold text-foreground">Effet sur la note</p>
              <ul className="mt-1 space-y-0.5 text-muted-foreground">
                <li>D9.5 « risque de transition » : niveau {lot2.niveauTransition ?? "non renseigné"}
                  {voirScores && <> → note {typeof lot2.noteTransition === "number" ? fmtNombre(lot2.noteTransition, 0) : "Info. insuffisante"} ({fmtNombre(P.climat.poidsTransition * 100, 0)} % de D9)</>}</li>
                {(["C11", "C16", "C17"] as const).map((c) => (
                  <li key={c}><span className="font-mono font-semibold text-foreground">{c}</span> · {P.plafonds[c].libelle} : {r.plafonds[c] === "Oui" ? <strong className="text-destructive">actif</strong> : r.plafonds[c] === "Non" ? "non" : "donnée manquante"}</li>
                ))}
              </ul>
            </div>
          ) : (
          <div>
            <p className="font-semibold text-foreground">Aperçu des règles proposées au lot 2 (non appliquées)</p>
            {e.apercuLot2.length ? (
              <ul className="mt-1 space-y-0.5">
                {e.apercuLot2.map((p) => (
                  <li key={p.code} className="text-muted-foreground"><span className="font-mono font-semibold text-foreground">{p.code}</span> · {p.libelle}{voirScores && <> : note limitée à {fmtNombre(p.noteMax, 0)}</>}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-muted-foreground">Aucun plafond climatique ne serait déclenché avec les données actuelles.</p>
            )}
          </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
