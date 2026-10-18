/**
 * Conversions entre le format des dossiers de l'outil Excel (clés du moteur de référence
 * Python, cf. docs/outil-excel/generateur/cas_tous.py) et le format web `DossierPF`.
 */
import type { DossierPF, Note, OuiNon, NatureRessource, QualiteAcheteur } from "./moteur";
import type { CodeRegime, CodePhase, CodeSecteur, DomaineGrille, CodeVerrou } from "./parametres";

/** Le référentiel sectoriel de la base (V9Sector) code l'immobilier de rendement « IMM ». */
export function secteurDepuisCodeBase(code: string | null | undefined): CodeSecteur | null {
  if (!code) return null;
  const c = code.trim().toUpperCase();
  if (c === "IMM" || c === "IMMO" || c === "IMMO-REND") return "IMMO-REND";
  const connus = ["ENR", "EAU", "TEL", "TRA", "POR", "SAN", "ETH", "IND", "AGR", "TOU", "MIN"];
  return connus.includes(c) ? (c as CodeSecteur) : null;
}

const ouiNon = (v: unknown): OuiNon => (v === "Oui" ? "Oui" : v === "Non" ? "Non" : null);
const nombre = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const note = (v: unknown): Note =>
  v === 100 || v === 80 || v === 50 || v === 20 ? v : v === "Info. insuffisante" ? "Info. insuffisante" : null;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function dossierDepuisCasExcel(c: any): DossierPF {
  const pr = c.proport ?? {};
  const p = c.plafonds_donnees ?? {};
  const grille: Partial<Record<DomaineGrille, Note[]>> = {};
  for (const [k, v] of Object.entries(c.grille ?? {})) grille[k as DomaineGrille] = (v as unknown[]).map(note);
  const verrous: Partial<Record<CodeVerrou, OuiNon>> = {};
  for (const [k, v] of Object.entries(c.verrous ?? {})) verrous[k as CodeVerrou] = ouiNon(v);
  return {
    regime: c.regime as CodeRegime, secteur: secteurDepuisCodeBase(c.secteur), phase: c.phase as CodePhase,
    climatEleve: ouiNon(c.climat_eleve),
    proportionnalite: {
      exposition: nombre(pr.expo), toutEnMad: ouiNon(pr.mad), duree: nombre(pr.duree), technologieEprouvee: ouiNon(pr.tech_refs),
      epcCleEnMain: ouiNon(pr.epc), acheteurUnique: ouiNon(pr.acheteur_unique), premiereReference: ouiNon(pr.premiere_ref),
      consortium: ouiNon(pr.consortium), contratPlus20Ans: ouiNon(pr.contrat_20), nbContreparties: nombre(pr.nb_cp),
    },
    emplois: (c.emplois ?? []).map((e: any[]) => ({ libelle: String(e[0]), montant: Number(e[1]) })),
    ressources: (c.ressources ?? []).map((r: any[]) => ({ libelle: String(r[0]), montant: Number(r[1]), nature: (r[2] ?? null) as NatureRessource | null })),
    planRemediation: ouiNon(c.plan_remediation),
    choc: nombre(c.choc),
    periodes: (c.periodes ?? []).map((x: any[]) => ({ libelle: String(x[0]), cfads: Number(x[1]), service: Number(x[2]), cfadsStresse: nombre(x[3]) })),
    n3Llcr: c.phase === "P1" ? null : note(c.n3_llcr), n4: note(c.n4), n5: note(c.n5), n6: note(c.n6),
    donneesPlafonds: {
      llcr: nombre(p.llcr), dsraMois: nombre(p.dsra), expositionDevises: nombre(p.fx), detteARefinancer: nombre(p.refi),
      strategieRefinancement: ouiNon(p.strategie_refi), partAcheteur: nombre(p.part_acheteur), qualiteAcheteur: (p.qualite_acheteur ?? null) as QualiteAcheteur,
      dureeContrat: nombre(p.duree_contrat), dureeDette: nombre(p.duree_dette), solutionContrat: ouiNon(p.solution_contrat),
      planClimat: ouiNon(p.plan_climat), capaciteSponsor: ouiNon(p.capacite_sponsor), operateurRemplacable: ouiNon(p.operateur_remplacable),
      ecartOm: nombre(p.ecart_om), expositionGroupe: ouiNon(p.expo_groupe),
    },
    grille, verrous,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
