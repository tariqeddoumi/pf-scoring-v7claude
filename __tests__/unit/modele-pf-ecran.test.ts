/**
 * Rendu des onglets du scoring Project Finance avec un cas d'étude complet et avec un
 * dossier vide : aucune erreur d'exécution, contenu attendu présent.
 */
import React, { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import cas from "@/lib/modele-pf/cas-etude.json";
import { saisieDepuisCasExcel } from "@/lib/modele-pf/conversion";
import { calculer, saisieVide, type SaisiePF } from "@/lib/modele-pf/saisie";
import { PARAMETRES_DEFAUT } from "@/lib/modele-pf/parametres";
import { BlocIdentification } from "@/components/scoring-pf/BlocIdentification";
import { BlocFinancement } from "@/components/scoring-pf/BlocFinancement";
import { BlocSecteur } from "@/components/scoring-pf/BlocSecteur";
import { BlocEcheancier } from "@/components/scoring-pf/BlocEcheancier";
import { BlocNoyau } from "@/components/scoring-pf/BlocNoyau";
import { BlocGrille } from "@/components/scoring-pf/BlocGrille";
import { BlocResultat } from "@/components/scoring-pf/BlocResultat";

// ts-jest compile le JSX des composants en React.createElement (JSX classique).
(globalThis as { React?: typeof React }).React = React;

const projet = { id: "p1", nom: "Projet fictif", codeProjet: "PF-2026-0001", secteur: "ENR", client: { id: "c1", nom: "Client fictif", codeClientT24: "20000001", radical: "0000001" } };

function tout(s: SaisiePF, voirScores: boolean): string {
  const { resultat: r, controles } = calculer(s);
  const props = { s, modifier: () => undefined, r, P: PARAMETRES_DEFAUT, lecture: false, voirScores, manquants: new Set(controles.map((c) => c.cible ?? "")) };
  return [
    renderToStaticMarkup(h(BlocIdentification, { ...props, projet })),
    renderToStaticMarkup(h(BlocFinancement, { ...props, credits: [], projetId: "p1" })),
    renderToStaticMarkup(h(BlocSecteur, props)),
    renderToStaticMarkup(h(BlocEcheancier, props)),
    renderToStaticMarkup(h(BlocNoyau, props)),
    renderToStaticMarkup(h(BlocGrille, { ...props, cible: "D2.1" })),
    renderToStaticMarkup(h(BlocResultat, props)),
  ].join("\n");
}

describe("écran du scoring Project Finance", () => {
  it.each(cas.slice(0, 18).map((c) => [c.dossier.onglet, c] as const))("%s : rendu de tous les blocs", (_n, c) => {
    const html = tout(saisieDepuisCasExcel(c.dossier), true);
    expect(html).toContain("Bloc 13");
    expect(html).toContain("Note approuvée");
  });

  it("dossier vide : rendu sans erreur et saisies signalées", () => {
    const html = tout(saisieVide(), false);
    expect(html).toContain("À saisir");
    // Rôle sans visibilité des scores : pas d'agrégation ni de note.
    expect(html).not.toContain("Bloc 9 · Agrégation");
    expect(html).not.toContain("Note calculée");
    expect(html).not.toContain("Plafond retenu");
    expect(html).not.toContain("Note max.");
  });
});
