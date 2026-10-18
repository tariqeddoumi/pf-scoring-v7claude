# -*- coding: utf-8 -*-
"""Construit l'outil Excel/VBA de scoring Project Finance V8, version 3.

Dix-huit dossiers préchargés (six cas d'origine, douze cas sectoriels), codes client T24,
radical et projet, crédits du projet, données sectorielles, listes de situations
descriptives (référentiel des niveaux), bloc 13 « Commentaires et conditions », fiche
comité, comparaison de deux dossiers, concordance des notes de référence et import des
propositions de l'IA.

Usage : python build_tool.py [--sans-vba]
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import xlsxwriter
from xlsxwriter.utility import xl_col_to_name
import cas_tous
import complements
import moteur_reference
import referentiel as REF
import vbaproj
import modules_vba

SANS_VBA = "--sans-vba" in sys.argv
ICI = os.path.dirname(os.path.abspath(__file__))
SORTIE = os.path.join(ICI, "Outil_Scoring_PF_V8_v3.xlsx" if SANS_VBA else "Outil_Scoring_PF_V8_v3.xlsm")
EXEMPLE_IA = os.path.join(ICI, "exemple_propositions_IA.xlsx")
MAX_DOSSIERS = 40
MODULES_TEST = []          # modules VBA ajoutés par les tests (jamais dans le classeur livré)
FORMAT_IA = "PF-PROPOSITIONS-IA v1"

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

NATURES_CREDIT = complements.NATURES_CREDIT
DEVISES = complements.DEVISES
AVIS = complements.AVIS
DECISIONS = complements.DECISIONS

# Champs absents du classeur d'origine, reconstitués à partir du récit (cas C1 à C5)
RECONST = "Valeur reconstituée à partir du récit du cas (champ absent du classeur d'origine) — à confirmer."
CHAMPS_RECONST = ("expo", "mad", "techno", "epc18", "unique", "premiere", "consortium", "plus20", "climat", "nbcp",
                  "part_ach", "qual", "duree_contrat", "refi", "sponsor", "operateur", "facteur")

# ===================================================================== mise en page d'un dossier
DOM_GRILLE = ["D1", "D2", "D3", "D4", "D5", "D6", "D8", "D9"]
NB_CREDITS = 6
NB_HYP = 8
NB_SEC = REF.NB_CHAMPS_SECTEUR


def _mise_en_page():
    """Numéros de ligne (1-based) de chaque saisie et de chaque calcul du dossier."""
    R = dict(a_saisir=4, tdb=5, note=6, score=7, plafonds_txt=8, verrous_txt=9, regime_txt=10, compl=11, nav=12)
    r = 13
    R["s1"], R["s1_hdr"] = r, r + 1
    r += 2
    for k in ("code_client", "radical", "code_projet", "regime", "secteur", "phase", "period", "famille"):
        R[k] = r
        r += 1
    r += 1
    R["s2"] = r
    r += 1
    for k in ("capex", "expo", "mad", "duree", "techno", "epc18", "unique", "premiere", "consortium", "plus20",
              "climat", "nbcp", "prop_base", "prop"):
        R[k] = r
        r += 1
    r += 1
    R["s3"], R["se_hdr"], R["se_first"], R["se_last"] = r, r + 1, r + 2, r + 9
    R["se_tot"], R["couv"], R["quote"], R["remed"] = r + 10, r + 11, r + 12, r + 13
    r += 15
    R["cr_title"], R["cr_hdr"], R["cr_first"] = r, r + 1, r + 2
    R["cr_last"] = R["cr_first"] + NB_CREDITS - 1
    R["cr_tot"] = R["cr_last"] + 1
    r = R["cr_tot"] + 2
    R["s4"], R["sec_hdr"], R["sec_first"] = r, r + 1, r + 2
    R["sec_last"] = R["sec_first"] + NB_SEC - 1
    R["hyp_hdr"] = R["sec_last"] + 1
    R["hyp_first"], R["hyp_last"] = R["hyp_hdr"] + 1, R["hyp_hdr"] + NB_HYP
    r = R["hyp_last"] + 2
    R["s5"] = r
    R["seuil_base"], R["delta"], R["majo"], R["seuils_hdr"], R["seuils"] = r + 1, r + 2, r + 3, r + 4, r + 5
    r += 7
    R["s6"], R["choc"], R["ech_hdr"], R["p_first"] = r, r + 1, r + 2, r + 3
    R["p_last"] = R["p_first"] + 59
    r = R["p_last"] + 2
    R["dmin"], R["dstress"], R["dmoy"], R["dann"], R["nbper"] = r, r + 1, r + 2, r + 3, r + 4
    r += 7
    R["s7"], R["noy_hdr"], R["n1"] = r, r + 1, r + 2
    R["n6"], R["d7"] = R["n1"] + 5, R["n1"] + 6
    R["donnees_hdr"] = R["d7"] + 1
    r = R["d7"] + 2
    for k in ("n3_saisi", "llcr", "dsra", "fx", "refi", "strat", "part_ach", "qual", "duree_contrat", "duree_dette",
              "solution", "plan_adapt", "sponsor", "operateur", "ecart_om", "facteur"):
        R[k] = r
        r += 1
    r += 1
    R["s8"], R["grid_hdr"], R["grid_first"] = r, r + 1, r + 2
    return R


R = _mise_en_page()


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
R["b13_title"] = R["statut"] + 2
for _i, _k in enumerate(("synthese", "forces", "faiblesses", "conditions", "justif", "avis", "decision")):
    R[_k] = R["b13_title"] + 1 + _i
R["fin"] = R["decision"]

# Colonnes masquées : J (type de ligne), K (sous-critère requis), L (clé), M (ligne du référentiel),
# P:R (check-list ; P sert aussi au lien « sous-critère à noter »), S (rang de la situation choisie),
# T (commentaire exigé et manquant).
CK_COL_LIB, CK_COL_ADR, CK_COL_OK = 15, 16, 17
R["ck_first"] = 14
B6_INDEX = 4 + 5          # rang de B6 dans X1..X4, B1..B8

SECTION_NAV = [("1 · Identification", "s1"), ("3 · Sources", "s3"), ("6 · Échéancier", "s6"), ("7 · Noyau", "s7"),
               ("8 · Grille", "s8"), ("11 · Plafonds", "pl_title"), ("13 · Commentaires", "b13_title")]

# Contrôles de format des codes (formules Excel, pour la validation et la check-list)
CHIFFRES = '"0123456789"'


def chiffres(c, debut, n):
    """Vrai si les n caractères de c à partir de debut sont des chiffres. Sans constante matricielle :
    Excel les refuse dans une règle de validation."""
    return (f'SUMPRODUCT(--ISNUMBER(FIND(MID({c},ROW(INDIRECT("1:{n}"))+{debut - 1},1),{CHIFFRES})))={n}')


def ok_radical(c):
    return f'AND(LEN({c})=7,{chiffres(c, 1, 7)})'


def ok_code_projet(c):
    return f'AND(LEN({c})=12,EXACT(LEFT({c},3),"PF-"),MID({c},8,1)="-",{chiffres(c, 4, 4)},{chiffres(c, 9, 4)})'


def ok_code_client(c):
    return f'AND(LEN(TRIM({c}))>=1,LEN({c})<=20)'


def flag_justif():
    """Vrai quand la justification des écarts est obligatoire : plafond, verrou ou information insuffisante."""
    g1, g2 = R["grid_first"], R["grid_last"]
    return (f'OR(COUNTIF($E${R["c_first"]}:$E${R["c_last"]},"Oui")>0,COUNTIF($F${R["x_first"]}:$F${R["b_last"]},"Oui")>0,'
            f'SUMPRODUCT(($J${g1}:$J${g2}="SC")*($K${g1}:$K${g2}=1)*($S${g1}:$S${g2}=5))>0,'
            f'COUNTIF($S${R["n1"] + 3}:$S${R["n6"]},5)>0)')


def _checklist():
    """Saisies attendues, dans l'ordre du dossier : (libellé, adresse, condition « fait », plage colorée si manquant).

    La condition est une expression Excel vraie quand la saisie est faite. Les saisies
    conditionnelles (EPC en P1, stratégie si dette à refinancer > 30 %, etc.) ne sont
    exigées que lorsque la règle qui les lit s'applique.
    """
    b = lambda k: f"$B${R[k]}"
    rempli = lambda k: f'{b(k)}<>""'
    nombre = lambda k: f"ISNUMBER({b(k)})"
    p1 = f'{b("phase")}="P1"'
    f1, f2, t = R["se_first"], R["se_last"], R["se_tot"]
    pf, pl = R["p_first"], R["p_last"]
    g1, g2 = R["grid_first"], R["grid_last"]
    x1, b8 = R["x_first"], R["b_last"]
    n4, n6 = R["n1"] + 3, R["n6"]
    items = [
        ("1 · Code client T24", "code_client", ok_code_client(b("code_client"))),
        ("1 · Radical du client (7 chiffres)", "radical", ok_radical(b("radical"))),
        ("1 · Code projet (PF-AAAA-NNNN)", "code_projet", ok_code_projet(b("code_projet"))),
        ("1 · Régime de revenus", "regime", rempli("regime")),
        ("1 · Secteur du projet", "secteur", rempli("secteur")),
        ("1 · Phase du projet", "phase", rempli("phase")),
        ("1 · Périodicité des échéances", "period", rempli("period")),
        ("2 · Exposition de la banque (MMAD)", "expo", nombre("expo")),
        ("2 · Recettes, coûts et dette en dirhams ?", "mad", rempli("mad")),
        ("2 · Durée du financement (ans)", "duree", nombre("duree")),
        ("2 · Technologie éprouvée ?", "techno", rempli("techno")),
        ("2 · EPC clé-en-main de moins de 18 mois ? (phase P1)", "epc18", f"OR(NOT({p1}),{rempli('epc18')})"),
        ("2 · Acheteur principal unique ?", "unique", rempli("unique")),
        ("2 · Première référence technologique ?", "premiere", rempli("premiere")),
        ("2 · Opération consortiale ?", "consortium", rempli("consortium")),
        ("2 · Contrat de revenus de plus de 20 ans ?", "plus20", rempli("plus20")),
        ("2 · Site à risque climatique élevé ?", "climat", rempli("climat")),
        ("2 · Nombre de contreparties clés", "nbcp", nombre("nbcp")),
        ("3 · Emplois : montants du besoin à terminaison", f"B{f1}", f"N($B${t})>0", f"B{f1}"),
        ("3 · Ressources engagées : montants", f"E{f1}", f"N($E${t})>0", f"E{f1}"),
        ("3 · Nature de chaque ressource", f"F{f1}", f'SUMPRODUCT(ISNUMBER($E${f1}:$E${f2})*($F${f1}:$F${f2}=""))=0', None),
        ("3 · Plan de remédiation (couverture entre 95 et 100 %)", "remed",
         f'OR(NOT(AND({p1},ISNUMBER({b("couv")}),N({b("couv")})>=P_N3_V,N({b("couv")})<P_N3_F)),{rempli("remed")})'),
        ("6 · Choc du scénario défavorable (%)", "choc", nombre("choc")),
        ("6 · Échéancier : CFADS d'au moins deux périodes", f"B{pf}", f"COUNT($B${pf}:$B${pl})>=2", None),
        ("6 · Service de la dette de chaque période", f"C{pf}",
         f"SUMPRODUCT(ISNUMBER($B${pf}:$B${pl})*(1-ISNUMBER($C${pf}:$C${pl})))=0", None),
        ("7 · N4 — Liquidité : situation à choisir", f"E{n4}", f'$B${n4}<>""', f"E{n4}:G{n4}"),
        ("7 · N5 — Levier : situation à choisir", f"E{n4 + 1}", f'$B${n4 + 1}<>""', f"E{n4 + 1}:G{n4 + 1}"),
        ("7 · N6 — Exposition résiduelle : situation à choisir", f"E{n6}", f'$B${n6}<>""', f"E{n6}:G{n6}"),
        ("7 · Justification exigée (N4 à N6 Critique ou Info. insuffisante)",
         f'="H"&IF(COUNT($T${n4}:$T${n6})=0,{n4},MIN($T${n4}:$T${n6}))', f"COUNT($T${n4}:$T${n6})=0", None),
        ("7 · N3 hors phase P1 : note LLCR", "n3_saisi", f"OR({p1},{rempli('n3_saisi')})"),
        ("7 · LLCR (plafond C4)", "llcr", nombre("llcr")),
        ("7 · DSRA en mois (plafond C7)", "dsra", nombre("dsra")),
        ("7 · Exposition nette en devises (plafond C6)", "fx", nombre("fx")),
        ("7 · Dette à refinancer à maturité (plafond C8)", "refi", nombre("refi")),
        ("7 · Stratégie de refinancement approuvée ?", "strat", f"OR(N({b('refi')})<=P_C8,{rempli('strat')})"),
        ("7 · Part des recettes de l'acheteur principal (C10)", "part_ach", nombre("part_ach")),
        ("7 · Qualité de crédit de l'acheteur principal", "qual", rempli("qual")),
        # Pas de contrat de revenus en régime R4 (exposition au marché) : C5 ne s'y applique pas.
        ("7 · Durée résiduelle du contrat de revenus (C5)", "duree_contrat", f'OR({b("regime")}="R4",{nombre("duree_contrat")})'),
        ("7 · Durée résiduelle de la dette", "duree_dette", nombre("duree_dette")),
        ("7 · Solution documentée (contrat plus court que la dette) ?", "solution",
         f'OR(NOT(AND({nombre("duree_contrat")},{nombre("duree_dette")})),N({b("duree_contrat")})>=N({b("duree_dette")}),{rempli("solution")})'),
        ("7 · Plan d'adaptation climatique financé ? (C11)", "plan_adapt", f'OR({b("climat")}<>"Oui",{rempli("plan_adapt")})'),
        ("7 · Capacité résiduelle du sponsor (C12)", "sponsor", rempli("sponsor")),
        ("7 · Opérateur remplaçable ? (C13)", "operateur", rempli("operateur")),
        ("7 · Écart fin O&M / fin de dette (opérateur non remplaçable)", "ecart_om", f'OR({b("operateur")}<>"Non",{nombre("ecart_om")})'),
        ("7 · Facteur commun au-delà de la limite interne (C14)", "facteur", rempli("facteur")),
        ("8 · Grille : sous-critère requis sans situation choisie", f'="E"&IF(COUNT($P${g1}:$P${g2})=0,{g1 + 1},MIN($P${g1}:$P${g2}))',
         f"COUNT($P${g1}:$P${g2})=0", None),
        ("8 · Commentaire exigé (situation Critique ou Info. insuffisante)",
         f'="H"&IF(COUNT($T${g1}:$T${g2})=0,{g1 + 1},MIN($T${g1}:$T${g2}))', f"COUNT($T${g1}:$T${g2})=0", None),
        ("10 · Verrous X1 à B8 : répondre Oui ou Non", f"E{x1}", f"COUNTBLANK($E${x1}:$E${b8})=0", None),
        ("13 · Synthèse de l'analyste", f"B{R['synthese']}", f'$B${R["synthese"]}<>""', f"B{R['synthese']}:H{R['synthese']}"),
        ("13 · Justification des écarts (plafond, verrou ou info. insuffisante)", f"B{R['justif']}",
         f'OR(NOT({flag_justif()}),$B${R["justif"]}<>"")', f"B{R['justif']}:H{R['justif']}"),
    ]
    out = []
    for it in items:
        lib, cle, ok = it[:3]
        if len(it) == 4:
            out.append((lib, cle, ok, it[3]))
        elif cle in R:
            out.append((lib, f"B{R[cle]}", ok, f"B{R[cle]}"))
        else:
            out.append((lib, cle, ok, None))
    return out


CHECKLIST = _checklist()
assert R["ck_first"] + len(CHECKLIST) - 1 < R["s7"]  # colonnes P:R libres avant le noyau et la grille

# ===================================================================== aide à la saisie
# Info-bulle affichée quand on sélectionne une cellule de saisie (titre ≤ 32 car., texte ≤ 255).
AIDE = {
    "titre": ("Intitulé du dossier", "Nom du projet, ex. « Centrale solaire de 80 MWc ». Le code projet se saisit au bloc 1."),
    "spv": ("SPV et localisation", "Société de projet emprunteuse et lieu du site."),
    "resume": ("Résumé du projet", "Objet, contrat de recettes, montage financier : trois ou quatre lignes."),
    "code_client": ("Code client T24", "Code du client (société de projet) dans T24. Saisi comme du texte : les zéros de tête "
                                       "sont conservés."),
    "radical": ("Radical du client", "Exactement 7 chiffres, zéros de tête compris (ex. 0041027). Repris dans la synthèse, "
                                     "la fiche comité, le nom du PDF et le journal."),
    "code_projet": ("Code projet", "Format PF-AAAA-NNNN, ex. PF-2026-0014. Le contrôle d'import des propositions IA "
                                   "compare ce code à celui du fichier."),
    "regime": ("Régime de revenus", "R1 contrat ferme (take-or-pay) ; R2 paiement à la disponibilité ; R3 contrat à risque de volume ; "
                                    "R4 exposition au marché. Fixe les seuils DSCR."),
    "secteur": ("Secteur du projet", "Code du secteur. Il ajoute l'écart Δ au seuil DSCR, choisit les champs du bloc 4 et "
                                     "les descriptions sectorielles de D2.1, D4.1, D4.3 et D5.2."),
    "phase": ("Phase du projet", "P1 construction ; P2 montée en charge (+0,05 sur les seuils) ; P3 exploitation stabilisée. "
                                 "La phase fixe les poids des domaines."),
    "period": ("Périodicité des échéances", "Fréquence du service de la dette. Le DSCR se mesure échéance par échéance, jamais en annuel."),
    "famille": ("Famille de financement", "PF-FLUX : société de projet remboursée par les flux du projet. La vente d'actifs (R5) est hors outil."),
    "expo": ("Exposition de la banque", "Montant total engagé par la banque sur le projet, en millions de dirhams (MMAD). Ex. : 250."),
    "mad": ("Tout en dirhams ?", "Oui si recettes, coûts et dette sont intégralement en MAD. Non dès qu'une part est en devises."),
    "duree": ("Durée du financement", "Durée totale de la dette, en années. Ex. : 15."),
    "techno": ("Technologie éprouvée ?", "Oui si la technologie compte au moins 3 références industrielles de plus de 3 ans."),
    "epc18": ("EPC clé-en-main < 18 mois ?", "Phase P1 seulement : Oui si le contrat EPC est forfaitaire, à prix et délai garantis, "
                                           "pour une durée de moins de 18 mois."),
    "unique": ("Acheteur principal unique ?", "Oui si l'essentiel des recettes provient d'un acheteur principal unique et identifié."),
    "premiere": ("Première référence ?", "Oui si la technologie est une première dans la juridiction (régime L)."),
    "consortium": ("Opération consortiale ?", "Oui si le financement est consortial au sens de la directive 3/W/2025 (régime L)."),
    "plus20": ("Contrat de plus de 20 ans ?", "Oui si la concession ou le contrat de revenus dépasse 20 ans (régime L)."),
    "climat": ("Risque climatique élevé ?", "Oui si le site est classé à risque climatique physique élevé : régime L, "
                                            "et plafond C11 sans plan d'adaptation financé."),
    "nbcp": ("Contreparties clés", "Nombre de contreparties clés : acheteur, EPC, opérateur, fournisseurs critiques… "
                                   "Au-delà de 3, régime L."),
    "emp_lib": ("Emploi", "Poste du besoin à terminaison : CAPEX, intérêts intercalaires, DSRA initiale, aléas…"),
    "emp_mt": ("Montant de l'emploi", "Montant en millions de dirhams (MMAD)."),
    "res_lib": ("Ressource", "Ressource engagée : dette senior, capital, quasi-fonds propres, subvention…"),
    "res_mt": ("Montant de la ressource", "Montant engagé, en millions de dirhams (MMAD)."),
    "nature": ("Nature de la ressource", "À choisir dans la liste. Dette senior et dette subordonnée forment la quote-part "
                                         "de dette (plafond C9 au-delà de 85 %)."),
    "remed": ("Plan de remédiation", "Phase P1 : Oui si un plan approuvé couvre l'écart lorsque les ressources couvrent "
                                     "entre 95 % et 100 % du besoin."),
    "cr_num": ("Numéro du dossier de crédit", "Référence du crédit dans le système de la banque, ex. CR-26-0101. "
                                              "Une ligne par crédit accordé ou proposé sur le projet."),
    "cr_nature": ("Nature du crédit", "À choisir dans la liste : investissement, relais, fonctionnement, garantie, couverture."),
    "cr_mt": ("Montant du crédit", "Montant en millions de dirhams (MMAD), contre-valeur pour un crédit en devises."),
    "cr_devise": ("Devise du crédit", "Devise de tirage et de remboursement."),
    "cr_duree": ("Durée du crédit", "Durée en années."),
    "cr_obs": ("Observation", "Information libre : taux, différé, profil d'amortissement…"),
    "sec_val": ("Donnée sectorielle", "Valeur de la donnée affichée à gauche, dans l'unité indiquée. Information, non "
                                      "utilisée par le calcul ; elle éclaire les sous-critères du secteur."),
    "sec_obs": ("Observation, source", "Source de la donnée (rapport d'expert, contrat, plan d'affaires) ou commentaire."),
    "hyp": ("Hypothèse d'exploitation", "Information libre, non utilisée par le calcul."),
    "choc": ("Scénario défavorable", "Baisse du CFADS appliquée à chaque période. Ex. : saisir 15% pour une baisse de 15 %. "
                                     "Sans effet sur les périodes dont le CFADS stressé est saisi."),
    "choc_lib": ("Description du stress", "Décrivez le scénario défavorable, ex. « production P90 et tarif −10 % »."),
    "p_lib": ("Période", "Libellé de l'échéance, ex. « An 1 · S1 ». Le bouton « Préparer l'échéancier » les génère."),
    "p_cfads": ("CFADS central", "Flux disponible pour le service de la dette sur la période, en MMAD. "
                                 "Un CFADS négatif est noté Critique d'office."),
    "p_service": ("Service de la dette", "Intérêts et principal dus sur la période, en MMAD. 0 = période de différé, "
                                         "exclue du DSCR."),
    "p_stress": ("CFADS stressé (facultatif)", "Laisser vide pour appliquer le choc du scénario défavorable. Sinon, CFADS du "
                                               "scénario défavorable issu du modèle de flux."),
    "choix_n": ("Situation de l'indicateur", "Choisissez la situation qui décrit le dossier : la note s'affiche à gauche "
                                             "(100, 80, 50 ou 20). « Info. insuffisante » est comptée à 20 et rend la note provisoire."),
    "n_lib": ("Justification", "Mesure et pièce justificative, ex. « DSRA 6 mois, cascade signée ». Obligatoire pour une "
                               "situation Critique ou « Info. insuffisante »."),
    "n3_saisi": ("N3 hors phase P1", "Note fondée sur le LLCR : 100, 80, 50 ou 20. En phase P1, N3 est calculé "
                                     "automatiquement à partir du test de financement à terminaison."),
    "llcr": ("LLCR", "Loan Life Coverage Ratio, en nombre de fois, ex. 1,35. Plafond C4 en dessous de 1,10."),
    "dsra": ("DSRA", "Réserve de service de la dette, en mois de service. Plafond C7 en dessous de 3 mois."),
    "fx": ("Exposition en devises", "Exposition nette non couverte, en % du service annuel de la dette. Saisir 0% si tout "
                                    "est en dirhams. Plafond C6 au-delà de 25 %."),
    "refi": ("Dette à refinancer", "Part du nominal à refinancer à maturité (ballon), en %. 0% si l'amortissement est "
                                   "complet. Plafond C8 au-delà de 30 % sans stratégie."),
    "strat": ("Stratégie de refinancement", "Oui si une stratégie de refinancement est approuvée : neutralise le plafond C8."),
    "part_ach": ("Part de l'acheteur principal", "Part des recettes portée par l'acheteur principal, en %. Ex. : 100%."),
    "qual": ("Qualité de l'acheteur", "Notation interne de l'acheteur principal. Plafond C10 si sa part dépasse 85 % "
                                      "et qu'il est noté sous BBB− ou non noté."),
    "duree_contrat": ("Durée du contrat de revenus", "Durée résiduelle du contrat de revenus, en années. Plafond C5 s'il "
                                                     "expire avant la dette sans solution documentée."),
    "duree_dette": ("Durée résiduelle de la dette", "Durée résiduelle de la dette, en années."),
    "solution": ("Solution documentée ?", "Oui si une solution documentée couvre l'expiration du contrat avant la dette : "
                                          "neutralise C5."),
    "plan_adapt": ("Plan d'adaptation financé ?", "Oui si un plan d'adaptation climatique est financé : neutralise C11."),
    "sponsor": ("Capacité du sponsor ?", "Oui si la capacité résiduelle du sponsor couvre l'appel d'equity restant. "
                                         "Non : plafond C12."),
    "operateur": ("Opérateur remplaçable ?", "Oui si l'opérateur O&M peut être remplacé. Non, avec un contrat O&M "
                                             "expirant plus de 5 ans avant la dette : plafond C13."),
    "ecart_om": ("Écart O&M / dette (ans)", "Années entre la fin du contrat O&M et la fin de la dette. "
                                            "À renseigner si l'opérateur n'est pas remplaçable."),
    "facteur": ("Facteur commun ?", "Oui si l'exposition du groupe bancaire sur un facteur commun dépasse la limite "
                                    "interne : plafond C14."),
    "grille": ("Situation du sous-critère", "Choisissez la situation qui décrit le dossier (onglet « Référentiel des niveaux »). "
                                            "La note s'affiche en colonne B. « Info. insuffisante » : comptée à 20, note provisoire."),
    "sc_comm": ("Commentaire", "Constat et pièce justificative. Obligatoire pour une situation Critique ou "
                               "« Info. insuffisante »."),
    "comm": ("Commentaire du domaine", "Constats et pièces qui justifient les notes du domaine."),
    "verrou": ("Verrou constaté ?", "Oui si le fait générateur est constaté, Non sinon. Une exclusion X empêche toute "
                                    "note ; un blocage B rend la note provisoire."),
    "verrouB6": ("Modèle de flux (B6)", "Question inversée : Oui si le modèle de flux daté est complet et rapproché des "
                                        "états financiers. Non déclenche le blocage B6."),
    "synthese": ("Synthèse (obligatoire)", "Le projet, la note et ce qui la détermine, en quelques phrases. Reprise en tête "
                                           "de la fiche comité."),
    "forces": ("Forces", "Points forts du dossier, avec les pièces qui les établissent."),
    "faiblesses": ("Faiblesses et mitigants", "Risques identifiés et, pour chacun, le mitigant en place ou proposé."),
    "conditions": ("Conditions proposées", "Conditions préalables, conditions de tirage, engagements et clauses de suivi."),
    "justif": ("Justification des écarts", "Obligatoire si un plafond, un verrou ou une « Info. insuffisante » est actif : "
                                           "cause, effet sur la note et mesure qui le lèverait."),
    "avis": ("Avis risques", "Avis de la fonction risques : favorable, favorable sous conditions, réservé ou défavorable."),
    "avis_txt": ("Motif de l'avis", "Motif et réserves de l'avis risques."),
    "decision": ("Décision du comité", "À renseigner après le comité : accord, accord sous conditions, ajournement ou refus."),
    "decision_txt": ("Date et références", "Date du comité, numéro de procès-verbal, réserves particulières."),
}
for _k, (_t, _m) in AIDE.items():
    assert len(_t) <= 32, _k
    assert len(_m) <= 255, (_k, len(_m))

# Contrôles numériques (message d'erreur en français)
NUM = {
    "pos": ({"validate": "decimal", "criteria": ">=", "value": 0}, "Saisissez un nombre positif ou nul."),
    "reel": ({"validate": "decimal", "criteria": "between", "minimum": -1e9, "maximum": 1e9}, "Saisissez un nombre."),
    "duree": ({"validate": "decimal", "criteria": "between", "minimum": 0, "maximum": 99}, "Saisissez une durée en années (0 à 99)."),
    "ecart": ({"validate": "decimal", "criteria": "between", "minimum": -99, "maximum": 99}, "Saisissez un nombre d'années (−99 à 99)."),
    "nb": ({"validate": "integer", "criteria": "between", "minimum": 0, "maximum": 99}, "Saisissez un nombre entier."),
    "pct": ({"validate": "decimal", "criteria": "between", "minimum": 0, "maximum": 1},
            "Saisissez un pourcentage entre 0 % et 100 %, par exemple 15%."),
    "pct5": ({"validate": "decimal", "criteria": "between", "minimum": 0, "maximum": 5},
             "Saisissez un pourcentage, par exemple 25% (500 % au plus)."),
    "choc": ({"validate": "decimal", "criteria": "between", "minimum": 0, "maximum": 0.95},
             "Saisissez la baisse du CFADS en pourcentage, par exemple 15% (95 % au plus)."),
    "ratio": ({"validate": "decimal", "criteria": "between", "minimum": 0, "maximum": 20},
              "Saisissez un ratio en nombre de fois, par exemple 1,35."),
    "mois": ({"validate": "decimal", "criteria": "between", "minimum": 0, "maximum": 60},
             "Saisissez un nombre de mois de service (0 à 60)."),
}


def validation(ws, plage, cle, liste=None, num=None, formule=None, erreur=None):
    """Liste déroulante, contrôle numérique ou formule, avec info-bulle et message d'erreur en français."""
    titre, message = AIDE[cle]
    if liste:
        opt = {"validate": "list", "source": liste, "error_title": "Valeur non admise",
               "error_message": "Choisissez une valeur dans la liste déroulante (flèche à droite de la cellule)."}
    elif num:
        regle, err = NUM[num]
        opt = dict(regle, error_title="Valeur non admise", error_message=err)
    elif formule:
        opt = {"validate": "custom", "value": formule, "error_title": "Format non admis", "error_message": erreur}
    else:
        opt = {"validate": "any"}
    opt.update(input_title=titre, input_message=message)
    ws.data_validation(plage, opt)


