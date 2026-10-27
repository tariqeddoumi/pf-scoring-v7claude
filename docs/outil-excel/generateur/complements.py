# -*- coding: utf-8 -*-
"""Compléments des dix-huit dossiers préchargés (version 3 de l'outil Excel).

Pour chaque onglet : codes d'identification (client T24, radical, projet), crédits de la
banque sur le projet, données sectorielles du bloc 4, commentaires exigés par la grille
(situation Critique ou « Info. insuffisante ») et bloc 13 « Commentaires et conditions ».

Codes, numéros de crédit, sociétés et projets sont FICTIFS. Les codes projet suivent le
format PF-AAAA-NNNN ; le radical compte exactement 7 chiffres (zéros de tête conservés).
"""

CMLT = "Crédit d'investissement (moyen et long terme)"
RELAIS = "Crédit relais (TVA, subventions)"
BFR = "Ligne de fonctionnement (BFR)"
GAR = "Garantie ou caution"
COUV = "Couverture (taux ou change)"
NATURES_CREDIT = [CMLT, RELAIS, BFR, GAR, COUV, "Autre"]
DEVISES = ["MAD", "EUR", "USD", "Autre"]
AVIS = ["Favorable", "Favorable sous conditions", "Réservé", "Défavorable"]
DECISIONS = ["Accord", "Accord sous conditions", "Ajournement", "Refus"]


def _cr(n, k):
    return f"CR-26-{n:02d}{k:02d}"


