// Serveurs de test locaux : stockage S3 minimal (4998) et « lecteur » compatible OpenAI (4999)
// qui répond à la place du modèle en lisant le texte des pièces transmis par l'application.
// Importé (et non lancé), le module n'ouvre aucun port et expose seulement `repondre`.
import http from "node:http";
import { pathToFileURL } from "node:url";

const lance = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

const objets = new Map();
if (lance) http.createServer((req, res) => {
  const cle = decodeURIComponent(req.url.split("?")[0]);
  if (req.method === "PUT") {
    const morceaux = [];
    req.on("data", (c) => morceaux.push(c));
    req.on("end", () => { objets.set(cle, Buffer.concat(morceaux)); res.writeHead(200, { ETag: '"x"' }); res.end(); });
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    const b = objets.get(cle);
    if (!b) { res.writeHead(404, { "content-type": "application/xml" }); res.end("<Error><Code>NoSuchKey</Code></Error>"); return; }
    res.writeHead(200, { "content-type": "application/pdf", "content-length": b.length });
    res.end(req.method === "GET" ? b : undefined);
    return;
  }
  if (req.method === "DELETE") { objets.delete(cle); res.writeHead(204); res.end(); return; }
  res.writeHead(200); res.end();
}).listen(4998);

// ─── lecteur ───────────────────────────────────────────────────────────────────
const norm = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'").replace(/\s+/g, " ").toLowerCase().trim();
const SECTEURS = { "energies renouvelables": "ENR", "eau et dessalement": "EAU", "telecom et data centers": "TEL", transport: "TRA",
  "ports et logistique": "POR", sante: "SAN", "thermique et gaz": "ETH", "immobilier de rendement": "IMMO-REND", industrie: "IND",
  "agro-industrie": "AGR", "tourisme et hotellerie": "TOU", "mines et extraction": "MIN" };
// Libellés des aléas tels que les pièces les écrivent (lib/modele-pf/climat.ts, LIBELLES_ALEAS).
const ALEAS = { chaleur: "Chaleur extrême", secheresse: "Stress hydrique et sécheresse", inondation: "Inondation et crue",
  submersion: "Submersion marine et élévation du niveau de la mer", feux: "Feux de forêt", vents: "Tempêtes, vents violents, vents de sable" };
const nombre = (t) => { const m = String(t).replace(/ | /g, " ").match(/-?\d[\d ]*(?:,\d+)?/); return m ? Number(m[0].replace(/ /g, "").replace(",", ".")) : null; };

function lireCriteres(consigne) {
  const lignes = consigne.split("\n"); const out = []; let cur = null;
  for (const l of lignes) {
    const m = l.match(/^- (\S+) — (.*?)( \[OBLIGATOIRE\])?$/);
    if (m) { cur = { code: m[1], label: m[2], options: [], nombre: false }; out.push(cur); continue; }
    const o = l.match(/^\s+· (.+?) = (.*)$/);
    if (o && cur) cur.options.push({ value: o[1], label: o[2].split(" — ")[0] });
    if (cur && /valeurNombre/.test(l)) cur.nombre = true;
  }
  return out;
}