def ecrire_classeur():
    wb = xlsxwriter.Workbook(SORTIE)
    wb.set_properties({"title": "Outil de scoring Project Finance V8 — version 3", "subject": "Scoring PF — Maroc",
                       "comments": "Dossiers d'étude fictifs. Paramètres candidats non approuvés."})
    F = formats(wb)

    ws_acc = wb.add_worksheet("Accueil")
    ws_syn = wb.add_worksheet("Synthèse")
    ws_fic = wb.add_worksheet("Fiche comité")
    ws_cmp = wb.add_worksheet("Comparaison")
    ws_cas = {d["onglet"]: wb.add_worksheet(d["onglet"]) for d in cas_tous.CAS}
    ws_mod = wb.add_worksheet("Modèle")
    ws_ref = wb.add_worksheet("Référentiel des niveaux")
    ws_par = wb.add_worksheet("Paramètres")
    ws_con = wb.add_worksheet("Concordance")
    ws_ia = wb.add_worksheet("Champs IA")
    ws_rev = wb.add_worksheet("Revue IA")
    ws_dia = wb.add_worksheet("Diagnostic")
    ws_jou = wb.add_worksheet("Journal")

    noms_vba = {"Accueil": "wsAccueil", "Synthèse": "wsSynthese", "Fiche comité": "wsFiche", "Comparaison": "wsComparaison",
                "Modèle": "wsModele", "Référentiel des niveaux": "wsReferentiel", "Paramètres": "wsParam",
                "Concordance": "wsConcordance", "Champs IA": "wsChampsIA", "Revue IA": "wsRevueIA",
                "Diagnostic": "wsDiag", "Journal": "wsJournal"}
    for k in ws_cas:
        noms_vba[k] = "ws" + k
    if not SANS_VBA:
        wb.set_vba_name("ThisWorkbook")
        for ws in wb.worksheets():
            ws.set_vba_name(noms_vba[ws.name])

    parametres(wb, ws_par, F)
    referentiel(wb, ws_ref, F)
    for d in cas_tous.CAS:
        dossier(wb, ws_cas[d["onglet"]], F, d)
    dossier(wb, ws_mod, F, None)
    ws_mod.hide()
    synthese(ws_syn, F, [d["onglet"] for d in cas_tous.CAS])
    fiche(wb, ws_fic, F, "C3")
    comparaison(ws_cmp, F, "C4A", "C4B")
    concordance(ws_con, F)
    champs_ia(wb, ws_ia, F)
    revue_ia(ws_rev, F)
    accueil(ws_acc, F)
    diagnostic(ws_dia, F)
    journal(ws_jou, F)
    ws_acc.activate()

    if not SANS_VBA:
        mods = [{"name": "ThisWorkbook", "type": "document", "base": "workbook",
                 "code": code_module(modules_vba.THIS_WORKBOOK)}]
        for ws in wb.worksheets():
            mods.append({"name": noms_vba[ws.name], "type": "document", "base": "worksheet",
                         "code": "Option Explicit\r\n"})
        code = code_module()
        mods.append({"name": "modOutil", "type": "module", "code": code})
        code_ia = code_module(modules_vba.MOD_IA)
        mods.append({"name": "modIA", "type": "module", "code": code_ia})
        for nom, src in MODULES_TEST:
            mods.append({"name": nom, "type": "module", "code": code_module(src)})
        binp = os.path.join(ICI, "vbaProject.bin")
        with open(binp, "wb") as fh:
            fh.write(vbaproj.build_vba_project(mods))
        wb.add_vba_project(binp)
        for nom, src in (("modOutil", code), ("modIA", code_ia)):
            with open(os.path.join(ICI, nom + ".bas"), "w", encoding="cp1252", newline="\r\n") as fh:
                fh.write(f'Attribute VB_Name = "{nom}"\n' + src.replace("\r\n", "\n"))
        with open(os.path.join(ICI, "ThisWorkbook.cls.txt"), "w", encoding="cp1252", newline="\r\n") as fh:
            fh.write(code_module(modules_vba.THIS_WORKBOOK).replace("\r\n", "\n"))
    wb.close()
    exemple_propositions()
    return SORTIE


def code_module(source=None):
    """Source d'un module VBA, avec les adresses du dossier issues de la mise en page R."""
    remplacements = {
        "{GRID_START}": R["grid_first"], "{GRID_END}": R["grid_last"],
        "{CK_FIRST}": R["ck_first"], "{CK_LAST}": R["ck_first"] + len(CHECKLIST) - 1,
        "{P_FIRST}": R["p_first"], "{P_LAST}": R["p_last"], "{PERIOD}": R["period"], "{DUREE}": R["duree"],
        "{DMIN}": R["dmin"], "{NA}": R["na"], "{A_SAISIR}": R["a_saisir"], "{REGIME}": R["regime"],
        "{PHASE}": R["phase"], "{SECTEUR}": R["secteur"], "{C_FIRST}": R["c_first"], "{C_LAST}": R["c_last"],
        "{CODE_CLIENT}": R["code_client"], "{RADICAL}": R["radical"], "{CODE_PROJET}": R["code_projet"],
        "{SEC_FIRST}": R["sec_first"], "{SEC_LAST}": R["sec_last"], "{MAX_DOSSIERS}": MAX_DOSSIERS,
        "{FORMAT_IA}": FORMAT_IA, "{REV_FIRST}": REV_FIRST, "{NOTE}": R["note"],
    }
    code = modules_vba.MOD_OUTIL if source is None else source
    for k, v in remplacements.items():
        code = code.replace(k, str(v))
    assert "{" not in code.replace("{00020", ""), "adresse non remplacée dans le module VBA"
    code.encode("cp1252")
    return code


