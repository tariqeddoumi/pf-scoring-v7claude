"""Pièces fictives des 18 cas d'étude du modèle de scoring Project Finance.

Chaque dossier rassemble les documents qu'un chargé d'affaires réunirait pour saisir le
cas dans l'outil : signalétique et KYC, mémorandum, plan de financement et term sheet,
modèle financier, rapports des conseils (ingénieur indépendant, marché et contreparties,
juridique, environnement et social). Les constats reprennent exactement la saisie du cas
(donnees.json, exporté par scripts/docs/exporter-donnees-cas.ts) : la lecture des pièces
doit conduire aux mêmes situations, verrous et plafonds que l'outil.

Une information marquée « Info. insuffisante » dans le cas est absente de son dossier :
la pièce correspondante figure au bordereau comme attendue et non remise.

    python3 docs/cas-etude-pieces/generer.py docs/cas-etude-pieces
"""
import json
import os
import sys

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

F = "/usr/share/fonts/truetype/dejavu/"
pdfmetrics.registerFont(TTFont("DV", F + "DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", F + "DejaVuSans-Bold.ttf"))
registerFontFamily("DV", normal="DV", bold="DVB", italic="DV", boldItalic="DVB")

OUT = sys.argv[1]
ICI = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(ICI, "donnees.json"), encoding="utf-8"))
REF = D["referentiel"]
PAR = D["parametres"]

BLEU = colors.HexColor("#1F3A5F")
S = {
    "t": ParagraphStyle("t", fontName="DVB", fontSize=16, leading=20, textColor=BLEU, spaceAfter=4),
    "st": ParagraphStyle("st", fontName="DV", fontSize=10, leading=13.5, textColor=colors.HexColor("#555555"), spaceAfter=10),
    "h": ParagraphStyle("h", fontName="DVB", fontSize=11.5, leading=14.5, textColor=BLEU, spaceBefore=9, spaceAfter=4),
    "p": ParagraphStyle("p", fontName="DV", fontSize=9.3, leading=13.2, spaceAfter=4),
    "c": ParagraphStyle("c", fontName="DV", fontSize=8.4, leading=10.8),
    "cb": ParagraphStyle("cb", fontName="DVB", fontSize=8.4, leading=10.8, textColor=colors.white),
    "enc": ParagraphStyle("enc", fontName="DV", fontSize=9, leading=12.5, backColor=colors.HexColor("#FFF6DD"),
                          borderColor=colors.HexColor("#D9A400"), borderWidth=0.6, borderPadding=6, spaceBefore=6, spaceAfter=8),
    "alerte": ParagraphStyle("alerte", fontName="DV", fontSize=9, leading=12.5, backColor=colors.HexColor("#FDECEC"),
                             borderColor=colors.HexColor("#C0392B"), borderWidth=0.6, borderPadding=6, spaceBefore=6, spaceAfter=8),
}
W = 17 * cm


def esc(t):
    return str(t).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def nb(x, dec=0):
    if x is None or x == "":
        return "—"
    if isinstance(x, str):
        return x
    s = f"{x:,.{dec}f}".replace(",", " ").replace(".", ",")
    return s


def nbx(x, maxdec=4):
    """Nombre avec ses décimales utiles, sans arrondi visible."""
    if x is None or x == "":
        return "—"
    if isinstance(x, str):
        return x
    t = f"{x:,.{maxdec}f}".rstrip("0").rstrip(".")
    return t.replace(",", " ").replace(".", ",")


def nbf(x, maxdec=1):
    """Nombre au format français des fiches climat : espace fine pour les milliers, virgule décimale."""
    s = f"{x:,.{maxdec}f}"
    if "." in s:
        s = s.rstrip("0").rstrip(".")
    return s.replace(",", "\u202f").replace(".", ",")


def pct(x, dec=0):
    return "—" if x is None else f"{nb(x * 100, dec)} %"


