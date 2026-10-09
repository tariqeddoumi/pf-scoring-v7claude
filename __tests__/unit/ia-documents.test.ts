import ExcelJS from "exceljs";
import {
  commentaireSource,
  construirePropositions,
  natureReponse,
  resultatSchema,
  type CritereGrille,
  type ResultatAnalyse,
} from "@/lib/services/ia-documents/resultat";
import { convertirPiece, extensionAcceptee, valeurCellule } from "@/lib/services/ia-documents/conversion";
import {
  consignes,
  decrireCritere,
  demandeLot,
  fusionnerQuestions,
  repartirEnLots,
} from "@/lib/services/ia-documents/analyse";

const grille: CritereGrille[] = [
  {
    id: "n1",
    code: "FIN.DSCR",
    label: "DSCR minimum",
    answerType: "NUMERIC",
    isMandatory: true,
    ranges: [
      { minValue: 0, maxValue: 1.2, label: "Faible" },
      { minValue: 1.2, maxValue: 10, label: "Solide" },
    ],
  },
  {
    id: "n2",
    code: "CTR.EPC",
    label: "Contrat EPC",
    answerType: "OPTION_SINGLE",
    options: [
      { value: "SIGNE", label: "Signé, clé en main" },
      { value: "NEGO", label: "En négociation" },
    ],
  },
  { id: "n3", code: "ESG.EIES", label: "EIES approuvée", answerType: "BOOLEAN", isMandatory: true },
  { id: "n4", code: "SPO.NOM", label: "Sponsor", answerType: "TEXT" },
  { id: "n5", code: "AUTO.CA", label: "Chiffre d'affaires (source verrouillée)", answerType: "NUMERIC", verrouille: true },
];

const extrait = (code: string, champs: Partial<ResultatAnalyse["criteres"][number]>) => ({
  code,
  statut: "trouve" as const,
  optionChoisie: null,
  valeurNombre: null,
  valeurBooleen: null,
  valeurTexte: null,
  confiance: "elevee" as const,
  justification: "Lu dans la pièce.",
  sources: [{ document: "Modele_financier.xlsx", localisation: "Feuille Ratios, D12", extrait: "1,35" }],
  documentAttendu: null,
  ...champs,
});

const resultat: ResultatAnalyse = {
  synthese: "Dossier incomplet.",
  documents: [],
  questions: [],
  criteres: [
    extrait("FIN.DSCR", { valeurNombre: 1.35 }),
    extrait("ctr.epc", { optionChoisie: "En négociation", confiance: "moyenne" }),
    extrait("ESG.EIES", { statut: "absent", documentAttendu: "Arrêté d'acceptabilité environnementale" }),
    extrait("SPO.NOM", { valeurTexte: "Atlas Énergie SA" }),
    extrait("AUTO.CA", { valeurNombre: 999 }),
    extrait("INCONNU", { valeurNombre: 1 }),
  ],
};

describe("ia-documents — propositions vérifiées contre la grille", () => {
  const { propositions, manquants } = construirePropositions(resultat, grille);
  const par = (code: string) => propositions.find((p) => p.code === code);

  it("nombre, option (par libellé, sans casse ni accent), texte", () => {
    expect(par("FIN.DSCR")?.valueNumber).toBe(1.35);
    expect(par("CTR.EPC")?.valueString).toBe("NEGO");
    expect(par("SPO.NOM")?.valueString).toBe("Atlas Énergie SA");
  });

  it("une information absente devient un manquant avec la pièce attendue", () => {
    const m = manquants.find((x) => x.code === "ESG.EIES");
    expect(m?.obligatoire).toBe(true);
    expect(m?.documentAttendu).toContain("environnementale");
    expect(par("ESG.EIES")).toBeUndefined();
  });

  it("source verrouillée et code inconnu ne sont jamais proposés", () => {
    expect(par("AUTO.CA")).toBeUndefined();
    expect(propositions.some((p) => p.code === "INCONNU")).toBe(false);
  });

  it("une option hors grille est refusée", () => {
    const r = { ...resultat, criteres: [extrait("CTR.EPC", { optionChoisie: "Contrat verbal" })] };
    const { propositions: p, manquants: m } = construirePropositions(r, grille);
    expect(p).toHaveLength(0);
    expect(m.find((x) => x.code === "CTR.EPC")?.motif).toContain("hors des options");
  });

  it("un critère non traité par l'IA est listé comme manquant", () => {
    const { manquants: m } = construirePropositions({ ...resultat, criteres: [] }, grille);
    expect(m.map((x) => x.code)).toEqual(["FIN.DSCR", "CTR.EPC", "ESG.EIES", "SPO.NOM"]);
  });

  it("la nature de réponse suit l'écran de saisie", () => {
    expect(grille.map(natureReponse)).toEqual(["nombre", "option", "booleen", "texte", "nombre"]);
  });

  it("le commentaire garde la source et la confiance", () => {
    expect(commentaireSource(par("FIN.DSCR")!, "l'analyste")).toContain("Modele_financier.xlsx (Feuille Ratios, D12)");
  });

  it("le schéma zod rejette une réponse mal formée", () => {
    expect(resultatSchema.safeParse({ synthese: "x" }).success).toBe(false);
    expect(resultatSchema.safeParse(resultat).success).toBe(true);
  });
});