# ===================================================================== formats
def formats(wb):
    base = {"font_name": "Arial", "font_size": 10, "valign": "vcenter"}

    def f(**kw):
        d = dict(base)
        d.update(kw)
        return wb.add_format(d)

    vert = "#1F4E3D"
    # Cellules de saisie : déverrouillées (locked=False). Les feuilles sont protégées
    # sans mot de passe : seules les cellules jaunes acceptent une saisie, les formules
    # ne peuvent plus être écrasées par mégarde.
    SAISIE = dict(font_color="#0000FF", bg_color="#FFF2CC", locked=False)
    return {
        "titre": f(bold=True, font_size=16, font_color=vert),
        "titre_in": f(bold=True, font_size=16, **SAISIE),
        "sous": f(italic=True, font_color="#555555"),
        "sous_in": f(italic=True, **SAISIE),
        "wrap": f(text_wrap=True, valign="top"),
        "wrap_in": f(text_wrap=True, valign="top", **SAISIE),
        "section": f(bold=True, font_color="white", bg_color=vert, font_size=11),
        "hdr": f(bold=True, bg_color="#DDE8E3", border=1, text_wrap=True),
        "hdr_in": f(bold=True, border=1, text_wrap=True, **SAISIE),
        "lab": f(border=1),
        "lab_w": f(border=1, text_wrap=True),
        "labb": f(border=1, bold=True),
        "labb_w": f(border=1, bold=True, text_wrap=True),
        "txt": f(border=1, text_wrap=True),
        "in": f(border=1, **SAISIE),
        "in_txt": f(border=1, num_format="@", align="center", **SAISIE),
        "in_txtg": f(border=1, num_format="@", **SAISIE),
        "in_c": f(border=1, align="center", **SAISIE),
        "in_num": f(border=1, num_format="#,##0.0", **SAISIE),
        "in_gen": f(border=1, num_format="#,##0.##", align="left", **SAISIE),
        "in_2d": f(border=1, num_format="0.00", **SAISIE),
        "in_pct": f(border=1, num_format="0.0%", **SAISIE),
        "in_int": f(border=1, num_format="0", **SAISIE),
        "in_wrap": f(border=1, text_wrap=True, valign="top", **SAISIE),
        "in_choix": f(border=1, text_wrap=True, font_size=9, **SAISIE),
        "in_big": f(bold=True, font_size=12, border=2, align="center", **SAISIE),
        "lien": f(font_color="#0563C1", underline=1),
        "lien_b": f(font_color="#0563C1", underline=1, border=1, bold=True),
        "nav": f(font_color="#0563C1", underline=1, align="center", bg_color="#EEF3F1", border=1),
        "nav_lab": f(bold=True, bg_color="#EEF3F1", border=1),
        "date": f(border=1, num_format="dd/mm/yyyy", align="center"),
        "leg_saisie": f(border=1, align="center", **SAISIE),
        "leg_manq": f(border=1, align="center", font_color="#0000FF", bg_color="#F8CBAD"),
        "leg_calc": f(border=1, align="center"),
        "leg_vert": f(border=1, align="center", bg_color="#C6EFCE", font_color="#006100"),
        "leg_ambre": f(border=1, align="center", bg_color="#FFE699", font_color="#7F6000"),
        "leg_rouge": f(border=1, align="center", bg_color="#F8CBAD", font_color="#9C0006"),
        "cadre": f(border=1, valign="top", text_wrap=True, locked=False),
        "num": f(border=1, num_format="#,##0.0"),
        "num1": f(border=1, num_format="0.0"),
        "num2": f(border=1, num_format="0.00"),
        "num3": f(border=1, num_format="0.000"),
        "pct": f(border=1, num_format="0.0%"),
        "int": f(border=1, num_format="0", align="center"),
        "calc": f(border=1, align="center"),
        "calc_txt": f(border=1, text_wrap=True),
        "calc_top": f(border=1, text_wrap=True, valign="top"),
        "green": f(border=1, font_color="#008000"),
        "big": f(bold=True, font_size=20, align="center", border=2),
        "bigtxt": f(bold=True, font_size=12, border=1, text_wrap=True),
        "kpi_lab": f(bold=True, bg_color="#F2F2F2", border=1, text_wrap=True),
        "kpi": f(bold=True, border=1, align="center", num_format="0.0"),
        "kpi3": f(bold=True, border=1, align="center", num_format="0.000"),
        "kpi_int": f(bold=True, border=1, align="center", num_format="0"),
        "kpi_pct": f(bold=True, border=1, align="center", num_format="0%"),
        "kpi_txt": f(bold=True, border=1, text_wrap=True),
        "total": f(bold=True, border=1, num_format="#,##0.0", top=2),
        "param": f(border=1, **SAISIE),
        "param_pct": f(border=1, num_format="0%", **SAISIE),
        "param_2d": f(border=1, num_format="0.00", **SAISIE),
        "ref": f(border=1, text_wrap=True, valign="top", font_size=9),
        "ref_b": f(border=1, text_wrap=True, valign="top", bold=True, font_size=9),
        "note_src": f(italic=True, font_color="#7F7F7F", font_size=8, text_wrap=True),
        "hidden": f(font_color="#FFFFFF"),
        "rouge": wb.add_format({"bg_color": "#F8CBAD", "font_color": "#9C0006"}),
        "ambre": wb.add_format({"bg_color": "#FFE699", "font_color": "#7F6000"}),
        "vertc": wb.add_format({"bg_color": "#C6EFCE", "font_color": "#006100"}),
        "gris": wb.add_format({"font_color": "#A6A6A6"}),
        "gris_fond": wb.add_format({"font_color": "#A6A6A6", "bg_color": "#F2F2F2"}),
        # saisie obligatoire encore vide : orange, redevient jaune une fois remplie
        "manquant": wb.add_format({"bg_color": "#F8CBAD", "border": 1, "border_color": "#C55A11"}),
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
    ws.conditional_format(hi, 2, hi, 4, {"type": "formula", "criteria": f"=ROUND(C{hi + 1},4)<>1", "format": F["rouge"]})
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
    ws.conditional_format(hi, 2, hi, 2, {"type": "formula", "criteria": f"=ROUND(C{hi + 1},4)<>1", "format": F["rouge"]})
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
              ("L_Notes", [100, 80, 50, 20, REF.INFO]),
              ("L_Periodicite", ["Semestrielle", "Trimestrielle", "Mensuelle"]),
              ("L_Nature", NATURES),
              ("L_QualAch", QUAL_ACHETEUR),
              ("L_NatureCredit", NATURES_CREDIT),
              ("L_Devise", DEVISES),
              ("L_Avis", AVIS),
              ("L_Decision", DECISIONS)]
    for k, (n, vals) in enumerate(listes):
        rr = r + (k // 5) * 12
        col = k % 5
        ws.write(rr, col, n, F["hdr"])
        for i, v in enumerate(vals):
            ws.write(rr + 1 + i, col, v, F["lab"])
        lettre = "ABCDE"[col]
        nom(n, f"${lettre}${rr + 2}:${lettre}${rr + 1 + len(vals)}")
    ws.freeze_panes(3, 0)
    ws.protect("", {"format_columns": True, "format_rows": True})


# ===================================================================== Référentiel des niveaux
REF_FIRST = 8   # première ligne du tableau des situations


def _lignes_referentiel():
    """(clé de recherche, clé affichée, libellé, secteur, options) dans l'ordre de la feuille."""
    out = []
    for cle, (lib, _) in REF.NIVEAUX.items():
        out.append((cle, cle, lib, "Tous secteurs", REF.options(cle)))
        if cle in REF.SECTEURS_DESC:
            for code, slib, _ in SECTEURS:
                out.append((f"{cle}|{code}", cle, lib, code, REF.options(cle, code)))
    return out


LIGNES_REF = _lignes_referentiel()


def referentiel(wb, ws, F):
    ws.set_column("A:A", 7); ws.set_column("B:B", 26); ws.set_column("C:C", 10)
    ws.set_column("D:G", 36); ws.set_column("H:H", 14); ws.set_column("J:J", 14, None, {"hidden": True})
    ws.hide_gridlines(2)
    ws.write("A1", "Référentiel des niveaux", F["titre"])
    ws.write("A2", "Situations proposées dans les listes du dossier (grille D1 à D9 et indicateurs N4 à N6). La note "
                   "découle de la situation choisie : Très favorable 100, Favorable 80, Vigilance 50, Critique 20 "
                   "(valeurs de l'onglet Paramètres).", F["sous"])
    ws.write("A3", "Pour D2.1, D4.1, D4.3 et D5.2, la liste du dossier propose la description du secteur choisi au bloc 1 ; "
                   "les autres sous-critères gardent la description commune. « Info. insuffisante » est comptée à 20, "
                   "rend la note provisoire (B7, C15) et exige un commentaire, comme une situation Critique.", F["sous"])
    ws.write("A4", "Le bloc 4 des dossiers affiche les données propres au secteur : tableau en bas de cette page.", F["sous"])
    r0 = REF_FIRST
    for c, h in enumerate(["Clé", "Sous-critère ou indicateur", "Secteur", "Très favorable (100)", "Favorable (80)",
                           "Vigilance (50)", "Critique (20)", "Info. insuffisante"]):
        ws.write(r0 - 2, c, h, F["hdr"])
    ws.write(r0 - 2, 9, "Clé de recherche", F["hdr"])
    for i, (cle_r, cle, lib, sec, opts) in enumerate(LIGNES_REF):
        r = r0 - 1 + i
        fmt_b = F["ref_b"] if sec == "Tous secteurs" else F["ref"]
        ws.write(r, 0, cle, fmt_b)
        ws.write(r, 1, lib, fmt_b)
        ws.write(r, 2, sec, fmt_b)
        for j, o in enumerate(opts):
            ws.write_string(r, 3 + j, o, F["ref"])
        ws.write(r, 9, cle_r)
    last = r0 + len(LIGNES_REF) - 1
    wb.define_name("R_Cles", f"='Référentiel des niveaux'!$J${r0}:$J${last}")
    wb.define_name("R_Opts", f"='Référentiel des niveaux'!$D${r0}:$H${last}")
    wb.define_name("R_Opt1", f"='Référentiel des niveaux'!$D${r0}")
    # Données sectorielles du bloc 4 : libellés puis unités
    r = last + 2
    ws.merge_range(r, 0, r, 7, "Bloc 4 · Données sectorielles affichées dans le dossier selon le secteur (information, non calculées)",
                   F["section"])
    r += 1
    for c, h in enumerate(["Code", "Secteur", ""] + [f"Donnée {k + 1}" for k in range(NB_SEC)]):
        ws.write(r, c, h, F["hdr"])
    s0 = r + 1
    for i, (code, lib, _) in enumerate(SECTEURS):
        ws.write(s0 + i, 0, code, F["ref_b"]); ws.write(s0 + i, 1, lib, F["ref"]); ws.write_blank(s0 + i, 2, None, F["ref"])
        champs = REF.CHAMPS_SECTEUR[code]
        for k in range(NB_SEC):
            if k < len(champs):
                ws.write_string(s0 + i, 3 + k, f"{champs[k][0]} ({champs[k][1]})", F["ref"])
            else:
                ws.write_blank(s0 + i, 3 + k, None, F["ref"])
    s1 = s0 + len(SECTEURS) - 1
    # Tables de recherche (masquées dans les colonnes L à X)
    ws.set_column("L:X", 12, None, {"hidden": True})
    for i, (code, lib, _) in enumerate(SECTEURS):
        champs = REF.CHAMPS_SECTEUR[code]
        ws.write(s0 + i, 11, code)
        for k in range(NB_SEC):
            ws.write_string(s0 + i, 12 + k, champs[k][0] if k < len(champs) else "")
            ws.write_string(s0 + i, 12 + NB_SEC + k, champs[k][1] if k < len(champs) else "")
    c_lib1, c_libn = xl_col_to_name(12), xl_col_to_name(12 + NB_SEC - 1)
    c_un1, c_unn = xl_col_to_name(12 + NB_SEC), xl_col_to_name(12 + 2 * NB_SEC - 1)
    wb.define_name("R_SecCodes", f"='Référentiel des niveaux'!$L${s0 + 1}:$L${s1 + 1}")
    wb.define_name("R_SecChamps", f"='Référentiel des niveaux'!${c_lib1}${s0 + 1}:${c_libn}${s1 + 1}")
    wb.define_name("R_SecUnites", f"='Référentiel des niveaux'!${c_un1}${s0 + 1}:${c_unn}${s1 + 1}")
    ws.freeze_panes(r0 - 1, 3)
    ws.set_landscape(); ws.set_paper(9); ws.fit_to_pages(1, 0); ws.repeat_rows(r0 - 2)
    ws.protect("", {"format_columns": True, "format_rows": True})
    if not SANS_VBA:
        ws.insert_button("I1", {"macro": "AllerAccueil", "caption": "Accueil", "width": 100, "height": 28})


# ===================================================================== dossier
def deja_sectoriel(hyp, secteur, valeurs):
    """Vrai si une hypothèse libre du cas répète une donnée sectorielle du bloc 4 (même libellé ou même valeur)."""
    import re
    lib, texte = hyp[0].lower(), str(hyp[1])
    if any(lib.split()[0] == l.split()[0].lower() for l, _ in REF.CHAMPS_SECTEUR.get(secteur, [])):
        return True
    for v, (_l, unite) in zip(valeurs, REF.CHAMPS_SECTEUR.get(secteur, [])):
        if unite.startswith("%") and "%" not in texte:
            continue
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            jeton = (f"{v:,.0f}".replace(",", " ") if float(v).is_integer() else f"{v}".replace(".", ","))
            if re.search(rf"(?<![\d,]){re.escape(jeton)}(?![\d,])", texte):
                return True
    return False


def dossier(wb, ws, F, d):
    vierge = d is None
    ws.set_column("A:A", 46)
    ws.set_column("B:C", 11)
    ws.set_column("D:D", 12)
    ws.set_column("E:G", 15)
    ws.set_column("H:H", 34)
    ws.set_column("I:I", 3)
    ws.set_column("J:M", 10, None, {"hidden": True})
    ws.set_column("N:N", 24)
    ws.set_column("O:O", 3)
    ws.set_column("P:T", 10, None, {"hidden": True})
    ws.freeze_panes(12, 0)
    ws.set_landscape(); ws.fit_to_pages(1, 0); ws.set_paper(9)
    ws.repeat_rows(0, 10)
    ws.hide_gridlines(2)
    ws.write("J1", "MODELE" if vierge else "DOSSIER_V8", F["hidden"])
    ws.write("K1", "V3", F["hidden"])
    # Feuille protégée sans mot de passe : seules les cellules jaunes sont modifiables.
    ws.protect("", {"format_columns": True, "format_rows": True})

    d = d or {}
    pr = d.get("proport", {})
    pdn = d.get("plafonds_donnees", {})
    reconst = d.get("reconstitue", set())
    secteur = d.get("secteur")

    def val(v, fmt, row, col, comment=None):
        if v is None or v == "":
            ws.write_blank(row - 1, col, None, fmt)
        elif isinstance(v, (int, float)) and not isinstance(v, bool):
            ws.write_number(row - 1, col, v, fmt)
        else:
            ws.write_string(row - 1, col, str(v), fmt)
        if comment:
            ws.write_comment(row - 1, col, comment, {"x_scale": 2, "y_scale": 1.3})

    def fx(ref, formula, fmt):
        ws.write_formula(ref, formula, fmt)

    def section(row, titre):
        ws.merge_range(row - 1, 0, row - 1, 7, titre, F["section"])

    def fusion(row, c1, c2, fmt, v=None):
        ws.merge_range(row - 1, c1, row - 1, c2, "", fmt)
        if v is not None:
            val(v, fmt, row, c1)

    def oui_non(v):
        return "Oui" if v == "Oui" else "Non"

    # ---------------------------------------------------------------- en-tête
    ws.write("A1", f"{d['ref']} · {d['titre']}" if d else "Nouveau dossier — intitulé du projet", F["titre_in"])
    ws.write("A2", f"{d['spv']} — {d['lieu']}" if d else "SPV — localisation", F["sous_in"])
    ws.merge_range("A3:H3", d.get("resume", "Résumé du projet : objet, contrat de recettes, financement."), F["wrap_in"])
    ws.set_row(2, 42)
    validation(ws, "A1", "titre"); validation(ws, "A2", "spv"); validation(ws, "A3", "resume")

    # ---------------------------------------------------------------- ligne « À SAISIR »
    ck1, ckn = R["ck_first"], R["ck_first"] + len(CHECKLIST) - 1
    plage_ok = f"$R${ck1}:$R${ckn}"
    ra = R["a_saisir"]
    ws.write(f"A{ra}", "À SAISIR (cellules orange)", F["kpi_lab"])
    fx(f"B{ra}", f"=COUNTIF({plage_ok},0)", F["kpi_int"])
    ws.merge_range(f"C{ra}:F{ra}", "", F["kpi_txt"])
    fx(f"C{ra}", f'=IF(B{ra}=0,"Saisie complète : lisez la note ci-dessous, puis « Fiche comité ».",'
                 f'"Prochaine saisie : "&INDEX($P${ck1}:$P${ckn},MATCH(0,{plage_ok},0)))', F["kpi_txt"])
    ws.merge_range(f"G{ra}:H{ra}", "", F["lien_b"])
    fx(f"G{ra}", f'=IF(B{ra}=0,"",HYPERLINK("#"&INDEX($Q${ck1}:$Q${ckn},MATCH(0,{plage_ok},0)),"→ Aller à la cellule "'
                 f'&INDEX($Q${ck1}:$Q${ckn},MATCH(0,{plage_ok},0))))', F["lien_b"])
    ws.set_row(ra - 1, 22)
    ws.conditional_format(f"B{ra}", {"type": "formula", "criteria": f"=AND(ISNUMBER($B${ra}),$B${ra}=0)", "format": F["vertc"]})
    ws.conditional_format(f"B{ra}", {"type": "formula", "criteria": f"=AND(ISNUMBER($B${ra}),$B${ra}>0)", "format": F["manquant"]})

    # ---------------------------------------------------------------- navigation
    rn = R["nav"]
    ws.write(f"A{rn}", "Aller à la section :", F["nav_lab"])
    for col, (lib, cle) in zip("BCDEFGH", SECTION_NAV):
        fx(f"{col}{rn}", f'=HYPERLINK("#A{R[cle]}","{lib}")', F["nav"])

    # ---------------------------------------------------------------- tableau de bord
    ws.merge_range(R["tdb"] - 1, 0, R["tdb"] - 1, 7, "", F["section"])
    fx(f"A{R['tdb']}", f'="TABLEAU DE BORD — "&IF($B${R["code_projet"]}="","code projet à saisir",$B${R["code_projet"]})'
                       f'&"  ·  client "&IF($B${R["code_client"]}="","—",$B${R["code_client"]})'
                       f'&"  ·  radical "&IF($B${R["radical"]}="","—",$B${R["radical"]})', F["section"])
    ws.write("A6", "NOTE APPROUVÉE (1 à 10)", F["kpi_lab"])
    fx("B6", f"=B{R['na']}", F["big"])
    ws.write("C6", "Libellé", F["kpi_lab"])
    fx("D6", f'=IFERROR(INDEX(P_ConvLib,MATCH(B{R["na"]},P_ConvNote,0)),"")', F["kpi_txt"])
    ws.write("E6", "Statut", F["kpi_lab"])
    ws.merge_range("F6:H6", "", F["kpi_txt"])
    fx("F6", f"=B{R['statut']}", F["kpi_txt"])
    ws.set_row(5, 34)
    ws.write("A7", "Score global (sur 100)", F["kpi_lab"]); fx("B7", f"=B{R['global']}", F["kpi"])
    ws.write("C7", "Note calculée", F["kpi_lab"]); fx("D7", f"=B{R['note_calc']}", F["kpi_int"])
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
    ws.write("A11", "Complétude (noyau N1-N6 et grille)", F["kpi_lab"]); fx("B11", f"=B{R['compl_crit']}", F["kpi_pct"])
    ws.write("C11", "Noyau financier D7", F["kpi_lab"]); fx("D11", f"=D{R['d7']}", F["kpi"])
    ws.write("E11", "Orientation", F["kpi_lab"])
    ws.merge_range("F11:H11", "", F["kpi_txt"])
    fx("F11", f'=IFERROR(INDEX(P_ConvOrient,MATCH(B{R["na"]},P_ConvNote,0)),"")', F["kpi_txt"])
    # Couleurs de la note. Règles sur formule : en règle « valeur de cellule », Excel classe
    # un texte au-dessus de tout nombre — « — » (hors périmètre) ou une cellule vide
    # s'affichaient en vert.
    for rng in ("B6", "D7"):
        c = "$" + rng[0] + "$" + rng[1:]
        ws.conditional_format(rng, {"type": "formula", "criteria": f"=AND(ISNUMBER({c}),{c}>=8)", "format": F["vertc"]})
        ws.conditional_format(rng, {"type": "formula", "criteria": f"=AND(ISNUMBER({c}),{c}>=6,{c}<8)", "format": F["ambre"]})
        ws.conditional_format(rng, {"type": "formula", "criteria": f"=AND(ISNUMBER({c}),{c}<6)", "format": F["rouge"]})
    ws.conditional_format("B6", {"type": "formula", "criteria": '=$B$6="—"', "format": F["rouge"]})

    # boutons : une colonne à droite du tableau de bord, dans les lignes figées
    if not SANS_VBA:
        for i, (cap, mac) in enumerate([("Contrôler la saisie", "ControlerDossier"), ("Fiche comité", "OuvrirFiche"),
                                        ("Exporter en PDF", "ExporterPDF"), ("Préparer l'échéancier", "PreparerEcheancier"),
                                        ("Effacer l'échéancier", "EffacerEcheancier"), ("Dupliquer ce dossier", "DupliquerDossier"),
                                        ("Comparer avec…", "ComparerDossiers"), ("Importer propositions IA", "ImporterPropositionsIA"),
                                        ("Synthèse", "AllerSynthese"), ("Accueil", "AllerAccueil")]):
            ws.insert_button(0, 13, {"macro": mac, "caption": cap, "width": 165, "height": 24,
                                     "x_offset": 6, "y_offset": 3 + i * 28})

    # ---------------------------------------------------------------- 1 identification et routage
    section(R["s1"], "1 · IDENTIFICATION ET ROUTAGE — codes du client et du projet ; le routage pilote seuils et poids")
    for c, h in enumerate(["Axe", "Valeur"]):
        ws.write(R["s1_hdr"] - 1, c, h, F["hdr"])
    ws.merge_range(R["s1_hdr"] - 1, 2, R["s1_hdr"] - 1, 7, "Libellé, contrôle", F["hdr"])
    codes = [("code_client", "Code client T24 (société de projet)", ok_code_client,
              "Code client T24 : 20 caractères au plus.", "Texte, zéros de tête conservés."),
             ("radical", "Radical du client (7 chiffres)", ok_radical,
              "Le radical compte exactement 7 chiffres, zéros de tête compris (ex. 0041027).",
              "Exactement 7 chiffres, zéros de tête compris."),
             ("code_projet", "Code projet", ok_code_projet,
              "Format attendu : PF-AAAA-NNNN, par exemple PF-2026-0014.", "Format PF-AAAA-NNNN.")]
    for key, lab, ok, err, aide in codes:
        r = R[key]
        ws.write(r - 1, 0, lab, F["lab"])
        val(d.get(key), F["in_txt"], r, 1)
        validation(ws, f"B{r}", key, formule="=" + ok(f"B{r}"), erreur=err)
        ws.merge_range(r - 1, 2, r - 1, 7, "", F["calc_txt"])
        fx(f"C{r}", f'=IF(B{r}="","À saisir — {aide}",IF({ok(f"B{r}")},"Format conforme.","Format non conforme : {aide}"))',
           F["calc_txt"])
        ws.conditional_format(f"C{r}", {"type": "formula", "criteria": f'=AND($B${r}<>"",NOT({ok(f"$B${r}")}))', "format": F["rouge"]})
    for key, lab, liste, lib in [("regime", "C — Régime de revenus", "=P_Regimes", "P_RegLib|P_Regimes"),
                                 ("secteur", "D — Secteur du projet", "=P_SecCodes", "P_SecLib|P_SecCodes"),
                                 ("phase", "B — Phase", "=P_PhaseCodes", "P_PhaseLib|P_PhaseCodes")]:
        r = R[key]
        ws.write(r - 1, 0, lab, F["lab"])
        val(d.get(key), F["in_c"], r, 1)
        validation(ws, f"B{r}", key, liste=liste)
        l1, l2 = lib.split("|")
        ws.merge_range(r - 1, 2, r - 1, 7, "", F["calc_txt"])
        fx(f"C{r}", f'=IFERROR(INDEX({l1},MATCH(B{r},{l2},0)),"")', F["calc_txt"])
    ws.write(R["period"] - 1, 0, "Périodicité du service de la dette", F["lab"])
    val(d.get("periodicite", "Semestrielle") if d else "", F["in_c"], R["period"], 1)
    validation(ws, f"B{R['period']}", "period", liste="=L_Periodicite")
    ws.merge_range(R["period"] - 1, 2, R["period"] - 1, 7,
                   "Jamais annuelle : le DSCR se mesure échéance par échéance.", F["calc_txt"])
    ws.write(R["famille"] - 1, 0, "A — Famille de financement", F["lab"])
    val("PF-FLUX", F["in_c"], R["famille"], 1)
    validation(ws, f"B{R['famille']}", "famille")
    ws.merge_range(R["famille"] - 1, 2, R["famille"] - 1, 7,
                   "SPV dédiée, remboursement par les flux du projet (R5 vente d'actifs : hors outil).", F["calc_txt"])

    # ---------------------------------------------------------------- 2 proportionnalité
    section(R["s2"], "2 · RÉGIME DE PROPORTIONNALITÉ — calculé, jamais choisi")
    ws.write(R["capex"] - 1, 0, "CAPEX du projet économique complet (MMAD)", F["lab"])
    fx(f"B{R['capex']}", f"=B{R['se_tot']}", F["num"])
    ws.merge_range(R["capex"] - 1, 2, R["capex"] - 1, 7, "Repris du total des emplois (section 3).", F["calc_txt"])
    source = {"expo": pr.get("expo"), "mad": pr.get("mad"), "duree": pr.get("duree"), "techno": pr.get("tech_refs"),
              "epc18": pr.get("epc"), "unique": pr.get("acheteur_unique"), "premiere": pr.get("premiere_ref"),
              "consortium": pr.get("consortium"), "plus20": pr.get("contrat_20"), "climat": d.get("climat_eleve"),
              "nbcp": pr.get("nb_cp")}
    champs = [("expo", "Exposition de la banque (MMAD)", "in_num", None, "pos"),
              ("mad", "Recettes, coûts et dette intégralement en dirhams", "in_c", "=L_OuiNon", None),
              ("duree", "Durée du financement (ans)", "in_int", None, "duree"),
              ("techno", "Technologie : ≥ 3 références industrielles de plus de 3 ans", "in_c", "=L_OuiNon", None),
              ("epc18", "En P1 : EPC clé-en-main forfaitaire, prix et délai garantis, < 18 mois", "in_c", "=L_OuiNon", None),
              ("unique", "Acheteur principal unique et identifié", "in_c", "=L_OuiNon", None),
              ("premiere", "Technologie constituant une première référence dans la juridiction", "in_c", "=L_OuiNon", None),
              ("consortium", "Opération consortiale relevant de la directive 3/W/2025", "in_c", "=L_OuiNon", None),
              ("plus20", "Concession ou contrat de revenus de plus de 20 ans", "in_c", "=L_OuiNon", None),
              ("climat", "Site classé à risque climatique physique élevé", "in_c", "=L_OuiNon", None),
              ("nbcp", "Nombre de contreparties clés", "in_int", None, "nb")]
    for key, lab, fmt, liste, num in champs:
        r = R[key]
        ws.write(r - 1, 0, lab, F["lab_w"])
        v = source[key] if d else None
        comment = RECONST if (key in CHAMPS_RECONST and key in reconst and v not in (None, "")) else None
        val(v, F[fmt], r, 1, comment)
        validation(ws, f"B{r}", key, liste=liste, num=num)
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

    # ---------------------------------------------------------------- 3 sources et emplois, crédits
    section(R["s3"], "3 · SOURCES ET EMPLOIS (MMAD) — test de financement à terminaison ; crédits de la banque")
    for c, h in enumerate(["Emplois", "Montant", "", "Ressources", "Montant", "Nature"]):
        ws.write(R["se_hdr"] - 1, c, h, F["hdr"])
    ws.merge_range(R["se_hdr"] - 1, 5, R["se_hdr"] - 1, 6, "Nature", F["hdr"])
    emplois = d.get("emplois", [])
    ressources = d.get("ressources", [])
    for i in range(R["se_last"] - R["se_first"] + 1):
        r = R["se_first"] + i
        e = emplois[i] if i < len(emplois) else ("", None)
        s = ressources[i] if i < len(ressources) else ("", None, "")
        val(e[0], F["in"], r, 0); val(e[1], F["in_num"], r, 1)
        ws.write_blank(r - 1, 2, None)
        val(s[0], F["in"], r, 3); val(s[1], F["in_num"], r, 4)
        fusion(r, 5, 6, F["in"], s[2])
    f1, f2, t = R["se_first"], R["se_last"], R["se_tot"]
    validation(ws, f"A{f1}:A{f2}", "emp_lib")
    validation(ws, f"B{f1}:B{f2}", "emp_mt", num="pos")
    validation(ws, f"D{f1}:D{f2}", "res_lib")
    validation(ws, f"E{f1}:E{f2}", "res_mt", num="pos")
    validation(ws, f"F{f1}:F{f2}", "nature", liste="=L_Nature")
    # nature manquante en face d'un montant de ressource
    ws.conditional_format(f"F{f1}:G{f2}", {"type": "formula", "criteria": f"=AND(ISNUMBER($E{f1}),$F{f1}=\"\")", "format": F["manquant"]})
    ws.write(t - 1, 0, "Total emplois (besoin à terminaison)", F["labb"]); fx(f"B{t}", f"=SUM(B{f1}:B{f2})", F["total"])
    ws.write(t - 1, 3, "Total ressources engagées", F["labb"]); fx(f"E{t}", f"=SUM(E{f1}:E{f2})", F["total"])
    ws.write(R["couv"] - 1, 0, "Couverture du besoin à terminaison (ressources / emplois)", F["lab"])
    fx(f"B{R['couv']}", f'=IF(N(B{t})=0,"",E{t}/B{t})', F["pct"])
    ws.write(R["quote"] - 1, 0, "Quote-part de dette (dette / besoin à terminaison)", F["lab"])
    fx(f"B{R['quote']}", f'=IF(N(B{t})=0,"",(SUMIF(F{f1}:F{f2},"Dette senior",E{f1}:E{f2})+SUMIF(F{f1}:F{f2},"Dette subordonnée",E{f1}:E{f2}))/B{t})', F["pct"])
    ws.write(R["remed"] - 1, 0, "Plan de remédiation approuvé (couverture entre 95 % et 100 %)", F["lab_w"])
    val(d.get("plan_remediation"), F["in_c"], R["remed"], 1)
    validation(ws, f"B{R['remed']}", "remed", liste="=L_OuiNon")

    # crédits de la banque sur le projet
    ws.merge_range(R["cr_title"] - 1, 0, R["cr_title"] - 1, 7,
                   "Crédits de la banque sur le projet — un projet peut porter plusieurs dossiers de crédit", F["labb"])
    hc = R["cr_hdr"]
    ws.write(hc - 1, 0, "Numéro du dossier de crédit", F["hdr"])
    ws.merge_range(hc - 1, 1, hc - 1, 3, "Nature", F["hdr"])
    for c, h in ((4, "Montant (MMAD)"), (5, "Devise"), (6, "Durée (ans)"), (7, "Observation")):
        ws.write(hc - 1, c, h, F["hdr"])
    credits = d.get("credits", [])
    for i in range(NB_CREDITS):
        r = R["cr_first"] + i
        cr = credits[i] if i < len(credits) else (None, None, None, None, None)
        val(cr[0], F["in_txtg"], r, 0)
        fusion(r, 1, 3, F["in"], cr[1])
        val(cr[2], F["in_num"], r, 4)
        val(cr[3], F["in_c"], r, 5)
        val(cr[4], F["in_num"], r, 6)
        val(None, F["in_wrap"], r, 7)
    c1, cn = R["cr_first"], R["cr_last"]
    validation(ws, f"A{c1}:A{cn}", "cr_num")
    validation(ws, f"B{c1}:B{cn}", "cr_nature", liste="=L_NatureCredit")
    validation(ws, f"E{c1}:E{cn}", "cr_mt", num="pos")
    validation(ws, f"F{c1}:F{cn}", "cr_devise", liste="=L_Devise")
    validation(ws, f"G{c1}:G{cn}", "cr_duree", num="duree")
    validation(ws, f"H{c1}:H{cn}", "cr_obs")
    rt = R["cr_tot"]
    ws.merge_range(rt - 1, 0, rt - 1, 3, "Total des crédits de la banque (MMAD, contre-valeur)", F["labb"])
    fx(f"E{rt}", f"=SUM(E{c1}:E{cn})", F["total"])
    ws.merge_range(rt - 1, 5, rt - 1, 6, "Écart avec l'exposition (bloc 2)", F["lab"])
    fx(f"H{rt}", f'=IF(OR(N(E{rt})=0,NOT(ISNUMBER($B${R["expo"]}))),"",E{rt}-$B${R["expo"]})', F["num"])
    ws.conditional_format(f"H{rt}", {"type": "formula", "criteria": f'=AND(ISNUMBER($H${rt}),ABS($H${rt})>0.5)', "format": F["ambre"]})
    ws.write_comment(rt - 1, 7, "Information : la somme des crédits devrait correspondre à l'exposition de la banque "
                                "saisie au bloc 2. Un écart est signalé en ambre ; il ne change pas la note.", {"x_scale": 2})

    # ---------------------------------------------------------------- 4 données sectorielles et hypothèses
    section(R["s4"], "4 · DONNÉES SECTORIELLES ET HYPOTHÈSES D'EXPLOITATION (information, non calculées)")
    hs = R["sec_hdr"]
    sect = f"$B${R['secteur']}"
    fx(f"A{hs}", f'="Données du secteur "&IF({sect}="","(choisissez le secteur au bloc 1)",{sect})', F["hdr"])
    ws.write(hs - 1, 1, "Valeur", F["hdr"])
    ws.write(hs - 1, 2, "Unité", F["hdr"])
    ws.merge_range(hs - 1, 3, hs - 1, 7, "Observation ou source", F["hdr"])
    sv = d.get("secteur_vals", [])
    for k in range(NB_SEC):
        r = R["sec_first"] + k
        idx = f"MATCH({sect},R_SecCodes,0)"
        lib = f"T(INDEX(R_SecChamps,{idx},{k + 1}))"
        fx(f"A{r}", f'=IF({sect}="",IF({k}=0,"Choisissez d\'abord le secteur (bloc 1)",""),IFERROR(IF({lib}="","Sans objet pour ce secteur",{lib}),""))',
           F["lab"])
        val(sv[k] if k < len(sv) else None, F["in_gen"], r, 1)
        fx(f"C{r}", f'=IFERROR(T(INDEX(R_SecUnites,{idx},{k + 1})),"")', F["calc"])
        fusion(r, 3, 7, F["in_wrap"])
        ws.conditional_format(f"A{r}:H{r}", {"type": "formula", "criteria": f'=$A${r}="Sans objet pour ce secteur"',
                                             "format": F["gris_fond"]})
    validation(ws, f"B{R['sec_first']}:B{R['sec_last']}", "sec_val")
    validation(ws, f"D{R['sec_first']}:D{R['sec_last']}", "sec_obs")
    hh = R["hyp_hdr"]
    ws.write(hh - 1, 0, "Autres hypothèses d'exploitation", F["hdr"])
    ws.merge_range(hh - 1, 1, hh - 1, 7, "Valeur", F["hdr"])
    hyps = [h for h in d.get("exploit", []) if not deja_sectoriel(h, secteur, d.get("secteur_vals", []))][:NB_HYP]
    for i in range(NB_HYP):
        r = R["hyp_first"] + i
        h = hyps[i] if i < len(hyps) else ("", "")
        val(h[0], F["in"], r, 0)
        fusion(r, 1, 7, F["in"], h[1])
    validation(ws, f"A{R['hyp_first']}:B{R['hyp_last']}", "hyp")

    # ---------------------------------------------------------------- 5 seuils
    section(R["s5"], "5 · SEUILS DSCR APPLICABLES = base du régime + Δ secteur + majoration de phase")
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
    section(R["s6"], "6 · ÉCHÉANCIER DATÉ ET DSCR PAR ÉCHÉANCE (jusqu'à 60 périodes)")
    ws.write(R["choc"] - 1, 0, "Scénario défavorable : baisse du CFADS appliquée à chaque période", F["lab_w"])
    val(d.get("choc"), F["in_pct"], R["choc"], 1, d.get("choc_commentaire"))
    ws.merge_range(R["choc"] - 1, 2, R["choc"] - 1, 7, "", F["in_wrap"])
    val(d.get("stress_lib") or "Description du scénario défavorable", F["in_wrap"], R["choc"], 2)
    validation(ws, f"B{R['choc']}", "choc", num="choc")
    validation(ws, f"C{R['choc']}", "choc_lib")
    for c, h in enumerate(["Période", "CFADS central", "Service de la dette", "DSCR", "Classement",
                           "CFADS stressé (saisie facultative)", "DSCR stressé", "DSCR annuel (paire de semestres)"]):
        ws.write(R["ech_hdr"] - 1, c, h, F["hdr"])
    ws.set_row(R["ech_hdr"] - 1, 30)
    per = d.get("periodes", [])
    for i in range(R["p_last"] - R["p_first"] + 1):
        r = R["p_first"] + i
        p = per[i] if i < len(per) else None
        val(p[0] if p else "", F["in"], r, 0)
        val(p[1] if p else None, F["in_num"], r, 1)
        val(p[2] if p else None, F["in_2d"], r, 2)
        fx(f"D{r}", f'=IF(OR(B{r}="",C{r}=""),"",IF(C{r}=0,"",B{r}/C{r}))', F["num3"])
        fx(f"E{r}", f'=IF(B{r}="","",IF(C{r}=0,"Différé",IF(B{r}<0,"Critique",{classe(f"D{r}")})))', F["calc"])
        val(p[3] if (p and len(p) > 3) else None, F["in_num"], r, 5)
        fx(f"G{r}", f'=IF(OR(B{r}="",C{r}="",C{r}=0),"",IF(F{r}<>"",F{r},B{r}*(1-$B${R["choc"]}))/C{r})', F["num3"])
        if i % 2 == 1:
            fx(f"H{r}", f'=IF(AND($B${R["period"]}="Semestrielle",B{r}<>"",B{r-1}<>"",N(C{r})+N(C{r-1})>0),(B{r}+B{r-1})/(C{r}+C{r-1}),"")', F["num3"])
        else:
            ws.write_blank(r - 1, 7, None, F["num3"])
    pf, pl = R["p_first"], R["p_last"]
    validation(ws, f"A{pf}:A{pl}", "p_lib")
    validation(ws, f"B{pf}:B{pl}", "p_cfads", num="reel")
    validation(ws, f"C{pf}:C{pl}", "p_service", num="pos")
    validation(ws, f"F{pf}:F{pl}", "p_stress", num="reel")
    # service de la dette manquant en face d'un CFADS
    ws.conditional_format(f"C{pf}:C{pl}", {"type": "formula", "criteria": f"=AND(ISNUMBER($B{pf}),NOT(ISNUMBER($C{pf})))", "format": F["manquant"]})
    # tant que moins de deux périodes sont saisies, les deux premières lignes sont à remplir
    ws.conditional_format(f"B{pf}:C{pf + 1}", {"type": "formula", "criteria": f"=AND(COUNT($B${pf}:$B${pl})<2,B{pf}=\"\")", "format": F["manquant"]})
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
    ws.write(R["dann"] - 1, 0, "DSCR annuel minimum, semestres agrégés (indicatif)", F["lab"])
    fx(f"D{R['dann']}", f'=IF(COUNT(H{pf}:H{pl})=0,"",MIN(H{pf}:H{pl}))', F["num3"])
    ws.write(R["nbper"] - 1, 0, "Nombre de périodes renseignées", F["lab"])
    fx(f"D{R['nbper']}", f"=COUNT(B{pf}:B{pl})", F["int"])
    for rr in (R["dmin"], R["dstress"]):
        ws.conditional_format(f"E{rr}", {"type": "cell", "criteria": "==", "value": '"Critique"', "format": F["rouge"]})
        ws.conditional_format(f"E{rr}", {"type": "cell", "criteria": "==", "value": '"Vigilance"', "format": F["ambre"]})

    # Situation choisie dans une liste (grille et N4 à N6) : M = ligne du référentiel,
    # S = rang de la situation (1 Très favorable … 4 Critique, 5 Info. insuffisante), B = note.
    def choix_formules(r, cle, avec_secteur):
        ws.write(r - 1, 11, cle, F["hidden"])
        if avec_secteur:
            fx(f"M{r}", f'=IFERROR(MATCH($L{r}&"|"&$B${R["secteur"]},R_Cles,0),MATCH($L{r},R_Cles,0))', F["hidden"])
        else:
            fx(f"M{r}", f"=MATCH($L{r},R_Cles,0)", F["hidden"])
        fx(f"S{r}", f'=IF($E{r}="","",IFERROR(MATCH($E{r},INDEX(R_Opts,$M{r},0),0),""))', F["hidden"])
        fx(f"B{r}", f'=IF($S{r}="","",CHOOSE($S{r},P_Ancre_TF,P_Ancre_F,P_Ancre_V,P_Ancre_C,"{REF.INFO}"))', F["calc"])
        ws.data_validation(f"E{r}", {"validate": "list", "source": f"=OFFSET(R_Opt1,$M{r}-1,0,1,5)",
                                     "input_title": AIDE["grille"][0] if cle[0] == "D" else AIDE["choix_n"][0],
                                     "input_message": AIDE["grille"][1] if cle[0] == "D" else AIDE["choix_n"][1],
                                     "error_title": "Situation non admise",
                                     "error_message": "Choisissez une situation dans la liste (flèche à droite de la cellule)."})

    # ---------------------------------------------------------------- 7 noyau
    section(R["s7"], "7 · NOYAU FINANCIER (D7) — N1 à N3 calculés, N4 à N6 choisis dans une liste de situations")
    for c, h in enumerate(["Indicateur", "Note", "Poids", "Contribution"]):
        ws.write(R["noy_hdr"] - 1, c, h, F["hdr"])
    ws.merge_range(R["noy_hdr"] - 1, 4, R["noy_hdr"] - 1, 6, "Situation (N4 à N6) ou mesure calculée (N1 à N3)", F["hdr"])
    ws.write(R["noy_hdr"] - 1, 7, "Justification (exigée si Critique ou Info.)", F["hdr"])
    ws.set_row(R["noy_hdr"] - 1, 30)
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
    n_lib = d.get("n_lib", {})
    for i, (codeN, lib, _) in enumerate(NOYAU):
        r = n + i
        ws.write(r - 1, 0, f"{codeN} — {lib}", F["lab_w"])
        if i in formules_n:
            fx(f"B{r}", formules_n[i], F["calc"])
            ws.merge_range(r - 1, 4, r - 1, 7, "", F["calc_txt"])
            fx(f"E{r}", mesures[i], F["calc_txt"])
        else:
            fusion(r, 4, 6, F["in_choix"], REF.choix(codeN, None, d.get(f"n{i + 1}")) if d else None)
            choix_formules(r, codeN, False)
            val(n_lib.get(codeN, ""), F["in_wrap"], r, 7)
            validation(ws, f"H{r}", "n_lib")
            fx(f"T{r}", f'=IF(AND(N($S{r})>=4,$H{r}=""),ROW(),"")', F["hidden"])
            ws.conditional_format(f"E{r}:G{r}", {"type": "formula", "criteria": f'=$B${r}=""', "format": F["manquant"]})
            ws.conditional_format(f"H{r}", {"type": "formula", "criteria": f'=$T${r}<>""', "format": F["manquant"]})
            ws.set_row(r - 1, 30)
        fx(f"C{r}", f"=INDEX(P_PoidsN,{i + 1})", F["pct"])
        # Indicateur non noté ou « Info. insuffisante » : compté à la valeur conservatrice
        # (comme dans la grille), et la complétude du noyau rend la note provisoire.
        fx(f"D{r}", f'=IF(ISNUMBER(B{r}),B{r},P_InfoInsuff)*C{r}', F["num1"])
    ws.write(R["d7"] - 1, 0, "D7 — SCORE DU NOYAU FINANCIER", F["labb"])
    fx(f"D{R['d7']}", f"=SUM(D{n}:D{n + 5})", F["kpi"])

    ws.merge_range(R["donnees_hdr"] - 1, 0, R["donnees_hdr"] - 1, 7,
                   "Données du noyau et des plafonds (alimentent N3 hors P1 et les plafonds C4 à C14)", F["hdr"])
    donnees = [
        ("n3_saisi", "N3 hors phase P1 : note fondée sur le LLCR (100, 80, 50, 20)", "in_c", "=L_Notes", None,
         None if d.get("phase") == "P1" else d.get("n3_llcr")),
        ("llcr", "LLCR (x) — plafond C4", "in_2d", None, "ratio", pdn.get("llcr")),
        ("dsra", "DSRA en mois de service de dette — plafond C7", "in_num", None, "mois", pdn.get("dsra")),
        ("fx", "Exposition nette en devises non couverte, en % du service annuel — C6", "in_pct", None, "pct5", pdn.get("fx")),
        ("refi", "Dette à refinancer à maturité, en % du nominal — C8", "in_pct", None, "pct", pdn.get("refi")),
        ("strat", "Stratégie de refinancement approuvée", "in_c", "=L_OuiNon", None, oui_non(pdn.get("strategie_refi")) if d else None),
        ("part_ach", "Part des recettes portée par l'acheteur principal — C10", "in_pct", None, "pct", pdn.get("part_acheteur")),
        ("qual", "Qualité de crédit interne de l'acheteur principal", "in_c", "=L_QualAch", None, pdn.get("qualite_acheteur")),
        ("duree_contrat", "Durée résiduelle du contrat de revenus (ans) — C5", "in_num", None, "duree", pdn.get("duree_contrat")),
        ("duree_dette", "Durée résiduelle de la dette (ans)", "in_num", None, "duree", pdn.get("duree_dette")),
        ("solution", "Solution documentée si le contrat expire avant la dette", "in_c", "=L_OuiNon", None,
         oui_non(pdn.get("solution_contrat")) if d else None),
        ("plan_adapt", "Plan d'adaptation climatique financé — C11", "in_c", "=L_OuiNon", None, oui_non(pdn.get("plan_climat")) if d else None),
        ("sponsor", "Capacité résiduelle du sponsor suffisante pour l'appel d'equity restant — C12", "in_c", "=L_OuiNon", None,
         pdn.get("capacite_sponsor")),
        ("operateur", "Opérateur remplaçable — C13", "in_c", "=L_OuiNon", None, pdn.get("operateur_remplacable")),
        ("ecart_om", "Écart entre la fin du contrat O&M et la fin de la dette (ans)", "in_num", None, "ecart", pdn.get("ecart_om")),
        ("facteur", "Exposition du groupe sur un facteur commun au-delà de la limite interne — C14", "in_c", "=L_OuiNon", None,
         pdn.get("expo_groupe")),
    ]
    for key, lab, fmt, liste, num, v in donnees:
        r = R[key]
        ws.write(r - 1, 0, lab, F["lab_w"])
        comment = RECONST if (key in CHAMPS_RECONST and key in reconst and v not in (None, "")) else None
        val(v, F[fmt], r, 1, comment)
        validation(ws, f"B{r}", key, liste=liste, num=num)

    # ---------------------------------------------------------------- 8 grille
    section(R["s8"], "8 · GRILLE QUALITATIVE — choisissez la situation ; la note (100, 80, 50, 20) s'en déduit")
    for c, h in enumerate(["Domaine et sous-critère", "Note", "Poids", "Score domaine"]):
        ws.write(R["grid_hdr"] - 1, c, h, F["hdr"])
    ws.merge_range(R["grid_hdr"] - 1, 4, R["grid_hdr"] - 1, 6, "Situation retenue (liste du référentiel des niveaux)", F["hdr"])
    ws.write(R["grid_hdr"] - 1, 7, "Commentaire (exigé si Critique ou Info.)", F["hdr"])
    ws.set_row(R["grid_hdr"] - 1, 30)
    grille = d.get("grille", {})
    comm = d.get("commentaires", {})
    sc_comm = d.get("sc_comm", {})
    idx_dom = {c: i for i, (c, _, _) in enumerate(DOMAINES)}
    for dm_, h, s1, s2 in GRILLE:
        lib = dict((c, l) for c, l, _ in DOMAINES)[dm_]
        ws.write(h - 1, 0, f"{dm_} — {lib}", F["labb"])
        ws.write_blank(h - 1, 1, None, F["lab"])
        fx(f"C{h}", f'=IFERROR(INDEX(P_PoidsDom,{idx_dom[dm_] + 1},MATCH($B${R["phase"]},P_PoidsHdr,0)),"")', F["pct"])
        fx(f"D{h}", f'=IF(N(C{h})=0,"",SUMPRODUCT(B{s1}:B{s2},C{s1}:C{s2})+P_InfoInsuff*SUMPRODUCT((1-ISNUMBER(B{s1}:B{s2}))*C{s1}:C{s2}))', F["kpi"])
        fusion(h, 4, 7, F["in_wrap"], comm.get(dm_, ""))
        validation(ws, f"E{h}", "comm")
        if comm.get(dm_):
            ws.set_row(h - 1, 45)
        ws.write(h - 1, 9, "DOM", F["hidden"])
        fx(f"K{h}", f"=IF(N(C{h})>0,1,0)", F["hidden"])
        fx(f"M{h}", f"=N(C{h})*SUMPRODUCT(ISNUMBER(B{s1}:B{s2})*C{s1}:C{s2})", F["hidden"])
        notes = grille.get(dm_, [])
        for j, (sl, _) in enumerate(SOUS_CRITERES[dm_]):
            r = s1 + j
            cle = f"{dm_}.{j + 1}"
            ws.write(r - 1, 0, "      " + sl, F["lab_w"])
            note = notes[j] if j < len(notes) else None
            fusion(r, 4, 6, F["in_choix"], REF.choix(cle, secteur, note) if d else None)
            choix_formules(r, cle, cle in REF.SECTEURS_DESC)
            fx(f"C{r}", f'=INDEX(P_SCPoids,MATCH(L{r},P_SCCle,0))', F["pct"])
            ws.write_blank(r - 1, 3, None, F["lab"])
            val(sc_comm.get(cle, ""), F["in_wrap"], r, 7)
            validation(ws, f"H{r}", "sc_comm")
            ws.write(r - 1, 9, "SC", F["hidden"])
            fx(f"K{r}", f"=K{h}", F["hidden"])
            # P : ligne d'un sous-critère requis encore sans situation (lien « Aller à ») ;
            # T : ligne d'un commentaire exigé encore vide.
            fx(f"P{r}", f'=IF(AND(K{r}=1,B{r}=""),ROW(),"")', F["hidden"])
            fx(f"T{r}", f'=IF(AND(K{r}=1,N($S{r})>=4,$H{r}=""),ROW(),"")', F["hidden"])
            ws.set_row(r - 1, 30)
            ws.conditional_format(f"A{r}:H{r}", {"type": "formula", "criteria": f"=$K${r}=0", "format": F["gris"]})
            ws.conditional_format(f"E{r}:G{r}", {"type": "formula", "criteria": f'=AND($K${r}=1,$B${r}="")', "format": F["manquant"]})
            ws.conditional_format(f"H{r}", {"type": "formula", "criteria": f'=$T${r}<>""', "format": F["manquant"]})
            ws.conditional_format(f"B{r}", {"type": "formula", "criteria": f"=AND($K${r}=1,N($S${r})>=4)", "format": F["rouge"]})
    g1, g2 = R["grid_first"], R["grid_last"]
    ws.write(R["couv_pond"] - 1, 0, "Couverture pondérée de la grille (minimum 95 % pour une note validée)", F["lab_w"])
    fx(f"B{R['couv_pond']}", f'=IF(SUMIF(J{g1}:J{g2},"DOM",C{g1}:C{g2})=0,"",SUM(M{g1}:M{g2})/SUMIF(J{g1}:J{g2},"DOM",C{g1}:C{g2}))', F["pct"])
    ws.write(R["compl_crit"] - 1, 0, "Complétude des critères requis : N1 à N6 et sous-critères de la phase (100 % exigé)", F["lab_w"])
    n1, n6 = R["n1"], R["n6"]
    fx(f"B{R['compl_crit']}", f'=IF(SUMIF(J{g1}:J{g2},"SC",K{g1}:K{g2})=0,"",(COUNT(B{n1}:B{n6})+SUMPRODUCT((J{g1}:J{g2}="SC")*(K{g1}:K{g2}=1)*ISNUMBER(B{g1}:B{g2})))/(6+SUMIF(J{g1}:J{g2},"SC",K{g1}:K{g2})))', F["pct"])

    # ---------------------------------------------------------------- 9 agrégation
    section(R["agr_title"], "9 · AGRÉGATION ET NOTE CALCULÉE")
    for c, h in enumerate(["Domaine", "Score", "Poids de la phase", "Contribution"]):
        ws.write(R["agr_hdr"] - 1, c, h, F["hdr"])
    hdr_row = {dd: h for dd, h, _, _ in GRILLE}
    for i, (dd, lib, _) in enumerate(DOMAINES):
        r = R["agr_first"] + i
        ws.write(r - 1, 0, f"{dd} — {lib}", F["lab"])
        src = f"D{R['d7']}" if dd == "D7" else f"D{hdr_row[dd]}"
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
    ws.merge_range(R["ver_hdr"] - 1, 0, R["ver_hdr"] - 1, 3, "Code et fait générateur", F["hdr"])
    for c, h in ((4, "Saisie"), (5, "Actif"), (6, "Stade bloqué"), (7, "Détection automatique")):
        ws.write(R["ver_hdr"] - 1, c, h, F["hdr"])
    auto = {"B3": f'IF(AND($B${R["phase"]}="P1",ISNUMBER($B${R["couv"]}),$B${R["couv"]}<P_N3_V),"Oui","")',
            "B7": f'IF(AND(ISNUMBER($B${R["compl_crit"]}),$B${R["compl_crit"]}<1),"Oui","")'}
    verrous = d.get("verrous", {})
    for i, item in enumerate(EXCLUSIONS + BLOCAGES):
        r = R["x_first"] + i
        c = item[0]
        ws.merge_range(r - 1, 0, r - 1, 3, f"{c} · {item[1]}", F["txt"])
        ws.set_row(r - 1, 27)
        if not d:
            saisie = ""
        elif c == "B6":
            saisie = "Non" if verrous.get("B6") == "Oui" else "Oui"
        else:
            saisie = "Oui" if verrous.get(c) == "Oui" else "Non"
        val(saisie, F["in_c"], r, 4,
            ("Les cas d'étude ne présentent qu'un échéancier représentatif (4 à 12 périodes). En production, "
             "l'échéancier complet est exigé ; à défaut, saisir « Non » : le blocage B6 s'applique.") if (d and c == "B6") else None)
        validation(ws, f"E{r}", "verrouB6" if c == "B6" else "verrou", liste="=L_OuiNon")
        ws.conditional_format(f"E{r}", {"type": "formula", "criteria": f'=$E${r}=""', "format": F["manquant"]})
        ws.write(r - 1, 6, item[2] if c.startswith("B") else "Aucune note", F["lab"])
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
    # B6 : la saisie porte sur la présence du modèle (Oui = présent)
    rb6 = R["x_first"] + B6_INDEX
    ws.write_comment(rb6 - 1, 0, "Pour B6, la saisie répond à la question « modèle de flux complet et rapproché ? » : "
                                 "« Non » déclenche le blocage.", {"x_scale": 2})

    # ---------------------------------------------------------------- 11 plafonds
    section(R["pl_title"], "11 · PLAFONDS DE NOTE C1 À C15 — déclenchés par les données, jamais saisis")
    for c, h in enumerate(["Code et fait générateur", "Donnée observée", "Seuil", "", "Actif", "Plafond", "Plafond effectif"]):
        if h:
            ws.write(R["pl_hdr"] - 1, c, h, F["hdr"])
    ws.merge_range(R["pl_hdr"] - 1, 2, R["pl_hdr"] - 1, 3, "Seuil", F["hdr"])
    B = lambda k: f"$B${R[k]}"
    Dm, Ds = f"$D${R['dmin']}", f"$D${R['dstress']}"
    obs = {
        "C1": (f"={Dm}", "=P_C1", f'=IF({Dm}="","n.r.",IF({Dm}<P_C1,"Oui","Non"))'),
        "C2": (f"={Dm}", f"=$B${rs}", f'=IF(OR({Dm}="",$B${rs}=""),"n.r.",IF({Dm}<$B${rs},"Oui","Non"))'),
        "C3": (f"={Ds}", "=P_C3", f'=IF({Ds}="","n.r.",IF({Ds}<P_C3,"Oui","Non"))'),
        "C4": (f'={B("llcr")}', "=P_C4", f'=IF({B("llcr")}="","n.r.",IF({B("llcr")}<P_C4,"Oui","Non"))'),
        "C5": (f'=IF({B("duree_contrat")}="","",{B("duree_contrat")}&" ans / dette "&{B("duree_dette")}&" ans")', '="contrat < dette"',
               # sans contrat de revenus (régime R4, exposition au marché) le plafond est sans objet
               f'=IF($B${R["regime"]}="R4","n.a.",IF(OR({B("duree_contrat")}="",{B("duree_dette")}=""),"n.r.",IF(AND({B("duree_contrat")}<{B("duree_dette")},{B("solution")}<>"Oui"),"Oui","Non")))'),
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
        ws.write(r - 1, 0, f"{c} · {fait}", F["txt"])
        ws.set_row(r - 1, 27)
        fx(f"B{r}", o, F[fmt_obs.get(c, "calc_txt")])
        ws.merge_range(r - 1, 2, r - 1, 3, "", F[fmt_obs.get(c, "calc_txt")] if c != "C2" else F["num2"])
        fx(f"C{r}", s, F[fmt_obs.get(c, "calc_txt")] if c != "C2" else F["num2"])
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

    # ---------------------------------------------------------------- 13 commentaires et conditions
    section(R["b13_title"], "13 · COMMENTAIRES ET CONDITIONS — alimente la fiche comité")
    b13 = d.get("bloc13", {})
    textes = [("synthese", "Synthèse de l'analyste (obligatoire)", 75), ("forces", "Forces", 45),
              ("faiblesses", "Faiblesses et mitigants", 45), ("conditions", "Conditions proposées", 60)]
    for key, lab, haut in textes:
        r = R[key]
        ws.write(r - 1, 0, lab, F["kpi_lab"])
        fusion(r, 1, 7, F["in_wrap"], b13.get(key, ""))
        validation(ws, f"B{r}", key)
        ws.set_row(r - 1, haut)
    rj = R["justif"]
    fx(f"A{rj}", f'=IF({flag_justif()},"Justification des écarts — OBLIGATOIRE : plafond, verrou ou info. insuffisante actif",'
                 f'"Justification des écarts (aucun plafond, verrou ni info. insuffisante actif)")', F["kpi_lab"])
    fusion(rj, 1, 7, F["in_wrap"], b13.get("justification", ""))
    validation(ws, f"B{rj}", "justif")
    ws.set_row(rj - 1, 60)
    for key, lab, liste, v, vt in (("avis", "Avis risques", "=L_Avis", b13.get("avis"), b13.get("avis_txt")),
                                   ("decision", "Décision du comité", "=L_Decision", b13.get("decision"), b13.get("decision_txt"))):
        r = R[key]
        ws.write(r - 1, 0, lab, F["kpi_lab"])
        fusion(r, 1, 2, F["in_c"], v)
        validation(ws, f"B{r}", key, liste=liste)
        fusion(r, 3, 7, F["in_wrap"], vt)
        validation(ws, f"D{r}", key + "_txt")
        ws.set_row(r - 1, 30)
    ws.print_area(0, 0, R["fin"] - 1, 7)

    # ---------------------------------------------------------------- check-list (colonnes P:R masquées)
    for i, (lib, adr, ok, cf) in enumerate(CHECKLIST):
        r = R["ck_first"] + i
        ws.write(r - 1, CK_COL_LIB, lib, F["hidden"])
        if adr.startswith("="):
            fx(f"Q{r}", adr, F["hidden"])
        else:
            ws.write(r - 1, CK_COL_ADR, adr, F["hidden"])
        fx(f"R{r}", f"=IF({ok},1,0)", F["hidden"])
        if cf:
            ws.conditional_format(cf, {"type": "formula", "criteria": f"=NOT({ok})", "format": F["manquant"]})


# ===================================================================== Synthèse
LIGNES_SYN = [("Intitulé du dossier", "A1", "calc_txt"),
              ("Code client T24", f"B{R['code_client']}", "calc"), ("Radical", f"B{R['radical']}", "calc"),
              ("Code projet", f"B{R['code_projet']}", "calc"),
              ("Régime de revenus", f"B{R['regime']}", "calc"),
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
              ("Verrous actifs", "B9", "calc_txt"),
              ("Plafond le plus contraignant", f"B{R['plafond']}", "int"),
              ("NOTE APPROUVÉE", f"B{R['na']}", "int"),
              ("Statut", f"B{R['statut']}", "calc_txt"),
              ("Avis risques", f"B{R['avis']}", "calc_txt"),
              ("Saisies obligatoires manquantes", f"B{R['a_saisir']}", "int"),
              ("Prochaine saisie", f"C{R['a_saisir']}", "calc_txt")]
COL_ADR_SYN = 1 + MAX_DOSSIERS + 1          # colonne masquée des adresses lues
DERN_SYN = xl_col_to_name(MAX_DOSSIERS)     # dernière colonne de dossier


def lig_syn(lib):
    return 5 + [l for l, _, _ in LIGNES_SYN].index(lib)


def synthese(ws, F, onglets):
    ws.set_column("A:A", 36)
    ws.set_column(f"B:{DERN_SYN}", 17)
    ws.set_column(COL_ADR_SYN, COL_ADR_SYN, 8, None, {"hidden": True})
    ws.write("A1", "Synthèse des dossiers", F["titre"])
    ws.write("A2", "Une colonne par onglet de dossier, lue en direct : c'est le tableau comparatif de tous les cas. Les "
                   "dossiers créés par « Nouveau dossier » sont ajoutés automatiquement ; sans macros, tapez le nom de "
                   "l'onglet en ligne 4.", F["sous"])
    ws.write("A4", "Onglet", F["hdr"])
    for j in range(MAX_DOSSIERS):
        if j < len(onglets):
            ws.write(3, 1 + j, onglets[j], F["hdr_in"])
        else:
            ws.write_blank(3, 1 + j, None, F["hdr_in"])
    ws.data_validation(f"B4:{DERN_SYN}4", {"validate": "any", "input_title": "Nom de l'onglet du dossier",
                                           "input_message": "Rempli par les macros. Sans macros, tapez ici le nom exact de "
                                                            "l'onglet d'un dossier pour l'ajouter à la synthèse."})
    for i, (lib, adr, fmt) in enumerate(LIGNES_SYN):
        r = 5 + i
        ws.write(r - 1, 0, lib, F["labb"] if lib.startswith("NOTE") else F["lab"])
        ws.write(r - 1, COL_ADR_SYN, adr)
        adr_col = xl_col_to_name(COL_ADR_SYN)
        for j in range(MAX_DOSSIERS):
            col = xl_col_to_name(1 + j)
            ws.write_formula(r - 1, 1 + j, f'=IF({col}$4="","",IFERROR(INDIRECT("\'"&{col}$4&"\'!"&${adr_col}{r}),""))', F[fmt])
    rna = lig_syn("NOTE APPROUVÉE")
    ws.set_row(rna - 1, 24)
    plage = lambda r: f"B{r}:{DERN_SYN}{r}"
    # règles sur formule : une colonne vide (texte "") ne doit pas s'afficher en vert
    ws.conditional_format(plage(rna), {"type": "formula", "criteria": f"=AND(ISNUMBER(B{rna}),B{rna}>=8)", "format": F["vertc"]})
    ws.conditional_format(plage(rna), {"type": "formula", "criteria": f"=AND(ISNUMBER(B{rna}),B{rna}>=6,B{rna}<8)", "format": F["ambre"]})
    ws.conditional_format(plage(rna), {"type": "formula", "criteria": f'=OR(AND(ISNUMBER(B{rna}),B{rna}<6),B{rna}="—")', "format": F["rouge"]})
    rms = lig_syn("Saisies obligatoires manquantes")
    ws.conditional_format(plage(rms), {"type": "formula", "criteria": f"=AND(ISNUMBER(B{rms}),B{rms}>0)", "format": F["manquant"]})
    for lib in ("Intitulé du dossier", "Plafonds actifs", "Statut", "Prochaine saisie"):
        ws.set_row(lig_syn(lib) - 1, 45)
    ws.freeze_panes(4, 1)
    r = 5 + len(LIGNES_SYN) + 1
    ws.write(r - 1, 0, "Les démonstrations à retenir", F["labb"])
    for k, t in enumerate([
        "C3 — Anti-compensation : un score de 73,7 (note 7) ramené à 4 par les plafonds C2 et C3. Un sponsor à 100 et une documentation à 100 ne compensent pas un DSCR de 1,06 sur le creux saisonnier.",
        "C4A et C4B — Le ratio annuel trompe : 1,53 en annuel, 0,59 par échéance. Après sculpture de l'amortissement, apport complémentaire et couverture de change, la note passe de 3 à 6 sans que le marché ait changé.",
        "C5 et AGR — Proportionnalité : le régime simplifié allège la grille de jugement, jamais les plafonds. Un noyau financier à 97 reste plafonné à 6 par la concentration sur un acheteur unique non noté.",
        "TEL, ETH, IMMO — Les plafonds C3, C4, C7, C8 et C9 se déclenchent sur des données, jamais sur une appréciation. MIN — une exclusion X3 empêche toute note, quel que soit le score."]):
        ws.merge_range(r + k, 0, r + k, 8, t, F["wrap"])
        ws.set_row(r + k, 32)
    ws.set_landscape(); ws.set_paper(9); ws.fit_to_pages(0, 1)
    ws.print_area(0, 0, 5 + len(LIGNES_SYN) - 1, len(onglets))
    ws.protect("", {"format_columns": True, "format_rows": True})
    if not SANS_VBA:
        ws.insert_button("D1", {"macro": "MettreAJourSynthese", "caption": "Mettre à jour la synthèse", "width": 190, "height": 28})
        ws.insert_button("G1", {"macro": "ExporterPDF", "caption": "Exporter en PDF", "width": 130, "height": 28})
        ws.insert_button("I1", {"macro": "AllerAccueil", "caption": "Accueil", "width": 100, "height": 28})


# ===================================================================== Fiche comité
def lire(adr, cellule="$B$4"):
    """Valeur d'une cellule du dossier choisi (vide si absente)."""
    ref = f'INDIRECT("\'"&{cellule}&"\'!{adr}")'
    return f'=IF({cellule}="","",IFERROR(IF({ref}="","",{ref}),""))'


def fiche(wb, ws, F, defaut):
    ws.set_column("A:A", 34)
    ws.set_column("B:F", 15)
    ws.set_column("G:G", 3)
    ws.set_column("H:H", 24)
    ws.hide_gridlines(2)
    ws.set_portrait(); ws.set_paper(9); ws.fit_to_pages(1, 0)
    ws.write("A1", "Fiche comité — notation Project Finance (modèle V8)", F["titre"])
    ws.write("A2", "Choisissez le dossier dans la cellule jaune. Tout est lu dans l'onglet du dossier ; "
                   "imprimez la page ou utilisez « Exporter en PDF ».", F["sous"])
    ws.write("A4", "Dossier (nom de l'onglet)", F["kpi_lab"])
    ws.merge_range("B4:C4", defaut, F["in_big"])
    ws.data_validation("B4", {"validate": "list", "source": f"='Synthèse'!$B$4:${DERN_SYN}$4",
                              "input_title": "Dossier à présenter",
                              "input_message": "Choisissez un dossier dans la liste (celle de la synthèse).",
                              "error_title": "Dossier inconnu",
                              "error_message": "Choisissez un dossier présent dans la synthèse."})
    ws.write("D4", "Édité le", F["kpi_lab"])
    ws.write_formula("E4", "=TODAY()", F["date"])
    ws.set_row(3, 24)

    def sec(row, titre):
        ws.merge_range(row - 1, 0, row - 1, 5, titre, F["section"])

    def ligne(row, lib, adr, fmt="calc_txt", fusion=True, h=None):
        ws.write(row - 1, 0, lib, F["kpi_lab"])
        if fusion:
            ws.merge_range(row - 1, 1, row - 1, 5, "", F[fmt])
        ws.write_formula(row - 1, 1, lire(adr), F[fmt])
        if h:
            ws.set_row(row - 1, h)

    sec(6, "IDENTIFICATION")
    ligne(7, "Intitulé", "A1")
    ligne(8, "Société de projet — localisation", "A2")
    ws.write("A9", "Code client T24", F["kpi_lab"]); ws.write_formula("B9", lire(f"B{R['code_client']}"), F["calc"])
    ws.write("C9", "Radical", F["kpi_lab"]); ws.write_formula("D9", lire(f"B{R['radical']}"), F["calc"])
    ws.write("E9", "Code projet", F["kpi_lab"]); ws.write_formula("F9", lire(f"B{R['code_projet']}"), F["calc"])
    ligne(10, "Résumé", "A3", h=48)

    sec(12, "NOTATION")
    ws.write("A13", "NOTE APPROUVÉE (1 à 10)", F["kpi_lab"])
    ws.write_formula("B13", lire(f"B{R['na']}"), F["big"])
    ws.merge_range("C13:F13", "", F["bigtxt"])
    ws.write_formula("C13", lire("D6"), F["bigtxt"])
    ws.set_row(12, 34)
    for cr, fmtname in (("=AND(ISNUMBER($B$13),$B$13>=8)", "vertc"),
                        ("=AND(ISNUMBER($B$13),$B$13>=6,$B$13<8)", "ambre"),
                        ('=OR(AND(ISNUMBER($B$13),$B$13<6),$B$13="—")', "rouge")):
        ws.conditional_format("B13", {"type": "formula", "criteria": cr, "format": F[fmtname]})
    ligne(14, "Statut", f"B{R['statut']}", h=30)
    ligne(15, "Orientation", "F11")
    ws.write("A16", "Score global (sur 100)", F["kpi_lab"]); ws.write_formula("B16", lire(f"B{R['global']}"), F["kpi"])
    ws.write("C16", "Note calculée", F["kpi_lab"]); ws.write_formula("D16", lire(f"B{R['note_calc']}"), F["kpi_int"])
    ws.write("E16", "Plafond", F["kpi_lab"]); ws.write_formula("F16", lire("F7"), F["kpi"])
    ligne(17, "Plafonds actifs", "B8", h=30)
    ligne(18, "Verrous actifs (X, B)", "B9")
    ligne(19, "Saisies obligatoires manquantes", f"B{R['a_saisir']}", fmt="kpi_int", fusion=False)
    ws.merge_range("C19:F19", "", F["calc_txt"])
    ws.write_formula("C19", lire(f"C{R['a_saisir']}"), F["calc_txt"])
    ws.conditional_format("B19", {"type": "formula", "criteria": "=AND(ISNUMBER($B$19),$B$19>0)", "format": F["manquant"]})

    sec(21, "ROUTAGE ET PROPORTIONNALITÉ")
    for k, (lib, cle) in enumerate([("Régime de revenus", "regime"), ("Secteur", "secteur"), ("Phase", "phase"),
                                    ("Régime de proportionnalité (S / M / L)", "prop")]):
        r = 22 + k
        ws.write(r - 1, 0, lib, F["kpi_lab"])
        ws.write_formula(r - 1, 1, lire(f"B{R[cle]}"), F["calc"])
        ws.merge_range(r - 1, 2, r - 1, 5, "", F["calc_txt"])
        ws.write_formula(r - 1, 2, lire(f"C{R[cle]}"), F["calc_txt"])
    ws.set_row(24, 30)

    sec(27, "INDICATEURS FINANCIERS")
    for c, h in enumerate(["Indicateur", "Valeur", "Repère", "Appréciation"]):
        ws.write(27, c, h, F["hdr"])
    ws.merge_range(27, 3, 27, 5, "Appréciation", F["hdr"])
    indic = [
        ("DSCR minimum par échéance (retenu)", f"D{R['dmin']}", "num3", f"B{R['seuils']}", "num2", f"E{R['dmin']}"),
        ("DSCR minimum sous scénario défavorable", f"D{R['dstress']}", "num3", None, None, f"E{R['dstress']}"),
        ("DSCR moyen (indicatif)", f"D{R['dmoy']}", "num3", None, None, None),
        ("DSCR annuel minimum (indicatif)", f"D{R['dann']}", "num3", None, None, None),
        ("Couverture du besoin à terminaison", f"B{R['couv']}", "pct", None, None, None),
        ("Quote-part de dette", f"B{R['quote']}", "pct", "=P_C9", "pct", None),
        ("LLCR", f"B{R['llcr']}", "num2", "=P_C4", "num2", None),
        ("DSRA (mois de service)", f"B{R['dsra']}", "num1", "=P_C7", "num1", None),
        ("CAPEX du projet (MMAD)", f"B{R['capex']}", "num", None, None, None),
        ("Exposition de la banque (MMAD)", f"B{R['expo']}", "num", None, None, None),
    ]
    for k, (lib, adr, fmt, rep, fmt_rep, appr) in enumerate(indic):
        r = 29 + k
        ws.write(r - 1, 0, lib, F["lab"])
        ws.write_formula(r - 1, 1, lire(adr), F[fmt])
        if rep is None:
            ws.write_blank(r - 1, 2, None, F["lab"])
        elif rep.startswith("="):
            ws.write_formula(r - 1, 2, rep, F[fmt_rep])
        else:
            ws.write_formula(r - 1, 2, lire(rep), F[fmt_rep])
        ws.merge_range(r - 1, 3, r - 1, 5, "", F["calc"])
        if appr:
            ws.write_formula(r - 1, 3, lire(appr), F["calc"])
            ws.conditional_format(r - 1, 3, r - 1, 3, {"type": "cell", "criteria": "==", "value": '"Critique"', "format": F["rouge"]})
            ws.conditional_format(r - 1, 3, r - 1, 3, {"type": "cell", "criteria": "==", "value": '"Vigilance"', "format": F["ambre"]})
    ws.write_comment("C29", "Repère du DSCR : seuil critique applicable (régime + secteur + phase).")

    sec(40, "CRÉDITS DE LA BANQUE SUR LE PROJET")
    for c, h in enumerate(["Numéro du dossier de crédit", "Nature", "", "Montant (MMAD)", "Devise", "Durée (ans)"]):
        if h:
            ws.write(40, c, h, F["hdr"])
    ws.merge_range(40, 1, 40, 2, "Nature", F["hdr"])
    for i in range(NB_CREDITS):
        r = 42 + i
        src = R["cr_first"] + i
        ws.write_formula(r - 1, 0, lire(f"A{src}"), F["calc_txt"])
        ws.merge_range(r - 1, 1, r - 1, 2, "", F["calc_txt"])
        ws.write_formula(r - 1, 1, lire(f"B{src}"), F["calc_txt"])
        ws.write_formula(r - 1, 3, lire(f"E{src}"), F["num"])
        ws.write_formula(r - 1, 4, lire(f"F{src}"), F["calc"])
        ws.write_formula(r - 1, 5, lire(f"G{src}"), F["num1"])
    rt = 42 + NB_CREDITS
    ws.merge_range(rt - 1, 0, rt - 1, 2, "Total (MMAD, contre-valeur)", F["labb"])
    ws.write_formula(rt - 1, 3, lire(f"E{R['cr_tot']}"), F["total"])

    d1 = rt + 3
    sec(d1 - 2, "SCORES PAR DOMAINE")
    for c, h in enumerate(["Domaine", "Score / 100", "Poids (phase)", "Contribution"]):
        ws.write(d1 - 2, c, h, F["hdr"])
    for i in range(9):
        r = d1 + i
        src = R["agr_first"] + i
        ws.write_formula(r - 1, 0, lire(f"A{src}"), F["lab"])
        ws.write_formula(r - 1, 1, lire(f"B{src}"), F["num1"])
        ws.write_formula(r - 1, 2, lire(f"C{src}"), F["pct"])
        ws.write_formula(r - 1, 3, lire(f"D{src}"), F["num1"])
    ws.write(d1 + 9 - 1, 0, "SCORE GLOBAL", F["labb"])
    ws.write_formula(d1 + 9 - 1, 3, lire(f"B{R['global']}"), F["kpi"])
    graphe = wb.add_chart({"type": "bar"})
    graphe.add_series({"name": "Score / 100",
                       "categories": f"='Fiche comité'!$A${d1}:$A${d1 + 8}",
                       "values": f"='Fiche comité'!$B${d1}:$B${d1 + 8}",
                       "fill": {"color": "#1F4E3D"}, "gap": 60,
                       "data_labels": {"value": True, "num_format": "0"}})
    graphe.set_title({"name": "Score par domaine", "name_font": {"size": 10}})
    graphe.set_x_axis({"min": 0, "max": 100, "major_unit": 20, "num_font": {"size": 8}})
    graphe.set_y_axis({"reverse": True, "num_font": {"size": 8}})
    graphe.set_legend({"none": True})
    graphe.set_size({"width": 300, "height": 230})
    ws.insert_chart(f"E{d1 - 1}", graphe, {"x_offset": 4, "y_offset": 2})

    r = d1 + 11
    sec(r, "COMMENTAIRES ET CONDITIONS (bloc 13 du dossier)")
    for k, (lib, cle, h) in enumerate([("Synthèse de l'analyste", "synthese", 75), ("Forces", "forces", 45),
                                       ("Faiblesses et mitigants", "faiblesses", 45), ("Conditions proposées", "conditions", 60),
                                       ("Justification des écarts", "justif", 45)]):
        rr = r + 1 + k
        ws.write(rr - 1, 0, lib, F["kpi_lab"])
        ws.merge_range(rr - 1, 1, rr - 1, 5, "", F["calc_top"])
        ws.write_formula(rr - 1, 1, lire(f"B{R[cle]}"), F["calc_top"])
        ws.set_row(rr - 1, h)
    rr = r + 6
    ws.write(rr - 1, 0, "Avis risques", F["kpi_lab"])
    ws.write_formula(rr - 1, 1, lire(f"B{R['avis']}"), F["kpi_txt"])
    ws.merge_range(rr - 1, 2, rr - 1, 5, "", F["calc_txt"])
    ws.write_formula(rr - 1, 2, lire(f"D{R['avis']}"), F["calc_txt"])
    ws.set_row(rr - 1, 30)

    r = rr + 2
    sec(r, "DÉCISION DU COMITÉ")
    ws.write(r, 0, "Décision (bloc 13 du dossier)", F["kpi_lab"])
    ws.write_formula(r, 1, lire(f"B{R['decision']}"), F["kpi_txt"])
    ws.merge_range(r, 2, r, 5, "", F["calc_txt"])
    ws.write_formula(r, 2, lire(f"D{R['decision']}"), F["calc_txt"])
    ws.set_row(r, 30)
    for k, lib in enumerate(["Conditions et réserves du comité", "Date du comité", "Signatures"]):
        rr = r + 2 + k
        ws.write(rr - 1, 0, lib, F["kpi_lab"])
        ws.merge_range(rr - 1, 1, rr - 1, 5, "", F["cadre"])
        ws.set_row(rr - 1, 30)
    ws.print_area(0, 0, r + 4, 5)
    ws.protect("", {"format_columns": True, "format_rows": True})
    if not SANS_VBA:
        ws.insert_button("H1", {"macro": "ExporterPDF", "caption": "Exporter en PDF", "width": 160, "height": 30})
        ws.insert_button("H3", {"macro": "AllerDossierFiche", "caption": "Ouvrir le dossier", "width": 160, "height": 30})
        ws.insert_button("H5", {"macro": "AllerAccueil", "caption": "Accueil", "width": 160, "height": 30})


# ===================================================================== Comparaison de deux dossiers
LIGNES_CMP = ([("Intitulé", "A1", "calc_txt", False), ("Code projet", f"B{R['code_projet']}", "calc", False),
               ("Radical", f"B{R['radical']}", "calc", False), ("Régime de revenus", f"B{R['regime']}", "calc", False),
               ("Secteur", f"B{R['secteur']}", "calc", False), ("Phase", f"B{R['phase']}", "calc", False),
               ("Régime de proportionnalité", f"B{R['prop']}", "calc", False),
               ("CAPEX (MMAD)", f"B{R['capex']}", "num", True), ("Exposition de la banque (MMAD)", f"B{R['expo']}", "num", True),
               ("Couverture à terminaison", f"B{R['couv']}", "pct", True), ("Quote-part de dette", f"B{R['quote']}", "pct", True),
               ("Seuil DSCR critique", f"B{R['seuils']}", "num2", True), ("DSCR minimum par échéance", f"D{R['dmin']}", "num3", True),
               ("DSCR minimum sous stress", f"D{R['dstress']}", "num3", True),
               ("DSCR annuel minimum (indicatif)", f"D{R['dann']}", "num3", True),
               ("LLCR", f"B{R['llcr']}", "num2", True), ("DSRA (mois)", f"B{R['dsra']}", "num1", True),
               ("Exposition nette en devises", f"B{R['fx']}", "pct", True)]
              + [(f"Score {c} — {lib}", f"B{R['agr_first'] + i}", "num1", True) for i, (c, lib, _) in enumerate(DOMAINES)]
              + [("Score global", f"B{R['global']}", "num1", True), ("Note calculée", f"B{R['note_calc']}", "int", True),
                 ("Plafond le plus contraignant", f"B{R['plafond']}", "int", True),
                 ("NOTE APPROUVÉE", f"B{R['na']}", "int", True), ("Statut", f"B{R['statut']}", "calc_txt", False),
                 ("Plafonds actifs", "B8", "calc_txt", False), ("Verrous actifs", "B9", "calc_txt", False),
                 ("Avis risques", f"B{R['avis']}", "calc_txt", False),
                 ("Saisies obligatoires manquantes", f"B{R['a_saisir']}", "int", True)])


def comparaison(ws, F, a_, b_):
    ws.set_column("A:A", 38); ws.set_column("B:C", 34); ws.set_column("D:D", 14); ws.set_column("E:E", 3)
    ws.set_column("F:F", 24)
    ws.hide_gridlines(2)
    ws.write("A1", "Comparaison de deux dossiers", F["titre"])
    ws.write("A2", "Choisissez deux dossiers dans les cellules jaunes : variante de montage, avant et après restructuration, "
                   "ou deux projets du même secteur. Les écarts significatifs sont surlignés.", F["sous"])
    ws.write("A4", "Dossiers comparés (noms d'onglet)", F["kpi_lab"])
    for cell, v in (("B4", a_), ("C4", b_)):
        ws.write(cell, v, F["in_big"])
        ws.data_validation(cell, {"validate": "list", "source": f"='Synthèse'!$B$4:${DERN_SYN}$4",
                                  "input_title": "Dossier à comparer",
                                  "input_message": "Choisissez un dossier dans la liste (celle de la synthèse).",
                                  "error_title": "Dossier inconnu", "error_message": "Choisissez un dossier présent dans la synthèse."})
    ws.write("D4", "Écart (B − A)", F["hdr"])
    ws.set_row(3, 24)
    for c, h in enumerate(["Indicateur", "Dossier A", "Dossier B", "Écart"]):
        ws.write(5, c, h, F["hdr"])
    for i, (lib, adr, fmt, numerique) in enumerate(LIGNES_CMP):
        r = 7 + i
        ws.write(r - 1, 0, lib, F["labb"] if lib.startswith("NOTE") else F["lab"])
        ws.write_formula(r - 1, 1, lire(adr, "$B$4"), F[fmt])
        ws.write_formula(r - 1, 2, lire(adr, "$C$4"), F[fmt])
        if numerique:
            ws.write_formula(r - 1, 3, f'=IF(AND(ISNUMBER(B{r}),ISNUMBER(C{r})),C{r}-B{r},IF(B{r}=C{r},"=","≠"))',
                             F[fmt if fmt not in ("calc", "calc_txt") else "calc"])
            ws.conditional_format(f"D{r}", {"type": "formula", "criteria": f'=AND(ISNUMBER(D{r}),ABS(D{r})>0.0001)', "format": F["ambre"]})
        else:
            ws.write_formula(r - 1, 3, f'=IF(B{r}=C{r},"=","≠")', F["calc"])
        ws.conditional_format(f"D{r}", {"type": "cell", "criteria": "==", "value": '"≠"', "format": F["ambre"]})
        if fmt == "calc_txt":
            ws.set_row(r - 1, 30)
    rna = 7 + [l for l, *_ in LIGNES_CMP].index("NOTE APPROUVÉE")
    for col in "BC":
        c = f"${col}${rna}"
        ws.conditional_format(f"{col}{rna}", {"type": "formula", "criteria": f"=AND(ISNUMBER({c}),{c}>=8)", "format": F["vertc"]})
        ws.conditional_format(f"{col}{rna}", {"type": "formula", "criteria": f"=AND(ISNUMBER({c}),{c}>=6,{c}<8)", "format": F["ambre"]})
        ws.conditional_format(f"{col}{rna}", {"type": "formula", "criteria": f'=OR(AND(ISNUMBER({c}),{c}<6),{c}="—")', "format": F["rouge"]})
    ws.freeze_panes(6, 1)
    ws.set_portrait(); ws.set_paper(9); ws.fit_to_pages(1, 1)
    ws.print_area(0, 0, 6 + len(LIGNES_CMP), 3)
    ws.protect("", {"format_columns": True, "format_rows": True})
    if not SANS_VBA:
        ws.insert_button("F1", {"macro": "ExporterPDF", "caption": "Exporter en PDF", "width": 160, "height": 28})
        ws.insert_button("F3", {"macro": "AllerAccueil", "caption": "Accueil", "width": 160, "height": 28})


# ===================================================================== Concordance des notes de référence
def resultats_reference():
    """Résultats du moteur de référence pour les dix-huit dossiers préchargés."""
    out = {}
    for d in cas_tous.CAS:
        r = moteur_reference.evaluer(d)
        out[d["onglet"]] = dict(
            note=r["note_approuvee"] if r["note_approuvee"] is not None else "—",
            note_calc=r["note_calculee"], score=r["score"], regime=r["regime_retenu"], plafond=r["plafond"],
            verrous=" ".join(r["verrous_actifs"]) or "Aucun", statut=r["statut"])
    return out


def concordance(ws, F):
    ref = resultats_reference()
    ws.set_column("A:A", 10); ws.set_column("B:M", 11); ws.set_column("N:N", 14); ws.set_column("O:O", 3)
    ws.set_column("P:P", 22)
    ws.hide_gridlines(2)
    ws.write("A1", "Concordance des notes de référence", F["titre"])
    ws.write("A2", "Résultats attendus des dix-huit dossiers préchargés, calculés par le moteur de référence (Python) "
                   "indépendant du classeur, face aux résultats lus en direct dans chaque onglet. « Écart » apparaît si "
                   "un dossier ou un paramètre a été modifié, ou si une formule a été altérée.", F["sous"])
    hdr = ["Onglet", "Note approuvée attendue", "Note approuvée lue", "Note calculée attendue", "Note calculée lue",
           "Score attendu", "Score lu", "Régime attendu", "Régime lu", "Plafond attendu", "Plafond lu",
           "Verrous attendus", "Verrous lus", "Résultat"]
    r0 = 6
    for c, h in enumerate(hdr):
        ws.write(r0 - 1, c, h, F["hdr"])
    ws.set_row(r0 - 1, 42)
    for i, d in enumerate(cas_tous.CAS):
        r = r0 + 1 + i
        k = d["onglet"]
        e = ref[k]
        lit = lambda adr: f'=IFERROR(INDIRECT("\'{k}\'!{adr}"),"onglet absent")'
        ws.write_url(r - 1, 0, f"internal:'{k}'!A1", F["lien_b"], k)
        val = lambda col, v, fmt: (ws.write_number(r - 1, col, v, F[fmt]) if isinstance(v, (int, float))
                                   else ws.write_string(r - 1, col, v, F[fmt]))
        val(1, e["note"], "int"); ws.write_formula(r - 1, 2, lit(f"B{R['na']}"), F["int"])
        val(3, e["note_calc"], "int"); ws.write_formula(r - 1, 4, lit(f"B{R['note_calc']}"), F["int"])
        val(5, round(e["score"], 4), "num2"); ws.write_formula(r - 1, 6, lit(f"B{R['global']}"), F["num2"])
        val(7, e["regime"], "calc"); ws.write_formula(r - 1, 8, lit(f"B{R['prop']}"), F["calc"])
        val(9, e["plafond"], "int"); ws.write_formula(r - 1, 10, lit(f"B{R['plafond']}"), F["int"])
        val(11, e["verrous"], "calc_txt"); ws.write_formula(r - 1, 12, lit("B9"), F["calc_txt"])
        ok = (f'AND(B{r}&""=C{r}&"",D{r}&""=E{r}&"",ISNUMBER(G{r}),ABS(F{r}-N(G{r}))<0.005,H{r}=I{r},'
              f'J{r}&""=K{r}&"",L{r}=M{r})')
        ws.write_formula(r - 1, 13, f'=IF({ok},"Conforme","Écart")', F["calc"])
        ws.conditional_format(f"N{r}", {"type": "cell", "criteria": "==", "value": '"Conforme"', "format": F["vertc"]})
        ws.conditional_format(f"N{r}", {"type": "cell", "criteria": "==", "value": '"Écart"', "format": F["rouge"]})
    rl = r0 + len(cas_tous.CAS)
    ws.write("A4", "Dossiers conformes", F["kpi_lab"])
    ws.write_formula("B4", f'=COUNTIF(N{r0 + 1}:N{rl},"Conforme")&" / {len(cas_tous.CAS)}"', F["kpi"])
    ws.conditional_format("B4", {"type": "formula", "criteria": f'=COUNTIF(N{r0 + 1}:N{rl},"Conforme")={len(cas_tous.CAS)}',
                                 "format": F["vertc"]})
    ws.conditional_format("B4", {"type": "formula", "criteria": f'=COUNTIF(N{r0 + 1}:N{rl},"Conforme")<{len(cas_tous.CAS)}',
                                 "format": F["rouge"]})
    ws.merge_range(rl + 1, 0, rl + 1, 13,
                   "La note approuvée attendue vaut « — » pour un dossier hors périmètre (exclusion X). Le score est comparé à "
                   "0,005 près. Le moteur de référence (moteur_reference.py) reproduit les formules des sections 1 à 12 et "
                   "sert aussi à vérifier le classeur après chaque construction.", F["wrap"])
    ws.set_row(rl + 1, 30)
    ws.freeze_panes(r0, 1)
    ws.set_landscape(); ws.set_paper(9); ws.fit_to_pages(1, 1)
    ws.protect("", {"format_columns": True, "format_rows": True})
    if not SANS_VBA:
        ws.insert_button("P1", {"macro": "Recalculer", "caption": "Tout recalculer", "width": 150, "height": 28})
        ws.insert_button("P3", {"macro": "AllerAccueil", "caption": "Accueil", "width": 150, "height": 28})


# ===================================================================== Champs importables (propositions IA)
def liste_champs_ia():
    """(clé, libellé, cellule, type, valeurs admises) de chaque champ que l'import IA peut alimenter."""
    c = []
    add = lambda cle, lib, cell, typ, adm="": c.append((cle, lib, cell, typ, adm))
    add("titre", "Intitulé du dossier", "A1", "texte")
    add("spv", "Société de projet — localisation", "A2", "texte")
    add("resume", "Résumé du projet", "A3", "texte")
    add("code_client", "Code client T24", f"B{R['code_client']}", "code", "20 caractères au plus")
    add("radical", "Radical du client", f"B{R['radical']}", "radical", "7 chiffres, zéros de tête compris")
    add("code_projet", "Code projet", f"B{R['code_projet']}", "codeprojet", "PF-AAAA-NNNN")
    add("regime", "Régime de revenus", f"B{R['regime']}", "liste:P_Regimes", "R1, R2, R3, R4")
    add("secteur", "Secteur du projet", f"B{R['secteur']}", "liste:P_SecCodes", ", ".join(s[0] for s in SECTEURS))
    add("phase", "Phase", f"B{R['phase']}", "liste:P_PhaseCodes", "P1, P2, P3")
    add("periodicite", "Périodicité des échéances", f"B{R['period']}", "liste:L_Periodicite", "Semestrielle, Trimestrielle, Mensuelle")
    for key, lib, typ in (("expo", "Exposition de la banque (MMAD)", "nombre"), ("mad", "Tout en dirhams", "liste:L_OuiNon"),
                          ("duree", "Durée du financement (ans)", "nombre"), ("techno", "Technologie éprouvée", "liste:L_OuiNon"),
                          ("epc18", "EPC clé-en-main < 18 mois (P1)", "liste:L_OuiNon"),
                          ("unique", "Acheteur principal unique", "liste:L_OuiNon"),
                          ("premiere", "Première référence technologique", "liste:L_OuiNon"),
                          ("consortium", "Opération consortiale", "liste:L_OuiNon"),
                          ("plus20", "Contrat de revenus > 20 ans", "liste:L_OuiNon"),
                          ("climat", "Site à risque climatique élevé", "liste:L_OuiNon"),
                          ("nbcp", "Nombre de contreparties clés", "nombre")):
        add(key, lib, f"B{R[key]}", typ, "Oui, Non" if typ.startswith("liste:L_OuiNon") else "")
    for i in range(R["se_last"] - R["se_first"] + 1):
        r = R["se_first"] + i
        add(f"emploi.{i + 1}.libelle", f"Emploi {i + 1} — libellé", f"A{r}", "texte")
        add(f"emploi.{i + 1}.montant", f"Emploi {i + 1} — montant (MMAD)", f"B{r}", "nombre")
    for i in range(R["se_last"] - R["se_first"] + 1):
        r = R["se_first"] + i
        add(f"ressource.{i + 1}.libelle", f"Ressource {i + 1} — libellé", f"D{r}", "texte")
        add(f"ressource.{i + 1}.montant", f"Ressource {i + 1} — montant (MMAD)", f"E{r}", "nombre")
        add(f"ressource.{i + 1}.nature", f"Ressource {i + 1} — nature", f"F{r}", "liste:L_Nature", ", ".join(NATURES))
    add("remediation", "Plan de remédiation approuvé", f"B{R['remed']}", "liste:L_OuiNon", "Oui, Non")
    for i in range(NB_CREDITS):
        r = R["cr_first"] + i
        add(f"credit.{i + 1}.numero", f"Crédit {i + 1} — numéro", f"A{r}", "texte")
        add(f"credit.{i + 1}.nature", f"Crédit {i + 1} — nature", f"B{r}", "liste:L_NatureCredit", ", ".join(NATURES_CREDIT))
        add(f"credit.{i + 1}.montant", f"Crédit {i + 1} — montant (MMAD)", f"E{r}", "nombre")
        add(f"credit.{i + 1}.devise", f"Crédit {i + 1} — devise", f"F{r}", "liste:L_Devise", ", ".join(DEVISES))
        add(f"credit.{i + 1}.duree", f"Crédit {i + 1} — durée (ans)", f"G{r}", "nombre")
    for k in range(NB_SEC):
        r = R["sec_first"] + k
        add(f"secteur.{k + 1}.valeur", f"Donnée sectorielle {k + 1} (libellé selon le secteur)", f"B{r}", "texte ou nombre")
        add(f"secteur.{k + 1}.source", f"Donnée sectorielle {k + 1} — source", f"D{r}", "texte")
    for i in range(NB_HYP):
        r = R["hyp_first"] + i
        add(f"hypothese.{i + 1}.libelle", f"Hypothèse {i + 1} — libellé", f"A{r}", "texte")
        add(f"hypothese.{i + 1}.valeur", f"Hypothèse {i + 1} — valeur", f"B{r}", "texte")
    add("choc", "Scénario défavorable : baisse du CFADS", f"B{R['choc']}", "pourcentage", "0 à 0,95 (0,15 = 15 %)")
    add("choc.description", "Description du scénario défavorable", f"C{R['choc']}", "texte")
    for i in range(R["p_last"] - R["p_first"] + 1):
        r = R["p_first"] + i
        add(f"echeance.{i + 1}.libelle", f"Échéance {i + 1} — libellé", f"A{r}", "texte")
        add(f"echeance.{i + 1}.cfads", f"Échéance {i + 1} — CFADS central (MMAD)", f"B{r}", "nombre")
        add(f"echeance.{i + 1}.service", f"Échéance {i + 1} — service de la dette (MMAD)", f"C{r}", "nombre")
        add(f"echeance.{i + 1}.cfads_stresse", f"Échéance {i + 1} — CFADS stressé (MMAD)", f"F{r}", "nombre")
    for i, (codeN, lib, _) in enumerate(NOYAU[3:]):
        r = R["n1"] + 3 + i
        add(codeN, f"{codeN} — {lib} : situation", f"E{r}", "situation", "Très favorable, Favorable, Vigilance, Critique, Info. insuffisante")
        add(f"{codeN}.justification", f"{codeN} — justification", f"H{r}", "texte")
    for key, lib, typ, adm in (("n3_llcr", "N3 hors P1 (note LLCR)", "liste:L_Notes", "100, 80, 50, 20, Info. insuffisante"),
                               ("llcr", "LLCR (x)", "nombre", ""), ("dsra", "DSRA (mois)", "nombre", ""),
                               ("fx", "Exposition nette en devises (% du service)", "pourcentage", "0,12 = 12 %"),
                               ("refi", "Dette à refinancer (% du nominal)", "pourcentage", "0,35 = 35 %"),
                               ("strat", "Stratégie de refinancement approuvée", "liste:L_OuiNon", "Oui, Non"),
                               ("part_ach", "Part des recettes de l'acheteur principal", "pourcentage", "0,9 = 90 %"),
                               ("qual", "Qualité de l'acheteur principal", "liste:L_QualAch", ", ".join(QUAL_ACHETEUR)),
                               ("duree_contrat", "Durée résiduelle du contrat de revenus (ans)", "nombre", ""),
                               ("duree_dette", "Durée résiduelle de la dette (ans)", "nombre", ""),
                               ("solution", "Solution documentée (contrat < dette)", "liste:L_OuiNon", "Oui, Non"),
                               ("plan_adapt", "Plan d'adaptation climatique financé", "liste:L_OuiNon", "Oui, Non"),
                               ("sponsor", "Capacité résiduelle du sponsor suffisante", "liste:L_OuiNon", "Oui, Non"),
                               ("operateur", "Opérateur remplaçable", "liste:L_OuiNon", "Oui, Non"),
                               ("ecart_om", "Écart fin O&M / fin de dette (ans)", "nombre", ""),
                               ("facteur", "Facteur commun au-delà de la limite", "liste:L_OuiNon", "Oui, Non")):
        cle_r = "n3_saisi" if key == "n3_llcr" else key
        add(key, lib, f"B{R[cle_r]}", typ, adm)
    for dm_, h, s1, _s2 in GRILLE:
        add(f"{dm_}.commentaire", f"{dm_} — commentaire du domaine", f"E{h}", "texte")
        for j, (sl, _) in enumerate(SOUS_CRITERES[dm_]):
            r = s1 + j
            add(f"{dm_}.{j + 1}", f"{dm_}.{j + 1} {sl} : situation", f"E{r}", "situation",
                "Très favorable, Favorable, Vigilance, Critique, Info. insuffisante")
            add(f"{dm_}.{j + 1}.commentaire", f"{dm_}.{j + 1} — commentaire", f"H{r}", "texte")
    for i, item in enumerate(EXCLUSIONS + BLOCAGES):
        r = R["x_first"] + i
        lib = "B6 — modèle de flux complet et rapproché ? (Oui = pas de blocage)" if item[0] == "B6" else f"{item[0]} — {item[1]}"
        add(f"verrou.{item[0]}", lib, f"E{r}", "liste:L_OuiNon", "Oui, Non")
    for key, lib in (("synthese", "Synthèse de l'analyste"), ("forces", "Forces"), ("faiblesses", "Faiblesses et mitigants"),
                     ("conditions", "Conditions proposées"), ("justif", "Justification des écarts")):
        add(f"bloc13.{key}", f"Bloc 13 — {lib}", f"B{R[key]}", "texte")
    add("bloc13.avis", "Bloc 13 — avis risques", f"B{R['avis']}", "liste:L_Avis", ", ".join(AVIS))
    add("bloc13.avis.motif", "Bloc 13 — motif de l'avis", f"D{R['avis']}", "texte")
    return c


CHAMPS_IA = liste_champs_ia()
IA_FIRST = 12


def champs_ia(wb, ws, F):
    ws.set_column("A:A", 26); ws.set_column("B:B", 52); ws.set_column("C:C", 9); ws.set_column("D:D", 18)
    ws.set_column("E:E", 60)
    ws.write("A1", "Champs importables — propositions de l'IA", F["titre"])
    ws.write("A2", "Format du fichier de propositions produit par l'outil web à partir des documents du projet. La macro "
                   "« Importer les propositions IA » le lit, contrôle les codes et présente chaque proposition à valider.", F["sous"])
    lignes = [
        ("Fichier", "Classeur Excel (.xlsx) contenant une feuille nommée « Propositions »."),
        ("B1", f"Format : « {FORMAT_IA} »."),
        ("B2, B3, B4", "Code client T24, radical (7 chiffres, en texte), code projet (PF-AAAA-NNNN). Ils doivent "
                       "correspondre à ceux du dossier ; un code vide dans le dossier est proposé à la saisie."),
        ("B5, B6", "Date de génération ; documents analysés (texte libre)."),
        ("Ligne 8 et suivantes", "Colonnes A Clé (ci-dessous), B Valeur proposée, C Source (document, page), D Confiance "
                                 "(Élevée, Moyenne, Faible), E Libellé (facultatif). Les pourcentages s'écrivent en fraction "
                                 "(0,15 pour 15 %) ; une « situation » s'écrit par son niveau (Favorable…) ou en toutes lettres."),
    ]
    for i, (a_, b_) in enumerate(lignes):
        ws.write(3 + i, 0, a_, F["labb"])
        ws.write(3 + i, 1, b_, F["wrap"])
    for c, h in enumerate(["Clé", "Libellé", "Cellule", "Type", "Valeurs admises, remarque"]):
        ws.write(IA_FIRST - 2, c, h, F["hdr"])
    for i, (cle, lib, cell, typ, adm) in enumerate(CHAMPS_IA):
        r = IA_FIRST - 1 + i
        ws.write_string(r, 0, cle, F["lab"]); ws.write_string(r, 1, lib, F["lab"])
        ws.write_string(r, 2, cell, F["calc"]); ws.write_string(r, 3, typ, F["lab"]); ws.write_string(r, 4, adm, F["txt"])
    last = IA_FIRST + len(CHAMPS_IA) - 1
    wb.define_name("IA_Champs", f"='Champs IA'!$A${IA_FIRST}:$D${last}")
    ws.freeze_panes(IA_FIRST - 1, 1)
    ws.autofilter(IA_FIRST - 2, 0, last - 1, 4)
    ws.protect("", {"format_columns": True, "format_rows": True, "autofilter": True, "sort": True})
    if not SANS_VBA:
        ws.insert_button("G1", {"macro": "AllerAccueil", "caption": "Accueil", "width": 120, "height": 28})


REV_FIRST = 9   # première ligne de propositions dans « Revue IA »


def revue_ia(ws, F):
    ws.set_column("A:A", 20); ws.set_column("B:B", 36); ws.set_column("C:C", 8); ws.set_column("D:E", 30)
    ws.set_column("F:F", 26); ws.set_column("G:G", 10); ws.set_column("H:H", 12); ws.set_column("I:I", 36)
    ws.set_column("J:K", 12, None, {"hidden": True})      # valeur convertie et type du champ (macro)
    ws.write("A1", "Revue des propositions de l'IA", F["titre"])
    ws.write("A2", "Rempli par la macro « Importer les propositions IA ». Vérifiez chaque proposition (en bleu, avec sa "
                   "source), choisissez Accepter ou Rejeter en colonne H, puis cliquez « Appliquer les décisions ». "
                   "Chaque décision est tracée dans le Journal.", F["sous"])
    for i, lib in enumerate(["Dossier cible", "Fichier importé", "Contrôle des codes", "Importé le"]):
        ws.write(3 + i, 0, lib, F["kpi_lab"])
        ws.merge_range(3 + i, 1, 3 + i, 4, "", F["calc_txt"])
    for c, h in enumerate(["Clé", "Libellé", "Cellule", "Valeur actuelle", "Valeur proposée", "Source", "Confiance",
                           "Décision", "Remarque"]):
        ws.write(REV_FIRST - 2, c, h, F["hdr"])
    ws.freeze_panes(REV_FIRST - 1, 0)
    ws.protect("", {"format_columns": True, "format_rows": True, "autofilter": True})
    if not SANS_VBA:
        ws.insert_button("F1", {"macro": "AppliquerPropositionsIA", "caption": "Appliquer les décisions", "width": 180, "height": 28})
        ws.insert_button("H1", {"macro": "AllerAccueil", "caption": "Accueil", "width": 100, "height": 28})


def exemple_propositions():
    """Fichier d'exemple au format d'import : un projet fictif à créer avec « Nouveau dossier depuis l'IA »."""
    wb = xlsxwriter.Workbook(EXEMPLE_IA)
    ws = wb.add_worksheet("Propositions")
    b = wb.add_format({"bold": True})
    t = wb.add_format({"num_format": "@"})
    ws.set_column("A:A", 24); ws.set_column("B:B", 60); ws.set_column("C:C", 40); ws.set_column("D:D", 12)
    ws.write("A1", "Format", b); ws.write("B1", FORMAT_IA)
    ws.write("A2", "Code client T24", b); ws.write_string("B2", "20228810", t)
    ws.write("A3", "Radical", b); ws.write_string("B3", "0228810", t)
    ws.write("A4", "Code projet", b); ws.write_string("B4", "PF-2026-0018", t)
    ws.write("A5", "Généré le", b); ws.write("B5", "2026-10-18")
    ws.write("A6", "Documents analysés", b)
    ws.write("B6", "Mémorandum d'information (fictif), contrat d'achat d'électricité (fictif), rapport de l'expert technique (fictif)")
    for c, h in enumerate(["Clé", "Valeur proposée", "Source (document, page)", "Confiance", "Libellé"]):
        ws.write(7, c, h, b)
    MI, PPA, EXP = "Mémorandum d'information", "Contrat d'achat", "Rapport de l'expert technique"
    props = [
        ("titre", "Centrale solaire photovoltaïque de 60 MWc (dossier d'exemple)", f"{MI}, p. 1", "Élevée"),
        ("spv", "SPV « Shams Oriental » SA (fictive) — Région de l'Oriental", f"{MI}, p. 2", "Élevée"),
        ("resume", "Centrale PV vendant sa production à l'acheteur public sous contrat d'achat ferme de 20 ans. "
                   "Financement en dirhams, EPC clé-en-main forfaitaire de 14 mois.", f"{MI}, p. 3", "Élevée"),
        ("regime", "R1", f"{PPA}, art. 4", "Élevée"), ("secteur", "ENR", f"{MI}, p. 3", "Élevée"),
        ("phase", "P1", f"{MI}, p. 5", "Élevée"), ("periodicite", "Semestrielle", f"{MI}, p. 21", "Élevée"),
        ("expo", 300, f"{MI}, p. 20", "Élevée"), ("mad", "Oui", f"{MI}, p. 20", "Élevée"),
        ("duree", 18, f"{MI}, p. 20", "Élevée"), ("techno", "Oui", f"{EXP}, p. 8", "Élevée"),
        ("epc18", "Oui", f"{MI}, p. 12", "Moyenne"), ("unique", "Oui", f"{PPA}, art. 2", "Élevée"),
        ("premiere", "Non", f"{EXP}, p. 8", "Élevée"), ("consortium", "Non", f"{MI}, p. 20", "Moyenne"),
        ("plus20", "Non", f"{PPA}, art. 6", "Élevée"), ("climat", "Non", f"{EXP}, p. 31", "Moyenne"),
        ("nbcp", 3, f"{MI}, p. 9", "Moyenne"),
        ("emploi.1.libelle", "Contrat EPC", f"{MI}, p. 18", "Élevée"), ("emploi.1.montant", 395, f"{MI}, p. 18", "Élevée"),
        ("emploi.2.libelle", "Raccordement", f"{MI}, p. 18", "Élevée"), ("emploi.2.montant", 22, f"{MI}, p. 18", "Élevée"),
        ("emploi.3.libelle", "Frais, intérêts intercalaires, DSRA", f"{MI}, p. 18", "Élevée"),
        ("emploi.3.montant", 43, f"{MI}, p. 18", "Élevée"),
        ("ressource.1.libelle", "Dette senior (18 ans)", f"{MI}, p. 19", "Élevée"), ("ressource.1.montant", 300, f"{MI}, p. 19", "Élevée"),
        ("ressource.1.nature", "Dette senior", f"{MI}, p. 19", "Élevée"),
        ("ressource.2.libelle", "Fonds propres", f"{MI}, p. 19", "Élevée"), ("ressource.2.montant", 165, f"{MI}, p. 19", "Élevée"),
        ("ressource.2.nature", "Fonds propres", f"{MI}, p. 19", "Élevée"),
        ("credit.1.numero", "CR-26-1801", "Système de la banque", "Élevée"),
        ("credit.1.nature", "Crédit d'investissement (moyen et long terme)", f"{MI}, p. 20", "Élevée"),
        ("credit.1.montant", 300, f"{MI}, p. 20", "Élevée"), ("credit.1.devise", "MAD", f"{MI}, p. 20", "Élevée"),
        ("credit.1.duree", 18, f"{MI}, p. 20", "Élevée"),
        ("secteur.1.valeur", 60, f"{EXP}, p. 4", "Élevée"), ("secteur.2.valeur", 118, f"{EXP}, p. 15", "Élevée"),
        ("secteur.3.valeur", 108, f"{EXP}, p. 15", "Moyenne"), ("secteur.4.valeur", 20, f"{PPA}, art. 6", "Élevée"),
        ("secteur.5.valeur", 0.46, f"{PPA}, annexe 2", "Élevée"),
        ("choc", 0.08, f"{EXP}, p. 16 (P90 sur un an)", "Moyenne"),
        ("choc.description", "Production P90 sur un an", f"{EXP}, p. 16", "Moyenne"),
        ("echeance.1.libelle", "An 1 · S1", f"{MI}, annexe 4", "Élevée"), ("echeance.1.cfads", 21.0, f"{MI}, annexe 4", "Élevée"),
        ("echeance.1.service", 15.2, f"{MI}, annexe 4", "Élevée"),
        ("echeance.2.libelle", "An 1 · S2", f"{MI}, annexe 4", "Élevée"), ("echeance.2.cfads", 23.5, f"{MI}, annexe 4", "Élevée"),
        ("echeance.2.service", 15.2, f"{MI}, annexe 4", "Élevée"),
        ("N4", "Très favorable", f"{MI}, p. 22 (DSRA 6 mois)", "Moyenne"),
        ("N4.justification", "DSRA 6 mois prévue au contrat de crédit", f"{MI}, p. 22", "Moyenne"),
        ("llcr", 1.45, f"{MI}, annexe 4", "Moyenne"), ("dsra", 6, f"{MI}, p. 22", "Élevée"),
        ("fx", 0, f"{MI}, p. 20", "Élevée"), ("refi", 0, f"{MI}, p. 20", "Élevée"),
        ("part_ach", 1, f"{PPA}, art. 2", "Élevée"), ("qual", "≥ BBB−", "Notation interne (à confirmer)", "Faible"),
        ("duree_contrat", 20, f"{PPA}, art. 6", "Élevée"), ("duree_dette", 18, f"{MI}, p. 20", "Élevée"),
        ("D2.1", "Très favorable", f"{EXP}, p. 8", "Moyenne"),
        ("D2.1.commentaire", "Modules et onduleurs de fabricants de premier rang ; productible P90 établi par l'expert.",
         f"{EXP}, p. 8 et 15", "Moyenne"),
        ("D3.1", "Favorable", f"{MI}, p. 12", "Moyenne"),
        ("D4.1", "Très favorable", f"{PPA}, art. 4 et 6", "Élevée"),
        ("D9.4", "Info. insuffisante", "Aucun document sur le risque climatique", "Faible"),
        ("D9.4.commentaire", "Étude de vulnérabilité climatique non fournie.", "—", "Faible"),
        ("bloc13.forces", "Contrat d'achat ferme de 20 ans couvrant la dette ; EPC forfaitaire.", f"{MI}, synthèse", "Moyenne"),
    ]
    for i, (k, v, s, cf) in enumerate(props):
        r = 8 + i
        ws.write_string(r, 0, k)
        if isinstance(v, (int, float)):
            ws.write_number(r, 1, v)
        else:
            ws.write_string(r, 1, v)
        ws.write_string(r, 2, s); ws.write_string(r, 3, cf)
    cles = {c for c, *_ in CHAMPS_IA}
    for k, *_ in props:
        assert k in cles, k
    wb.close()


# ===================================================================== Accueil
def accueil(ws, F, nb_lignes=MAX_DOSSIERS):
    ws.hide_gridlines(2)
    ws.set_column("A:A", 2); ws.set_column("B:B", 11); ws.set_column("C:C", 38); ws.set_column("D:D", 14)
    ws.set_column("E:F", 9); ws.set_column("G:G", 10); ws.set_column("H:H", 40); ws.set_column("I:I", 62)
    ws.set_column("J:J", 2); ws.set_column("K:K", 34)
    ws.write("B2", "Outil de scoring Project Finance — modèle V8", F["titre"])
    ws.write("B3", "Version 3 · dix-huit dossiers préchargés · situations descriptives · commentaires et conditions · "
                   "comparaison · concordance · import des propositions de l'IA.", F["sous"])

    def bandeau(row, titre):
        ws.merge_range(row - 1, 1, row - 1, 8, titre, F["section"])

    def texte(row, t, h=None):
        ws.merge_range(row - 1, 1, row - 1, 8, t, F["wrap"])
        if h:
            ws.set_row(row - 1, h)

    bandeau(5, "SCORER UN PROJET EN 5 ÉTAPES")
    etapes = [
        "1. Cliquez « Nouveau dossier » (à droite) : dossier vide, ou copie d'un dossier existant avec « Dupliquer ». "
        "Avec un fichier de propositions de l'IA, cliquez « Nouveau dossier depuis l'IA ».",
        "2. Saisissez d'abord les codes (client T24, radical à 7 chiffres, code projet PF-AAAA-NNNN), puis remplissez les "
        "cellules ORANGE : ce sont les saisies obligatoires encore vides. Sélectionnez une cellule pour lire son aide.",
        "3. Grille et indicateurs N4 à N6 : choisissez dans la liste la situation qui décrit le dossier ; la note s'affiche "
        "à côté. Une situation Critique ou « Info. insuffisante » exige un commentaire.",
        "4. Lisez le tableau de bord : note approuvée, plafonds et verrous actifs, statut. Rédigez le bloc 13 "
        "« Commentaires et conditions » : synthèse obligatoire, justification des écarts si un plafond ou un verrou est actif.",
        "5. Cliquez « Contrôler la saisie », puis « Fiche comité » pour imprimer la page de présentation ou l'exporter en PDF.",
    ]
    for k, t in enumerate(etapes):
        texte(6 + k, t, 28)

    bandeau(12, "LÉGENDE")
    for col, (lib, fmt) in zip("BCDEFGH", [("Saisie", "leg_saisie"), ("Saisie obligatoire manquante", "leg_manq"),
                                           ("Calcul", "leg_calc"), ("Note ≥ 8", "leg_vert"), ("Note 6 ou 7", "leg_ambre"),
                                           ("Note ≤ 5", "leg_rouge")]):
        ws.write(f"{col}13", lib, F[fmt])
    texte(14, "Les cellules de calcul sont protégées (sans mot de passe) pour éviter d'écraser une formule par erreur. "
              "Pour modifier la structure : onglet Révision › Ôter la protection de la feuille.", 28)

    # ---------------------------------------------------------------- catalogue des cas
    bandeau(16, "CATALOGUE DES 18 CAS D'ÉTUDE — dossiers fictifs ; cliquez sur un onglet pour l'ouvrir")
    for c, h in enumerate(["Onglet", "Projet", "Code projet", "Secteur", "Régime · phase", "Note approuvée",
                           "Situations illustrées", "Ce que ce cas enseigne"]):
        ws.write(16, 1 + c, h, F["hdr"])
    r0 = 18
    for k, d in enumerate(cas_tous.CAS):
        r = r0 + k
        o = d["onglet"]
        ws.write_url(r - 1, 1, f"internal:'{o}'!A1", F["lien_b"], o)
        ws.write(r - 1, 2, d["titre"], F["calc_txt"])
        ws.write(r - 1, 3, d["code_projet"], F["calc"])
        ws.write(r - 1, 4, d["secteur"], F["calc"])
        ws.write(r - 1, 5, f"{d['regime']} · {d['phase']}", F["calc"])
        ws.write_formula(r - 1, 6, f'=IFERROR(INDIRECT("\'{o}\'!B{R["na"]}"),"—")', F["kpi"])
        ws.write(r - 1, 7, d["situations"], F["calc_txt"])
        ws.write(r - 1, 8, d["enseigne"], F["calc_txt"])
        ws.set_row(r - 1, 75 if len(d["enseigne"]) > 300 else 60)
    rl = r0 + len(cas_tous.CAS) - 1
    for crit, fm in ((f"=AND(ISNUMBER(G{r0}),G{r0}>=8)", "vertc"), (f"=AND(ISNUMBER(G{r0}),G{r0}>=6,G{r0}<8)", "ambre"),
                     (f'=OR(AND(ISNUMBER(G{r0}),G{r0}<6),G{r0}="—")', "rouge")):
        ws.conditional_format(f"G{r0}:G{rl}", {"type": "formula", "criteria": crit, "format": F[fm]})

    # ---------------------------------------------------------------- dossiers (lus dans la synthèse)
    rv = rl + 2
    bandeau(rv, "VOS DOSSIERS — tous les onglets de dossier, lus dans la synthèse")
    for c, h in enumerate(["Onglet", "Intitulé", "Code projet", "Phase", "Note approuvée", "Manquantes", "Statut"]):
        ws.write(rv, 1 + c, h, F["hdr"])
    ws.merge_range(rv, 7, rv, 8, "Statut", F["hdr"])
    r1 = rv + 2
    for k in range(nb_lignes):
        r = r1 + k
        col = xl_col_to_name(1 + k)
        nom = f"'Synthèse'!${col}$4"
        ws.write_formula(r - 1, 1, f'=IF({nom}="","",HYPERLINK("#\'"&{nom}&"\'!A1",{nom}))', F["lien_b"])
        for c, (lib, fmt) in enumerate([("Intitulé du dossier", "calc_txt"), ("Code projet", "calc"), ("Phase", "calc"),
                                        ("NOTE APPROUVÉE", "kpi"), ("Saisies obligatoires manquantes", "int")]):
            ws.write_formula(r - 1, 2 + c, f"=IF({nom}=\"\",\"\",'Synthèse'!${col}${lig_syn(lib)})", F[fmt])
        ws.merge_range(r - 1, 7, r - 1, 8, "", F["calc_txt"])
        ws.write_formula(r - 1, 7, f"=IF({nom}=\"\",\"\",'Synthèse'!${col}${lig_syn('Statut')})", F["calc_txt"])
    rl2 = r1 + nb_lignes - 1
    for crit, fm in ((f"=AND(ISNUMBER(F{r1}),F{r1}>=8)", "vertc"), (f"=AND(ISNUMBER(F{r1}),F{r1}>=6,F{r1}<8)", "ambre"),
                     (f'=OR(AND(ISNUMBER(F{r1}),F{r1}<6),F{r1}="—")', "rouge")):
        ws.conditional_format(f"F{r1}:F{rl2}", {"type": "formula", "criteria": crit, "format": F[fm]})
    ws.conditional_format(f"G{r1}:G{rl2}", {"type": "formula", "criteria": f"=AND(ISNUMBER(G{r1}),G{r1}>0)", "format": F["manquant"]})

    r = rl2 + 2
    bandeau(r, "BON À SAVOIR")
    notes = [
        "Les dix-huit dossiers fournis sont FICTIFS et pédagogiques ; leurs codes client, radicaux, codes projet et numéros de "
        "crédit sont fictifs. Les seuils, poids et plafonds de l'onglet Paramètres sont des paramètres CANDIDATS, non "
        "approuvés par le Comité de validation : ne pas les utiliser en production avant validation.",
        "Macros : activez-les à l'ouverture (bandeau « Activer le contenu »). Sans macros, tout se calcule quand même ; seuls les "
        "boutons sont inactifs. Pour créer un dossier sans macros : clic droit sur un onglet › Afficher › Modèle, puis clic droit "
        "sur Modèle › Déplacer ou copier › Créer une copie ; renommez la copie et tapez son nom en ligne 4 de la Synthèse.",
        "Automatique : seuils DSCR (régime + secteur + phase), DSCR par échéance et stressé, N1 à N3, notes de la grille et de "
        "N4 à N6 déduites des situations choisies, plafonds C1 à C15, verrous B3 et B7, régime S / M / L avec escalade.",
        "Onglets : Référentiel des niveaux (situations de chaque sous-critère, variantes sectorielles), Comparaison (deux dossiers "
        "côte à côte), Concordance (notes de référence des 18 cas), Champs IA (format du fichier de propositions), Revue IA, "
        "Diagnostic (corrections apportées) et Journal (trace des actions).",
        "Propositions de l'IA : l'outil web produit un fichier de propositions à partir des documents du projet. « Importer les "
        "propositions IA » vérifie les codes client et projet, affiche chaque proposition en bleu avec sa source à côté de la "
        "valeur actuelle ; rien n'est écrit dans le dossier sans votre acceptation, et chaque décision est tracée.",
    ]
    for k, t in enumerate(notes):
        texte(r + 1 + k, t, 42 if len(t) > 250 else 30)
    ws.freeze_panes(4, 0)
    ws.protect("", {"format_columns": True, "format_rows": True})
    if not SANS_VBA:
        boutons = [("Nouveau dossier (vide)", "NouveauDossier"), ("Dupliquer un dossier", "DupliquerDossier"),
                   ("Nouveau dossier depuis l'IA", "NouveauDossierDepuisIA"),
                   ("Importer les propositions IA", "ImporterPropositionsIA"),
                   ("Comparer deux dossiers", "ComparerDossiers"), ("Fiche comité", "OuvrirFiche"),
                   ("Synthèse des dossiers", "AllerSynthese"), ("Concordance des 18 cas", "AllerConcordance"),
                   ("Référentiel des niveaux", "AllerReferentiel"), ("Supprimer un dossier…", "SupprimerDossier"),
                   ("Tout recalculer", "Recalculer"), ("Paramètres du modèle", "AllerParametres"),
                   ("Diagnostic et corrections", "AllerDiagnostic"), ("Journal des actions", "AllerJournal")]
        for i, (cap, mac) in enumerate(boutons):
            ws.insert_button(4, 10, {"macro": mac, "caption": cap, "width": 220, "height": 26,
                                     "x_offset": 4, "y_offset": i * 31})


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

# Défauts de la première version de l'outil, corrigés dans la version 2
DIAG_V2 = [
    ("Tableau de bord", "Moyenne", "Couleur de la note : la règle « valeur ≥ 8 » classe un texte au-dessus de tout nombre. Un dossier hors périmètre (« — ») ou vide s'affichait en vert, comme une bonne note.",
     "Règles sur formule (ESTNUM) : vert, ambre ou rouge seulement pour une note numérique ; « — » en rouge."),
    ("Synthèse", "Moyenne", "Même défaut sur la ligne NOTE APPROUVÉE : les colonnes sans dossier apparaissaient en vert.",
     "Même correction, appliquée aussi à l'accueil et à la fiche comité."),
    ("Noyau financier", "Élevée", "Un indicateur N4 à N6 laissé vide ou noté « Info. insuffisante » comptait 0 sans rendre la note provisoire : le dossier restait « validable » avec un noyau incomplet.",
     "Complétude étendue à N1-N6 (B7 et C15 se déclenchent) ; indicateur non noté compté à 20, comme dans la grille."),
    ("Plafonds", "Faible", "C5 (contrat de revenus plus court que la dette) restait « non évalué » en régime R4, où il n'existe pas de contrat de revenus.",
     "C5 indiqué « n.a. » (sans objet) en régime R4."),
    ("Saisie", "Élevée", "Aucune protection : une frappe dans une cellule de formule l'écrasait sans alerte et faussait la note.",
     "Feuilles protégées sans mot de passe : seules les cellules jaunes acceptent une saisie."),
    ("Saisie", "Moyenne", "Rien n'indiquait ce qui restait à saisir ; montants et pourcentages acceptaient n'importe quelle valeur (15 au lieu de 15 %).",
     "Saisies obligatoires vides en orange, ligne « À SAISIR » avec lien vers la prochaine cellule, info-bulles, contrôles numériques avec message en français."),
    ("Macros", "Moyenne", "L'export PDF échouait pour un classeur ouvert depuis OneDrive ou SharePoint (chemin web) et imposait le dossier du classeur.",
     "Fenêtre « Enregistrer sous » pour choisir l'emplacement ; message explicite en cas d'échec."),
    ("Macros", "Faible", "Un onglet copié à la main depuis le Modèle (sans macros) n'était pas reconnu par la synthèse ; le Modèle visible pouvait être rempli par erreur.",
     "Copies du Modèle reconnues ; Modèle masqué."),
    ("Macros", "Faible", "Le contrôle de saisie s'interrompait sur une erreur d'exécution si une cellule contenait une valeur d'erreur (#N/A).",
     "Lecture des cellules protégée contre les valeurs d'erreur ; contrôle fondé sur la même check-list que la ligne « À SAISIR »."),
    ("Ergonomie", "Amélioration", "Pas de page de présentation au comité ; libellés de l'échéancier à taper un par un.",
     "Onglet « Fiche comité » imprimable avec graphique des domaines ; boutons « Préparer l'échéancier » et « Effacer l'échéancier »."),
]

# Défauts de la version 2, corrigés dans la version 3
DIAG_V3 = [
    ("Cas d'étude", "Moyenne", "Les six dossiers fournis n'étaient pas complets : « Nombre de contreparties clés » vide partout, exposition de la banque vide en C2, durée du contrat de revenus vide en C2, C4A, C4B et C5. La ligne « À SAISIR » de dossiers présentés comme exemples n'était donc jamais à zéro.",
     "Champs complétés (valeurs reconstituées, signalées « à confirmer » en commentaire). Les notes approuvées des six cas sont inchangées ; l'onglet Concordance le vérifie."),
    ("Plafonds", "Faible", "Le fait générateur de chaque plafond tenait dans une colonne de 14 caractères : le texte était tronqué à l'écran et à l'impression.",
     "Code et fait générateur regroupés dans la colonne A, sur deux lignes ; même présentation pour les verrous."),
    ("Saisie", "Moyenne", "La grille et N4 à N6 se notaient par un chiffre (100, 80, 50, 20) sans dire à quoi il correspond : deux analystes pouvaient noter différemment la même situation.",
     "Liste de quatre situations décrites par sous-critère (onglet « Référentiel des niveaux »), variantes sectorielles pour D2.1, D4.1, D4.3 et D5.2 ; la note s'en déduit et s'affiche à côté, dans une cellule protégée."),
    ("Saisie", "Moyenne", "Une note Critique ou « Info. insuffisante » pouvait rester sans explication, et un plafond actif sans justification.",
     "Commentaire exigé pour une situation Critique ou « Info. insuffisante » ; justification des écarts exigée au bloc 13 dès qu'un plafond, un verrou ou une information insuffisante est actif."),
    ("Identification", "Élevée", "Aucun code client ni code projet : impossible de rattacher un dossier au client T24 ou à ses crédits, ni de contrôler un import.",
     "Code client T24, radical (7 chiffres, zéros conservés) et code projet (PF-AAAA-NNNN) contrôlés, repris dans la synthèse, la fiche comité, le nom du PDF et le journal ; tableau des crédits du projet."),
    ("Secteur", "Moyenne", "Les hypothèses d'exploitation étaient libres : rien n'indiquait les données à réunir pour un secteur donné.",
     "Bloc 4 : trois à six données propres au secteur choisi, les autres lignes « Sans objet » ; hypothèses libres conservées en dessous."),
    ("Fiche comité", "Moyenne", "La fiche reprenait « Ce que le dossier enseigne », texte pédagogique sans avis ni conditions.",
     "Bloc 13 « Commentaires et conditions » (synthèse, forces, faiblesses et mitigants, conditions, justification, avis risques, décision) repris dans la fiche ; l'enseignement des cas passe au catalogue de l'Accueil."),
    ("Synthèse", "Faible", "La synthèse et l'accueil s'arrêtaient à 23 dossiers.",
     "40 dossiers ; catalogue des 18 cas, comparaison de deux dossiers et concordance des notes de référence."),
]


def diagnostic(ws, F):
    ws.set_column("A:A", 5); ws.set_column("B:B", 16); ws.set_column("C:C", 10)
    ws.set_column("D:D", 70); ws.set_column("E:E", 60)
    ws.write("A1", "Diagnostic du classeur d'origine et corrections des versions 2 et 3", F["titre"])
    ws.write("A2", "Chaque constat est vérifié par recalcul des formules ; la colonne de droite décrit la correction apportée dans cet outil.", F["sous"])
    for c, h in enumerate(["N°", "Zone", "Gravité", "Constat (classeur d'origine « Cas_Etude_PF_Maroc_V8.xlsx »)", "Correction dans l'outil"]):
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
        ws.write_formula(rr, 4, f'=IFERROR(INDIRECT("\'{k}\'!B{R["na"]}"),"")', F["int"])
        ws.write(rr, 5, reg, F["calc"])
        ws.write_formula(rr, 6, f'=IFERROR(INDIRECT("\'{k}\'!B{R["prop"]}"),"")', F["calc"])
        ws.write_formula(rr, 7, f'=IFERROR(INDIRECT("\'{k}\'!B8"),"")', F["calc_txt"])
        ws.set_row(rr, 30)
    rr = r + 2 + len(origine) + 1
    ws.merge_range(rr, 1, rr, 7,
                   "Les notes approuvées sont inchangées : les corrections portent sur la mécanique (routage, plafonds, stress, "
                   "synthèse), pas sur le jugement des cas. Le régime de proportionnalité change pour C1, C4A et C4B, en application "
                   "de la doctrine. Les nouveaux champs (exposition bancaire, qualité de l'acheteur, etc.) sont reconstitués à partir "
                   "du récit : leurs cellules portent un commentaire « à confirmer ».", F["wrap"])
    ws.set_row(rr, 58)

    for titre, liste, entete in (("Version 2 de l'outil : défauts de la première version corrigés", DIAG_V2,
                                  ["N°", "Zone", "Gravité", "Défaut constaté (version 1)", "Correction (version 2)"]),
                                 ("Version 3 de l'outil : défauts de la version 2 corrigés et améliorations", DIAG_V3,
                                  ["N°", "Zone", "Gravité", "Défaut constaté (version 2)", "Correction (version 3)"])):
        r = rr + 2
        ws.write(r, 1, titre, F["labb"])
        for c, h in enumerate(entete):
            ws.write(r + 1, c, h, F["hdr"])
        for i, (zone, grav, constat, corr) in enumerate(liste):
            rr = r + 2 + i
            ws.write_number(rr, 0, i + 1, F["int"])
            ws.write(rr, 1, zone, F["lab"]); ws.write(rr, 2, grav, F["lab"])
            ws.write(rr, 3, constat, F["txt"]); ws.write(rr, 4, corr, F["txt"])
            ws.set_row(rr, 58)
        ws.conditional_format(r + 2, 2, r + 1 + len(liste), 2, {"type": "cell", "criteria": "==", "value": '"Élevée"', "format": F["ambre"]})
    ws.freeze_panes(4, 0)
    ws.protect("", {"format_columns": True, "format_rows": True})
    if not SANS_VBA:
        ws.insert_button("G1", {"macro": "AllerAccueil", "caption": "Accueil", "width": 100, "height": 28})


def journal(ws, F):
    ws.set_column("A:A", 18); ws.set_column("B:B", 20); ws.set_column("C:C", 22)
    ws.set_column("D:D", 14); ws.set_column("E:E", 16); ws.set_column("F:F", 80)
    ws.write("A1", "Journal des actions", F["titre"])
    ws.write("A2", "Alimenté automatiquement par les macros (créations, contrôles, exports, routage, propositions IA). Ne pas modifier.", F["sous"])
    for c, h in enumerate(["Date", "Utilisateur", "Action", "Dossier", "Code projet", "Détail"]):
        ws.write(3, c, h, F["hdr"])
    ws.freeze_panes(4, 0)
    ws.protect("", {"format_columns": True, "format_rows": True, "autofilter": True, "sort": True})
    if not SANS_VBA:
        ws.insert_button("H1", {"macro": "AllerAccueil", "caption": "Accueil", "width": 100, "height": 28})


if __name__ == "__main__":
    print(ecrire_classeur())
