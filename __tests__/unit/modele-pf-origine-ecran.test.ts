import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { saisieVide } from "@/lib/modele-pf/saisie";
import { SaisieContexte, OrigineChamp, MarqueOrigine } from "@/components/scoring-pf/origine";
import { Champ } from "@/components/scoring-pf/champs";

function rendu(el: ReturnType<typeof h>, s = saisieVide()) {
  return renderToStaticMarkup(h(SaisieContexte.Provider, { value: s }, el));
}

describe("commentaire d'origine sous un champ", () => {
  const s = saisieVide();
  s.donneesPlafonds.llcr = 1.35;
  s.origines.llcr = { type: "ia", valeur: 1.35, source: "Rapport du conseiller financier.pdf, p. 14", detail: "Tableau 6 : LLCR 1,35x.",
    confiance: "elevee", le: "2026-10-26T10:00:00.000Z", par: "u1" };

  it("indique la pièce, la date et la confiance, avec la justification dépliable", () => {
    const html = rendu(h(OrigineChamp, { cle: "llcr" }), s);
    expect(html).toContain("Proposé par l&#x27;IA le 26/10/2026");
    expect(html).toContain("Source : Rapport du conseiller financier.pdf, p. 14");
    expect(html).toContain("confiance élevée");
    expect(html).toContain("Tableau 6 : LLCR 1,35x.");
  });

  it("signale une valeur modifiée depuis par l'analyste", () => {
    const m = structuredClone(s);
    m.donneesPlafonds.llcr = 1.2;
    expect(rendu(h(OrigineChamp, { cle: "llcr" }), m)).toContain("Modifié par l&#x27;analyste — valeur initiale « 1,35 »");
  });

  it("n'affiche rien pour une valeur tapée", () => {
    expect(rendu(h(OrigineChamp, { cle: "dsra" }), s)).toBe("");
    expect(rendu(h(MarqueOrigine, { cles: ["emploi.1.montant"] }), s)).toBe("");
  });

  it("apparaît sous un champ de l'écran, sa cible traduite en clé (dsraMois → dsra)", () => {
    const d = structuredClone(s);
    d.donneesPlafonds.dsraMois = 6;
    d.origines.dsra = { type: "ia", valeur: 6, source: "Term sheet.pdf, p. 4", detail: "", confiance: "moyenne", le: "2026-10-26T10:00:00.000Z", par: "" };
    const html = rendu(h(Champ, { cible: "dsraMois", libelle: "DSRA (C7)", children: h("input") }), d);
    expect(html).toContain("Source : Term sheet.pdf, p. 4");
  });
});