def tableau(lignes, largeurs=None):
    data = [[Paragraph(esc(c), S["cb"] if i == 0 else S["c"]) for c in l] for i, l in enumerate(lignes)]
    t = Table(data, colWidths=largeurs, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLEU),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B8C2CC")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F5F8")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def fiche(lignes):
    """Tableau à deux colonnes libellé / valeur, sans en-tête."""
    data = [[Paragraph(esc(a), S["cb"]), Paragraph(esc(b), S["c"])] for a, b in lignes]
    t = Table(data, colWidths=[5.2 * cm, W - 5.2 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), BLEU),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#B8C2CC")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def pdf(chemin, titre, sous_titre, blocs, entete):
    os.makedirs(os.path.dirname(chemin), exist_ok=True)

    def cadre(c, d):
        c.saveState()
        c.setFont("DV", 7.3)
        c.setFillColor(colors.HexColor("#888888"))
        c.drawString(2 * cm, A4[1] - 1.2 * cm, entete)
        c.drawString(2 * cm, 1.1 * cm, "DOCUMENT FICTIF — cas d'étude du modèle de scoring PF. Toute ressemblance avec une entité réelle est fortuite.")
        c.drawRightString(A4[0] - 2 * cm, 1.1 * cm, f"Page {d.page}")
        c.restoreState()

    doc = SimpleDocTemplate(chemin, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm, topMargin=1.8 * cm,
                            bottomMargin=1.8 * cm, title=titre, author="Cas d'étude PF Scoring (fictif)")
    flux = [Paragraph(esc(titre), S["t"]), Paragraph(esc(sous_titre), S["st"])]

    def ajouter(b, dest):
        if b is None:
            return
        if isinstance(b, list):
            # Section insécable : titre et tableaux restent sur la même page.
            groupe = []
            for x in b:
                ajouter(x, groupe)
            dest.append(KeepTogether(groupe))
        elif isinstance(b, str):
            if b == "---":
                dest.append(PageBreak())
            elif b.startswith("# "):
                dest.append(Paragraph(esc(b[2:]), S["h"]))
            elif b.startswith("! "):
                dest.append(Paragraph(esc(b[2:]), S["enc"]))
            elif b.startswith("!! "):
                dest.append(Paragraph(esc(b[3:]), S["alerte"]))
            else:
                dest.append(Paragraph(esc(b), S["p"]))
        else:
            dest.append(b)
            dest.append(Spacer(1, 6))

    for b in blocs:
        ajouter(b, flux)
    doc.build(flux, onFirstPage=cadre, onLaterPages=cadre)


# ─── Lecture des niveaux ───────────────────────────────────────────────────────

def descriptions(cle, secteur):
    return REF["variantesSectorielles"].get(f"{cle}|{secteur}") or REF["niveaux"].get(cle, {}).get("descriptions", [])


def libelle_critere(cle):
    return REF["niveaux"].get(cle, {}).get("libelle", cle)


def constat(cle, saisie, manquants):
    """Constat d'un critère, rédigé comme l'écrirait le conseil (sans dire le niveau)."""
    g = saisie["grille"].get(cle) or {}
    n = g.get("niveau")
    com = (g.get("commentaire") or "").strip()
    if n == 5:
        manquants.append((cle, libelle_critere(cle), com or "Pièce justificative non remise."))
        return f"Élément non disponible à la date du présent document. {sans_jargon(com)}".strip()
    d = descriptions(cle, saisie["secteur"])
    txt = d[n - 1] if n and 1 <= n <= len(d) else ""
    # Minuscule initiale, sauf pour un sigle (EPC, DSRA…).
    debut = txt[0].lower() + txt[1:] if txt and not (len(txt) > 1 and txt[1].isupper()) else txt
    phrase = f"Constat : {debut or 'sans observation particulière'}."
    return f"{phrase} {com}".strip()


def sans_jargon(t):
    """Les commentaires des cas citent le vocabulaire de l'outil ; une pièce ne le connaît pas."""
    import re
    return re.sub(r"\s*\(«\s*Info\. insuffisante\s*»\)", "", t or "").strip()


def constat_noyau(cle, saisie, manquants):
    """Constat d'un indicateur choisi du noyau financier (N4 à N6)."""
    g = (saisie.get("noyau") or {}).get(cle) or {}
    n = g.get("niveau")
    j = (g.get("justification") or "").strip()
    if n == 5:
        manquants.append((cle, libelle_critere(cle), j or "Pièce justificative non remise."))
        return f"Élément non disponible à la date du présent document. {j}".strip()
    d = REF["niveaux"].get(cle, {}).get("descriptions", [])
    txt = d[n - 1] if n and 1 <= n <= len(d) else ""
    debut = txt[0].lower() + txt[1:] if txt and not (len(txt) > 1 and txt[1].isupper()) else txt
    return f"Constat : {debut or 'sans observation particulière'}. {j}".strip()


def section_criteres(dom, saisie, manquants, intro=None):
    blocs = [f"# {dom} — {PAR['libellesDomaines'][dom]}"]
    cd = (saisie.get("commentairesDomaines") or {}).get(dom)
    if intro:
        blocs.append(intro)
    if cd:
        blocs.append(sans_jargon(cd))
    lignes = [["Point examiné", "Constat"]]
    for sc in PAR["sousCriteres"][dom]:
        lignes.append([f"{sc['cle']} · {sc['libelle']}", constat(sc["cle"], saisie, manquants)])
    blocs.append(tableau(lignes, [5.5 * cm, W - 5.5 * cm]))
    return blocs