COMPLEMENTS = {
    # ----------------------------------------------------------------- cas d'origine
    "C1": dict(
        code_client="20041027", radical="0041027", code_projet="PF-2026-0001",
        credits=[(_cr(1, 1), CMLT, 425, "MAD", 20), (_cr(1, 2), RELAIS, 40, "MAD", 2)],
        secteur_vals=[80, 152, 140, 25, 0.48, 0.4],
        situations="Référence P1, contrat ferme R1 ; marge de financement à terminaison étroite (N3 = 80).",
        bloc13=dict(
            synthese="Centrale PV sous contrat d'achat ferme de 25 ans couvrant la dette de 20 ans, financée en dirhams, "
                     "EPC clé-en-main forfaitaire. Note 9, aucun plafond ni verrou. Régime L par la seule durée du contrat (> 20 ans).",
            forces="Contrat ferme couvrant la dette ; sponsor engagé juridiquement (fonds propres et dépassement) ; "
                   "EPC forfaitaire avec pénalités ; tout en MAD, taux fixe, sans ballon.",
            faiblesses="Marge de financement à terminaison de 5,7 % seulement (N3 = 80) ; DSCR P90 à 1,12 (Vigilance) ; "
                       "délais de paiement de l'acheteur de 60 à 90 jours. Mitigants : engagement de dépassement de 40 MMAD, DSRA 6 mois.",
            conditions="Engagement de dépassement maintenu jusqu'à la réception ; DSRA dotée avant le premier tirage ; "
                       "rapport de l'ingénieur indépendant à chaque tirage.",
            justification="",
            avis="Favorable", avis_txt="Profil très solide ; conditions standard de construction.",
        ),
    ),
    "C2": dict(
        code_client="20058316", radical="0058316", code_projet="PF-2026-0002",
        credits=[(_cr(2, 1), CMLT, 270, "MAD", 20), (_cr(2, 2), CMLT, 150, "EUR", 20)],
        secteur_vals=[100000, 3.6, 83, 60, 25],
        situations="Paiement à la disponibilité R2 en montée en charge P2 ; risque énergie partiellement retenu.",
        bloc13=dict(
            synthese="Dessalement rémunéré à la disponibilité, en montée en charge. Le stress énergie fait tomber N2 à 20 et le noyau "
                     "à 57,5 : note 6 sans plafond. Régime L (CAPEX, consortium, devises, contrat > 20 ans).",
            forces="Redevance de capacité sur 25 ans ; technologie d'osmose inverse éprouvée ; acheteur public de qualité.",
            faiblesses="Disponibilité constatée 94 % contre 97 % ; répercussion plafonnée du coût de l'énergie ; 35 % de la dette en "
                       "euros couverte à 60 %. Mitigants : DSRA 4 mois, plan d'amélioration de la disponibilité.",
            conditions="Porter la DSRA à 6 mois ; couvrir le change à 80 % au moins ; plan d'action de disponibilité suivi par "
                       "l'ingénieur des prêteurs.",
            justification="",
            avis="Favorable sous conditions", avis_txt="Note 6 : conditions et mitigants à formaliser.",
        ),
    ),
    "C3": dict(
        code_client="20063902", radical="0063902", code_projet="PF-2026-0003",
        credits=[(_cr(3, 1), CMLT, 240, "MAD", 15)],
        secteur_vals=[220, 65, 1350, 878, 55, "Contrat de gestion, 15 ans"],
        situations="Anti-compensation : score 73,7 ramené à 4 par C2 et C3 (creux saisonnier).",
        bloc13=dict(
            synthese="Hôtel de qualité, sponsor et documentation à 100, score 73,7 (note 7). Le DSCR du semestre creux (1,06) est sous "
                     "le seuil critique R4 × TOU (1,60) et le stress le fait tomber à 0,75 : note ramenée à 4 par C2 et C3.",
            forces="Sponsor solide, documentation et sûretés complètes ; quote-part de dette de 50 %.",
            faiblesses="Saisonnalité forte : semestre creux à 1,06 ; aucune ligne saisonnière ; recettes exposées au marché (R4).",
            conditions="Sculpter l'amortissement sur la saisonnalité ; ligne de trésorerie saisonnière engagée ; "
                       "DSRA portée à 9 mois tant que le DSCR défavorable reste sous 1,00.",
            justification="Plafonds C2 (DSCR minimum 1,059 < seuil critique 1,60) et C3 (DSCR défavorable 0,752 < 1,00) : "
                          "la note calculée 7 est ramenée à 4. Aucun mitigant ne lève un plafond sans changement de structure.",
            avis="Réservé", avis_txt="Restructuration du service de la dette à examiner avant tout accord.",
        ),
    ),
    "C4A": dict(
        code_client="20077415", radical="0077415", code_projet="PF-2026-0004",
        credits=[(_cr(4, 1), CMLT, 250, "MAD", 10)],
        secteur_vals=[60, 3.2, 70, 40],
        situations="Piège du ratio annuel : 1,53 en annuel, 0,59 par échéance ; change non couvert.",
        sc_comm={"D9.4": "Exposition aux sécheresses non couverte : aucun plan d'adaptation de l'approvisionnement en olives."},
        bloc13=dict(
            synthese="Le DSCR annuel (1,53) masque un semestre d'intercampagne à 0,59. Quatre plafonds (C1, C2, C3, C6) "
                     "ramènent la note calculée 5 à 3.",
            forces="Sponsor et site solides ; fonds propres à 40 %.",
            faiblesses="Amortissement linéaire inadapté à la campagne ; achats importés non couverts (132 % du service) ; "
                       "DSRA de 3 mois seulement.",
            conditions="Sculpter l'amortissement ; ligne de campagne engagée ; couverture de change de 90 % des achats importés.",
            justification="C1 et C2 : DSCR minimum 0,588 ; C3 : DSCR défavorable 0,395 ; C6 : exposition nette en devises 132 % "
                          "du service. D9.4 noté Critique : risque de sécheresse sans plan d'adaptation.",
            avis="Défavorable", avis_txt="Refus en l'état ; voir la structure restructurée (onglet C4B).",
        ),
    ),
    "C4B": dict(
        code_client="20077415", radical="0077415", code_projet="PF-2026-0004",
        credits=[(_cr(4, 2), CMLT, 210, "MAD", 10), (_cr(4, 3), BFR, 25, "MAD", 1)],
        secteur_vals=[60, 3.2, 70, 40],
        situations="Même projet que C4A restructuré : la note passe de 3 à 6 sans changement de marché.",
        sc_comm={"D9.4": "Risque de sécheresse inchangé par la restructuration : plan d'adaptation toujours absent."},
        bloc13=dict(
            synthese="Restructuration de C4A : amortissement sculpté, apport complémentaire, ligne de campagne et couverture de change. "
                     "Plus aucun plafond : note 6.",
            forces="Service sculpté sur la campagne (DSCR minimum 1,68) ; ligne de campagne engagée ; couverture de change à 90 %.",
            faiblesses="Exposition de change résiduelle de 16 % du service ; climat (D9.4) toujours Critique.",
            conditions="Maintien de la couverture de change ; plan d'adaptation à la sécheresse dans les 12 mois.",
            justification="Aucun plafond actif. D9.4 noté Critique (sécheresse sans plan d'adaptation) : à traiter par la "
                          "condition ci-dessus.",
            avis="Favorable sous conditions", avis_txt="Accord possible sur la structure restructurée.",
        ),
    ),
    "C5": dict(
        code_client="20089133", radical="0089133", code_projet="PF-2026-0005",
        credits=[(_cr(5, 1), CMLT, 60, "MAD", 12)],
        secteur_vals=[12, 21.6, 20.1, 15, 0.80, 0.5],
        situations="Régime simplifié S : grille allégée, plafonds intacts (C10, acheteur unique non noté).",
        bloc13=dict(
            synthese="Centrale d'autoproduction de 12 MWc vendant à un industriel unique non noté. Régime S. Noyau à 97, "
                     "score 83,8 (note 8) plafonné à 6 par C10.",
            forces="Noyau financier excellent (DSCR minimum 1,68) ; EPC court et forfaitaire ; tout en MAD.",
            faiblesses="Acheteur unique portant 100 % des recettes, non noté.",
            conditions="Notation interne de l'acheteur ; garantie de paiement de la maison mère de l'acheteur ou "
                       "lettre de crédit stand-by de 6 mois de facturation.",
            justification="C10 : acheteur portant 100 % des recettes, non noté (seuil BBB−) : la note 8 est ramenée à 6.",
            avis="Favorable sous conditions", avis_txt="La garantie de paiement lèverait le plafond C10.",
        ),
    ),
    # ----------------------------------------------------------------- cas sectoriels
    "ENR": dict(
        code_client="20102256", radical="0102256", code_projet="PF-2026-0006",
        credits=[(_cr(6, 1), CMLT, 430, "MAD", 18), (_cr(6, 2), RELAIS, 40, "MAD", 2)],
        secteur_vals=[140, 520, 470, 20, 0.45, 0.3],
        situations="Dossier de référence : régime M, aucun plafond, note 10.",
        bloc13=dict(
            forces="Contrat d'achat ferme de 20 ans couvrant la dette ; sponsor noté BBB+ ; EPC de premier rang ; "
                   "tout en MAD, taux fixé par swap.",
            faiblesses="Indexation limitée à 80 % du tarif ; levier de 69 % (N5 = 80).",
            justification="",
            avis="Favorable", avis_txt="Profil de référence.",
        ),
    ),
    "EAU": dict(
        code_client="20117740", radical="0117740", code_projet="PF-2026-0007",
        credits=[(_cr(7, 1), CMLT, 360, "MAD", 20), (_cr(7, 2), CMLT, 160, "EUR", 20)],
        secteur_vals=[120000, 3.4, 72, 80, 25],
        situations="Montée en charge P2 ; climat élevé neutralisé par un plan financé ; régime L.",
        bloc13=dict(
            forces="Redevance de capacité de 25 ans ; acheteur public adossé à l'État ; plan d'adaptation climatique financé.",
            faiblesses="Disponibilité 96 % sous la garantie de 98 % ; fournisseur unique de membranes ; 12 % du service exposé au change.",
            justification="",
            avis="Favorable sous conditions", avis_txt="Suivi de la disponibilité et de la couverture de change.",
        ),
    ),
    "TEL": dict(
        code_client="20123581", radical="0123581", code_projet="PF-2026-0008",
        credits=[(_cr(8, 1), CMLT, 330, "MAD", 12), (_cr(8, 2), GAR, 30, "MAD", 3)],
        secteur_vals=[24, 62, 6.5, 1.45, 35],
        situations="Plafond C3 : DSCR défavorable sous 1,00 ; escalade M → L par le plafond.",
        bloc13=dict(
            forces="Conception Tier III certifiée ; clients de premier rang, aucun au-delà de 35 % ; LLCR 1,41.",
            faiblesses="38 % de la capacité non commercialisée ; DSCR défavorable 0,987.",
            justification="C3 : DSCR défavorable 0,987 < 1,00 ; la note calculée 7 est ramenée à 4. Le plafond fait aussi "
                          "passer le régime M en régime L.",
            avis="Réservé", avis_txt="Accord envisageable avec réserve complémentaire et tirages conditionnés.",
        ),
    ),
    "TRA": dict(
        code_client="20131094", radical="0131094", code_projet="PF-2026-0009",
        credits=[(_cr(9, 1), CMLT, 600, "MAD", 16), (_cr(9, 2), COUV, 50, "MAD", 16)],
        secteur_vals=[21400, 0, "Péage", "Non", 24],
        situations="Régime R4 : seuils les plus exigeants ; C2 actif à 1,37 ; C5 sans objet.",
        bloc13=dict(
            forces="Six ans d'historique de trafic en croissance ; refinancement réalisé ; DSRA 6 mois.",
            faiblesses="Recettes de péage sans garantie (R4) ; DSCR minimum 1,367 sous le seuil critique 1,40.",
            justification="C2 : DSCR minimum 1,367 < seuil critique R4 × TRA (1,40) ; la note calculée 6 est ramenée à 5.",
            avis="Favorable sous conditions", avis_txt="Note 5 : sous surveillance, clauses de trafic à suivre.",
        ),
    ),
    "POR": dict(
        code_client="20146628", radical="0146628", code_projet="PF-2026-0010",
        credits=[(_cr(10, 1), CMLT, 620, "MAD", 18), (_cr(10, 2), RELAIS, 80, "MAD", 3)],
        secteur_vals=[1200000, None, 90, 60, 30],
        situations="Construction sans EPC signé (B2) ; C10 et C14 ; couverture 97 % avec plan de remédiation.",
        bloc13=dict(
            forces="Volume minimum garanti de 60 % ; concession de 30 ans ; plan de remédiation approuvé (couverture 97 %).",
            faiblesses="EPC non signé (B2) ; armateur unique non noté (90 % du trafic) ; facteur commun au-delà de la limite.",
            justification="B2 : EPC non signé en phase P1, la note reste provisoire (stade Octroi). C10 : acheteur à 90 % non noté ; "
                          "C14 : exposition du groupe sur un facteur commun : note plafonnée à 6.",
            avis="Réservé", avis_txt="Pas d'octroi avant la signature de l'EPC.",
        ),
    ),
    "SAN": dict(
        code_client="20150372", radical="0150372", code_projet="PF-2026-0011",
        credits=[(_cr(11, 1), CMLT, 420, "MAD", 20)],
        secteur_vals=[600, "Disponibilité", 20, 10],
        situations="Informations insuffisantes (B7, C15) ; opérateur non remplaçable (C13).",
        sc_comm={"D5.3": "Étude des coûts de gros entretien des équipements médicaux non remise.",
                 "D9.2": "Plan de consultation des riverains et du personnel transféré non communiqué."},
        bloc13=dict(
            forces="Loyer de disponibilité indexé versé par l'autorité de santé ; contrat de 20 ans égal à la dette.",
            faiblesses="Deux sous-critères sans information (D5.3, D9.2) ; opérateur de maintenance spécialisée non remplaçable "
                       "et contrat O&M expirant 7 ans avant la dette.",
            justification="B7 et C15 : D5.3 et D9.2 en « Info. insuffisante » (complétude < 100 %), note provisoire. "
                          "C13 : opérateur non remplaçable, écart O&M / dette de 7 ans > 5 ans.",
            avis="Réservé", avis_txt="Compléter le dossier avant présentation pour une note validée.",
        ),
    ),
    "ETH": dict(
        code_client="20168815", radical="0168815", code_projet="PF-2026-0012",
        credits=[(_cr(12, 1), CMLT, 720, "MAD", 10), (_cr(12, 2), GAR, 80, "MAD", 2)],
        secteur_vals=[450, 56, 12, 90, 100],
        situations="LLCR sous 1,10 (C4) et ballon de 35 % sans stratégie (C8).",
        bloc13=dict(
            forces="Contrat de capacité de 12 ans ; disponibilité garantie de 92 % atteinte ; acheteur public de qualité.",
            faiblesses="Ballon de 35 % du nominal sans stratégie de refinancement ; LLCR 1,08.",
            justification="C4 : LLCR 1,08 < 1,10 ; C8 : 35 % de dette à refinancer sans stratégie approuvée. "
                          "La note calculée 6 est ramenée à 4.",
            avis="Réservé", avis_txt="Une stratégie de refinancement approuvée lèverait C8 ; C4 demande de réduire le ballon.",
        ),
    ),
    "IMMO": dict(
        code_client="20172204", radical="0172204", code_projet="PF-2026-0013",
        credits=[(_cr(13, 1), CMLT, 480, "MAD", 15)],
        secteur_vals=[48000, 91, 5.2, 9.7, 18],
        situations="Levier 88 % (C9) et DSRA de 2 mois (C7) ; N4 et N5 Critiques.",
        bloc13=dict(
            forces="Occupation de 91 %, locataires diversifiés (premier à 18 %) ; LLCR 1,36.",
            faiblesses="Quote-part de dette de 88 % ; DSRA de 2 mois ; baux de 5,2 ans face à une dette de 15 ans.",
            justification="C9 : quote-part de dette 87,9 % > 85 % ; C7 : DSRA 2 mois < 3 mois. N4 et N5 notés Critique pour les "
                          "mêmes raisons. Note calculée 6 ramenée à 5.",
            avis="Favorable sous conditions", avis_txt="Apport de fonds propres et DSRA de 6 mois exigés.",
        ),
    ),
    "IND": dict(
        code_client="20185547", radical="0185547", code_projet="PF-2026-0014",
        credits=[(_cr(14, 1), CMLT, 300, "MAD", 12), (_cr(14, 2), CMLT, 130, "EUR", 12)],
        secteur_vals=[219000, 82, 70, 45],
        situations="Avis juridique avec réserve (B5) ; contrat plus court que la dette (C5) ; change (C6).",
        bloc13=dict(
            forces="Procédé éprouvé ; contrat d'enlèvement de 70 % de la production ; fonds propres à 35 %.",
            faiblesses="Contrat d'enlèvement de 8 ans pour une dette de 12 ans ; exposition de change de 30 % du service ; "
                       "réserve de l'avis juridique sur le nantissement.",
            justification="B5 : avis d'opposabilité avec réserve (stade Décaissement). C5 : contrat de 8 ans < dette de 12 ans "
                          "sans solution ; C6 : 30 % > 25 %. N6 Critique. Note calculée 6 ramenée à 5.",
            avis="Réservé", avis_txt="Levée de la réserve juridique et couverture de change avant décaissement.",
        ),
    ),
    "AGR": dict(
        code_client="20193360", radical="0193360", code_projet="PF-2026-0015",
        credits=[(_cr(15, 1), CMLT, 85, "MAD", 10), (_cr(15, 2), BFR, 10, "MAD", 1)],
        secteur_vals=[100, 2.8, 85, 100],
        situations="Régime S en construction : petit projet, contrat d'achat ferme, aucun plafond.",
        bloc13=dict(
            forces="Contrat d'achat de 100 % de la production sur 10 ans ; 1 400 producteurs sous contrat ; tout en MAD.",
            faiblesses="Récolte d'olives sensible aux campagnes déficitaires.",
            justification=("Volet climatique (lot 2) : la sécheresse est un aléa élevé sans adaptation financée ; C11 limite "
                           "la note à 6. Mitigants proposés : diversification des bassins d'approvisionnement, irrigation "
                           "d'appoint des producteurs, réserve de service de la dette portée à 9 mois."),
            avis="Favorable", avis_txt="Régime simplifié ; conditions standard.",
        ),
    ),
    "TOU": dict(
        code_client="20207719", radical="0207719", code_projet="PF-2026-0016",
        credits=[(_cr(16, 1), CMLT, 380, "MAD", 14)],
        secteur_vals=[420, 54, 1450, 783, 70, "Contrat de gestion, 20 ans"],
        situations="CFADS négatif en basse saison (C1) ; droit d'occupation non établi (B4) ; climat sans plan (C11).",
        sc_comm={"D4.1": "Aucune garantie de loyer ni de résultat de l'opérateur : recettes entièrement exposées.",
                 "D9.4": "Site littoral exposé à l'érosion côtière, aucun plan d'adaptation financé."},
        bloc13=dict(
            forces="Destination établie ; marque internationale sous contrat de gestion de 20 ans.",
            faiblesses="Occupation de 54 % contre 68 % au plan ; CFADS négatif en basse saison ; droit d'occupation "
                       "du domaine non établi ; érosion côtière sans plan.",
            justification="C1, C2, C3 : CFADS négatif sur un semestre (DSCR −0,19) ; C11 : risque climatique élevé sans plan "
                          "financé. B4 : droit d'occupation non établi (stade Octroi). D4.1 et D9.4 notés Critique.",
            avis="Défavorable", avis_txt="Révision de fond du plan d'affaires et de la structure.",
        ),
    ),
    "MIN": dict(
        code_client="20214486", radical="0214486", code_projet="PF-2026-0017",
        credits=[(_cr(17, 1), CMLT, 500, "MAD", 9), (_cr(17, 2), CMLT, 400, "USD", 9)],
        secteur_vals=[48, "Norme internationale de certification", 13, 64, 100],
        situations="Exclusion X3 (contrepartie sous sanctions) : aucune note ; B3 et B8 en plus.",
        sc_comm={"D4.2": "Prix du cuivre libre, sans plancher ni couverture.",
                 "D4.3": "Coût de production dans le dernier quartile en scénario défavorable.",
                 "D6.1": "Acheteur unique de la production noté sous BBB− et signalé au titre du dispositif LBC-FT.",
                 "D9.1": "Gestion des résidus miniers non approuvée ; étude d'impact à reprendre."},
        bloc13=dict(
            forces="Réserves certifiées de 48 Mt ; coût de production compétitif au prix de référence.",
            faiblesses="Contrepartie clé sous sanctions (X3) ; couverture à terminaison de 92 % (B3) ; acceptabilité "
                       "environnementale non obtenue (B8) ; capacité du sponsor insuffisante (C12).",
            justification="X3 : exclusion, aucune note n'est produite. B3, B8 et les plafonds C2, C3, C10, C12 sont listés pour "
                          "information. D4.2, D4.3, D6.1, D9.1 notés Critique.",
            avis="Défavorable", avis_txt="Hors périmètre tant que la contrepartie sous sanctions demeure.",
        ),
    ),
}

# Les dossiers sectoriels reprennent leur lecture et leurs points au comité (cas_sectoriels_textes)
# comme synthèse et conditions proposées : complétés dans cas_tous.

for _k, _v in COMPLEMENTS.items():
    assert len(_v["radical"]) == 7 and _v["radical"].isdigit(), _k
    assert _v["code_projet"][:3] == "PF-" and len(_v["code_projet"]) == 12, _k
    for _c in _v["credits"]:
        assert _c[1] in NATURES_CREDIT and _c[3] in DEVISES, _k
    assert _v["bloc13"]["avis"] in AVIS, _k