export function repondre(docs, consigne) {
  const vide = { synthese: "", documents: [], criteres: [], questions: [] };
  if (consigne.includes("VOLET : CONTRÔLE")) {
    const bord = docs.find((d) => /Bordereau/.test(d.nom));
    const manque = bord && !/Aucune : le dossier est complet/.test(bord.texte);
    return { ...vide, synthese: `Dossier de ${docs.length} pièces.${manque ? " Pièces attendues non remises : voir le bordereau." : " Dossier complet."}`,
      documents: docs.map((d) => ({ nom: d.nom, typeIdentifie: d.nom.replace(/^\d+_/, "").replace(/_/g, " ").replace(/\.pdf$/, ""), role: "Pièce du dossier",
        complet: !(manque && /Bordereau/.test(d.nom)), elementsManquants: [], incoherences: [] })) };
  }
  const tout = docs.map((d) => d.texte).join("\n");
  const plat = norm(tout);
  const src = (motif) => { const d = docs.find((x) => norm(x.texte).includes(norm(motif))) ?? docs[0]; return [{ document: d.nom, localisation: "texte", extrait: motif.slice(0, 120) }]; };
  const apres = (etiquette, long = 160) => { const i = plat.indexOf(norm(etiquette)); return i < 0 ? null : plat.slice(i + norm(etiquette).length, i + norm(etiquette).length + long); };
  const res = (code, champs, motif, statut = "trouve") => ({ code, statut, optionChoisie: null, valeurNombre: null, valeurBooleen: null, valeurTexte: null,
    confiance: "elevee", justification: "Lu dans les pièces.", sources: motif ? src(motif) : [], documentAttendu: null, ...champs });
  const absent = (code) => ({ code, statut: "absent", optionChoisie: null, valeurNombre: null, valeurBooleen: null, valeurTexte: null,
    confiance: "faible", justification: "Information absente des pièces.", sources: [], documentAttendu: "Pièce complémentaire" });
  const ouiNon = (code, etiquette) => { const a = apres(etiquette, 12); if (!a) return absent(code); const v = /^\s*:?\s*oui/.test(a) ? "Oui" : /^\s*:?\s*non/.test(a) ? "Non" : null; return v ? res(code, { optionChoisie: v }, etiquette) : absent(code); };
  const num = (code, etiquette, facteur = 1) => { const a = apres(etiquette, 40); const n = a == null ? null : nombre(a); return n == null ? absent(code) : res(code, { valeurNombre: n * facteur }, etiquette); };
  const phrase = (code, si, sinon) => plat.includes(norm(si)) ? res(code, { optionChoisie: "Oui" }, si) : sinon && plat.includes(norm(sinon)) ? res(code, { optionChoisie: "Non" }, sinon) : absent(code);

  // Fiche climat (bloc 14) : sections « Risques climatiques physiques », « Risque de transition » et
  // « Scénario climatique » de la synthèse EIES et climat. Une valeur « non documenté » reste absente.
  const toutC = tout.replace(/\s+/g, " ");
  const debClimat = toutC.indexOf("Risques climatiques physiques");
  const entre = (debut, fin) => {
    if (debClimat < 0) return null;
    const i = toutC.indexOf(debut, debClimat); if (i < 0) return null;
    const j = fin ? toutC.indexOf(fin, i + debut.length) : -1;
    const v = toutC.slice(i + debut.length, j < 0 ? i + debut.length + 160 : j).trim();
    return !v || norm(v).startsWith("non documente") ? null : v;
  };
  const climat = (k) => {
    const alea = k.match(/^climat\.alea\.([a-z]+)\.(niveau|adaptation)$/);
    if (alea) {
      const lib = ALEAS[alea[1]];
      const i = debClimat < 0 ? -1 : plat.indexOf("source / etude adaptation financee", plat.indexOf("risques climatiques physiques"));
      const fin = plat.indexOf("risque de transition", i);
      const table = i < 0 ? "" : plat.slice(i, fin < 0 ? undefined : fin);
      const j = lib ? table.indexOf(norm(lib)) : -1;
      if (j < 0) return absent(k);
      // Ligne du tableau : niveau, source (sans « oui » ni « non »), adaptation financée.
      const m = table.slice(j + norm(lib).length).match(/^\s*(faible|moyen|eleve)\b.*?\b(oui|non documente|non)\b/);
      if (!m) return absent(k);
      if (alea[2] === "niveau") return res(k, { optionChoisie: { faible: "Faible", moyen: "Moyen", eleve: "Élevé" }[m[1]] }, lib);
      return m[2] === "non documente" ? absent(k) : res(k, { optionChoisie: m[2] === "oui" ? "Oui" : "Non" }, lib);
    }
    const oN = (v, motif) => { const n = v == null ? "" : norm(v); return /^oui\b/.test(n) ? res(k, { optionChoisie: "Oui" }, motif) : /^non\b/.test(n) ? res(k, { optionChoisie: "Non" }, motif) : absent(k); };
    const nb = (v, motif, facteur = 1) => { const n = v == null ? null : nombre(v); return n == null ? absent(k) : res(k, { valeurNombre: n * facteur }, motif); };
    switch (k) {
      case "climat.localisation": { const v = entre("Localisation du site", "Aléa Niveau"); return v ? res(k, { valeurTexte: v }, "Localisation du site") : absent(k); }
      case "climat.emissions": return nb(entre("Émissions de gaz à effet de serre, scopes 1 et 2", "Exportations vers l'UE"), "Émissions de gaz à effet de serre");
      case "climat.export_macf": return nb(entre("Exportations vers l'UE soumises au MACF", "Dépendance aux énergies fossiles"), "Exportations vers l'UE", 0.01);
      case "climat.actif_fossile": return oN(entre("Dépendance aux énergies fossiles", "Plan de transition"), "Dépendance aux énergies fossiles");
      case "climat.plan_transition": return oN(entre("Plan de transition crédible et financé", "Scénario climatique"), "Plan de transition");
      case "climat.choc": return nb(entre("Baisse du CFADS sous le scénario climatique"), "Baisse du CFADS sous le scénario climatique", 0.01);
      case "climat.choc.description": { const v = entre("Scénario climatique retenu", "Baisse du CFADS sous le scénario climatique"); return v ? res(k, { valeurTexte: v }, "Scénario climatique retenu") : absent(k); }
      default: return absent(k);
    }
  };

  const criteres = lireCriteres(consigne).map((c) => {
    const k = c.code;
    if (k.startsWith("climat.")) return climat(k);
    if (/^(D\d\.\d|N[4-6])$/.test(k)) {
      const cible = norm(`${k} · `);
      for (let i = plat.indexOf(cible); i >= 0; i = plat.indexOf(cible, i + 1)) {
        const fen = plat.slice(i + cible.length, i + cible.length + 700);
        const fin = fen.search(/\b(d\d\.\d|n[4-6]) · /);
        const zone = fin > 0 ? fen.slice(0, fin) : fen;
        if (zone.includes("element non disponible")) return res(k, { optionChoisie: "Info. insuffisante", statut: "partiel" }, `${k} · `);
        let meilleur = null;
        for (const o of c.options) {
          if (o.value === "Info. insuffisante") continue;
          const lib = norm(o.label);
          if (zone.includes(lib) && (!meilleur || lib.length > meilleur.l)) meilleur = { l: lib.length, o };
        }
        if (meilleur) return res(k, { optionChoisie: meilleur.o.value }, `${k} · `);
      }
      return absent(k);
    }
    switch (k) {
      case "regime": { const m = plat.match(/regime de revenus .*?\((r[1-4])\)/); return m ? res(k, { optionChoisie: m[1].toUpperCase() }, "Régime de revenus") : absent(k); }
      case "phase": { const m = plat.match(/phase .*?\((p[1-3])\)/); return m ? res(k, { optionChoisie: m[1].toUpperCase() }, "Phase") : absent(k); }
      case "secteur": { const m = tout.match(/^Secteur (.+)$/m); const s = m && Object.entries(SECTEURS).find(([l]) => norm(m[1]).startsWith(l)); return s ? res(k, { optionChoisie: s[1] }, "Secteur") : absent(k); }
      case "periodicite": { const a = apres("Périodicité", 20) ?? ""; const v = ["Semestrielle", "Trimestrielle", "Mensuelle"].find((x) => a.includes(norm(x))); return v ? res(k, { optionChoisie: v }, "Périodicité") : absent(k); }
      case "expo": return num(k, "Exposition sollicitée");
      case "duree": return num(k, "Durée de la dette");
      case "nbcp": return num(k, "Nombre de contreparties clés");
      case "mad": return ouiNon(k, "Financement intégralement en dirhams");
      case "techno": return ouiNon(k, "Technologie éprouvée (références)");
      case "epc18": return ouiNon(k, "Construction clé-en-main");
      case "unique": return ouiNon(k, "Acheteur unique de la production");
      case "premiere": return ouiNon(k, "Première référence technologique");
      case "consortium": return ouiNon(k, "Opération consortiale");
      case "plus20": return ouiNon(k, "Contrat de revenus ou concession de plus de 20 ans");
      case "climat": return ouiNon(k, "Site exposé à un risque climatique physique élevé");
      case "remediation": return phrase(k, "Un plan de remédiation du financement à terminaison a été présenté", "Aucun plan de remédiation du financement à terminaison");
      case "n3_llcr": { const m = plat.match(/n3 · appreciation du llcr \(hors construction\) : note (\d+) sur 100/); return m ? res(k, { optionChoisie: m[1] }, "N3 · Appréciation du LLCR") : absent(k); }
      case "choc": { const m = plat.match(/baisse du cfads de (\d+(?:,\d+)?) %/); return m ? res(k, { valeurNombre: Number(m[1].replace(",", ".")) / 100 }, "baisse du CFADS") : absent(k); }
      case "choc.description": { const i = tout.indexOf(" : baisse du CFADS"); if (i < 0) return absent(k); const deb = tout.lastIndexOf("\n", i); return res(k, { valeurTexte: tout.slice(deb + 1, i).trim() }, "Scénario défavorable"); }
      case "llcr": return num(k, "LLCR :");
      case "dsra": return num(k, "Réserve de service de la dette (DSRA)");
      case "fx": return num(k, "Exposition nette en devises non couverte", 0.01);
      case "refi": return num(k, "Dette à refinancer à l'échéance (ballon)", 0.01);
      case "strat": { const a = apres("Stratégie de refinancement approuvée", 15) ?? ""; return /^\s*oui/.test(a) ? res(k, { optionChoisie: "Oui" }, "Stratégie") : /^\s*non\b/.test(a) ? res(k, { optionChoisie: "Non" }, "Stratégie") : absent(k); }
      case "part_ach": return num(k, "Part des recettes portée par l'acheteur ou payeur principal :", 0.01);
      case "qual": { const a = apres("qualité de crédit interne de cet acheteur :", 15) ?? ""; const v = c.options.find((o) => a.trim().startsWith(norm(o.value))); return v ? res(k, { optionChoisie: v.value }, "qualité de crédit interne") : absent(k); }
      case "duree_contrat": return num(k, "Durée du contrat de revenus :");
      case "duree_dette": { const m = plat.match(/pour une dette de (\d+) ans|dette de (\d+) ans\./); return m ? res(k, { valeurNombre: Number(m[1] ?? m[2]) }, "dette de") : absent(k); }
      case "solution": return ouiNon(k, "Solution documentée pour la période non couverte");
      case "plan_adapt": return ouiNon(k, "Plan d'adaptation financé");
      case "sponsor": { const a = apres("Capacité résiduelle du sponsor pour l'appel de fonds propres restant :", 15) ?? ""; return /^\s*suffisante/.test(a) ? res(k, { optionChoisie: "Oui" }, "Capacité résiduelle") : /^\s*insuffisante/.test(a) ? res(k, { optionChoisie: "Non" }, "Capacité résiduelle") : absent(k); }
      case "operateur": return ouiNon(k, "Opérateur remplaçable sans rupture d'exploitation");
      case "ecart_om": { const m = plat.match(/expire (\d+) ans avant la derniere echeance/); if (m) return res(k, { valeurNombre: Number(m[1]) }, "expire"); return plat.includes("couvre toute la duree de la dette (ecart de 0 an)") ? res(k, { valeurNombre: 0 }, "écart de 0 an") : absent(k); }
      case "facteur": return phrase(k, "dépasse la limite interne", "reste dans les limites internes");
      case "verrou.X1": return phrase(k, "L'activité figure sur la liste d'exclusion", "ne figure ni sur la liste");
      case "verrou.X2": return phrase(k, "ne peut juridiquement être obtenue", "sont obtenues ou peuvent l'être");
      case "verrou.X3": return phrase(k, "figure sur une liste de sanctions", "aucune correspondance");
      case "verrou.X4": return phrase(k, "en défaut avéré non régularisé", "Analyse du marché");
      case "verrou.B1": return phrase(k, "Le contrat de revenus principal n'est pas signé", "Le contrat de revenus principal est signé");
      case "verrou.B2": return phrase(k, "Le contrat de construction (EPC) n'est pas signé", "Rapport de l'ingénieur indépendant");
      case "verrou.B3": return phrase(k, "ne couvrent pas le besoin à terminaison", "Couverture du besoin à terminaison");
      case "verrou.B4": return phrase(k, "Le droit d'occupation du site n'est pas établi", "Le droit d'occupation du site est établi");
      case "verrou.B5": return phrase(k, "comporte une réserve substantielle", "sans réserve substantielle");
      // B6 est posé à l'envers : « Oui » = modèle complet et rapproché (pas de blocage).
      case "verrou.B6": return plat.includes(norm("n'est pas rapproché des états financiers")) ? res(k, { optionChoisie: "Non" }, "modèle") : plat.includes(norm("rapproché des derniers états financiers")) ? res(k, { optionChoisie: "Oui" }, "modèle") : absent(k);
      case "verrou.B7": return phrase(k, "À saisir en « Info. insuffisante »", "Aucune : le dossier est complet");
      case "verrou.B8": return phrase(k, "L'acceptabilité environnementale n'est pas obtenue", "L'acceptabilité environnementale est obtenue");
      case "liste.emplois": return liste(k, "Emplois (besoin à terminaison, MMAD)", "Total du besoin");
      case "liste.ressources": return liste(k, "Ressources (MMAD)", "Total des ressources");
      case "liste.echeancier": return liste(k, "Échéancier du scénario central", "DSCR minimum du scénario central");
      default:
        if (/^secteur\.\d+\.valeur$/.test(k)) {
          const lib = c.label.replace(/\s*\([^)]*\)\s*$/, "");
          const ligne = tout.split("\n").find((l) => l.startsWith(lib + " "));
          if (!ligne) return absent(k);
          const reste = ligne.slice(lib.length).trim();
          const m = reste.match(/^(-?\d[\d \u202f\u00a0]*(?:,\d+)?)(\s|$)/);
          if (m) return res(k, { valeurNombre: nombre(m[1]) }, lib);
          return reste && !reste.startsWith("—") ? res(k, { valeurTexte: reste.split(" ")[0] }, lib) : absent(k);
        }
        return absent(k);
    }
  });

  // Listes : une ligne de tableau par ligne de texte, entre deux repères.
  function liste(code, debut, fin) {
    const i = tout.indexOf(debut); const j = tout.indexOf(fin, i + 1);
    if (i < 0 || j < 0) return absent(code);
    const lignes = tout.slice(i + debut.length, j).split("\n").map((l) => l.trim()).filter(Boolean);
    const NB = "(-?\\d[\\d \u202f\u00a0]*(?:,\\d+)?)";
    const NATURES = ["Dette senior", "Dette subordonnée", "Fonds propres", "Quasi-fonds propres", "Engagement sponsor", "Ligne dédiée engagée", "Subvention encaissée", "Autre ressource"];
    const sorties = [];
    for (const l of lignes) {
      if (code === "liste.emplois") { const m = l.match(new RegExp(`^(.*?\\S)\\s+${NB}$`)); if (m && !/^Emploi /.test(l)) sorties.push(`${m[1]} ; ${nombre(m[2])}`); }
      if (code === "liste.ressources") {
        const m = l.match(new RegExp(`^(.*?\\S)\\s+${NB}$`)); if (!m || /^Ressource /.test(l)) continue;
        const nat = NATURES.find((n) => m[1].endsWith(" " + n));
        if (nat) sorties.push(`${m[1].slice(0, -nat.length - 1)} ; ${nombre(m[2])} ; ${nat}`);
      }
      if (code === "liste.echeancier") { const m = l.match(new RegExp(`^(.+?)\\s+${NB}\\s+${NB}\\s+(?:${NB}|—)$`)); if (m && !/^Période/.test(l)) sorties.push(`${m[1]} ; ${nombre(m[2])} ; ${nombre(m[3])}`); }
    }
    return sorties.length ? res(code, { valeurTexte: sorties.join("\n") }, debut) : absent(code);
  }
  return { ...vide, criteres };
}

