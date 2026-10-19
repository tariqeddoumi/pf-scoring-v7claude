/**
 * SQL d'installation des 18 cas d'étude (fictifs) du modèle Project Finance : un client,
 * un projet, ses crédits et son scoring complet par cas (C4A et C4B sont deux scorings du
 * même projet). Identifiants dérivés du code de chaque cas : relancer ne crée pas de
 * doublon (ON CONFLICT (id) DO NOTHING).
 *
 *   npx tsx scripts/db/semer-cas-pf.ts <entiteId> <auteurId> > cas-pf.sql
 *
 * Le SQL est découpé en parties (« -- PARTIE n ») pour pouvoir être exécuté en plusieurs fois.
 */
import { createHash } from "crypto";
import cas from "../../lib/modele-pf/cas-etude.json";
import { saisieDepuisCasExcel } from "../../lib/modele-pf/conversion";
import { calculerEvaluation } from "../../lib/modele-pf/serveur";
import { PARAMETRES_DEFAUT } from "../../lib/modele-pf/parametres";

const [entiteId, auteurId] = process.argv.slice(2);
if (!entiteId || !auteurId) {
  console.error("Usage : semer-cas-pf.ts <entiteId> <auteurId>");
  process.exit(1);
}

const uuid = (graine: string) => {
  const h = createHash("md5").update(`cas-pf:${graine}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const q = (v: unknown) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const j = (v: unknown) => `$json$${JSON.stringify(v)}$json$::jsonb`;
/** Le référentiel sectoriel de la base code l'immobilier de rendement « IMM ». */
const secteurBase = (s: string) => (s === "IMMO-REND" ? "IMM" : s);

type Dossier = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const parties: string[][] = [[], [], []];
const vus = new Set<string>();

(cas as { dossier: Dossier }[]).forEach((c, i) => {
  const d = c.dossier;
  const sql = parties[Math.floor((i * parties.length) / cas.length)];
  const clientId = uuid(`client:${d.code_client}`);
  const projetId = uuid(`projet:${d.code_projet}`);
  const emplois = (d.emplois ?? []).reduce((t: number, e: [string, number]) => t + Number(e[1] || 0), 0);
  const credits: [string, string, number, string, number][] = d.credits ?? [];
  const totalCredits = credits.reduce((t, x) => t + Number(x[2] || 0), 0);
  const nomClient = String(d.spv).replace(/^SPV\s*/i, "").replace(/[«»]/g, "").replace(/\s+/g, " ").trim();

  if (!vus.has(projetId)) {
    vus.add(projetId);
    sql.push(`INSERT INTO "BP_PF_clients" (id, nom, "raisonSociale", "codeClientT24", radical, secteur, pays, ville, type, status, "entiteId", "createdAt", "updatedAt")
VALUES (${q(clientId)}, ${q(nomClient)}, ${q(nomClient)}, ${q(d.code_client)}, ${q(d.radical)}, ${q(secteurBase(d.secteur))}, 'Maroc', ${q(d.lieu)}, 'Entreprise', 'Actif', ${q(entiteId)}, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;`);
    sql.push(`INSERT INTO "BP_PF_projects" (id, nom, description, secteur, montant, devise, status, pays, "countryCode", "clientId", "coutTotal", financement, "dureeCredit", "nomSPV", "codeProjet", "entiteId", "creePar", "dateCreation", "dateMiseAJour")
VALUES (${q(projetId)}, ${q(`${d.titre} (fictif)`)}, ${q(d.resume)}, ${q(secteurBase(d.secteur))}, ${q(totalCredits * 1e6)}, 'MAD', 'en_cours', 'Maroc', 'MA', ${q(clientId)}, ${q(emplois * 1e6)}, ${q(totalCredits * 1e6)}, ${q(d.proport?.duree ? Math.round(d.proport.duree) : null)}, ${q(d.spv)}, ${q(d.code_projet)}, ${q(entiteId)}, ${q(auteurId)}, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;`);
    credits.forEach(([numero, nature, montant, devise, duree], k) => {
      sql.push(`INSERT INTO "BP_PF_project_credits" (id, "projectId", "entiteId", numero, nature, montant, devise, "dureeAns", source, ordre, "createdAt", "updatedAt")
VALUES (${q(uuid(`credit:${d.code_projet}:${numero}`))}, ${q(projetId)}, ${q(entiteId)}, ${q(numero)}, ${q(nature)}, ${q(montant)}, ${q(devise || "MAD")}, ${q(duree)}, 'MANUELLE', ${k}, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;`);
    });
  }

  const saisie = saisieDepuisCasExcel(d);
  const calc = calculerEvaluation(saisie, PARAMETRES_DEFAUT, { codeClientT24: d.code_client, radical: d.radical, codeProjet: d.code_projet });
  if (calc.controles.length) throw new Error(`Cas ${d.onglet} incomplet : ${calc.controles.map((x) => x.libelle).join(", ")}`);
  const r = calc.resume;
  // Brouillon : le résultat est recalculé à l'ouverture avec les paramètres en vigueur.
  sql.push(`INSERT INTO "BP_PF_evaluations_pf" (id, "projectId", titre, statut, saisie, "scoreGlobal", "noteCalculee", "noteApprouvee", "regimeRetenu", "statutNote", "creePar", "modifiePar", "createdAt", "updatedAt")
VALUES (${q(uuid(`scoring:${d.onglet}`))}, ${q(projetId)}, ${q(`Cas d'étude ${d.onglet} — ${d.ref ?? ""}`.trim())}, 'brouillon', ${j(saisie)}, ${q(r.scoreGlobal)}, ${q(r.noteCalculee)}, ${q(r.noteApprouvee)}, ${q(r.regimeRetenu)}, ${q(r.statutNote)}, ${q(auteurId)}, ${q(auteurId)}, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;`);
});

parties.forEach((p, i) => console.log(`-- PARTIE ${i + 1}\nBEGIN;\n${p.join("\n")}\nCOMMIT;\n`));
