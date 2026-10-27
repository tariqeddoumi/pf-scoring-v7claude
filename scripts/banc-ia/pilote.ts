// Pilote du test de bout en bout de l'import par IA, à travers les routes de l'application :
// nouveau scoring vide → dépôt des 9 pièces → analyse → comparaison des propositions avec la
// saisie de référence du cas (fiche climat fictive du bloc 14 comprise) → acceptation de toutes
// les propositions → note obtenue.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import cas from "../../lib/modele-pf/cas-etude.json";
import { saisieDepuisCasExcel } from "../../lib/modele-pf/conversion";
import { lireChamp, afficherValeur, tousLesChamps } from "../../lib/modele-pf/champs-ia";
import { relireSaisie } from "../../lib/modele-pf/saisie";
import { FICHES_CLIMAT_CAS } from "../../lib/modele-pf/cas-climat";

const BASE = "http://localhost:3200";
const PIECES = path.join(__dirname, "../../docs/cas-etude-pieces");
const JETON = process.env.JETON!;
const filtre = process.argv[2];

const api = async (m: string, url: string, corps?: unknown) => {
  const r = await fetch(BASE + url, { method: m, headers: { authorization: `Bearer ${JETON}`, "content-type": "application/json" }, body: corps ? JSON.stringify(corps) : undefined });
  const t = await r.text();
  let j: any; try { j = JSON.parse(t); } catch { j = { brut: t.slice(0, 300) }; }
  if (!r.ok) throw new Error(`${m} ${url} → ${r.status} ${JSON.stringify(j).slice(0, 300)}`);
  return j;
};
const egal = (a: unknown, b: unknown) => {
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
  return JSON.stringify(a) === JSON.stringify(b) || (a != null && b != null && String(a) === String(b));
};

const ATTENDU = JSON.parse(fs.readFileSync(path.join(PIECES, "donnees.json"), "utf8")).cas.map((c: any) => c.resultat);
async function principal() {
const bilan: string[] = [];
const dossiers = fs.readdirSync(PIECES).filter((d) => /^\d\d_/.test(d) && fs.statSync(path.join(PIECES, d)).isDirectory()).sort();
for (const [i, { dossier: d }] of (cas as any[]).entries()) {
  const nomDossier = dossiers[i];
  if (filtre && !nomDossier.includes(filtre)) continue;
  const ref = saisieDepuisCasExcel(d);
  // Les cas Excel n'ont pas de fiche climat : la référence du bloc 14 est la fiche fictive du cas,
  // que portent les pièces (synthèse EIES et climat), comme dans scripts/docs/exporter-donnees-cas.ts.
  const fc = FICHES_CLIMAT_CAS[d.onglet];
  if (fc) ref.climat = relireSaisie({ ...ref, climat: { ...ref.climat, ...fc } }).climat;
  const pid = execSync(`psql -h /tmp -p 55432 -U postgres -d pf -Atc "select id from \\"BP_PF_projects\\" where \\"codeProjet\\"='${d.code_projet}'"`).toString().trim();
  const { id } = await api("POST", `/api/projects/${pid}/evaluations-pf`, { titre: `Test import IA — ${d.onglet}` });

  for (const f of fs.readdirSync(path.join(PIECES, nomDossier)).sort()) {
    const contenu = fs.readFileSync(path.join(PIECES, nomDossier, f));
    const lien = await api("POST", `/api/evaluations-pf/${id}/pieces`, { fileName: f, fileSize: contenu.length, fileType: "application/pdf" });
    const r = await fetch(lien.url, { method: lien.methode, headers: lien.entetes, body: contenu });
    if (!r.ok) throw new Error(`dépôt ${f} → ${r.status}`);
  }

  const { analyse } = await api("POST", `/api/evaluations-pf/${id}/analyse`);
  const props: any[] = analyse.propositions;
  let justes = 0;
  const ecarts: string[] = [];
  for (const p of props) {
    // Justifications et commentaires : texte libre de l'IA, sans valeur de référence.
    if (/\.(justification|commentaire|source)$/.test(p.cle)) { justes++; continue; }
    const attendu = lireChamp(ref, p.cle);
    if (egal(p.valeur, attendu)) justes++;
    else ecarts.push(`${p.cle}: lu « ${p.affichage} » / attendu « ${afficherValeur(p.cle, attendu)} »`);
  }
  // Champs renseignés dans le cas mais non proposés par l'analyse.
  const proposees = new Set(props.map((p) => p.cle));
  const nonLus = analyse.manquants.map((m: any) => m.cle).filter((c: string) => {
    const v = lireChamp(ref, c); return v !== null && v !== "" && !proposees.has(c);
  });

  // Fiche climat (bloc 14) : champs renseignés dans la référence et retrouvés à l'identique.
  const attendusClimat = tousLesChamps().map((c) => c.cle)
    .filter((c) => c.startsWith("climat.") && !c.endsWith(".source") && lireChamp(ref, c) !== null);
  const climatJustes = attendusClimat.filter((c) => { const p = props.find((x) => x.cle === c); return p && egal(p.valeur, lireChamp(ref, c)); }).length;

  await api("POST", `/api/evaluations-pf/${id}/propositions`, { decisions: props.map((p) => ({ cle: p.cle, decision: "acceptee" })) });
  const e = await api("GET", `/api/evaluations-pf/${id}`);
  const r = e.resultat;
  const ligne = `${d.onglet.padEnd(5)} pièces ${analyse.pieces.length} · propositions ${props.length} (${justes} conformes, ${ecarts.length} écarts) · non lus ${nonLus.length} · climat ${climatJustes}/${attendusClimat.length} · note ${r.noteApprouvee} (attendu ${ATTENDU[i].noteApprouvee}, ${ATTENDU[i].verrousActifs.join(",") || "—"} / ${ATTENDU[i].plafondsActifs.join(",") || "—"}) · verrous ${r.verrousActifs.join(",") || "—"} · plafonds ${r.plafondsActifs.join(",") || "—"}`;
  console.log(ligne);
  for (const x of ecarts.slice(0, 12)) console.log("    écart", x);
  if (nonLus.length) console.log("    non lus", nonLus.join(", "));
  bilan.push(ligne);
  fs.writeFileSync(path.join(process.env.BANC_IA_TRACE ?? "/tmp", `res_${d.onglet}.json`),
    JSON.stringify({ id, climat: { justes: climatJustes, attendus: attendusClimat.length }, resultat: { noteApprouvee: r.noteApprouvee, noteCalculee: r.noteCalculee, score: r.score, verrous: r.verrousActifs, plafonds: r.plafondsActifs }, ecarts, nonLus, avertissements: analyse.avertissements }, null, 1));
}
}
principal().catch((e) => { console.error(e); process.exit(1); });