describe("ia-documents — conversion des pièces", () => {
  it("formats acceptés", () => {
    expect(extensionAcceptee("Rapport.PDF")).toBe(true);
    expect(extensionAcceptee("modele.xlsx")).toBe(true);
    expect(extensionAcceptee("ancien.xls")).toBe(false);
    expect(extensionAcceptee("script.exe")).toBe(false);
  });

  it("Excel : résultats des formules et adresses de cellules", async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Ratios");
    ws.getCell("A1").value = "DSCR minimum";
    ws.getCell("B1").value = { formula: "C1/D1", result: 1.35 };
    ws.getCell("A2").value = new Date("2027-06-30");
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    const piece = await convertirPiece("modele.xlsx", buffer);
    const bloc = piece.blocs[0] as { source: { data: string } };
    expect(bloc.source.data).toContain("Feuille « Ratios »");
    expect(bloc.source.data).toContain("A1: DSCR minimum | B1: 1.35");
    expect(bloc.source.data).toContain("A2: 2027-06-30");
  });

  it("PDF transmis tel quel, CSV en texte, format inconnu refusé", async () => {
    const pdf = await convertirPiece("a.pdf", Buffer.from("%PDF-1.4"));
    expect(pdf.blocs[0]).toMatchObject({ type: "document", source: { media_type: "application/pdf" } });
    const csv = await convertirPiece("a.csv", Buffer.from("an;cfads\n1;70"));
    expect((csv.blocs[0] as { source: { data: string } }).source.data).toContain("1;70");
    await expect(convertirPiece("a.doc", Buffer.from("x"))).rejects.toThrow(/Format non pris en charge/);
  });

  it("valeur de cellule : texte riche et erreurs", () => {
    expect(valeurCellule({ richText: [{ text: "Atlas " }, { text: "SA" }] })).toBe("Atlas SA");
    expect(valeurCellule(null)).toBe("");
  });
});

describe("ia-documents — consignes", () => {
  it("chaque critère est décrit avec sa forme de réponse", () => {
    expect(decrireCritere(grille[1])).toContain("NEGO = En négociation");
    expect(decrireCritere(grille[0])).toContain("[OBLIGATOIRE]");
    const texte = consignes("Projet : Centrale");
    expect(texte).toContain("ne JAMAIS inventer");
    expect(texte).toContain("Projet : Centrale");
    const lot = demandeLot(grille);
    for (const c of grille) expect(lot).toContain(c.code);
  });

  it("la grille est répartie en lots parallèles, 10 au plus", () => {
    const codes = Array.from({ length: 84 }, (_, i) => i);
    const lots = repartirEnLots(codes);
    expect(lots).toHaveLength(7);
    expect(lots.flat()).toEqual(codes);
    expect(repartirEnLots(Array.from({ length: 250 }, (_, i) => i))).toHaveLength(10);
    expect(repartirEnLots([])).toEqual([]);
  });

  it("les questions des différents lots sont fusionnées sans doublon", () => {
    const q = (question: string) => ({ question, destinataire: "client" as const, criteres: [], documentAttendu: null });
    expect(fusionnerQuestions([[q("Fournir le PPA signé")], [q("fournir le  PPA signé"), q("Fournir l'EIES")]])).toHaveLength(2);
  });
});