def oui(v):
    return v == "Oui"


# ─── Volet climatique (bloc 14 de l'outil) ─────────────────────────────────────

ALEAS = ["chaleur", "secheresse", "inondation", "submersion", "feux", "vents"]
LIBELLES_ALEAS = {
    "chaleur": "Chaleur extrême",
    "secheresse": "Stress hydrique et sécheresse",
    "inondation": "Inondation et crue",
    "submersion": "Submersion marine et élévation du niveau de la mer",
    "feux": "Feux de forêt",
    "vents": "Tempêtes, vents violents, vents de sable",
}
ND = "non documenté"
CT = "Rapport du conseiller technique des prêteurs (fictif)"


def aleas_evalues(cl):
    return [(a, cl["aleas"][a]) for a in ALEAS if (cl.get("aleas") or {}).get(a, {}).get("niveau")]


def tableau_aleas(lignes, largeurs):
    """Tableau des aléas : niveau d'exposition coloré pour la lecture rapide."""
    t = tableau(lignes, largeurs)
    teintes = {"Élevé": "#F6D5D1", "Moyen": "#FCEBC7", "Faible": "#DCEFDC"}
    styles = []
    for i, l in enumerate(lignes[1:], 1):
        if l[1] in teintes:
            styles.append(("BACKGROUND", (1, i), (1, i), colors.HexColor(teintes[l[1]])))
    t.setStyle(TableStyle(styles))
    return t


def sections_climat(cl):
    """Sections climat de la synthèse EIES : aléas physiques, transition, scénario."""
    if not cl:
        return []
    lignes = [["Aléa", "Niveau d'exposition", "Source / étude", "Adaptation financée"]]
    for a, x in aleas_evalues(cl):
        lignes.append([LIBELLES_ALEAS[a], x["niveau"], x.get("source") or ND, x.get("adaptation") or ND])
    physiques = [
        "# Risques climatiques physiques",
        "Exposition du site aux aléas climatiques physiques, établie d'après l'étude d'impact et le rapport du conseiller "
        "technique des prêteurs. « Adaptation financée » : mesures d'adaptation prévues et financées dans le budget du projet.",
        fiche([("Localisation du site", cl.get("localisation") or ND)]),
    ]
    physiques.append(tableau_aleas(lignes, [4.6 * cm, 2.7 * cm, W - 10.3 * cm, 3 * cm]) if len(lignes) > 1
                     else "Aucun aléa climatique physique n'est analysé dans les pièces remises.")
    em, macf = cl.get("emissions"), cl.get("exportMacf")
    transition = [
        "# Risque de transition",
        fiche([
            ("Émissions de gaz à effet de serre, scopes 1 et 2", f"{nbf(em, 0)} tCO₂e par an" if em is not None else ND),
            ("Exportations vers l'UE soumises au MACF", f"{nbf(macf * 100)} % du chiffre d'affaires" if macf is not None else ND),
            ("Dépendance aux énergies fossiles", cl.get("actifFossile") or ND),
            ("Plan de transition crédible et financé", cl.get("planTransition") or ND),
        ]),
    ]
    choc, desc = cl.get("chocClimatique"), (cl.get("descriptionClimatique") or "").strip()
    scenario = [
        "# Scénario climatique",
        fiche([
            ("Scénario climatique retenu", desc or ND),
            ("Baisse du CFADS sous le scénario climatique", f"{nbf(choc * 100)} %" if choc is not None else ND),
        ]),
    ]
    return [physiques, transition, scenario]


def section_climat_ingenieur(cl):
    """Aléas analysés par l'ingénieur indépendant (conseiller technique des prêteurs)."""
    lignes = [["Aléa", "Niveau d'exposition", "Analyse", "Adaptation financée"]]
    for a, x in aleas_evalues(cl or {}):
        if (x.get("source") or "").startswith(CT):
            reste = x["source"][len(CT):].lstrip(", ")
            precision = f"Revue technique, {reste}" if reste else "Revue technique"
            lignes.append([LIBELLES_ALEAS[a], x["niveau"], precision, x.get("adaptation") or ND])
    if len(lignes) == 1:
        return []
    return [["# Résilience du site aux aléas climatiques",
             "Aléas examinés dans le cadre de la revue technique (repris dans la synthèse environnementale, sociale et climat).",
             tableau_aleas(lignes, [4.6 * cm, 2.7 * cm, W - 10.3 * cm, 3 * cm])]]


# ─── Pièces ────────────────────────────────────────────────────────────────────

