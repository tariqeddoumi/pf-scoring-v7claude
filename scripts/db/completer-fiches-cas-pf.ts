/**
 * Complète les fiches client et projet des 18 cas d'étude (fictifs) installés par
 * semer-cas-pf.ts, qui ne renseignait que l'essentiel (nom, codes, montants). Toutes les
 * données sont fictives : identifiants, adresses, contacts, notations.
 *
 *   npx tsx scripts/db/completer-fiches-cas-pf.ts > fiches-cas-pf.sql
 *
 * Seuls les champs vides sont remplis (COALESCE) : une valeur saisie depuis l'outil n'est
 * jamais écrasée. La ville, posée par l'installation avec un lieu générique (« Zone
 * portuaire »), est remplacée uniquement si elle porte encore cette valeur d'origine.
 */
import { createHash } from "crypto";
import cas from "../../lib/modele-pf/cas-etude.json";

const uuid = (graine: string) => {
  const h = createHash("md5").update(`cas-pf:${graine}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const mmad = (x: number) =>
  `${x.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} MMAD`;

import { FICHES_CAS as F } from "./fiches-cas-pf-donnees";

type Dossier = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const FONDS_PROPRES = ["Fonds propres", "Quasi-fonds propres"];
const vus = new Set<string>();
const sql: string[] = ["BEGIN;"];
const clients: Record<string, unknown>[] = [];
const projets: Record<string, unknown>[] = [];

for (const { dossier: d } of cas as { dossier: Dossier }[]) {
  if (vus.has(d.code_projet)) continue; // C4A et C4B partagent le projet ; la fiche suit C4A
  vus.add(d.code_projet);
  const f = F[d.code_projet];
  if (!f) throw new Error(`Fiche manquante pour ${d.code_projet}`);
  const nomClient = String(d.spv)
    .replace(/^SPV\s*/i, "")
    .replace(/[«»]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const ressources: [string, number, string][] = d.ressources ?? [];
  const fp = ressources
    .filter((r) => FONDS_PROPRES.includes(r[2]))
    .reduce((t, r) => t + r[1], 0);
  const dette = ressources
    .filter((r) => r[2] === "Dette senior")
    .reduce((t, r) => t + r[1], 0);
  const totalRess = ressources.reduce((t, r) => t + r[1], 0);
  const exposition = (d.credits ?? []).reduce(
    (t: number, c: [string, string, number]) => t + Number(c[2] || 0),
    0
  );
  const dscr = Math.min(
    ...(d.periodes ?? [])
      .filter((p: number[]) => p[2] > 0)
      .map((p: number[]) => p[1] / p[2])
  );
  const duree = Math.round(d.proport?.duree ?? 0);
  const suffixeRc = Number(d.code_client.slice(-5));
  const structure = ressources
    .map(
      (r) =>
        `${r[0]} : ${mmad(r[1])} (${((r[1] / totalRess) * 100).toFixed(1).replace(".", ",")} %)`
    )
    .join(" · ");

  const client: Record<string, unknown> = {
    nomCommercial: nomClient.replace(/\s+(SA|SARL)\s*\(fictive\)$/, ""),
    description: `Société de projet (SPV) dédiée au projet « ${d.titre} ». ${d.resume} Cas d'étude fictif.`,
    email: `contact@${f.domaine}.example.ma`,
    telephone: f.telephone,
    website: `https://www.${f.domaine}.example.ma`,
    adresse: f.adresse,
    codePostal: f.codePostal,
    typeClient: f.typeClient,
    formeJuridique: f.forme,
    segmentClientele: f.segment,
    ratingInterne: f.rating,
    statutBancaire: f.statutBancaire,
    statusKYC: f.kyc,
    statusConformite: f.conformite,
    effectifs: f.effectifs,
    capitalSocial: f.capital,
    chiffreAffaires: f.ca,
    fondsPropres: Math.round(fp * 1e6),
    exerciceReference: 2025,
    exposition: Math.round(exposition * 1e6),
    centreAffaires: `Centre d'affaires Grandes Entreprises — ${f.ville}`,
    gestionnaire: "AnaRisk1 Eddoumi1",
    dateRelation: f.relation,
    dateCreationSociete: f.creation,
    dateRevueKYC: "2026-06-30",
    ice: `00${d.code_client}${String(suffixeRc).padStart(5, "0")}`,
    registreCommerce: `RC ${f.ville} ${100000 + suffixeRc}`,
    identifiantFiscal: String(40000000 + suffixeRc * 7),
    roleGroupe: "SPV / société de projet",
    experienceSecteurAnnees: f.experience,
    projetsSimilaires: f.similaires,
    notationExterne: f.notation,
    agenceNotation: f.notation === "Non notée" ? "Autre" : "Fitch Maroc",
    classificationBAM: f.bam,
    niveauRisqueLBC: f.lbc,
    ppe: false,
    sourceDonnees: "Cas d'étude fictif",
  };
  const projet: Record<string, unknown> = {
    sponsorPrincipal: f.sponsor,
    constructeurEPC: f.epc,
    operateurOM: f.om,
    technologie: f.technologie,
    capaciteInstallee: f.capacite,
    debutConstruction: f.debut,
    finConstruction: f.fin,
    apportPropre: Math.round(fp * 1e6),
    structureCapitalePrincipale: structure,
    taux: f.taux,
    typeCredit: f.typeCredit,
    dureeProjet: f.dureeProjet,
    periodeAmorce: f.amorce,
    periodeRemboursement: Math.max(duree - f.amorce, 0),
    tauxCouverture: Number.isFinite(dscr) ? Math.round(dscr * 100) / 100 : null,
    ratio: fp > 0 ? Math.round((dette / fp) * 100) / 100 : null,
  };
  clients.push({
    id: uuid(`client:${d.code_client}`),
    lieu: d.lieu,
    villeCible: f.ville,
    ...client,
  });
  projets.push({ id: uuid(`projet:${d.code_projet}`), ...projet });
}

/** Une instruction par table : les lignes passent en JSON, chaque colonne n'est remplie que si elle est vide. */
const maj = (
  table: string,
  lignes: Record<string, unknown>[],
  horodatage: string,
  extra = ""
) => {
  const cols = Object.keys(lignes[0]).filter(
    (k) => !["id", "lieu", "villeCible"].includes(k)
  );
  return `UPDATE "${table}" t SET
  ${cols.map((k) => `"${k}" = COALESCE(t."${k}", r."${k}")`).join(",\n  ")},${extra}
  "${horodatage}" = NOW()
FROM (SELECT e, r.* FROM jsonb_array_elements($json$${JSON.stringify(lignes)}$json$::jsonb) e,
      jsonb_populate_record(NULL::"${table}", e) r) r
WHERE t.id = r.id;`;
};
sql.push(
  maj(
    "BP_PF_clients",
    clients,
    "updatedAt",
    `
  ville = CASE WHEN t.ville IS NULL OR t.ville = r.e->>'lieu' THEN r.e->>'villeCible' ELSE t.ville END,`
  )
);
sql.push(maj("BP_PF_projects", projets, "dateMiseAJour"));
sql.push("COMMIT;");
console.log(sql.join("\n"));