let appels = 0;
if (lance) http.createServer((req, res) => {
  const morceaux = [];
  req.on("data", (c) => morceaux.push(c));
  req.on("end", async () => {
    try {
      const corps = JSON.parse(Buffer.concat(morceaux).toString("utf8"));
      const contenu = corps.messages.find((m) => m.role === "user").content;
      const docs = []; let consigne = "";
      for (const p of contenu) {
        if (p.type !== "text") continue;
        const m = p.text.match(/^=== Document « (.+?) » ===\n([\s\S]*)$/);
        if (m) docs.push({ nom: m[1], texte: m[2] }); else consigne = p.text;
      }
      appels += 1;
      try { (await import("node:fs")).writeFileSync((process.env.BANC_IA_TRACE ?? "/tmp") + `/recu_${appels}.txt`, docs.map((d) => "##### " + d.nom + "\n" + d.texte).join("\n") + "\n##### CONSIGNE\n" + consigne); } catch {}
      const sortie = repondre(docs, consigne);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ model: "lecteur-de-test", choices: [{ finish_reason: "stop", message: { content: JSON.stringify(sortie) } }],
        usage: { prompt_tokens: JSON.stringify(contenu).length >> 2, completion_tokens: 100 } }));
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  });
}).listen(4999, () => console.log("serveurs prêts (S3 4998, IA 4999)"));