def generer_cas(i, c):
    d, f, s, r = c["dossier"], c["fiche"], c["saisie"], c["resultat"]
    onglet = d["onglet"]
    nom_spv = d["spv"].replace("SPV ", "").replace("« ", "").replace(" »", "").strip()
    dossier = os.path.join(OUT, f"{i:02d}_{onglet}")
    entete = f"{d['ref'].replace('CAS', 'Cas')} · {d['titre']} · {nom_spv} · {d['code_projet']}"
    secteur = PAR["secteurs"].get(s["secteur"], {}).get("libelle", s["secteur"])
    regime = PAR["regimes"].get(s["regime"], {}).get("libelle", s["regime"])
    phase = PAR["phases"].get(s["phase"], {}).get("libelle", s["phase"])
    v = s.get("verrous") or {}
    pl = s.get("donneesPlafonds") or {}
    pr = s.get("proportionnalite") or {}
    manquants = []
    pieces = []

    def chemin(nom):
        pieces.append(nom)
        return os.path.join(dossier, nom + ".pdf")

    # 01 — Fiche signalétique et KYC
    bene = "Bénéficiaires effectifs identifiés au-delà du seuil de 25 %, justificatifs au dossier."
    pdf(chemin("01_Fiche_signaletique_et_KYC"), "Fiche signalétique et KYC de la société de projet",
        f"{nom_spv} — client de la banque (code T24 {d['code_client']}, radical {d['radical']})",
        [
            "# Identité",
            fiche([
                ("Raison sociale", nom_spv), ("Forme juridique", f["forme"]), ("Type de client", f["typeClient"]),
                ("Segment", f["segment"]), ("Date de création", f["creation"]), ("Capital social", f"{nb(f['capital'])} MAD"),
                ("ICE", f"00{d['code_client']}{int(d['code_client'][-5:]):05d}"),
                ("Registre de commerce", f"RC {f['ville']} {100000 + int(d['code_client'][-5:])}"),
                ("Identifiant fiscal", str(40000000 + int(d["code_client"][-5:]) * 7)),
                ("Siège", f"{f['adresse']}, {f['codePostal']} {f['ville']}, Maroc"),
                ("Contact", f"{f['telephone']} · contact@{f['domaine']}.example.ma"),
                ("Effectifs", nb(f["effectifs"])),
            ]),
            "# Actionnariat et gouvernance",
            f"Actionnaires : {f['sponsor']}. Expérience du sponsor dans le secteur : {f['experience']} ans ; "
            f"projets comparables réalisés : {f['similaires']}.",
            bene,
            tableau([["Point examiné", "Constat"], [f"D1.3 · {libelle_critere('D1.3')}", constat("D1.3", s, manquants)]], [5.5 * cm, W - 5.5 * cm]),
            "# Relation bancaire",
            fiche([
                ("Statut bancaire", f["statutBancaire"]), ("Date d'entrée en relation", f["relation"]),
                ("Notation interne", f["rating"]), ("Notation externe", f"{f['notation']}"),
                ("Classification Bank Al-Maghrib", f["bam"]),
            ]),
            "# Conformité (KYC / LBC-FT)",
            fiche([
                ("Statut KYC", f["kyc"]), ("Statut de conformité", f["conformite"]),
                ("Niveau de risque LBC-FT", f["lbc"]), ("Personne politiquement exposée", "Non"),
                ("Dernière revue KYC", "30/06/2026"),
            ]),
            ("!! Filtrage des sanctions : une contrepartie clé du projet figure sur une liste de sanctions internationales "
             "(voir l'analyse des contreparties). La relation ne peut être engagée en l'état.") if oui(v.get("X3"))
            else "Filtrage des sanctions et des listes de vigilance : aucune correspondance pour la société, ses actionnaires et ses contreparties clés.",
        ], entete)

    # 02 — Mémorandum de présentation
    champs = REF["champsSecteur"].get(s["secteur"], [])
    donnees_sect = [["Donnée sectorielle", "Valeur", "Unité"]]
    for k, ch in enumerate(champs):
        val = (s.get("donneesSecteur") or [{}] * len(champs))[k] if k < len(s.get("donneesSecteur") or []) else {}
        donnees_sect.append([ch["libelle"], nb(val.get("valeur"), 2 if isinstance(val.get("valeur"), float) else 0), ch["unite"]])
    pdf(chemin("02_Memorandum_de_presentation"), f"Mémorandum de présentation — {d['titre']}",
        f"{nom_spv} · {d['lieu']} · document du sponsor transmis à la banque",
        [
            "# Le projet",
            d["resume"],
            fiche([
                ("Secteur", secteur), ("Phase", f"{phase} ({s['phase']})"), ("Régime de revenus", f"{regime} ({s['regime']})"),
                ("Localisation", f"{d['lieu']} — {f['ville']}"), ("Technologie", f["technologie"]),
                ("Capacité", nb(f["capacite"])), ("Début de construction", f["debut"]), ("Fin de construction", f["fin"]),
                ("Durée de vie / concession", f"{f['dureeProjet']} ans"),
            ]),
            "# Acteurs",
            fiche([("Sponsor", f["sponsor"]), ("Constructeur (EPC)", f["epc"]), ("Opérateur (O&M)", f["om"])]),
            "# Données sectorielles",
            tableau(donnees_sect, [8 * cm, 4.5 * cm, 4.5 * cm]),
            "# Hypothèses d'exploitation",
            tableau([["Hypothèse", "Valeur"]] + [[h["libelle"], h["valeur"]] for h in s.get("hypotheses") or []], [8 * cm, W - 8 * cm]),
            "# Caractéristiques du montage",
            fiche([
                ("Exposition sollicitée", f"{nb(pr.get('exposition'))} MMAD"),
                ("Financement intégralement en dirhams", pr.get("toutEnMad") or "—"),
                ("Durée de la dette", f"{nb(pr.get('duree'))} ans"),
                ("Technologie éprouvée (références)", pr.get("technologieEprouvee") or "—"),
                ("Construction clé-en-main", pr.get("epcCleEnMain") or "—"),
                ("Acheteur unique de la production", pr.get("acheteurUnique") or "—"),
                ("Première référence technologique", pr.get("premiereReference") or "—"),
                ("Opération consortiale", pr.get("consortium") or "—"),
                ("Contrat de revenus ou concession de plus de 20 ans", pr.get("contratPlus20Ans") or "—"),
                ("Nombre de contreparties clés", nb(pr.get("nbContreparties"))),
                ("Site exposé à un risque climatique physique élevé", s.get("climatEleve") or "—"),
            ]),
            ("!! L'activité figure sur la liste d'exclusion de la banque.") if oui(v.get("X1")) else
            "L'activité ne figure ni sur la liste des activités interdites par la loi marocaine ni sur la liste d'exclusion de la banque.",
        ], entete)

    # 03 — Plan de financement et term sheet
    em = s.get("emplois") or []
    rs = s.get("ressources") or []
    noy = s.get("noyau") or {}
    blocs = [
        "# Emplois (besoin à terminaison, MMAD)",
        tableau([["Emploi", "Montant (MMAD)"]] + [[e["libelle"], nbx(e["montant"])] for e in em]
                + [["Total du besoin", nb(sum(e["montant"] or 0 for e in em), 1)]], [12 * cm, W - 12 * cm]),
        "# Ressources (MMAD)",
        tableau([["Ressource", "Nature", "Montant (MMAD)"]] + [[x["libelle"], x.get("nature") or "—", nbx(x["montant"])] for x in rs]
                + [["Total des ressources", "", nb(sum(x["montant"] or 0 for x in rs), 1)]], [8.5 * cm, 4.5 * cm, W - 13 * cm]),
        f"Couverture du besoin à terminaison par les ressources engagées : {pct(r.get('couverture'), 1)}. "
        f"Quote-part de dette dans le plan de financement : {pct(r.get('quotePart'), 1)}.",
    ]
    if oui(v.get("B3")):
        blocs.append("!! Les ressources engagées ne couvrent pas le besoin à terminaison : un complément de financement reste à engager.")
    if s.get("planRemediation") == "Oui":
        blocs.append("Un plan de remédiation du financement à terminaison a été présenté par le sponsor.")
    elif s.get("planRemediation") == "Non":
        blocs.append("Aucun plan de remédiation du financement à terminaison n'a été présenté.")
    blocs += [
        "# Crédits sollicités auprès de la banque",
        tableau([["N°", "Nature", "Montant (MMAD)", "Devise", "Durée"]] +
                [[cr[0], cr[1], nb(cr[2], 1), cr[3] or "MAD", f"{nb(cr[4])} ans"] for cr in d.get("credits") or []],
                [2.6 * cm, 7 * cm, 2.6 * cm, 2 * cm, W - 14.2 * cm]),
        "# Principales conditions (term sheet indicative)",
        fiche([
            ("Type de crédit", f["typeCredit"]), ("Taux indicatif", f"{nb(f['taux'], 1)} %"),
            ("Différé d'amortissement", f"{f['amorce']} an(s)"), ("Périodicité", s.get("periodicite") or "—"),
            ("Réserve de service de la dette (DSRA)", f"{nbx(pl.get('dsraMois'))} mois de service — {noy.get('N4', {}).get('justification', '')}"),
            ("Levier", noy.get("N5", {}).get("justification", "—")),
            ("Exposition taux / change / refinancement", noy.get("N6", {}).get("justification", "—")),
            ("Exposition nette en devises non couverte", f"{nbx((pl.get('expositionDevises') or 0) * 100)} % du service annuel de la dette"),
            ("Dette à refinancer à l'échéance (ballon)", f"{nbx((pl.get('detteARefinancer') or 0) * 100)} %"),
            ("Stratégie de refinancement approuvée", pl.get("strategieRefinancement") or "Sans objet"),
            ("Sûretés", "Nantissement des actions et des comptes de la SPV, cession des créances des contrats, délégation des assurances, accords directs."),
        ]),
        "# Appréciation des prêteurs sur la structure",
        tableau([["Point examiné", "Constat"]] + [[f"{k} · {libelle_critere(k)}", constat_noyau(k, s, manquants)] for k in ("N4", "N5", "N6")],
                [5.5 * cm, W - 5.5 * cm]),
    ]
    pdf(chemin("03_Plan_de_financement_et_term_sheet"), "Plan de financement et term sheet indicative",
        f"{nom_spv} · financement sollicité de {nb(sum((cr[2] or 0) for cr in d.get('credits') or []), 1)} MMAD", blocs, entete)

    # 04 — Modèle financier : synthèse
    lignes = [["Période", "CFADS (MMAD)", "Service de la dette (MMAD)", "DSCR"]]
    for p in r.get("periodes") or []:
        lignes.append([p["libelle"], nbx(p["cfads"]), nbx(p["service"]), nb(p["dscr"], 2) if p["dscr"] is not None else "—"])
    blocs = [
        "# Échéancier du scénario central",
        f"Modèle de flux daté (périodicité {s.get('periodicite', 'semestrielle').lower()}), extrait des périodes les plus contraintes.",
        tableau(lignes, [6 * cm, 3.5 * cm, 4.5 * cm, W - 14 * cm]),
        f"DSCR minimum du scénario central : {nb(r.get('dscrMin'), 2)}x.",
        "# Scénario défavorable",
        f"{s.get('descriptionStress') or 'Scénario de la banque'} : baisse du CFADS de {nbx((s.get('choc') or 0) * 100)} % sur chaque période. "
        f"DSCR minimum sous ce scénario : {nb(r.get('dscrMinStresse'), 2)}x.",
        "# Couverture sur la durée du prêt",
        f"LLCR : {nbx(pl.get('llcr'))}x." if pl.get("llcr") is not None else "LLCR non calculé à ce stade.",
        (f"N3 · Appréciation du LLCR (hors construction) : note {s['n3Llcr']} sur 100 retenue par l'analyse des prêteurs."
         if s["phase"] != "P1" and isinstance(s.get("n3Llcr"), int) else None),
    ]
    if s["phase"] == "P1":
        blocs.append(f"Phase de construction : test de financement à terminaison — ressources engagées / besoin = {pct(r.get('couverture'), 1)}.")
    blocs.append("!! Le modèle de flux n'est pas rapproché des états financiers." if oui(v.get("B6")) else
                 "Le modèle est daté et rapproché des derniers états financiers disponibles.")
    pdf(chemin("04_Modele_financier_synthese"), "Modèle financier — synthèse", f"{nom_spv} · version remise à la banque", blocs, entete)

    # 05 — Rapport de l'ingénieur indépendant (D2, D3, D5)
    blocs = ["Rapport de l'ingénieur indépendant mandaté par les prêteurs : technologie, site, construction et exploitation."]
    blocs += section_criteres("D2", s, manquants)
    blocs += section_criteres("D3", s, manquants)
    if oui(v.get("B2")):
        blocs.append("!! Le contrat de construction (EPC) n'est pas signé à la date du rapport : prix et délai restent ouverts.")
    blocs += section_criteres("D5", s, manquants)
    blocs += section_climat_ingenieur(s.get("climat"))
    rempl = pl.get("operateurRemplacable")
    if rempl:
        blocs.append(f"Opérateur remplaçable sans rupture d'exploitation : {rempl}."
                     + (f" Le contrat d'exploitation et de maintenance expire {nbx(pl.get('ecartOm'))} ans avant la dernière échéance de la dette." if pl.get("ecartOm")
                        else " Le contrat d'exploitation et de maintenance couvre toute la durée de la dette (écart de 0 an)." if pl.get("ecartOm") == 0 else ""))
    pdf(chemin("05_Rapport_ingenieur_independant"), "Rapport de l'ingénieur indépendant", f"{d['titre']} · {f['ville']}", blocs, entete)

    # 06 — Analyse du marché et des contreparties (D1.1-1.2, D4, D6)
    blocs = ["# D1 — Sponsors (capacité et engagements)",
             tableau([["Point examiné", "Constat"]] + [[f"{sc['cle']} · {sc['libelle']}", constat(sc["cle"], s, manquants)]
                                                       for sc in PAR["sousCriteres"]["D1"] if sc["cle"] != "D1.3"], [5.5 * cm, W - 5.5 * cm]),
             f"Capacité résiduelle du sponsor pour l'appel de fonds propres restant : {'suffisante' if pl.get('capaciteSponsor') == 'Oui' else 'insuffisante'}."
             if pl.get("capaciteSponsor") else None]
    blocs += section_criteres("D4", s, manquants)
    blocs.append(f"Durée du contrat de revenus : {nbx(pl.get('dureeContrat'))} ans, pour une dette de {nbx(pl.get('dureeDette'))} ans."
                 + (f" Solution documentée pour la période non couverte : {pl.get('solutionContrat')}." if pl.get("solutionContrat") else "")
                 if pl.get("dureeContrat") is not None else
                 f"Aucun contrat de revenus à durée ferme ; dette de {nbx(pl.get('dureeDette'))} ans.")
    blocs += section_criteres("D6", s, manquants)
    blocs.append(f"Part des recettes portée par l'acheteur ou payeur principal : {nbx((pl.get('partAcheteur') or 0) * 100)} % ; "
                 f"qualité de crédit interne de cet acheteur : {pl.get('qualiteAcheteur') or '—'}.")
    blocs.append("!! L'exposition du groupe bancaire sur une contrepartie commune dépasse la limite interne." if pl.get("expositionGroupe") == "Oui"
                 else "L'exposition du groupe bancaire sur les contreparties du projet reste dans les limites internes.")
    if oui(v.get("X3")):
        blocs.append("!! Une contrepartie clé (acheteur de la production) figure sur une liste de sanctions internationales.")
    if oui(v.get("X4")):
        blocs.append("!! Une contrepartie clé est en défaut avéré non régularisé.")
    pdf(chemin("06_Analyse_marche_et_contreparties"), "Analyse du marché et des contreparties",
        f"{d['titre']} · note du conseil commercial et de la direction des risques", blocs, entete)

    # 07 — Note juridique et sûretés (D8, verrous juridiques)
    blocs = ["Note du conseil juridique des prêteurs : documentation contractuelle, sûretés, autorisations et litiges."]
    blocs += section_criteres("D8", s, manquants)
    blocs.append("!! Le contrat de revenus principal n'est pas signé (en négociation)." if oui(v.get("B1")) else "Le contrat de revenus principal est signé.")
    blocs.append("!! Le droit d'occupation du site n'est pas établi pour une durée couvrant la dette augmentée de 24 mois." if oui(v.get("B4"))
                 else "Le droit d'occupation du site est établi pour une durée couvrant la dette augmentée de 24 mois au moins.")
    blocs.append("!! L'avis juridique sur l'opposabilité des sûretés comporte une réserve substantielle." if oui(v.get("B5"))
                 else "Avis juridique sur l'opposabilité des sûretés : sans réserve substantielle.")
    blocs.append("!! Une autorisation légalement indispensable ne peut juridiquement être obtenue." if oui(v.get("X2"))
                 else "Les autorisations légalement indispensables sont obtenues ou peuvent l'être dans le cadre réglementaire en vigueur.")
    pdf(chemin("07_Note_juridique_et_suretes"), "Note juridique et sûretés", f"{nom_spv} · conseil des prêteurs", blocs, entete)

    # 08 — Synthèse environnementale et sociale, climat (D9)
    blocs = ["Synthèse de l'étude d'impact environnemental et social (normes de performance SFI, exigences BERD, Principes de l'Équateur)."]
    blocs += section_criteres("D9", s, manquants)
    blocs.append("!! L'acceptabilité environnementale n'est pas obtenue au stade requis." if oui(v.get("B8"))
                 else "L'acceptabilité environnementale est obtenue au stade requis.")
    blocs.append(f"Risque climatique physique élevé au site : {s.get('climatEleve') or '—'}."
                 + (f" Plan d'adaptation financé : {pl.get('planClimat')}." if pl.get("planClimat") else ""))
    blocs += sections_climat(s.get("climat"))
    pdf(chemin("08_Synthese_EIES_et_climat"), "Synthèse environnementale, sociale et climat", f"{d['titre']} · {d['lieu']}", blocs, entete)

    # 00 — Bordereau (écrit en dernier : il recense les pièces manquantes)
    lignes = [["N°", "Pièce", "Contenu utile à la saisie"]]
    usage = {
        "01": "Bloc 1 (identification), D1.3, contrôle des sanctions (X3)",
        "02": "Blocs 1 à 5 (secteur, phase, régime, données sectorielles, hypothèses), proportionnalité",
        "03": "Bloc 3 (sources et emplois), crédits, N4 à N6, plafonds C6 à C9, B3",
        "04": "Bloc 6 (échéancier), N1 à N3, scénario défavorable, LLCR, B6",
        "05": "D2, D3, D5, B2, C13, aléas climatiques (bloc 14)",
        "06": "D1.1, D1.2, D4, D6, C5, C10, C12, C14, X3, X4",
        "07": "D8, B1, B4, B5, X2",
        "08": "D9, B8, C11, fiche climat (bloc 14 : aléas, transition, scénario climatique)",
    }
    titres = {
        "01": "Fiche signalétique et KYC", "02": "Mémorandum de présentation", "03": "Plan de financement et term sheet",
        "04": "Modèle financier — synthèse", "05": "Rapport de l'ingénieur indépendant", "06": "Analyse du marché et des contreparties",
        "07": "Note juridique et sûretés", "08": "Synthèse environnementale, sociale et climat",
    }
    for nom in pieces:
        lignes.append([nom[:2], titres.get(nom[:2], nom[3:].replace("_", " ")), usage.get(nom[:2], "")])
    blocs = [
        f"Dossier constitué pour la saisie du {d['ref'].replace('CAS', 'cas')} ({onglet}) dans l'outil de scoring Project Finance.",
        tableau(lignes, [1.2 * cm, 6.8 * cm, W - 8 * cm]),
        "# Pièces attendues non remises",
    ]
    if manquants:
        blocs.append(tableau([["Point concerné", "Pièce attendue"]] + [[f"{k} · {lib}", com] for k, lib, com in manquants], [6 * cm, W - 6 * cm]))
        blocs.append("! À saisir en « Info. insuffisante » : la note restera provisoire tant que ces pièces ne sont pas reçues.")
    else:
        blocs.append("Aucune : le dossier est complet.")
    pdf(os.path.join(dossier, "00_Bordereau_des_pieces.pdf"), f"Bordereau des pièces — {d['ref'].replace('CAS', 'cas')}",
        f"{d['titre']} · {nom_spv} · {d['code_projet']}", blocs, entete)
    return {"dossier": os.path.basename(dossier), "pieces": len(pieces) + 1, "manquants": len(manquants)}


