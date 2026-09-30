# -*- coding: utf-8 -*-
"""Construit l'outil Excel/VBA de scoring Project Finance V8 à partir des cas d'étude.

Usage : python build_tool.py [--sans-vba]
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import xlsxwriter
from xlsxwriter.utility import xl_rowcol_to_cell
import cas_data
import vbaproj
import modules_vba

SANS_VBA = "--sans-vba" in sys.argv
ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, "Outil_Scoring_PF_V8.xlsx" if SANS_VBA else "Outil_Scoring_PF_V8.xlsm")

# ===================================================================== barèmes (doctrine V8)
REGIMES = [("R1", "Contrat ferme à quantité garantie (take-or-pay)", 1.10, 1.20, 1.30),
           ("R2", "Paiement à la disponibilité", 1.12, 1.22, 1.32),
           ("R3", "Contrat à risque de volume", 1.20, 1.35, 1.50),
           ("R4", "Exposition au marché", 1.35, 1.55, 1.80)]
SECTEURS = [("ENR", "Énergies renouvelables", -0.05), ("EAU", "Eau et dessalement", 0.0),
            ("TEL", "Télécom et data centers", 0.0), ("TRA", "Transport", 0.05),
            ("POR", "Ports et logistique", 0.05), ("SAN", "Santé", 0.05),
            ("ETH", "Thermique et gaz", 0.05), ("IMMO-REND", "Immobilier de rendement", 0.05),
            ("IND", "Industrie", 0.10), ("AGR", "Agro-industrie", 0.15),
            ("TOU", "Tourisme et hôtellerie", 0.20), ("MIN", "Mines et extraction", 0.25)]
PHASES = [("P1", "Construction", 0.0), ("P2", "Montée en charge", 0.05), ("P3", "Exploitation", 0.0)]
DOMAINES = [("D1", "Sponsors et actionnariat", (0.10, 0.08, 0.05)),
            ("D2", "Projet, site, technologie", (0.10, 0.07, 0.05)),
            ("D3", "Construction et achèvement", (0.20, 0.08, 0.0)),
            ("D4", "Mécanisme des recettes", (0.05, 0.12, 0.15)),
            ("D5", "Exploitation et maintenance", (0.05, 0.12, 0.15)),
            ("D6", "Contreparties et consortium", (0.10, 0.12, 0.15)),
            ("D7", "Finance et trésorerie (noyau)", (0.25, 0.28, 0.30)),
            ("D8", "Juridique, sûretés, continuité", (0.10, 0.08, 0.10)),
            ("D9", "ESG et climat résiduel", (0.05, 0.05, 0.05))]
NOYAU = [("N1", "DSCR minimum, scénario central", 0.25),
         ("N2", "DSCR minimum, scénario défavorable", 0.20),
         ("N3", "LLCR / financement à terminaison (P1)", 0.15),
         ("N4", "Liquidité (DSRA, lignes, cascade)", 0.15),
         ("N5", "Levier et fonds propres à risque", 0.15),
         ("N6", "Exposition résiduelle taux / change / refinancement", 0.10)]
SOUS_CRITERES = {
    "D1": [("Capacité financière du sponsor", 0.40), ("Obligation juridique de soutien", 0.35), ("Structure actionnariale et gouvernance", 0.25)],
    "D2": [("Technologie et performance", 0.35), ("Site, foncier physique et accès", 0.40), ("Planning et complexité d'exécution", 0.25)],
    "D3": [("Contrat EPC et constructeur", 0.40), ("Interfaces et gouvernance de chantier", 0.25), ("Assurances et garanties mobilisables", 0.35)],
    "D4": [("Structure contractuelle des recettes", 0.45), ("Mécanisme de prix et indexation", 0.30), ("Marché et concurrence", 0.25)],
    "D5": [("Opérateur et contrat O&M", 0.35), ("Performance technique et disponibilité", 0.40), ("Coûts, gros entretien et dépendances", 0.25)],
    "D6": [("Acheteur ou payeur principal", 0.50), ("Fournisseurs critiques", 0.20), ("Prêteurs et consortium", 0.30)],
    "D8": [("Documentation contractuelle et droits directs", 0.35), ("Sûretés et opposabilité", 0.40), ("Autorisations, cadre réglementaire, litiges", 0.25)],
    "D9": [("Environnement et ressources", 0.30), ("Social et acceptabilité", 0.30), ("Gouvernance ESG et exécution", 0.15), ("Climat résiduel", 0.25)],
}
CONVERSION = [(0, 1, "Très critique", "Refus ou restructuration complète"), (32, 2, "Critique", "Refus en l'état"),
              (42, 3, "Préoccupant", "Révision de fond"), (50, 4, "Fragile", "Restructuration à examiner"),
              (58, 5, "Moyen", "Sous surveillance"), (66, 6, "Acceptable", "Conditions et mitigants"),
              (73, 7, "Satisfaisant", "Conditions légères"), (80, 8, "Solide", "Réserves mineures à documenter"),
              (86, 9, "Très solide", "Conditions minimales"), (92, 10, "Excellent", "Profil de référence")]
PLAFONDS = [("C1", "DSCR minimum de base inférieur à 1,05x sur une échéance", 3),
            ("C2", "DSCR minimum de base sous le seuil critique du couple régime × secteur", 5),
            ("C3", "DSCR minimum sous scénario défavorable inférieur à 1,00x", 4),
            ("C4", "LLCR inférieur à 1,10x", 4),
            ("C5", "Contrat de revenus expirant avant la dernière échéance de dette, sans solution documentée", 5),
            ("C6", "Exposition nette en devises non couverte supérieure à 25 % du service de dette annuel", 5),
            ("C7", "DSRA absente ou inférieure à 3 mois de service de dette", 6),
            ("C8", "Dette à refinancer à maturité supérieure à 30 % du nominal, sans stratégie approuvée", 5),
            ("C9", "Quote-part de dette supérieure à 85 % du plan de financement", 5),
            ("C10", "Acheteur portant plus de 85 % des recettes et de qualité interne inférieure à BBB−", 6),
            ("C11", "Risque climatique physique élevé au site sans plan d'adaptation financé", 6),
            ("C12", "Capacité résiduelle du sponsor insuffisante pour l'appel d'equity restant", 6),
            ("C13", "Opérateur non remplaçable et contrat O&M expirant plus de 5 ans avant la dette", 7),
            ("C14", "Exposition du groupe bancaire sur un facteur commun au-delà de la limite interne", 6),
            ("C15", "Note issue d'une évaluation partielle (statut provisoire)", 6)]
EXCLUSIONS = [("X1", "Activité interdite par la loi marocaine ou par la politique d'exclusion de la banque"),
              ("X2", "Autorisation légalement indispensable juridiquement impossible à obtenir"),
              ("X3", "Contrepartie clé sous sanctions ou signalée au titre du dispositif LBC-FT"),
              ("X4", "Contrepartie clé en défaut avéré non régularisé")]
BLOCAGES = [("B1", "Contrat de revenus principal non signé (régimes R1 à R3)", "Octroi"),
            ("B2", "Contrat EPC non signé en phase P1", "Octroi"),
            ("B3", "Besoin à terminaison supérieur aux ressources engagées (couverture < 95 % en P1)", "Décaissement"),
            ("B4", "Droit d'occupation du site non établi, ou durée < dette + 24 mois", "Octroi"),
            ("B5", "Avis juridique d'opposabilité des sûretés absent ou avec réserve substantielle", "Décaissement"),
            ("B6", "Modèle de flux datés absent ou non rapproché des états financiers", "Notation validée"),
            ("B7", "Complétude des critères critiques inférieure à 100 %", "Notation validée"),
            ("B8", "Acceptabilité environnementale non obtenue au stade requis", "Octroi")]
SCALAIRES = [
    ("P_S_CAPEX", "Régime S — CAPEX maximal (MMAD)", 200),
    ("P_S_EXPO", "Régime S — exposition maximale de la banque (MMAD)", 100),
    ("P_S_DUREE", "Régime S — durée de financement maximale (ans)", 12),
    ("P_L_CAPEX", "Régime L — CAPEX au-delà duquel on escalade (MMAD)", 1500),
    ("P_L_EXPO", "Régime L — exposition au-delà de laquelle on escalade (MMAD)", 500),
    ("P_L_NBCP", "Régime L — nombre de contreparties clés au-delà duquel on escalade", 3),
    ("P_N3_TF", "N3 (P1) — couverture à terminaison pour Très favorable", 1.10),
    ("P_N3_F", "N3 (P1) — couverture à terminaison pour Favorable", 1.00),
    ("P_N3_V", "N3 (P1) — couverture minimale avec plan approuvé (Vigilance) ; en deçà Critique et B3", 0.95),
    ("P_C1", "C1 — DSCR minimum de base", 1.05),
    ("P_C3", "C3 — DSCR minimum sous stress", 1.00),
    ("P_C4", "C4 — LLCR minimum", 1.10),
    ("P_C6", "C6 — exposition nette en devises maximale (part du service annuel)", 0.25),
    ("P_C7", "C7 — DSRA minimale (mois de service)", 3),
    ("P_C8", "C8 — dette à refinancer maximale (part du nominal)", 0.30),
    ("P_C9", "C9 — quote-part de dette maximale", 0.85),
    ("P_C10", "C10 — part des recettes de l'acheteur principal au-delà de laquelle on teste sa qualité", 0.85),
    ("P_C13", "C13 — écart maximal entre fin du contrat O&M et fin de la dette (ans)", 5),
    ("P_COUV", "Couverture pondérée minimale d'une note validée (sinon C15)", 0.95),
]
ANCRES = [("P_Ancre_TF", "Très favorable", 100), ("P_Ancre_F", "Favorable", 80),
          ("P_Ancre_V", "Vigilance", 50), ("P_Ancre_C", "Critique", 20),
          ("P_InfoInsuff", "Valeur retenue pour une information insuffisante (conservatrice)", 20)]
QUAL_ACHETEUR = ["≥ BBB−", "< BBB−", "Non noté"]
NATURES = ["Dette senior", "Dette subordonnée", "Fonds propres", "Quasi-fonds propres",
           "Engagement sponsor", "Ligne dédiée engagée", "Subvention encaissée", "Autre ressource"]

# ===================================================================== données des cas
# Champs nouveaux (absents du classeur d'origine) : valeurs reconstituées à partir du
# récit de chaque cas. Chacune porte un commentaire « à confirmer » dans la cellule.
RECONST = "Valeur reconstituée à partir du récit du cas (champ absent du classeur d'origine) — à confirmer."

EXTRA = {
    "C1": dict(expo=465, mad="Oui", duree=20, techno="Oui", epc18="Non", unique="Oui", premiere="Non",
               consortium="Non", plus20="Oui", climat="Non", nbcp=None, part_ach=1.0, qual="≥ BBB−",
               duree_contrat=25, duree_dette=20, solution="", refi=0.0, strat="", plan_adapt="",
               sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C2": dict(expo=None, mad="Non", duree=20, techno="Oui", epc18="Non", unique="Oui", premiere="Non",
               consortium="Oui", plus20="Non", climat="Non", nbcp=None, part_ach=1.0, qual="≥ BBB−",
               duree_contrat=None, duree_dette=20, solution="", refi=None, strat="", plan_adapt="",
               sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C3": dict(expo=240, mad="Oui", duree=15, techno="Oui", epc18="Non", unique="Non", premiere="Non",
               consortium="Non", plus20="Non", climat="Non", nbcp=None, part_ach=0.30, qual="Non noté",
               duree_contrat=None, duree_dette=15, solution="", refi=0.0, strat="", plan_adapt="",
               sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C4A": dict(expo=250, mad="Non", duree=10, techno="Oui", epc18="Non", unique="Non", premiere="Non",
                consortium="Non", plus20="Non", climat="Non", nbcp=None, part_ach=0.40, qual="Non noté",
                duree_contrat=None, duree_dette=10, solution="", refi=0.0, strat="", plan_adapt="",
                sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C4B": dict(expo=210, mad="Non", duree=10, techno="Oui", epc18="Non", unique="Non", premiere="Non",
                consortium="Non", plus20="Non", climat="Non", nbcp=None, part_ach=0.40, qual="Non noté",
                duree_contrat=None, duree_dette=10, solution="", refi=0.0, strat="", plan_adapt="",
                sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
    "C5": dict(expo=60, mad="Oui", duree=12, techno="Oui", epc18="Oui", unique="Oui", premiere="Non",
               consortium="Non", plus20="Non", climat="Non", nbcp=None, part_ach=1.0, qual="Non noté",
               duree_contrat=None, duree_dette=12, solution="", refi=0.0, strat="", plan_adapt="",
               sponsor="Oui", operateur="Oui", ecart_om=None, facteur="Non", plan_remed="Non"),
}
# Champs reconstitués (nom du champ -> cellule) : servent aux commentaires « à confirmer »
CHAMPS_RECONST = {"expo": "B23", "mad": "B24", "techno": "B26", "epc18": "B27", "unique": "B28",
                  "premiere": "B29", "consortium": "B30", "plus20": "B31", "climat": "B32",
                  "part_ach": "B156", "qual": "B157", "duree_contrat": "B158", "refi": "B154",
                  "sponsor": "B162", "operateur": "B163", "facteur": "B165"}
# Ce qui est documenté dans le récit n'est pas marqué « reconstitué ».
DOCUMENTE = {"C1": {"mad", "plus20", "unique", "duree_contrat", "refi", "qual", "part_ach"},
             "C2": {"mad", "consortium", "unique", "part_ach"},
             "C3": {"mad", "refi"},
             "C4A": {"mad", "refi"}, "C4B": {"mad", "refi"},
             "C5": {"mad", "techno", "unique", "part_ach", "qual", "refi"}}

# ===================================================================== mise en page d'un dossier
R = dict(
    note=6, score=7, plafonds_txt=8, verrous_txt=9, regime_txt=10, compl=11,
    regime=15, secteur=16, phase=17, period=18, famille=19,
    capex=22, expo=23, mad=24, duree=25, techno=26, epc18=27, unique=28, premiere=29,
    consortium=30, plus20=31, climat=32, nbcp=33, prop_base=34, prop=35,
    se_hdr=38, se_first=39, se_last=46, se_tot=47, couv=48, quote=49, remed=50,
    hyp_first=53, hyp_last=60,
    seuil_base=63, delta=64, majo=65, seuils_hdr=66, seuils=67,
    choc=70, ech_hdr=71, p_first=72, p_last=131,
    dmin=133, dstress=134, dmoy=135, dann=136, nbper=137,
    noy_hdr=141, n1=142, n6=147, d7=148,
    n3_saisi=150, llcr=151, dsra=152, fx=153, refi=154, strat=155, part_ach=156, qual=157,
    duree_contrat=158, duree_dette=159, solution=160, plan_adapt=161, sponsor=162,
    operateur=163, ecart_om=164, facteur=165,
    grid_hdr=168, grid_first=169,
)
DOM_GRILLE = ["D1", "D2", "D3", "D4", "D5", "D6", "D8", "D9"]


def layout_grille():
    rows, r = [], R["grid_first"]
    for d in DOM_GRILLE:
        subs = SOUS_CRITERES[d]
        rows.append((d, r, r + 1, r + len(subs)))
        r += 1 + len(subs)
    return rows, r - 1


GRILLE, GRID_END = layout_grille()
R["grid_last"] = GRID_END
R["couv_pond"] = GRID_END + 2
R["compl_crit"] = GRID_END + 3
R["agr_title"] = GRID_END + 5
R["agr_hdr"] = GRID_END + 6
R["agr_first"] = GRID_END + 7          # D1..D9
R["global"] = R["agr_first"] + 9
R["note_calc"] = R["global"] + 1
R["ver_title"] = R["note_calc"] + 2
R["ver_hdr"] = R["ver_title"] + 1
R["x_first"] = R["ver_hdr"] + 1
R["b_first"] = R["x_first"] + 4
R["b_last"] = R["b_first"] + 7
R["pl_title"] = R["b_last"] + 2
R["pl_hdr"] = R["pl_title"] + 1
R["c_first"] = R["pl_hdr"] + 1
R["c_last"] = R["c_first"] + 14
R["plafond"] = R["c_last"] + 1
R["na_title"] = R["plafond"] + 2
R["na"] = R["na_title"] + 1
R["statut"] = R["na"] + 1
R["lecon_title"] = R["statut"] + 2
R["lecon"] = R["lecon_title"] + 1

# Cohérence avec les adresses codées dans les macros
assert R["regime"] == 15 and R["expo"] == 23 and R["choc"] == 70 and R["p_first"] == 72 and R["p_last"] == 131
assert R["n1"] == 142 and R["n3_saisi"] == 150 and R["dsra"] == 152 and R["fx"] == 153 and R["note"] == 6


def a(col, row, absolu=True):
    """Adresse A1 (colonne lettre, ligne 1-based)."""
    return f"${col}${row}" if absolu else f"{col}{row}"


def ecrire_classeur():
    wb = xlsxwriter.Workbook(SORTIE)
    wb.set_properties({"title": "Outil de scoring Project Finance V8", "subject": "Scoring PF — Maroc",
                       "comments": "Dossiers d'étude fictifs. Paramètres candidats non approuvés."})
    F = formats(wb)

    ws_acc = wb.add_worksheet("Accueil")
    ws_syn = wb.add_worksheet("Synthèse")
    ws_cas = {k: wb.add_worksheet(k) for k in cas_data.CAS}
    ws_mod = wb.add_worksheet("Modèle")
    ws_par = wb.add_worksheet("Paramètres")
    ws_dia = wb.add_worksheet("Diagnostic")
    ws_jou = wb.add_worksheet("Journal")

    noms_vba = {"Accueil": "wsAccueil", "Synthèse": "wsSynthese", "Modèle": "wsModele",
                "Paramètres": "wsParam", "Diagnostic": "wsDiag", "Journal": "wsJournal"}
    for k in cas_data.CAS:
        noms_vba[k] = "ws" + k
    if not SANS_VBA:
        wb.set_vba_name("ThisWorkbook")
        for ws in wb.worksheets():
            ws.set_vba_name(noms_vba[ws.name])

    parametres(wb, ws_par, F)
    for k, ws in ws_cas.items():
        dossier(wb, ws, F, cas_data.CAS[k], k)
    dossier(wb, ws_mod, F, None, None)
    synthese(ws_syn, F, list(cas_data.CAS))
    accueil(ws_acc, F)
    diagnostic(ws_dia, F)
    journal(ws_jou, F)
    ws_acc.activate()

    if not SANS_VBA:
        mods = [{"name": "ThisWorkbook", "type": "document", "base": "workbook",
                 "code": modules_vba.THIS_WORKBOOK}]
        for ws in wb.worksheets():
            mods.append({"name": noms_vba[ws.name], "type": "document", "base": "worksheet",
                         "code": "Option Explicit\r\n"})
        code = (modules_vba.MOD_OUTIL.replace("{GRID_START}", str(R["grid_first"]))
                .replace("{GRID_END}", str(R["grid_last"])))
        mods.append({"name": "modOutil", "type": "module", "code": code})
        binp = os.path.join(ICI, "vbaProject.bin")
        with open(binp, "wb") as fh:
            fh.write(vbaproj.build_vba_project(mods))
        wb.add_vba_project(binp)
        with open(os.path.join(ICI, "modOutil.bas"), "w", encoding="cp1252", newline="\r\n") as fh:
            fh.write('Attribute VB_Name = "modOutil"\n' + code.replace("\r\n", "\n"))
        with open(os.path.join(ICI, "ThisWorkbook.cls.txt"), "w", encoding="cp1252", newline="\r\n") as fh:
            fh.write(modules_vba.THIS_WORKBOOK.replace("\r\n", "\n"))
    wb.close()
    return SORTIE


# ===================================================================== formats
def formats(wb):
    base = {"font_name": "Arial", "font_size": 10, "valign": "vcenter"}

    def f(**kw):
        d = dict(base)
        d.update(kw)
        return wb.add_format(d)

    vert = "#1F4E3D"
    return {
        "titre": f(bold=True, font_size=16, font_color=vert),
        "titre_in": f(bold=True, font_size=16, font_color="#0000FF", bg_color="#FFF2CC"),
        "sous": f(italic=True, font_color="#555555"),
        "sous_in": f(italic=True, font_color="#0000FF", bg_color="#FFF2CC"),
        "wrap": f(text_wrap=True, valign="top"),
        "wrap_in": f(text_wrap=True, valign="top", font_color="#0000FF", bg_color="#FFF2CC"),
        "section": f(bold=True, font_color="white", bg_color=vert, font_size=11),
        "hdr": f(bold=True, bg_color="#DDE8E3", border=1, text_wrap=True),
        "lab": f(border=1),
        "labb": f(border=1, bold=True),
        "txt": f(border=1, text_wrap=True),
        "in": f(border=1, font_color="#0000FF", bg_color="#FFF2CC"),
        "in_c": f(border=1, font_color="#0000FF", bg_color="#FFF2CC", align="center"),
        "in_num": f(border=1, font_color="#0000FF", bg_color="#FFF2CC", num_format="#,##0.0"),
        "in_2d": f(border=1, font_color="#0000FF", bg_color="#FFF2CC", num_format="0.00"),
        "in_pct": f(border=1, font_color="#0000FF", bg_color="#FFF2CC", num_format="0.0%"),
        "in_int": f(border=1, font_color="#0000FF", bg_color="#FFF2CC", num_format="0"),
        "in_wrap": f(border=1, font_color="#0000FF", bg_color="#FFF2CC", text_wrap=True),
        "num": f(border=1, num_format="#,##0.0"),
        "num1": f(border=1, num_format="0.0"),
        "num2": f(border=1, num_format="0.00"),
        "num3": f(border=1, num_format="0.000"),
        "pct": f(border=1, num_format="0.0%"),
        "int": f(border=1, num_format="0", align="center"),
        "calc": f(border=1, align="center"),
        "calc_txt": f(border=1, text_wrap=True),
        "green": f(border=1, font_color="#008000"),
        "big": f(bold=True, font_size=20, align="center", border=2),
        "bigtxt": f(bold=True, font_size=12, border=1, text_wrap=True),
        "kpi_lab": f(bold=True, bg_color="#F2F2F2", border=1),
        "kpi": f(bold=True, border=1, align="center", num_format="0.0"),
        "kpi3": f(bold=True, border=1, align="center", num_format="0.000"),
        "kpi_pct": f(bold=True, border=1, align="center", num_format="0%"),
        "kpi_txt": f(bold=True, border=1, text_wrap=True),
        "total": f(bold=True, border=1, num_format="#,##0.0", top=2),
        "param": f(border=1, font_color="#0000FF", bg_color="#FFF2CC"),
        "param_pct": f(border=1, font_color="#0000FF", bg_color="#FFF2CC", num_format="0%"),
        "param_2d": f(border=1, font_color="#0000FF", bg_color="#FFF2CC", num_format="0.00"),
        "note_src": f(italic=True, font_color="#7F7F7F", font_size=8, text_wrap=True),
        "hidden": f(font_color="#FFFFFF"),
        "rouge": wb.add_format({"bg_color": "#F8CBAD", "font_color": "#9C0006"}),
        "ambre": wb.add_format({"bg_color": "#FFE699", "font_color": "#7F6000"}),
        "vertc": wb.add_format({"bg_color": "#C6EFCE", "font_color": "#006100"}),
        "gris": wb.add_format({"font_color": "#A6A6A6"}),
    }


# ===================================================================== Paramètres
def parametres(wb, ws, F):
    ws.set_column("A:A", 14)
    ws.set_column("B:B", 52)
    ws.set_column("C:F", 13)
    ws.set_column("H:H", 16)
    ws.set_column("I:I", 44)
    ws.set_column("J:L", 12)
    ws.write("A1", "Paramètres du modèle V8", F["titre"])
    ws.write("A2", "Paramètres CANDIDATS, non approuvés par le Comité de validation. Tous les onglets de dossier "
                   "lisent ces cellules : une modification s'applique immédiatement à tous les dossiers.", F["sous"])

    def nom(n, ref):
        wb.define_name(n, f"='Paramètres'!{ref}")

    # Régimes
    r = 4
    ws.write(r - 1, 0, "Seuils DSCR de base par régime de revenus (phase stabilisée)", F["labb"])
    for c, h in enumerate(["Régime", "Libellé", "Critique <", "Vigilance <", "Favorable <"]):
        ws.write(r, c, h, F["hdr"])
    for i, (code, lib, s0, s1, s2) in enumerate(REGIMES):
        ws.write(r + 1 + i, 0, code, F["lab"])
        ws.write(r + 1 + i, 1, lib, F["lab"])
        for j, v in enumerate((s0, s1, s2)):
            ws.write_number(r + 1 + i, 2 + j, v, F["param_2d"])
    lo, hi = r + 2, r + 1 + len(REGIMES)
    nom("P_Regimes", f"$A${lo}:$A${hi}"); nom("P_RegLib", f"$B${lo}:$B${hi}")
    nom("P_Crit", f"$C${lo}:$C${hi}"); nom("P_Vig", f"$D${lo}:$D${hi}"); nom("P_Fav", f"$E${lo}:$E${hi}")
    ws.write(hi, 1, "R5 (vente d'actifs) : hors périmètre de cet outil — LTC, LTV et encaissements sécurisés.", F["note_src"])

    # Secteurs
    r = hi + 3
    ws.write(r - 1, 0, "Écart sectoriel Δ ajouté au seuil du régime", F["labb"])
    for c, h in enumerate(["Code", "Secteur", "Δ"]):
        ws.write(r, c, h, F["hdr"])
    for i, (code, lib, dlt) in enumerate(SECTEURS):
        ws.write(r + 1 + i, 0, code, F["lab"]); ws.write(r + 1 + i, 1, lib, F["lab"])
        ws.write_number(r + 1 + i, 2, dlt, F["param_2d"])
    lo, hi = r + 2, r + 1 + len(SECTEURS)
    nom("P_SecCodes", f"$A${lo}:$A${hi}"); nom("P_SecLib", f"$B${lo}:$B${hi}"); nom("P_SecDelta", f"$C${lo}:$C${hi}")

    # Phases
    r = hi + 3
    ws.write(r - 1, 0, "Phases et majoration du seuil", F["labb"])
    for c, h in enumerate(["Phase", "Libellé", "Majoration"]):
        ws.write(r, c, h, F["hdr"])
    for i, (code, lib, m) in enumerate(PHASES):
        ws.write(r + 1 + i, 0, code, F["lab"]); ws.write(r + 1 + i, 1, lib, F["lab"])
        ws.write_number(r + 1 + i, 2, m, F["param_2d"])
    lo, hi = r + 2, r + 1 + len(PHASES)
    nom("P_PhaseCodes", f"$A${lo}:$A${hi}"); nom("P_PhaseLib", f"$B${lo}:$B${hi}"); nom("P_PhaseMaj", f"$C${lo}:$C${hi}")

    # Poids des domaines
    r = hi + 3
    ws.write(r - 1, 0, "Poids des domaines par phase", F["labb"])
    for c, h in enumerate(["Domaine", "Libellé", "P1", "P2", "P3"]):
        ws.write(r, c, h, F["hdr"])
    for i, (code, lib, poids) in enumerate(DOMAINES):
        ws.write(r + 1 + i, 0, code, F["lab"]); ws.write(r + 1 + i, 1, lib, F["lab"])
        for j, p in enumerate(poids):
            ws.write_number(r + 1 + i, 2 + j, p, F["param_pct"])
    lo, hi = r + 2, r + 1 + len(DOMAINES)
    ws.write(hi, 1, "Total (doit valoir 100 %)", F["labb"])
    for j, col in enumerate("CDE"):
        ws.write_formula(hi, 2 + j, f"=SUM({col}{lo}:{col}{hi})", F["pct"])
    nom("P_DomCodes", f"$A${lo}:$A${hi}"); nom("P_DomLib", f"$B${lo}:$B${hi}")
    nom("P_PoidsDom", f"$C${lo}:$E${hi}"); nom("P_PoidsHdr", f"$C${lo - 1}:$E${lo - 1}")

    # Noyau
    r = hi + 3
    ws.write(r - 1, 0, "Poids des indicateurs du noyau financier (D7)", F["labb"])
    for c, h in enumerate(["Code", "Indicateur", "Poids"]):
        ws.write(r, c, h, F["hdr"])
    for i, (code, lib, p) in enumerate(NOYAU):
        ws.write(r + 1 + i, 0, code, F["lab"]); ws.write(r + 1 + i, 1, lib, F["lab"])
        ws.write_number(r + 1 + i, 2, p, F["param_pct"])
    lo, hi = r + 2, r + 1 + len(NOYAU)
    ws.write(hi, 1, "Total", F["labb"]); ws.write_formula(hi, 2, f"=SUM(C{lo}:C{hi})", F["pct"])
    nom("P_PoidsN", f"$C${lo}:$C${hi}")

    # Ancres
    r = hi + 3
    ws.write(r - 1, 0, "Ancres de notation (échelle 0-100)", F["labb"])
    for c, h in enumerate(["Nom", "Appréciation", "Valeur"]):
        ws.write(r, c, h, F["hdr"])
    for i, (n, lib, v) in enumerate(ANCRES):
        ws.write(r + 1 + i, 0, n, F["lab"]); ws.write(r + 1 + i, 1, lib, F["lab"])
        ws.write_number(r + 1 + i, 2, v, F["param"])
        nom(n, f"$C${r + 2 + i}")
    last_anc = r + 1 + len(ANCRES)
    ws.write(last_anc, 1, "La doctrine V8 interdit la renormalisation libre : une information insuffisante est comptée "
                          "à la valeur ci-dessus et déclenche le plafond C15 (paramètre candidat).", F["note_src"])

    # Conversion (colonnes H-K)
    r = 4
    ws.write(r - 1, 7, "Conversion du score en note", F["labb"])
    for c, h in enumerate(["Score à partir de", "Note", "Libellé", "Orientation"]):
        ws.write(r, 7 + c, h, F["hdr"])
    for i, (s, n, lib, ori) in enumerate(CONVERSION):
        ws.write_number(r + 1 + i, 7, s, F["param"]); ws.write_number(r + 1 + i, 8, n, F["lab"])
        ws.write(r + 1 + i, 9, lib, F["lab"]); ws.write(r + 1 + i, 10, ori, F["lab"])
    lo, hi = r + 2, r + 1 + len(CONVERSION)
    nom("P_ConvSeuil", f"$H${lo}:$H${hi}"); nom("P_ConvNote", f"$I${lo}:$I${hi}")
    nom("P_ConvLib", f"$J${lo}:$J${hi}"); nom("P_ConvOrient", f"$K${lo}:$K${hi}")
    ws.set_column("J:J", 16); ws.set_column("K:K", 34)

    # Plafonds
    r = hi + 3
    ws.write(r - 1, 7, "Plafonds de note C1 à C15", F["labb"])
    for c, h in enumerate(["Code", "Fait générateur", "Plafond"]):
        ws.write(r, 7 + c, h, F["hdr"])
    for i, (code, fait, niv) in enumerate(PLAFONDS):
        ws.write(r + 1 + i, 7, code, F["lab"]); ws.write(r + 1 + i, 8, fait, F["txt"])
        ws.write_number(r + 1 + i, 9, niv, F["param"])
    lo, hi = r + 2, r + 1 + len(PLAFONDS)
    nom("P_PlafCode", f"$H${lo}:$H${hi}"); nom("P_PlafFait", f"$I${lo}:$I${hi}"); nom("P_PlafNiv", f"$J${lo}:$J${hi}")
    ws.set_column("I:I", 60)

    # Seuils scalaires
    r = hi + 3
    ws.write(r - 1, 7, "Seuils des règles (proportionnalité, N3, plafonds)", F["labb"])
    for c, h in enumerate(["Nom", "Paramètre", "Valeur"]):
        ws.write(r, 7 + c, h, F["hdr"])
    for i, (n, lib, v) in enumerate(SCALAIRES):
        ws.write(r + 1 + i, 7, n, F["lab"]); ws.write(r + 1 + i, 8, lib, F["txt"])
        fmt = F["param_pct"] if (isinstance(v, float) and v < 1 and n not in ("P_N3_V",)) else F["param_2d"] if isinstance(v, float) else F["param"]
        if n in ("P_N3_TF", "P_N3_F", "P_N3_V"):
            fmt = F["param_pct"]
        ws.write_number(r + 1 + i, 9, v, fmt)
        nom(n, f"$J${r + 2 + i}")
    hi = r + 1 + len(SCALAIRES)

    # Sous-critères
    r = hi + 3
    ws.write(r - 1, 7, "Poids des sous-critères (indépendants de la phase)", F["labb"])
    for c, h in enumerate(["Clé", "Sous-critère", "Poids"]):
        ws.write(r, 7 + c, h, F["hdr"])
    i = 0
    for d in DOM_GRILLE:
        for j, (lib, p) in enumerate(SOUS_CRITERES[d]):
            ws.write(r + 1 + i, 7, f"{d}.{j + 1}", F["lab"]); ws.write(r + 1 + i, 8, lib, F["txt"])
            ws.write_number(r + 1 + i, 9, p, F["param_pct"])
            i += 1
    lo, hi = r + 2, r + 1 + i
    nom("P_SCCle", f"$H${lo}:$H${hi}"); nom("P_SCPoids", f"$J${lo}:$J${hi}")

    # Listes
    r = last_anc + 4
    ws.write(r - 1, 0, "Listes de choix", F["labb"])
    listes = [("L_OuiNon", ["Oui", "Non"]),
              ("L_Notes", [100, 80, 50, 20, "Info. insuffisante"]),
              ("L_Periodicite", ["Semestrielle", "Trimestrielle", "Mensuelle"]),
              ("L_Nature", NATURES),
              ("L_QualAch", QUAL_ACHETEUR)]
    for k, (n, vals) in enumerate(listes):
        ws.write(r, k, n, F["hdr"])
        for i, v in enumerate(vals):
            ws.write(r + 1 + i, k, v, F["lab"])
        col = "ABCDE"[k]
        nom(n, f"${col}${r + 2}:${col}${r + 1 + len(vals)}")
    ws.freeze_panes(3, 0)


# ===================================================================== dossier
def dossier(wb, ws, F, cas, code):
    vierge = cas is None
    ws.set_column("A:A", 50)
    ws.set_column("B:G", 15)
    ws.set_column("H:H", 18)
    ws.set_column("I:I", 3)
    ws.set_column("J:M", 10, None, {"hidden": True})
    ws.set_column("N:N", 22)
    ws.freeze_panes(12, 0)
    ws.set_landscape(); ws.fit_to_pages(1, 0); ws.set_paper(9)
    ws.hide_gridlines(2)
    ws.write("J1", "MODELE" if vierge else "DOSSIER_V8", F["hidden"])

    m = cas["meta"] if cas else {}
    fin = cas["fin"] if cas else {}
    ex = EXTRA.get(code, {}) if cas else {}

    def val(v, fmt, row, col, comment=None):
        if v is None or v == "":
            ws.write_blank(row - 1, col, None, fmt)
        elif isinstance(v, (int, float)):
            ws.write_number(row - 1, col, v, fmt)
        else:
            ws.write_string(row - 1, col, str(v), fmt)
        if comment:
            ws.write_comment(row - 1, col, comment, {"x_scale": 2, "y_scale": 1.3})

    def fx(ref, formula, fmt):
        ws.write_formula(ref, formula, fmt)

    def section(row, titre):
        ws.merge_range(row - 1, 0, row - 1, 7, titre, F["section"])

    def lv(ref):  # validation liste
        return {"validate": "list", "source": ref}

    # ---------------------------------------------------------------- en-tête
    ws.write("A1", f"{m['ref']} · {m['nom']}" if cas else "Nouveau dossier — intitulé du projet", F["titre_in"])
    ws.write("A2", f"{m['spv']} — {m['lieu']}" if cas else "SPV — localisation", F["sous_in"])
    ws.merge_range("A3:H3", m.get("resume", "Résumé du projet : objet, contrat de recettes, financement."), F["wrap_in"])
    ws.set_row(2, 42)

    # ---------------------------------------------------------------- tableau de bord
    section(5, "TABLEAU DE BORD — se met à jour à chaque saisie")
    ws.write("A6", "NOTE APPROUVÉE (1 à 10)", F["kpi_lab"])
    fx("B6", f"=B{R['na']}", F["big"])
    ws.write("C6", "Libellé", F["kpi_lab"])
    fx("D6", f'=IFERROR(INDEX(P_ConvLib,MATCH(B{R["na"]},P_ConvNote,0)),"")', F["kpi_txt"])
    ws.write("E6", "Statut", F["kpi_lab"])
    ws.merge_range("F6:H6", "", F["kpi_txt"])
    fx("F6", f"=B{R['statut']}", F["kpi_txt"])
    ws.set_row(5, 34)
    ws.write("A7", "Score global (sur 100)", F["kpi_lab"]); fx("B7", f"=B{R['global']}", F["kpi"])
    ws.write("C7", "Note calculée", F["kpi_lab"]); fx("D7", f"=B{R['note_calc']}", F["kpi"])
    ws.write("E7", "Plafond applicable", F["kpi_lab"])
    ws.merge_range("F7:H7", "", F["kpi_txt"])
    fx("F7", f'=IF(B{R["plafond"]}>=10,"Aucun (10)",B{R["plafond"]})', F["kpi_txt"])
    ws.write("A8", "Plafonds actifs", F["kpi_lab"])
    ws.merge_range("B8:H8", "", F["kpi_txt"])
    parts = []
    for i, (c, _, _) in enumerate(PLAFONDS):
        rr = R["c_first"] + i
        parts.append(f'IF(E{rr}="Oui","{c} ("&F{rr}&")  ","")')
    nr = f'COUNTIF(E{R["c_first"]}:E{R["c_last"]},"n.r.")'
    fx("B8", f'=IF(TRIM({"&".join(parts)})="","Aucun",TRIM({"&".join(parts)}))&IF({nr}>0,"   —   "&{nr}&" plafond(s) non évalué(s) faute de donnée","")', F["kpi_txt"])
    ws.write("A9", "Verrous actifs (exclusions X, blocages B)", F["kpi_lab"])
    ws.merge_range("B9:H9", "", F["kpi_txt"])
    vparts = []
    for i, (c, *_rest) in enumerate(EXCLUSIONS + BLOCAGES):
        rr = R["x_first"] + i
        vparts.append(f'IF(F{rr}="Oui","{c}  ","")')
    fx("B9", f'=IF(TRIM({"&".join(vparts)})="","Aucun",TRIM({"&".join(vparts)}))', F["kpi_txt"])
    ws.write("A10", "Régime de proportionnalité retenu", F["kpi_lab"]); fx("B10", f"=B{R['prop']}", F["kpi"])
    ws.write("C10", "DSCR minimum", F["kpi_lab"]); fx("D10", f"=D{R['dmin']}", F["kpi3"])
    ws.write("E10", "DSCR stressé min.", F["kpi_lab"]); fx("F10", f"=D{R['dstress']}", F["kpi3"])
    ws.write("A11", "Complétude de la grille", F["kpi_lab"]); fx("B11", f"=B{R['compl_crit']}", F["kpi_pct"])
    ws.write("C11", "Noyau financier D7", F["kpi_lab"]); fx("D11", f"=D{R['d7']}", F["kpi"])
    ws.write("E11", "Orientation", F["kpi_lab"])
    ws.merge_range("F11:H11", "", F["kpi_txt"])
    fx("F11", f'=IFERROR(INDEX(P_ConvOrient,MATCH(B{R["na"]},P_ConvNote,0)),"")', F["kpi_txt"])
    # couleurs de la note
    for rng in ("B6", "D7"):
        ws.conditional_format(rng, {"type": "cell", "criteria": ">=", "value": 8, "format": F["vertc"]})
        ws.conditional_format(rng, {"type": "cell", "criteria": "between", "minimum": 6, "maximum": 7.99, "format": F["ambre"]})
        ws.conditional_format(rng, {"type": "cell", "criteria": "<", "value": 6, "format": F["rouge"]})

    # boutons
    if not SANS_VBA:
        for i, (cap, mac) in enumerate([("Contrôler la saisie", "ControlerDossier"), ("Exporter en PDF", "ExporterPDF"),
                                        ("Dupliquer ce dossier", "DupliquerDossier"), ("Synthèse", "AllerSynthese"),
                                        ("Accueil", "AllerAccueil")]):
            ws.insert_button(1 + i * 2, 13, {"macro": mac, "caption": cap, "width": 150, "height": 28})

    # ---------------------------------------------------------------- 1 routage
    section(13, "1 · ROUTAGE — pilote les seuils DSCR et les poids de domaine")
    for c, h in enumerate(["Axe", "Valeur", "Libellé"]):
        ws.write(13, c, h, F["hdr"])
    ws.merge_range(13, 2, 13, 7, "Libellé", F["hdr"])
    for key, lab, liste, lib in [("regime", "C — Régime de revenus", "=P_Regimes", "P_RegLib|P_Regimes"),
                                 ("secteur", "D — Secteur du projet", "=P_SecCodes", "P_SecLib|P_SecCodes"),
                                 ("phase", "B — Phase", "=P_PhaseCodes", "P_PhaseLib|P_PhaseCodes")]:
        r = R[key]
        ws.write(r - 1, 0, lab, F["lab"])
        v = {"regime": m.get("regime"), "secteur": m.get("secteur"), "phase": m.get("phase")}[key]
        val(v, F["in_c"], r, 1)
        ws.data_validation(r - 1, 1, r - 1, 1, lv(liste))
        l1, l2 = lib.split("|")
        ws.merge_range(r - 1, 2, r - 1, 7, "", F["calc_txt"])
        fx(f"C{r}", f'=IFERROR(INDEX({l1},MATCH(B{r},{l2},0)),"")', F["calc_txt"])
    ws.write(R["period"] - 1, 0, "Périodicité du service de la dette", F["lab"])
    val("Semestrielle" if cas else "", F["in_c"], R["period"], 1)
    ws.data_validation(R["period"] - 1, 1, R["period"] - 1, 1, lv("=L_Periodicite"))
    ws.merge_range(R["period"] - 1, 2, R["period"] - 1, 7,
                   "Jamais annuelle : le DSCR se mesure échéance par échéance.", F["calc_txt"])
    ws.write(R["famille"] - 1, 0, "A — Famille de financement", F["lab"])
    val("PF-FLUX" if cas else "", F["in_c"], R["famille"], 1)
    ws.merge_range(R["famille"] - 1, 2, R["famille"] - 1, 7,
                   "SPV dédiée, remboursement par les flux du projet (R5 vente d'actifs : hors outil).", F["calc_txt"])

    # ---------------------------------------------------------------- 2 proportionnalité
    section(21, "2 · RÉGIME DE PROPORTIONNALITÉ — calculé, jamais choisi")
    ws.write(R["capex"] - 1, 0, "CAPEX du projet économique complet (MMAD)", F["lab"])
    fx(f"B{R['capex']}", f"=B{R['se_tot']}", F["num"])
    ws.merge_range(R["capex"] - 1, 2, R["capex"] - 1, 7, "Repris du total des emplois (section 3).", F["calc_txt"])
    champs = [("expo", "Exposition de la banque (MMAD)", "in_num", None),
              ("mad", "Recettes, coûts et dette intégralement en dirhams", "in_c", "=L_OuiNon"),
              ("duree", "Durée du financement (ans)", "in_int", None),
              ("techno", "Technologie : ≥ 3 références industrielles de plus de 3 ans", "in_c", "=L_OuiNon"),
              ("epc18", "En P1 : EPC clé-en-main forfaitaire, prix et délai garantis, < 18 mois", "in_c", "=L_OuiNon"),
              ("unique", "Acheteur principal unique et identifié", "in_c", "=L_OuiNon"),
              ("premiere", "Technologie constituant une première référence dans la juridiction", "in_c", "=L_OuiNon"),
              ("consortium", "Opération consortiale relevant de la directive 3/W/2025", "in_c", "=L_OuiNon"),
              ("plus20", "Concession ou contrat de revenus de plus de 20 ans", "in_c", "=L_OuiNon"),
              ("climat", "Site classé à risque climatique physique élevé", "in_c", "=L_OuiNon"),
              ("nbcp", "Nombre de contreparties clés", "in_int", None)]
    for key, lab, fmt, liste in champs:
        r = R[key]
        ws.write(r - 1, 0, lab, F["lab"])
        v = ex.get(key) if cas else None
        comment = RECONST if (cas and key in CHAMPS_RECONST and key not in DOCUMENTE.get(code, set()) and v not in (None, "")) else None
        val(v, F[fmt], r, 1, comment)
        if liste:
            ws.data_validation(r - 1, 1, r - 1, 1, lv(liste))
    rb = R
    nbV = f'COUNTIF($F${R["x_first"]}:$F${R["b_last"]},"Oui")'
    nbP = f'COUNTIF($E${R["c_first"]}:$E${R["c_last"]},"Oui")'
    L = (f'OR(B{rb["capex"]}>P_L_CAPEX,N(B{rb["expo"]})>P_L_EXPO,B{rb["regime"]}="R4",B{rb["premiere"]}="Oui",'
         f'N(B{rb["fx"]})>0,B{rb["consortium"]}="Oui",B{rb["plus20"]}="Oui",B{rb["climat"]}="Oui",N(B{rb["nbcp"]})>P_L_NBCP)')
    S = (f'AND(B{rb["capex"]}<=P_S_CAPEX,B{rb["expo"]}<>"",N(B{rb["expo"]})<=P_S_EXPO,OR(B{rb["regime"]}="R1",B{rb["regime"]}="R2"),'
         f'B{rb["techno"]}="Oui",B{rb["mad"]}="Oui",B{rb["duree"]}<>"",N(B{rb["duree"]})<=P_S_DUREE,'
         f'OR(B{rb["phase"]}<>"P1",B{rb["epc18"]}="Oui"),B{rb["unique"]}="Oui",{nbV}=0)')
    rp = R["prop_base"]
    ws.write(rp - 1, 0, "Régime calculé (avant escalade)", F["labb"])
    fx(f"B{rp}", f'=IF(OR(B{rb["capex"]}="",B{rb["capex"]}=0,B{rb["regime"]}=""),"",IF({L},"L",IF({S},"S","M")))', F["kpi"])
    motifs = "&".join([
        f'IF(B{rb["capex"]}>P_L_CAPEX,"CAPEX > "&P_L_CAPEX&" MMAD ; ","")',
        f'IF(N(B{rb["expo"]})>P_L_EXPO,"exposition > "&P_L_EXPO&" MMAD ; ","")',
        f'IF(B{rb["regime"]}="R4","régime de revenus R4 ; ","")',
        f'IF(B{rb["premiere"]}="Oui","première référence technologique ; ","")',
        f'IF(N(B{rb["fx"]})>0,"devises non intégralement couvertes ; ","")',
        f'IF(B{rb["consortium"]}="Oui","opération consortiale ; ","")',
        f'IF(B{rb["plus20"]}="Oui","contrat de revenus > 20 ans ; ","")',
        f'IF(B{rb["climat"]}="Oui","risque climatique élevé ; ","")',
        f'IF(N(B{rb["nbcp"]})>P_L_NBCP,"plus de "&P_L_NBCP&" contreparties clés ; ","")'])
    ws.merge_range(rp - 1, 2, rp - 1, 7, "", F["calc_txt"])
    fx(f"C{rp}", f'=IF(B{rp}="","",IF(B{rp}="L","Escalade : "&{motifs},IF(B{rp}="S","Toutes les conditions du régime simplifié sont réunies.","Régime standard par défaut : une condition du régime S manque, aucune condition d\'escalade.")))', F["calc_txt"])
    r2 = R["prop"]
    ws.write(r2 - 1, 0, "RÉGIME RETENU (après escalade automatique)", F["labb"])
    s1 = f'IF(AND(B{rp}="S",{nbV}>0),"M",B{rp})'
    fx(f"B{r2}", f'=IF(B{rp}="","",IF(AND({s1}="M",{nbP}>0),"L",{s1}))', F["kpi"])
    ws.merge_range(r2 - 1, 2, r2 - 1, 7, "", F["calc_txt"])
    fx(f"C{r2}", f'=IF(B{r2}=B{rp},"Aucune escalade.",IF(B{r2}="L","Escalade : un plafond de note est actif (M passe en L).","Escalade : un verrou est actif (S passe en M)."))', F["calc_txt"])
    ws.set_row(rp - 1, 30)

    # ---------------------------------------------------------------- 3 sources et emplois
    section(37, "3 · SOURCES ET EMPLOIS (MMAD) — test de financement à terminaison")
    for c, h in enumerate(["Emplois", "Montant", "", "Ressources", "Montant", "Nature"]):
        ws.write(R["se_hdr"] - 1, c, h, F["hdr"])
    emplois = cas["emplois"] if cas else []
    ressources = cas["ressources"] if cas else []
    for i in range(R["se_last"] - R["se_first"] + 1):
        r = R["se_first"] + i
        e = emplois[i] if i < len(emplois) else ("", None)
        s = ressources[i] if i < len(ressources) else ("", None)
        val(e[0], F["in"], r, 0); val(e[1], F["in_num"], r, 1)
        ws.write_blank(r - 1, 2, None)
        val(s[0], F["in"], r, 3); val(s[1], F["in_num"], r, 4)
        nature = ""
        if s[0]:
            t = s[0].lower()
            nature = ("Dette senior" if "dette" in t else "Engagement sponsor" if "engagement" in t
                      else "Ligne dédiée engagée" if "ligne" in t else "Quasi-fonds propres" if "quasi" in t
                      else "Fonds propres")
        val(nature, F["in"], r, 5)
        ws.data_validation(r - 1, 5, r - 1, 5, lv("=L_Nature"))
    f1, f2, t = R["se_first"], R["se_last"], R["se_tot"]
    ws.write(t - 1, 0, "Total emplois (besoin à terminaison)", F["labb"]); fx(f"B{t}", f"=SUM(B{f1}:B{f2})", F["total"])
    ws.write(t - 1, 3, "Total ressources engagées", F["labb"]); fx(f"E{t}", f"=SUM(E{f1}:E{f2})", F["total"])
    ws.write(R["couv"] - 1, 0, "Couverture du besoin à terminaison (ressources / emplois)", F["lab"])
    fx(f"B{R['couv']}", f'=IF(N(B{t})=0,"",E{t}/B{t})', F["pct"])
    ws.write(R["quote"] - 1, 0, "Quote-part de dette (dette / besoin à terminaison)", F["lab"])
    fx(f"B{R['quote']}", f'=IF(N(B{t})=0,"",(SUMIF(F{f1}:F{f2},"Dette senior",E{f1}:E{f2})+SUMIF(F{f1}:F{f2},"Dette subordonnée",E{f1}:E{f2}))/B{t})', F["pct"])
    ws.write(R["remed"] - 1, 0, "Plan de remédiation approuvé (couverture entre 95 % et 100 %)", F["lab"])
    val(ex.get("plan_remed", "") if cas else "", F["in_c"], R["remed"], 1)
    ws.data_validation(R["remed"] - 1, 1, R["remed"] - 1, 1, lv("=L_OuiNon"))

    # ---------------------------------------------------------------- 4 hypothèses
    section(52, "4 · HYPOTHÈSES D'EXPLOITATION (information, non calculées)")
    hyps = cas["exploit"] if cas else []
    for i in range(R["hyp_last"] - R["hyp_first"] + 1):
        r = R["hyp_first"] + i
        h = hyps[i] if i < len(hyps) else ("", "")
        val(h[0], F["in"], r, 0)
        ws.merge_range(r - 1, 1, r - 1, 7, "", F["in"])
        val(h[1], F["in"], r, 1)

    # ---------------------------------------------------------------- 5 seuils
    section(62, "5 · SEUILS DSCR APPLICABLES = base du régime + Δ secteur + majoration de phase")
    ws.write(R["seuil_base"] - 1, 0, "Seuil critique de base du régime", F["lab"])
    fx(f"B{R['seuil_base']}", f'=IFERROR(INDEX(P_Crit,MATCH($B${R["regime"]},P_Regimes,0)),"")', F["num2"])
    ws.write(R["delta"] - 1, 0, "Écart sectoriel Δ", F["lab"])
    fx(f"B{R['delta']}", f'=IFERROR(INDEX(P_SecDelta,MATCH($B${R["secteur"]},P_SecCodes,0)),"")', F["num2"])
    ws.write(R["majo"] - 1, 0, "Majoration de phase", F["lab"])
    fx(f"B{R['majo']}", f'=IFERROR(INDEX(P_PhaseMaj,MATCH($B${R["phase"]},P_PhaseCodes,0)),"")', F["num2"])
    for c, h in enumerate(["Seuils applicables", "Critique <", "Vigilance <", "Favorable <", "Très favorable ≥"]):
        ws.write(R["seuils_hdr"] - 1, c, h, F["hdr"])
    rs = R["seuils"]
    ws.write(rs - 1, 0, "Seuil = base + Δ + majoration", F["labb"])
    adj = f'$B${R["delta"]}+$B${R["majo"]}'
    for col, rng in (("B", "P_Crit"), ("C", "P_Vig"), ("D", "P_Fav")):
        fx(f"{col}{rs}", f'=IFERROR(INDEX({rng},MATCH($B${R["regime"]},P_Regimes,0))+{adj},"")', F["num2"])
    fx(f"E{rs}", f"=D{rs}", F["num2"])

    def classe(x):
        return (f'IF({x}<$B${rs},"Critique",IF({x}<$C${rs},"Vigilance",IF({x}<$D${rs},"Favorable","Très favorable")))')

    # ---------------------------------------------------------------- 6 échéancier
    section(69, "6 · ÉCHÉANCIER DATÉ ET DSCR PAR ÉCHÉANCE (jusqu'à 60 périodes)")
    ws.write(R["choc"] - 1, 0, "Scénario défavorable : baisse du CFADS appliquée à chaque période", F["lab"])
    choc = None
    if cas:
        per = fin["periodes"]
        dmin = min(p["cfads"] / p["service"] for p in per if p["service"])
        choc = round(1 - fin["dscr_stresse"] / dmin, 6)
    val(choc, F["in_pct"], R["choc"], 1,
        ("Choc calibré pour reproduire le DSCR stressé du modèle de flux de l'analyste "
         f"({str(fin['dscr_stresse']).replace('.', ',')}), saisi en dur dans le classeur d'origine.") if cas else None)
    ws.merge_range(R["choc"] - 1, 2, R["choc"] - 1, 7, "", F["in_wrap"])
    val(fin.get("stress_lib", "Description du scénario défavorable") if cas else "Description du scénario défavorable",
        F["in_wrap"], R["choc"], 2)
    for c, h in enumerate(["Période", "CFADS central", "Service de la dette", "DSCR", "Classement",
                           "CFADS stressé (saisie facultative)", "DSCR stressé", "DSCR annuel (paire de semestres)"]):
        ws.write(R["ech_hdr"] - 1, c, h, F["hdr"])
    ws.set_row(R["ech_hdr"] - 1, 30)
    per = fin.get("periodes", []) if cas else []
    for i in range(R["p_last"] - R["p_first"] + 1):
        r = R["p_first"] + i
        p = per[i] if i < len(per) else None
        val(p["lib"] if p else "", F["in"], r, 0)
        val(p["cfads"] if p else None, F["in_num"], r, 1)
        val(p["service"] if p else None, F["in_2d"], r, 2)
        fx(f"D{r}", f'=IF(OR(B{r}="",C{r}=""),"",IF(C{r}=0,"",B{r}/C{r}))', F["num3"])
        fx(f"E{r}", f'=IF(B{r}="","",IF(C{r}=0,"Différé",IF(B{r}<0,"Critique",{classe(f"D{r}")})))', F["calc"])
        ws.write_blank(r - 1, 5, None, F["in_num"])
        fx(f"G{r}", f'=IF(OR(B{r}="",C{r}="",C{r}=0),"",IF(F{r}<>"",F{r},B{r}*(1-$B${R["choc"]}))/C{r})', F["num3"])
        if i % 2 == 1:
            fx(f"H{r}", f'=IF(AND($B${R["period"]}="Semestrielle",B{r}<>"",B{r-1}<>"",N(C{r})+N(C{r-1})>0),(B{r}+B{r-1})/(C{r}+C{r-1}),"")', F["num3"])
        else:
            ws.write_blank(r - 1, 7, None, F["num3"])
    pf, pl = R["p_first"], R["p_last"]
    ws.conditional_format(f"E{pf}:E{pl}", {"type": "cell", "criteria": "==", "value": '"Critique"', "format": F["rouge"]})
    ws.conditional_format(f"E{pf}:E{pl}", {"type": "cell", "criteria": "==", "value": '"Vigilance"', "format": F["ambre"]})
    ws.conditional_format(f"E{pf}:E{pl}", {"type": "cell", "criteria": "==", "value": '"Très favorable"', "format": F["vertc"]})
    ws.write(R["dmin"] - 1, 0, "DSCR MINIMUM sur toutes les échéances (mesure retenue)", F["labb"])
    fx(f"D{R['dmin']}", f'=IF(COUNT(D{pf}:D{pl})=0,"",MIN(D{pf}:D{pl}))', F["kpi3"])
    fx(f"E{R['dmin']}", f'=IF(D{R["dmin"]}="","",IF(F{R["dmin"]}>0,"Critique",{classe("D"+str(R["dmin"]))}))', F["calc"])
    fx(f"F{R['dmin']}", f'=COUNTIF(B{pf}:B{pl},"<0")', F["hidden"])
    ws.write(R["dstress"] - 1, 0, "DSCR minimum sous scénario défavorable", F["labb"])
    fx(f"D{R['dstress']}", f'=IF(COUNT(G{pf}:G{pl})=0,"",MIN(G{pf}:G{pl}))', F["kpi3"])
    fx(f"E{R['dstress']}", f'=IF(D{R["dstress"]}="","",{classe("D"+str(R["dstress"]))})', F["calc"])
    ws.write(R["dmoy"] - 1, 0, "DSCR moyen sur l'horizon (indicatif — jamais retenu)", F["lab"])
    fx(f"D{R['dmoy']}", f'=IF(SUM(C{pf}:C{pl})=0,"",SUM(B{pf}:B{pl})/SUM(C{pf}:C{pl}))', F["num3"])
    ws.write(R["dann"] - 1, 0, "DSCR annuel minimum, semestres agrégés (indicatif — le piège du ratio annuel)", F["lab"])
    fx(f"D{R['dann']}", f'=IF(COUNT(H{pf}:H{pl})=0,"",MIN(H{pf}:H{pl}))', F["num3"])
    ws.write(R["nbper"] - 1, 0, "Nombre de périodes renseignées", F["lab"])
    fx(f"D{R['nbper']}", f"=COUNT(B{pf}:B{pl})", F["int"])
    for rr in (R["dmin"], R["dstress"]):
        ws.conditional_format(f"E{rr}", {"type": "cell", "criteria": "==", "value": '"Critique"', "format": F["rouge"]})
        ws.conditional_format(f"E{rr}", {"type": "cell", "criteria": "==", "value": '"Vigilance"', "format": F["ambre"]})

    # ---------------------------------------------------------------- 7 noyau
    section(140, "7 · NOYAU FINANCIER (D7) — N1 à N3 calculés, N4 à N6 notés sur pièces")
    for c, h in enumerate(["Indicateur", "Note", "Poids", "Contribution", "Mesure et justification"]):
        ws.write(R["noy_hdr"] - 1, c, h, F["hdr"])
    ws.merge_range(R["noy_hdr"] - 1, 4, R["noy_hdr"] - 1, 7, "Mesure et justification", F["hdr"])
    anc = lambda x: (f'IF({x}<$B${rs},P_Ancre_C,IF({x}<$C${rs},P_Ancre_V,IF({x}<$D${rs},P_Ancre_F,P_Ancre_TF)))')
    dm, ds = f"$D${R['dmin']}", f"$D${R['dstress']}"
    n = R["n1"]
    formules_n = {
        0: f'=IF({dm}="","",IF($F${R["dmin"]}>0,P_Ancre_C,{anc(dm)}))',
        1: f'=IF({ds}="","",{anc(ds)})',
        2: (f'=IF($B${R["phase"]}="P1",IF($B${R["couv"]}="","",IF($B${R["couv"]}>=P_N3_TF,P_Ancre_TF,'
            f'IF($B${R["couv"]}>=P_N3_F,P_Ancre_F,IF(AND($B${R["couv"]}>=P_N3_V,$B${R["remed"]}="Oui"),P_Ancre_V,P_Ancre_C)))),'
            f'IF($B${R["n3_saisi"]}="","",$B${R["n3_saisi"]}))'),
    }
    mesures = {
        0: f'=IF({dm}="","",IF($F${R["dmin"]}>0,"CFADS négatif sur au moins une période : Critique d\'office","DSCR minimum "&FIXED({dm},3)&" face au seuil critique "&FIXED($B${rs},2)&" du couple "&$B${R["regime"]}&" × "&$B${R["secteur"]}))',
        1: f'=IF({ds}="","","DSCR stressé minimum "&FIXED({ds},3)&" — "&$C${R["choc"]})',
        2: f'=IF($B${R["phase"]}="P1",IF($B${R["couv"]}="","","Phase P1 : test de financement à terminaison, couverture "&FIXED($B${R["couv"]}*100,1)&" %"),"LLCR "&IF($B${R["llcr"]}="","non renseigné",FIXED($B${R["llcr"]},2))&" — note N3 saisie ligne {R["n3_saisi"]}")',
    }
    for i, (codeN, lib, _) in enumerate(NOYAU):
        r = n + i
        ws.write(r - 1, 0, f"{codeN} — {lib}", F["lab"])
        if i in formules_n:
            fx(f"B{r}", formules_n[i], F["calc"])
        else:
            val(fin.get(f"n{i + 1}") if cas else None, F["in_c"], r, 1)
            ws.data_validation(r - 1, 1, r - 1, 1, lv("=L_Notes"))
        fx(f"C{r}", f"=INDEX(P_PoidsN,{i + 1})", F["pct"])
        fx(f"D{r}", f'=IF(ISNUMBER(B{r}),B{r}*C{r},0)', F["num1"])
        ws.merge_range(r - 1, 4, r - 1, 7, "", F["calc_txt"] if i in mesures else F["in_wrap"])
        if i in mesures:
            fx(f"E{r}", mesures[i], F["calc_txt"])
        else:
            val(fin.get(f"n{i + 1}_lib", "") if cas else "", F["in_wrap"], r, 4)
    ws.write(R["d7"] - 1, 0, "D7 — SCORE DU NOYAU FINANCIER", F["labb"])
    fx(f"D{R['d7']}", f"=SUM(D{n}:D{n + 5})", F["kpi"])

    ws.merge_range(R["d7"], 0, R["d7"], 7, "Données du noyau et des plafonds (alimentent N3 hors P1 et les plafonds C4 à C14)", F["hdr"])
    donnees = [
        ("n3_saisi", "N3 hors phase P1 : note fondée sur le LLCR (100, 80, 50, 20)", "in_c", "=L_Notes", None if not cas or m["phase"] == "P1" else fin.get("n3")),
        ("llcr", "LLCR (x) — plafond C4", "in_2d", None, fin.get("llcr") if cas else None),
        ("dsra", "DSRA en mois de service de dette — plafond C7", "in_num", None, fin.get("dsra_mois") if cas else None),
        ("fx", "Exposition nette en devises non couverte, en % du service annuel — C6", "in_pct", None, (fin.get("fx_net_pct") / 100) if cas else None),
        ("refi", "Dette à refinancer à maturité, en % du nominal — C8", "in_pct", None, ex.get("refi") if cas else None),
        ("strat", "Stratégie de refinancement approuvée", "in_c", "=L_OuiNon", ex.get("strat") if cas else None),
        ("part_ach", "Part des recettes portée par l'acheteur principal — C10", "in_pct", None, ex.get("part_ach") if cas else None),
        ("qual", "Qualité de crédit interne de l'acheteur principal", "in_c", "=L_QualAch", ex.get("qual") if cas else None),
        ("duree_contrat", "Durée résiduelle du contrat de revenus (ans) — C5", "in_num", None, ex.get("duree_contrat") if cas else None),
        ("duree_dette", "Durée résiduelle de la dette (ans)", "in_num", None, ex.get("duree_dette") if cas else None),
        ("solution", "Solution documentée si le contrat expire avant la dette", "in_c", "=L_OuiNon", ex.get("solution") if cas else None),
        ("plan_adapt", "Plan d'adaptation climatique financé — C11", "in_c", "=L_OuiNon", ex.get("plan_adapt") if cas else None),
        ("sponsor", "Capacité résiduelle du sponsor suffisante pour l'appel d'equity restant — C12", "in_c", "=L_OuiNon", ex.get("sponsor") if cas else None),
        ("operateur", "Opérateur remplaçable — C13", "in_c", "=L_OuiNon", ex.get("operateur") if cas else None),
        ("ecart_om", "Écart entre la fin du contrat O&M et la fin de la dette (ans)", "in_num", None, ex.get("ecart_om") if cas else None),
        ("facteur", "Exposition du groupe sur un facteur commun au-delà de la limite interne — C14", "in_c", "=L_OuiNon", ex.get("facteur") if cas else None),
    ]
    for key, lab, fmt, liste, v in donnees:
        r = R[key]
        ws.write(r - 1, 0, lab, F["lab"])
        comment = RECONST if (cas and key in CHAMPS_RECONST and key not in DOCUMENTE.get(code, set()) and v not in (None, "")) else None
        val(v, F[fmt], r, 1, comment)
        if liste:
            ws.data_validation(r - 1, 1, r - 1, 1, lv(liste))

    # ---------------------------------------------------------------- 8 grille
    section(R["grid_hdr"] - 1, "8 · GRILLE QUALITATIVE — notes 100 / 80 / 50 / 20 ou « Info. insuffisante »")
    for c, h in enumerate(["Domaine et sous-critère", "Note", "Poids", "Score domaine", "Commentaire"]):
        ws.write(R["grid_hdr"] - 1, c, h, F["hdr"])
    ws.merge_range(R["grid_hdr"] - 1, 4, R["grid_hdr"] - 1, 7, "Commentaire", F["hdr"])
    qual = cas["qualitatif"] if cas else {}
    comm = cas["commentaires"] if cas else {}
    idx_dom = {c: i for i, (c, _, _) in enumerate(DOMAINES)}
    for d, h, s1, s2 in GRILLE:
        lib = dict((c, l) for c, l, _ in DOMAINES)[d]
        ws.write(h - 1, 0, f"{d} — {lib}", F["labb"])
        ws.write_blank(h - 1, 1, None, F["lab"])
        fx(f"C{h}", f'=IFERROR(INDEX(P_PoidsDom,{idx_dom[d] + 1},MATCH($B${R["phase"]},P_PoidsHdr,0)),"")', F["pct"])
        fx(f"D{h}", f'=IF(N(C{h})=0,"",SUMPRODUCT(B{s1}:B{s2},C{s1}:C{s2})+P_InfoInsuff*SUMPRODUCT((1-ISNUMBER(B{s1}:B{s2}))*C{s1}:C{s2}))', F["kpi"])
        ws.merge_range(h - 1, 4, h - 1, 7, "", F["in_wrap"])
        val(comm.get(d, ""), F["in_wrap"], h, 4)
        if comm.get(d):
            ws.set_row(h - 1, 45)
        ws.write(h - 1, 9, "DOM", F["hidden"])
        fx(f"K{h}", f"=IF(N(C{h})>0,1,0)", F["hidden"])
        fx(f"M{h}", f"=N(C{h})*SUMPRODUCT(ISNUMBER(B{s1}:B{s2})*C{s1}:C{s2})", F["hidden"])
        notes = qual.get(d, [])
        for j, (sl, _) in enumerate(SOUS_CRITERES[d]):
            r = s1 + j
            ws.write(r - 1, 0, "      " + sl, F["lab"])
            val(notes[j] if j < len(notes) else None, F["in_c"], r, 1)
            ws.data_validation(r - 1, 1, r - 1, 1, lv("=L_Notes"))
            fx(f"C{r}", f'=INDEX(P_SCPoids,MATCH(L{r},P_SCCle,0))', F["pct"])
            ws.write(r - 1, 9, "SC", F["hidden"])
            fx(f"K{r}", f"=K{h}", F["hidden"])
            ws.write(r - 1, 11, f"{d}.{j + 1}", F["hidden"])
            ws.conditional_format(f"A{r}:D{r}", {"type": "formula", "criteria": f"=$K${r}=0", "format": F["gris"]})
    g1, g2 = R["grid_first"], R["grid_last"]
    ws.write(R["couv_pond"] - 1, 0, "Couverture pondérée de la grille (minimum 95 % pour une note validée)", F["lab"])
    fx(f"B{R['couv_pond']}", f'=IF(SUMIF(J{g1}:J{g2},"DOM",C{g1}:C{g2})=0,"",SUM(M{g1}:M{g2})/SUMIF(J{g1}:J{g2},"DOM",C{g1}:C{g2}))', F["pct"])
    ws.write(R["compl_crit"] - 1, 0, "Complétude des critères requis par la phase (100 % exigé)", F["lab"])
    fx(f"B{R['compl_crit']}", f'=IF(SUMIF(J{g1}:J{g2},"SC",K{g1}:K{g2})=0,"",SUMPRODUCT((J{g1}:J{g2}="SC")*(K{g1}:K{g2}=1)*ISNUMBER(B{g1}:B{g2}))/SUMIF(J{g1}:J{g2},"SC",K{g1}:K{g2}))', F["pct"])

    # ---------------------------------------------------------------- 9 agrégation
    section(R["agr_title"], "9 · AGRÉGATION ET NOTE CALCULÉE")
    for c, h in enumerate(["Domaine", "Score", "Poids de la phase", "Contribution"]):
        ws.write(R["agr_hdr"] - 1, c, h, F["hdr"])
    hdr_row = {d: h for d, h, _, _ in GRILLE}
    for i, (d, lib, _) in enumerate(DOMAINES):
        r = R["agr_first"] + i
        ws.write(r - 1, 0, f"{d} — {lib}", F["lab"])
        src = f"D{R['d7']}" if d == "D7" else f"D{hdr_row[d]}"
        fx(f"B{r}", f'={src}', F["num1"])
        fx(f"C{r}", f'=IFERROR(INDEX(P_PoidsDom,{i + 1},MATCH($B${R["phase"]},P_PoidsHdr,0)),"")', F["pct"])
        fx(f"D{r}", f'=IF(ISNUMBER(B{r}),B{r},0)*N(C{r})', F["num1"])
    a1, a9 = R["agr_first"], R["agr_first"] + 8
    ws.write(R["global"] - 1, 0, "SCORE GLOBAL (sur 100)", F["labb"])
    fx(f"B{R['global']}", f'=IF(N(C{a1})+N(C{a9})=0,"",SUM(D{a1}:D{a9}))', F["kpi"])
    ws.write(R["note_calc"] - 1, 0, "Note calculée (table de conversion)", F["labb"])
    fx(f"B{R['note_calc']}", f'=IF(B{R["global"]}="","",INDEX(P_ConvNote,MATCH(B{R["global"]},P_ConvSeuil,1)))', F["kpi"])
    fx(f"C{R['note_calc']}", f'=IF(B{R["global"]}="","",INDEX(P_ConvLib,MATCH(B{R["global"]},P_ConvSeuil,1)))', F["calc"])

    # ---------------------------------------------------------------- 10 verrous
    section(R["ver_title"], "10 · VERROUS — exclusions X (aucune note) et blocages B (note provisoire)")
    for c, h in enumerate(["Code", "Fait générateur", "", "", "Saisie", "Actif"]):
        ws.write(R["ver_hdr"] - 1, c, h, F["hdr"])
    ws.merge_range(R["ver_hdr"] - 1, 1, R["ver_hdr"] - 1, 3, "Fait générateur", F["hdr"])
    ws.write(R["ver_hdr"] - 1, 6, "Stade bloqué", F["hdr"])
    ws.write(R["ver_hdr"] - 1, 7, "Détection automatique", F["hdr"])
    auto = {"B3": f'IF(AND($B${R["phase"]}="P1",ISNUMBER($B${R["couv"]}),$B${R["couv"]}<P_N3_V),"Oui","")',
            "B7": f'IF(AND(ISNUMBER($B${R["compl_crit"]}),$B${R["compl_crit"]}<1),"Oui","")'}
    for i, item in enumerate(EXCLUSIONS + BLOCAGES):
        r = R["x_first"] + i
        c = item[0]
        ws.write(r - 1, 0, c, F["labb"])
        ws.merge_range(r - 1, 1, r - 1, 3, item[1], F["txt"])
        val("Oui" if (cas and c == "B6") else ("Non" if cas else ""), F["in_c"], r, 4,
            ("Les cas d'étude ne présentent qu'un échéancier représentatif (4 à 6 périodes). En production, "
             "l'échéancier complet est exigé ; à défaut, saisir « Non » : le blocage B6 s'applique.") if (cas and c == "B6") else None)
        ws.data_validation(r - 1, 4, r - 1, 4, lv("=L_OuiNon"))
        if c.startswith("B"):
            ws.write(r - 1, 6, item[2], F["lab"])
        else:
            ws.write(r - 1, 6, "Aucune note", F["lab"])
        if c == "B6":
            fx(f"H{r}", f'=IF(E{r}="Non","Oui","")', F["calc"])
        elif c in auto:
            fx(f"H{r}", "=" + auto[c], F["calc"])
        else:
            ws.write_blank(r - 1, 7, None, F["calc"])
        if c == "B6":
            fx(f"F{r}", f'=IF(H{r}="Oui","Oui","Non")', F["calc"])
        else:
            fx(f"F{r}", f'=IF(OR(E{r}="Oui",H{r}="Oui"),"Oui","Non")', F["calc"])
        ws.conditional_format(f"F{r}", {"type": "cell", "criteria": "==", "value": '"Oui"', "format": F["rouge"]})
    ws.write(R["ver_hdr"] - 1, 4, "Saisie", F["hdr"])
    ws.write(R["ver_hdr"] - 1, 5, "Actif", F["hdr"])
    # B6 : la saisie porte sur la présence du modèle (Oui = présent)
    rb6 = R["x_first"] + 4 + 5
    ws.write_comment(rb6 - 1, 1, "Pour B6, la saisie répond à la question « modèle de flux complet et rapproché ? » : "
                                 "« Non » déclenche le blocage.", {"x_scale": 2})

    # ---------------------------------------------------------------- 11 plafonds
    section(R["pl_title"], "11 · PLAFONDS DE NOTE C1 À C15 — déclenchés par les données, jamais saisis")
    for c, h in enumerate(["Code", "Fait générateur", "Donnée observée", "Seuil", "Actif", "Plafond", "Plafond effectif"]):
        ws.write(R["pl_hdr"] - 1, c, h, F["hdr"])
    B = lambda k: f"$B${R[k]}"
    obs = {
        "C1": (f'={B("dmin").replace("$B","$D")}', "=P_C1", f'=IF({B("dmin").replace("$B","$D")}="","n.r.",IF({B("dmin").replace("$B","$D")}<P_C1,"Oui","Non"))'),
        "C2": (f'={B("dmin").replace("$B","$D")}', f"=$B${rs}", f'=IF(OR({B("dmin").replace("$B","$D")}="",$B${rs}=""),"n.r.",IF({B("dmin").replace("$B","$D")}<$B${rs},"Oui","Non"))'),
        "C3": (f'={B("dstress").replace("$B","$D")}', "=P_C3", f'=IF({B("dstress").replace("$B","$D")}="","n.r.",IF({B("dstress").replace("$B","$D")}<P_C3,"Oui","Non"))'),
        "C4": (f'={B("llcr")}', "=P_C4", f'=IF({B("llcr")}="","n.r.",IF({B("llcr")}<P_C4,"Oui","Non"))'),
        "C5": (f'=IF({B("duree_contrat")}="","",{B("duree_contrat")}&" ans / dette "&{B("duree_dette")}&" ans")', '="contrat < dette"',
               f'=IF(OR({B("duree_contrat")}="",{B("duree_dette")}=""),"n.r.",IF(AND({B("duree_contrat")}<{B("duree_dette")},{B("solution")}<>"Oui"),"Oui","Non"))'),
        "C6": (f'={B("fx")}', "=P_C6", f'=IF({B("fx")}="","n.r.",IF({B("fx")}>P_C6,"Oui","Non"))'),
        "C7": (f'={B("dsra")}', "=P_C7", f'=IF({B("dsra")}="","n.r.",IF({B("dsra")}<P_C7,"Oui","Non"))'),
        "C8": (f'={B("refi")}', "=P_C8", f'=IF({B("refi")}="","n.r.",IF(AND({B("refi")}>P_C8,{B("strat")}<>"Oui"),"Oui","Non"))'),
        "C9": (f'={B("quote")}', "=P_C9", f'=IF({B("quote")}="","n.r.",IF({B("quote")}>P_C9,"Oui","Non"))'),
        "C10": (f'=IF({B("part_ach")}="","",FIXED({B("part_ach")}*100,0)&" % — "&{B("qual")})', "=P_C10",
                f'=IF(OR({B("part_ach")}="",{B("qual")}=""),"n.r.",IF(AND({B("part_ach")}>P_C10,{B("qual")}<>INDEX(L_QualAch,1)),"Oui","Non"))'),
        "C11": (f'={B("climat")}', '="élevé sans plan"', f'=IF({B("climat")}="","n.r.",IF(AND({B("climat")}="Oui",{B("plan_adapt")}<>"Oui"),"Oui","Non"))'),
        "C12": (f'={B("sponsor")}', '="insuffisante"', f'=IF({B("sponsor")}="","n.r.",IF({B("sponsor")}="Non","Oui","Non"))'),
        "C13": (f'=IF({B("operateur")}="","",{B("operateur")}&IF({B("ecart_om")}="",""," — écart "&{B("ecart_om")}&" ans"))', "=P_C13",
                f'=IF({B("operateur")}="","n.r.",IF(AND({B("operateur")}="Non",N({B("ecart_om")})>P_C13),"Oui","Non"))'),
        "C14": (f'={B("facteur")}', '="au-delà limite"', f'=IF({B("facteur")}="","n.r.",IF({B("facteur")}="Oui","Oui","Non"))'),
        "C15": (f'=$B${R["couv_pond"]}', "=P_COUV", f'=IF(OR($B${R["couv_pond"]}="",$B${R["compl_crit"]}=""),"n.r.",IF(OR($B${R["couv_pond"]}<P_COUV,$B${R["compl_crit"]}<1),"Oui","Non"))'),
    }
    fmt_obs = {"C1": "num3", "C2": "num3", "C3": "num3", "C4": "num2", "C6": "pct", "C7": "num1", "C8": "pct", "C9": "pct", "C15": "pct"}
    for i, (c, fait, niv) in enumerate(PLAFONDS):
        r = R["c_first"] + i
        o, s, act = obs[c]
        ws.write(r - 1, 0, c, F["labb"])
        ws.write(r - 1, 1, fait, F["txt"])
        ws.set_row(r - 1, 27)
        fx(f"C{r}", o, F[fmt_obs.get(c, "calc_txt")])
        fx(f"D{r}", s, F[fmt_obs.get(c, "calc_txt")] if c not in ("C2",) else F["num2"])
        fx(f"E{r}", act, F["calc"])
        fx(f"F{r}", f"=INDEX(P_PlafNiv,{i + 1})", F["int"])
        fx(f"G{r}", f'=IF(E{r}="Oui",F{r},10)', F["int"])
        ws.conditional_format(f"E{r}", {"type": "cell", "criteria": "==", "value": '"Oui"', "format": F["rouge"]})
        ws.conditional_format(f"E{r}", {"type": "cell", "criteria": "==", "value": '"n.r."', "format": F["ambre"]})
    ws.write(R["plafond"] - 1, 0, "PLAFOND LE PLUS CONTRAIGNANT (10 = aucun)", F["labb"])
    fx(f"B{R['plafond']}", f"=MIN(G{R['c_first']}:G{R['c_last']})", F["kpi"])

    # ---------------------------------------------------------------- 12 note approuvée
    section(R["na_title"], "12 · NOTE APPROUVÉE = min(note calculée ; plafonds actifs) — ordre X, B, score, C")
    nX = f'COUNTIF(F{R["x_first"]}:F{R["x_first"] + 3},"Oui")'
    nB = f'COUNTIF(F{R["b_first"]}:F{R["b_last"]},"Oui")'
    stades = "&".join([f'IF(F{R["b_first"] + i}="Oui","{b[0]} ({b[2]})  ","")' for i, b in enumerate(BLOCAGES)])
    ws.write(R["na"] - 1, 0, "NOTE APPROUVÉE", F["labb"])
    fx(f"B{R['na']}", f'=IF({nX}>0,"—",IF(B{R["note_calc"]}="","",MIN(B{R["note_calc"]},B{R["plafond"]})))', F["big"])
    ws.set_row(R["na"] - 1, 30)
    ws.write(R["statut"] - 1, 0, "Statut", F["labb"])
    ws.merge_range(R["statut"] - 1, 1, R["statut"] - 1, 7, "", F["kpi_txt"])
    fx(f"B{R['statut']}", (f'=IF(B{R["note_calc"]}="","Dossier incomplet",IF({nX}>0,"Hors périmètre — aucune note produite",'
                            f'IF({nB}>0,"Note provisoire — stade bloqué : "&TRIM({stades}),'
                            f'IF(E{R["c_last"]}="Oui","Note provisoire — évaluation partielle (C15)","Note validable, à soumettre au comité"))))'), F["kpi_txt"])

    # ---------------------------------------------------------------- 13 enseignement
    section(R["lecon_title"], "13 · CE QUE CE CAS ENSEIGNE")
    ws.merge_range(R["lecon"] - 1, 0, R["lecon"] - 1, 7, cas["lecon"] if cas else "", F["wrap_in"])
    ws.set_row(R["lecon"] - 1, 60)
    ws.print_area(0, 0, R["lecon"], 7)


# ===================================================================== Synthèse
LIGNES_SYN = [("Intitulé du dossier", "A1", "calc_txt"), ("Régime de revenus", f"B{R['regime']}", "calc"),
              ("Secteur", f"B{R['secteur']}", "calc"), ("Phase", f"B{R['phase']}", "calc"),
              ("Régime de proportionnalité retenu", f"B{R['prop']}", "calc"),
              ("Seuil DSCR critique applicable", f"B{R['seuils']}", "num2"),
              ("DSCR minimum par échéance", f"D{R['dmin']}", "num3"),
              ("DSCR minimum sous stress", f"D{R['dstress']}", "num3"),
              ("DSCR moyen (indicatif)", f"D{R['dmoy']}", "num3"),
              ("DSCR annuel minimum (indicatif)", f"D{R['dann']}", "num3"),
              ("D7 — noyau financier", f"D{R['d7']}", "num1"),
              ("Score global sur 100", f"B{R['global']}", "num1"),
              ("Note calculée", f"B{R['note_calc']}", "int"),
              ("Plafonds actifs", "B8", "calc_txt"),
              ("Plafond le plus contraignant", f"B{R['plafond']}", "int"),
              ("NOTE APPROUVÉE", f"B{R['na']}", "int"),
              ("Statut", f"B{R['statut']}", "calc_txt")]


def synthese(ws, F, onglets):
    ws.set_column("A:A", 36)
    ws.set_column("B:X", 17)
    ws.set_column("Z:Z", 8, None, {"hidden": True})
    ws.write("A1", "Synthèse des dossiers", F["titre"])
    ws.write("A2", "Une colonne par onglet de dossier. Le bouton « Mettre à jour la synthèse » ajoute les dossiers "
                   "créés depuis l'accueil. Aucune valeur n'est saisie ici : tout est lu dans les dossiers.", F["sous"])
    ws.write("A4", "Onglet", F["hdr"])
    for j in range(23):
        if j < len(onglets):
            ws.write(3, 1 + j, onglets[j], F["hdr"])
        else:
            ws.write_blank(3, 1 + j, None, F["hdr"])
    for i, (lib, adr, fmt) in enumerate(LIGNES_SYN):
        r = 5 + i
        ws.write(r - 1, 0, lib, F["labb"] if lib.startswith("NOTE") else F["lab"])
        ws.write(r - 1, 25, adr)
        for j in range(23):
            col = xl_rowcol_to_cell(0, 1 + j)[:-1]
            ws.write_formula(r - 1, 1 + j, f'=IF({col}$4="","",IFERROR(INDIRECT("\'"&{col}$4&"\'!"&$Z{r}),""))', F[fmt])
    rna = 5 + [l for l, _, _ in LIGNES_SYN].index("NOTE APPROUVÉE")
    ws.set_row(rna - 1, 24)
    ws.conditional_format(f"B{rna}:X{rna}", {"type": "cell", "criteria": ">=", "value": 8, "format": F["vertc"]})
    ws.conditional_format(f"B{rna}:X{rna}", {"type": "cell", "criteria": "between", "minimum": 6, "maximum": 7, "format": F["ambre"]})
    ws.conditional_format(f"B{rna}:X{rna}", {"type": "cell", "criteria": "between", "minimum": 1, "maximum": 5, "format": F["rouge"]})
    ws.set_row(4, 45); ws.set_row(4 + 13, 45); ws.set_row(4 + 16, 45)
    ws.freeze_panes(4, 1)
    r = 5 + len(LIGNES_SYN) + 2
    ws.write(r - 1, 0, "Les trois démonstrations à retenir", F["labb"])
    for k, t in enumerate([
        "CAS 3 — Anti-compensation : un score de 73,7 (note 7) ramené à 4 par les plafonds C2 et C3. Un sponsor à 100 et une documentation à 100 ne compensent pas un DSCR de 1,06 sur le creux estival.",
        "CAS 4A vs 4B — Le ratio annuel trompe : 1,53 en annuel, 0,59 par échéance. Après sculpture de l'amortissement, apport complémentaire et couverture de change, la note passe de 3 à 6 sans que le marché ait changé.",
        "CAS 5 — Proportionnalité : le régime simplifié allège la grille de jugement, jamais les plafonds. Un noyau financier à 97 reste plafonné à 6 par la concentration sur un acheteur unique non noté."]):
        ws.merge_range(r + k, 0, r + k, 6, t, F["wrap"])
        ws.set_row(r + k, 32)
    if not SANS_VBA:
        ws.insert_button("I1", {"macro": "MettreAJourSynthese", "caption": "Mettre à jour la synthèse", "width": 190, "height": 28})
        ws.insert_button("L1", {"macro": "ExporterPDF", "caption": "Exporter en PDF", "width": 130, "height": 28})
        ws.insert_button("O1", {"macro": "AllerAccueil", "caption": "Accueil", "width": 100, "height": 28})


# ===================================================================== Accueil
def accueil(ws, F):
    ws.set_column("A:A", 3); ws.set_column("B:B", 110); ws.set_column("C:C", 3); ws.set_column("D:D", 30)
    ws.hide_gridlines(2)
    ws.write("B2", "Outil de scoring Project Finance — modèle V8", F["titre"])
    ws.write("B3", "Classeur Excel dynamique piloté par macros VBA. Toutes les notes sont produites par des formules ; "
                   "les macros créent, dupliquent, contrôlent, exportent et tracent.", F["sous"])
    lignes = [
        ("AVERTISSEMENT", True),
        ("Les six dossiers fournis (C1 à C5) sont FICTIFS et construits à des fins pédagogiques. Les seuils, poids et plafonds "
         "sont des paramètres CANDIDATS, non approuvés par le Comité de validation : ne pas les utiliser en production avant validation.", False),
        ("", False),
        ("DÉMARRER", True),
        ("1. Activez les macros à l'ouverture (bandeau jaune « Activer le contenu »). Sans macros, le classeur calcule tout de même ; "
         "seuls les boutons sont inactifs.", False),
        ("2. Ouvrez un dossier existant (onglets C1 à C5) ou cliquez sur « Nouveau dossier ».", False),
        ("3. Saisissez uniquement les cellules JAUNES à texte bleu. Toutes les autres cellules sont des formules.", False),
        ("4. Le tableau de bord en haut de chaque dossier (lignes 5 à 11, toujours visible) se met à jour à chaque saisie.", False),
        ("5. « Contrôler la saisie » liste ce qui manque ; « Exporter en PDF » produit la fiche du dossier ; la synthèse compare tous les dossiers.", False),
        ("", False),
        ("CE QUI EST AUTOMATIQUE", True),
        ("• Seuils DSCR : base du régime + écart sectoriel + majoration de phase, lus dans l'onglet Paramètres.", False),
        ("• DSCR par échéance, DSCR minimum retenu, DSCR stressé, DSCR moyen et annuel affichés à titre indicatif seulement.", False),
        ("• Noyau financier : N1 et N2 notés à partir des DSCR ; N3 en construction à partir du test de financement à terminaison.", False),
        ("• Plafonds C1 à C15 déclenchés par les données saisies — un plafond ne se tape plus à la main.", False),
        ("• Verrous X (hors périmètre) et B (note provisoire) ; B3 et B7 détectés automatiquement.", False),
        ("• Régime de proportionnalité S / M / L calculé, avec escalade automatique (verrou : S vers M ; plafond : M vers L).", False),
        ("• Poids des domaines selon la phase ; domaine sans poids (D3 en exploitation) grisé et exclu de la complétude.", False),
        ("", False),
        ("RACCOURCIS", True),
        ("Onglet Diagnostic : les anomalies relevées dans le classeur d'origine et leur correction.   "
         "Onglet Journal : trace des créations, duplications, contrôles, exports et changements de routage.", False),
    ]
    r = 5
    for t, titre in lignes:
        ws.write(r - 1, 1, t, F["section"] if titre else F["wrap"])
        if not titre and len(t) > 120:
            ws.set_row(r - 1, 28)
        r += 1
    if not SANS_VBA:
        boutons = [("Nouveau dossier", "NouveauDossier"), ("Dupliquer le dossier actif", "DupliquerDossier"),
                   ("Supprimer le dossier actif", "SupprimerDossier"), ("Mettre à jour la synthèse", "AllerSynthese"),
                   ("Tout recalculer", "Recalculer"), ("Paramètres du modèle", "AllerParametres"),
                   ("Diagnostic du classeur d'origine", "AllerDiagnostic")]
        for i, (cap, mac) in enumerate(boutons):
            ws.insert_button(4 + i * 2, 3, {"macro": mac, "caption": cap, "width": 210, "height": 30})


# ===================================================================== Diagnostic
DIAG = [
    ("Synthèse", "Élevée", "L'onglet Synthèse ne contient aucune formule : ses 84 valeurs sont saisies en dur. Modifier un cas ne change rien à la synthèse.",
     "Synthèse lue dans les dossiers par formule (INDIRECT sur l'onglet et l'adresse) ; colonnes ajoutées automatiquement par la macro."),
    ("Synthèse", "Moyenne", "« DSCR annuel agrégé » porte deux définitions différentes : l'onglet de cas calcule un ratio sur toutes les périodes (1,368 pour C1), la synthèse affiche le minimum des ratios annuels (1,347). Écart dans les 6 cas.",
     "Deux lignes distinctes et nommées : « DSCR moyen sur l'horizon » et « DSCR annuel minimum, semestres agrégés », toutes deux indicatives."),
    ("Routage", "Élevée", "Régime, secteur et phase sont du texte : les seuils pointent sur des cellules fixes du barème (ex. =Barèmes!B6) choisies à la main pour chaque cas. Changer le régime ou la phase ne change ni les seuils ni les poids de domaine.",
     "Listes déroulantes ; seuils et poids retrouvés par INDEX/EQUIV sur le code choisi."),
    ("Noyau financier", "Moyenne", "Les poids N1 à N6 sont recopiés en dur dans chaque cas au lieu de pointer sur le barème ; les ancres 20/50/80/100 sont écrites dans les formules.",
     "Poids et ancres lus dans Paramètres (plages nommées) : un changement s'applique à tous les dossiers."),
    ("Noyau financier", "Élevée", "Le DSCR sous scénario défavorable est une constante saisie (ex. 1,117) : il ne dépend pas de l'échéancier. Modifier un CFADS ne change pas N2.",
     "DSCR stressé recalculé à chaque période à partir d'un choc sur le CFADS, ou d'un CFADS stressé saisi. Choc des cas calibré pour reproduire la valeur d'origine."),
    ("Noyau financier", "Moyenne", "N3 est saisi même en phase de construction, alors que la couverture à terminaison est calculée juste au-dessus et que la doctrine fixe le barème (≥ 110 % → 10 ; 100-110 % → 8 ; 95-100 % avec plan → 5 ; sinon 2 et B3).",
     "N3 calculé en P1 à partir de la couverture ; saisi hors P1 (LLCR), le barème LLCR n'étant pas publié par la doctrine."),
    ("Plafonds", "Critique", "Les plafonds sont tapés à la main dans chaque cas. Aucune règle ne se déclenche seule : baisser un CFADS sous le seuil critique ne plafonne pas la note. C2 n'est pas listé pour le cas 4A alors que son DSCR (0,59) est sous le seuil critique (1,35).",
     "Les quinze plafonds C1 à C15 sont évalués par formule à partir des données ; « n.r. » signale une donnée manquante."),
    ("Verrous", "Élevée", "Les exclusions X1-X4 et les blocages B1-B8 de la doctrine sont absents du classeur.",
     "Section Verrous : saisie Oui/Non, détection automatique de B3 (couverture) et B7 (complétude), statut de la note."),
    ("Complétude", "Moyenne", "Aucun contrôle de complétude ni plafond C15 : une grille partiellement remplie produit une note normale.",
     "Couverture pondérée et complétude calculées ; C15 et B7 déclenchés en dessous des seuils ; information insuffisante comptée à 20, sans renormalisation."),
    ("Proportionnalité", "Moyenne", "Le régime S/M/L est saisi. Trois cas contredisent la doctrine : C1 (contrat de 25 ans > 20 ans), C4A (devises non couvertes, plafonds actifs) et C4B (exposition de change résiduelle de 16 %) relèvent du régime L, non M.",
     "Régime calculé à partir des conditions S et d'escalade L, puis escalade automatique (verrou : S → M ; plafond : M → L)."),
    ("Saisie", "Moyenne", "Aucune liste de validation : une note de 75 ou 90 est acceptée alors que l'échelle ne connaît que 100, 80, 50 et 20.",
     "Listes déroulantes sur toutes les notes, codes et réponses Oui/Non."),
    ("Calcul", "Moyenne", "Pas de garde : un service de la dette nul (différé) produit #DIV/0!, un CFADS négatif est classé comme un ratio ordinaire.",
     "Différé signalé comme tel ; CFADS négatif noté Critique d'office sur N1, conformément à la doctrine."),
    ("Justifications", "Faible", "Les justifications contiennent des chiffres figés (« DSCR minimum 1.296 », avec un point) qui deviennent faux dès qu'une saisie change.",
     "Mesures N1 à N3 rédigées par formule à partir des valeurs calculées, au format français."),
    ("Échéancier", "Élevée", "Chaque cas ne comporte que 4 à 6 périodes représentatives : le « DSCR minimum » est le minimum d'un échantillon, non de toutes les échéances, ce que la doctrine exige (blocage B6).",
     "Échéancier de 60 périodes. Les cas conservent leurs périodes d'origine ; B6 est renseigné « Oui » avec un commentaire rappelant la limite."),
    ("Outil", "Élevée", "Aucune macro : ajouter un dossier suppose de recopier un onglet à la main et de réécrire la synthèse.",
     "Macros : nouveau dossier, duplication, suppression, contrôle de saisie, recalcul, export PDF, synthèse et journal."),
]


def diagnostic(ws, F):
    ws.set_column("A:A", 5); ws.set_column("B:B", 16); ws.set_column("C:C", 10)
    ws.set_column("D:D", 70); ws.set_column("E:E", 60)
    ws.write("A1", "Diagnostic du classeur d'origine « Cas_Etude_PF_Maroc_V8.xlsx »", F["titre"])
    ws.write("A2", "Chaque constat est vérifié par recalcul des formules d'origine ; la colonne de droite décrit la correction apportée dans cet outil.", F["sous"])
    for c, h in enumerate(["N°", "Zone", "Gravité", "Constat", "Correction dans l'outil"]):
        ws.write(3, c, h, F["hdr"])
    for i, (zone, grav, constat, corr) in enumerate(DIAG):
        r = 4 + i
        ws.write_number(r, 0, i + 1, F["int"])
        ws.write(r, 1, zone, F["lab"])
        ws.write(r, 2, grav, F["lab"])
        ws.write(r, 3, constat, F["txt"])
        ws.write(r, 4, corr, F["txt"])
        ws.set_row(r, 58)
    last = 4 + len(DIAG)
    ws.conditional_format(4, 2, last, 2, {"type": "cell", "criteria": "==", "value": '"Critique"', "format": F["rouge"]})
    ws.conditional_format(4, 2, last, 2, {"type": "cell", "criteria": "==", "value": '"Élevée"', "format": F["ambre"]})

    r = last + 2
    ws.write(r, 1, "Résultats : classeur d'origine face à l'outil corrigé (colonnes « Outil » lues en direct dans les dossiers)", F["labb"])
    hdr = ["", "Cas", "", "Note approuvée d'origine", "Note approuvée — outil", "Régime d'origine", "Régime — outil", "Plafonds — outil"]
    ws.set_column("F:H", 22)
    for c, h in enumerate(hdr):
        if h:
            ws.write(r + 1, c, h, F["hdr"])
    origine = {"C1": (9, "M"), "C2": (6, "L"), "C3": (4, "L"), "C4A": (3, "M"), "C4B": (6, "M"), "C5": (6, "S")}
    for i, (k, (na, reg)) in enumerate(origine.items()):
        rr = r + 2 + i
        ws.write(rr, 1, k, F["labb"])
        ws.write_number(rr, 3, na, F["int"])
        ws.write_formula(rr, 4, f"='{k}'!B{R['na']}", F["int"])
        ws.write(rr, 5, reg, F["calc"])
        ws.write_formula(rr, 6, f"='{k}'!B{R['prop']}", F["calc"])
        ws.write_formula(rr, 7, f"='{k}'!B8", F["calc_txt"])
        ws.set_row(rr, 30)
    rr = r + 2 + len(origine) + 1
    ws.merge_range(rr, 1, rr, 7,
                   "Les notes approuvées sont inchangées : les corrections portent sur la mécanique (routage, plafonds, stress, "
                   "synthèse), pas sur le jugement des cas. Le régime de proportionnalité change pour C1, C4A et C4B, en application "
                   "de la doctrine. Les nouveaux champs (exposition bancaire, qualité de l'acheteur, etc.) sont reconstitués à partir "
                   "du récit : leurs cellules portent un commentaire « à confirmer ».", F["wrap"])
    ws.set_row(rr, 58)
    ws.freeze_panes(4, 0)


def journal(ws, F):
    ws.set_column("A:A", 18); ws.set_column("B:B", 20); ws.set_column("C:C", 20)
    ws.set_column("D:D", 16); ws.set_column("E:E", 70)
    ws.write("A1", "Journal des actions", F["titre"])
    ws.write("A2", "Alimenté automatiquement par les macros. Ne pas modifier.", F["sous"])
    for c, h in enumerate(["Date", "Utilisateur", "Action", "Dossier", "Détail"]):
        ws.write(3, c, h, F["hdr"])
    ws.freeze_panes(4, 0)


if __name__ == "__main__":
    print(ecrire_classeur())