def index(resumes):
    lignes = [["Dossier", "Projet", "Secteur · phase · régime", "Note attendue", "Verrous / plafonds"]]
    for (i, c), rs in zip(enumerate(D["cas"], 1), resumes):
        d, s, r = c["dossier"], c["saisie"], c["resultat"]
        note = r.get("noteApprouvee")
        lignes.append([
            rs["dossier"], d["titre"], f"{s['secteur']} · {s['phase']} · {s['regime']}",
            f"{note} (calculée {r.get('noteCalculee')}, score {nb(r.get('score'), 1)})",
            ", ".join((r.get("verrousActifs") or []) + (r.get("plafondsActifs") or [])) or "aucun",
        ])
    pdf(os.path.join(OUT, "00_Index_des_18_dossiers.pdf"), "Pièces des 18 cas d'étude — index",
        "Dossiers fictifs pour alimenter l'outil et l'analyse des pièces par l'IA",
        [
            "Chaque dossier contient un bordereau et huit pièces. Les constats des rapports reprennent exactement la saisie "
            "du cas dans l'outil : déposées dans l'onglet « Pièces et IA », elles doivent conduire aux mêmes situations, "
            "verrous et plafonds. Les informations volontairement absentes d'un cas (« Info. insuffisante ») figurent au "
            "bordereau comme pièces attendues non remises. La synthèse environnementale, sociale et climat porte aussi la "
            "fiche climat du cas (aléas physiques, risque de transition, scénario climatique), fictive comme le reste du dossier.",
            "# Résultats attendus dans l'outil",
            tableau(lignes, [2.2 * cm, 5.4 * cm, 3.2 * cm, 3.4 * cm, W - 14.2 * cm]),
            "! C4A et C4B portent sur le même projet : C4B est la structure restructurée (amortissement sculpté, "
            "apport complémentaire, couverture de change).",
        ], "Cas d'étude PF Scoring — documents fictifs")


if __name__ == "__main__":
    resumes = [generer_cas(i, c) for i, c in enumerate(D["cas"], 1)]
    index(resumes)
    for rs in resumes:
        print(rs)
