# -*- coding: utf-8 -*-
"""Référentiel des niveaux (outil Excel V8, version 3).

Pour chaque sous-critère de la grille (D1.1 à D9.4) et pour les indicateurs N4 à N6 du
noyau, quatre situations décrivent les niveaux Très favorable (100), Favorable (80),
Vigilance (50) et Critique (20). L'analyste choisit une situation dans une liste ; la
note s'en déduit. « Info. insuffisante » reste toujours possible (comptée à 20).

Quatre sous-critères ont une description propre au secteur (D2.1, D4.1, D4.3, D5.2) :
la liste du dossier prend la variante du secteur choisi, à défaut la description commune.

Les descriptions restent courtes (la liste déroulante d'Excel n'affiche qu'une ligne).
"""

NIVEAUX_LIB = ("Très favorable", "Favorable", "Vigilance", "Critique")
INFO = "Info. insuffisante"
SEP = " — "

# clé -> (libellé, [Très favorable, Favorable, Vigilance, Critique])
NIVEAUX = {
    # D1 Sponsors et actionnariat
    "D1.1": ("Capacité financière du sponsor", [
        "Sponsor noté ≥ BBB, fonds propres disponibles > 3 × l'appel restant",
        "Sponsor solide, capacité couvrant l'appel restant avec marge",
        "Capacité juste suffisante ou dépendante d'autres projets",
        "Capacité insuffisante ou sponsor en difficulté financière"]),
    "D1.2": ("Obligation juridique de soutien", [
        "Engagements signés : fonds propres, dépassement, garanties de complétion",
        "Engagement de fonds propres signé, dépassement partiellement couvert",
        "Lettre de confort ou engagement non encore signé",
        "Aucun engagement juridique du sponsor"]),
    "D1.3": ("Structure actionnariale et gouvernance", [
        "Actionnariat stable, pacte signé, gouvernance de la SPV documentée",
        "Actionnariat stable, pacte en cours de finalisation",
        "Actionnariat dispersé ou clauses de sortie précoces",
        "Actionnariat instable, conflit ou bénéficiaire effectif non établi"]),
    # D2 Projet, site, technologie
    "D2.1": ("Technologie et performance", [
        "Technologie éprouvée, références nombreuses et comparables",
        "Technologie éprouvée, références moins nombreuses ou plus petites",
        "Technologie récente ou extrapolée à une taille supérieure",
        "Technologie non éprouvée à cette échelle"]),
    "D2.2": ("Site, foncier physique et accès", [
        "Foncier sécurisé, études de sol faites, accès et réseaux disponibles",
        "Foncier sécurisé, études ou raccordements encore à finaliser",
        "Foncier ou accès en cours d'obtention, contraintes de site identifiées",
        "Foncier non sécurisé ou contrainte de site non résolue"]),
    "D2.3": ("Planning et complexité d'exécution", [
        "Planning réaliste avec marge, chantier simple et répétitif",
        "Planning tenable, quelques interfaces critiques identifiées",
        "Planning tendu ou chemin critique dépendant de tiers",
        "Planning irréaliste ou complexité non maîtrisée"]),
    # D3 Construction et achèvement
    "D3.1": ("Contrat EPC et constructeur", [
        "EPC clé-en-main forfaitaire, constructeur de premier rang, pénalités ≥ 15 %",
        "EPC forfaitaire, pénalités ou garanties légèrement en retrait",
        "Lots séparés ou constructeur à l'expérience limitée",
        "Pas d'EPC signé ou constructeur fragile"]),
    "D3.2": ("Interfaces et gouvernance de chantier", [
        "Interface unique, ingénieur indépendant des prêteurs mandaté",
        "Interfaces peu nombreuses et contractualisées",
        "Interfaces multiples, coordination portée par la SPV",
        "Interfaces non contractualisées ou litige de chantier"]),
    "D3.3": ("Assurances et garanties mobilisables", [
        "Polices tous risques et pertes d'exploitation, prêteurs bénéficiaires",
        "Polices en place, quelques franchises ou plafonds élevés",
        "Couverture partielle ou délégation aux prêteurs non finalisée",
        "Assurances absentes ou insuffisantes"]),
    # D4 Mécanisme des recettes
    "D4.1": ("Structure contractuelle des recettes", [
        "Contrat ferme couvrant toute la durée de la dette",
        "Contrat couvrant l'essentiel des recettes et de la durée",
        "Recettes en partie contractuelles, en partie exposées",
        "Recettes sans contrat ou contrat expirant tôt"]),
    "D4.2": ("Mécanisme de prix et indexation", [
        "Prix fixé, indexé sur les coûts réels du projet",
        "Indexation partielle (≥ 70 %) ou décalée",
        "Indexation faible ou plafonnée, coûts en partie non répercutés",
        "Prix libre ou baisse de prix probable"]),
    "D4.3": ("Marché et concurrence", [
        "Demande structurelle, aucune concurrence crédible",
        "Demande solide, concurrence limitée",
        "Concurrence active ou demande sensible à la conjoncture",
        "Surcapacité ou demande en déclin"]),
    # D5 Exploitation et maintenance
    "D5.1": ("Opérateur et contrat O&M", [
        "Opérateur de premier rang, contrat O&M long, pénalités adossées",
        "Opérateur expérimenté, contrat O&M plus court que la dette",
        "Opérateur peu expérimenté ou exploitation en régie par la SPV",
        "Aucun opérateur qualifié identifié"]),
    "D5.2": ("Performance technique et disponibilité", [
        "Performance garantie et constatée au-dessus du contrat",
        "Performance conforme au contrat",
        "Performance légèrement inférieure, pénalités ponctuelles",
        "Performance durablement inférieure au contrat"]),
    "D5.3": ("Coûts, gros entretien et dépendances", [
        "Coûts contractualisés, réserve de gros entretien dotée",
        "Coûts maîtrisés, réserve de gros entretien prévue",
        "Coûts exposés à l'inflation ou intrants critiques non couverts",
        "Coûts non maîtrisés ou dépendance non couverte"]),
    # D6 Contreparties et consortium
    "D6.1": ("Acheteur ou payeur principal", [
        "Acheteur noté ≥ BBB, paiements réguliers",
        "Acheteur noté BBB−, retards de paiement limités",
        "Acheteur non noté ou retards de paiement répétés",
        "Acheteur fragile ou en défaut de paiement"]),
    "D6.2": ("Fournisseurs critiques", [
        "Fournisseurs multiples ou contrats long terme garantis",
        "Fournisseur principal solide, alternative possible",
        "Fournisseur unique, substitution longue ou coûteuse",
        "Fournisseur critique fragile, aucune alternative"]),
    "D6.3": ("Prêteurs et consortium", [
        "Prêteurs de premier rang, convention intercréanciers signée",
        "Consortium solide, convention en cours de finalisation",
        "Prêteurs hétérogènes ou règles de vote à préciser",
        "Conflit entre prêteurs ou absence de convention"]),
    # D8 Juridique, sûretés, continuité
    "D8.1": ("Documentation contractuelle et droits directs", [
        "Contrats signés, accords directs avec toutes les contreparties clés",
        "Contrats signés, accords directs avec les principales contreparties",
        "Contrats ou accords directs en cours de négociation",
        "Documentation lacunaire, pas de droits directs"]),
    "D8.2": ("Sûretés et opposabilité", [
        "Sûretés complètes, enregistrées, avis juridique sans réserve",
        "Sûretés complètes, formalités en cours",
        "Sûretés partielles ou réserve dans l'avis juridique",
        "Sûretés non opposables ou absentes"]),
    "D8.3": ("Autorisations, cadre réglementaire, litiges", [
        "Toutes autorisations définitives, cadre stable, aucun litige",
        "Autorisations obtenues, renouvellements de routine",
        "Autorisations en cours ou cadre réglementaire en évolution",
        "Autorisation clé manquante ou litige significatif"]),
    # D9 ESG et climat résiduel
    "D9.1": ("Environnement et ressources", [
        "Étude d'impact approuvée, plan de gestion conforme aux normes IFC",
        "Étude d'impact approuvée, plan de gestion à compléter",
        "Impacts notables, mesures d'atténuation en cours de définition",
        "Impact majeur non traité ou étude d'impact absente"]),
    "D9.2": ("Social et acceptabilité", [
        "Consultation menée, aucun déplacement, emploi local documenté",
        "Consultation menée, impacts sociaux limités et traités",
        "Réinstallation ou contestation locale à gérer",
        "Opposition forte ou réinstallation non conforme"]),
    "D9.3": ("Gouvernance ESG et exécution", [
        "Système de gestion E&S certifié, suivi par un consultant des prêteurs",
        "Système de gestion E&S en place, reporting régulier",
        "Système de gestion E&S embryonnaire",
        "Aucun système de gestion E&S"]),
    "D9.4": ("Climat résiduel", [
        "Risques physiques et de transition faibles ou entièrement couverts",
        "Risques identifiés et couverts pour l'essentiel",
        "Risque résiduel significatif, plan d'adaptation partiel",
        "Risque élevé sans plan d'adaptation"]),
    # Noyau financier : indicateurs notés sur pièces
    "N4": ("Liquidité (DSRA, lignes, cascade)", [
        "DSRA ≥ 6 mois dotée, réserve de maintenance, cascade signée",
        "DSRA ≥ 6 mois, autres réserves partielles",
        "DSRA de 3 à 6 mois ou dotation progressive",
        "DSRA < 3 mois ou absente, pas de cascade"]),
    "N5": ("Levier et fonds propres à risque", [
        "Quote-part de dette ≤ 65 %, fonds propres versés en premier",
        "Quote-part de dette de 65 à 75 %",
        "Quote-part de dette de 75 à 85 % ou fonds propres versés au prorata",
        "Quote-part de dette > 85 % ou fonds propres non engagés"]),
    "N6": ("Exposition résiduelle taux / change / refinancement", [
        "Tout en MAD, taux fixe ou couvert, amortissement complet",
        "Exposition résiduelle faible (< 10 % du service), couverte pour l'essentiel",
        "Exposition de 10 à 25 % du service ou ballon refinancé avec stratégie",
        "Exposition > 25 % du service ou refinancement sans stratégie"]),
}

# (clé, secteur) -> [Très favorable, Favorable, Vigilance, Critique]
NIVEAUX_SECTEUR = {
    # ---------------------------------------------------------------- D2.1 Technologie
    ("D2.1", "ENR"): ["Équipements de premier rang, productible P90 établi par un expert",
                      "Équipements reconnus, productible P90 établi sur des données courtes",
                      "Équipement récent ou productible établi par le développeur seul",
                      "Productible non établi de façon indépendante"],
    ("D2.1", "EAU"): ["Procédé avec ≥ 3 références comparables, consommation garantie",
                      "Procédé éprouvé, références de taille inférieure",
                      "Procédé extrapolé ou consommation énergétique non garantie",
                      "Procédé sans référence de taille comparable"],
    ("D2.1", "TEL"): ["Conception Tier III certifiée, équipements standard du marché",
                      "Conception Tier III, certification en cours",
                      "Redondances partielles ou équipements spécifiques",
                      "Conception non redondante ou technologie dépassée"],
    ("D2.1", "TRA"): ["Ouvrages courants, techniques de construction maîtrisées",
                      "Ouvrages d'art standards, quelques sections complexes",
                      "Ouvrages d'art majeurs ou terrain difficile",
                      "Technique de construction non éprouvée localement"],
    ("D2.1", "POR"): ["Équipements de manutention standard, références multiples",
                      "Équipements éprouvés, automatisation partielle",
                      "Terminal fortement automatisé, références limitées",
                      "Système de manutention prototype"],
    ("D2.1", "SAN"): ["Bâtiment et plateau technique standard, normes hospitalières",
                      "Plateau technique éprouvé, quelques équipements de pointe",
                      "Équipements de pointe dépendant d'un fournisseur unique",
                      "Conception non conforme aux normes hospitalières"],
    ("D2.1", "ETH"): ["Turbines de série, rendement garanti, références nombreuses",
                      "Équipements éprouvés, rendement garanti partiellement",
                      "Modèle récent ou conversion de combustible",
                      "Technologie sans historique d'exploitation"],
    ("D2.1", "IMMO-REND"): ["Construction standard, certification énergétique obtenue",
                            "Construction standard, certification en cours",
                            "Bâtiment spécifique difficile à reconvertir",
                            "Bâtiment obsolète ou non conforme"],
    ("D2.1", "IND"): ["Procédé industriel éprouvé, garanties de performance du fournisseur",
                      "Procédé éprouvé, garanties partielles",
                      "Procédé adapté ou montée en cadence incertaine",
                      "Procédé pilote ou non éprouvé à l'échelle"],
    ("D2.1", "AGR"): ["Itinéraire technique maîtrisé, rendements de référence documentés",
                      "Itinéraire maîtrisé, rendements sur historique court",
                      "Nouvelle culture ou nouvelle transformation sur ce site",
                      "Rendements non documentés"],
    ("D2.1", "TOU"): ["Concept éprouvé, marque internationale, conception validée",
                      "Concept éprouvé, adaptation au site en cours",
                      "Concept nouveau sur ce marché",
                      "Concept non validé"],
    ("D2.1", "MIN"): ["Réserves certifiées selon une norme reconnue, procédé éprouvé",
                      "Réserves certifiées, procédé à adapter au minerai",
                      "Ressources indiquées seulement ou essais pilotes partiels",
                      "Réserves non certifiées"],
    # ---------------------------------------------------------------- D4.1 Structure des recettes
    ("D4.1", "ENR"): ["Contrat d'achat ferme couvrant toute la dette",
                      "Contrat d'achat couvrant l'essentiel de la durée",
                      "Vente partielle au marché ou contrat plus court que la dette",
                      "Production vendue sans contrat d'achat"],
    ("D4.1", "EAU"): ["Redevance de capacité couvrant le service de la dette",
                      "Redevance de capacité majoritaire, part variable limitée",
                      "Part variable importante ou indexation incomplète",
                      "Recettes fondées sur le volume consommé"],
    ("D4.1", "TEL"): ["Contrats long terme couvrant ≥ 85 % de la capacité",
                      "Contrats couvrant 70 à 85 % de la capacité",
                      "Contrats couvrant 50 à 70 % de la capacité",
                      "Contrats couvrant moins de 50 % de la capacité"],
    ("D4.1", "TRA"): ["Paiement à la disponibilité par une autorité publique",
                      "Péage avec garantie de recettes minimales",
                      "Péage sans garantie, trafic historique établi",
                      "Péage sans garantie et sans historique de trafic"],
    ("D4.1", "POR"): ["Volumes minimaux garantis par l'armateur ou le chargeur",
                      "Client d'ancrage contractualisé, volumes partiellement garantis",
                      "Volumes non garantis, clientèle diversifiée",
                      "Volumes non garantis, client unique"],
    ("D4.1", "SAN"): ["Paiement à la disponibilité par l'autorité de santé",
                      "Paiement mixte, part fixe majoritaire",
                      "Paiement à l'activité avec conventions d'assurance maladie",
                      "Recettes à l'activité sans convention"],
    ("D4.1", "ETH"): ["Contrat d'achat de capacité et d'énergie couvrant la dette",
                      "Contrat de capacité, énergie vendue au marché",
                      "Contrat plus court que la dette",
                      "Vente au marché sans contrat"],
    ("D4.1", "IMMO-REND"): ["Baux fermes longs, durée résiduelle moyenne > dette",
                            "Baux fermes, durée résiduelle moyenne ≥ 5 ans",
                            "Baux courts ou locataire principal > 40 % des loyers",
                            "Vacance élevée ou baux résiliables à court terme"],
    ("D4.1", "IND"): ["Contrat d'enlèvement ferme couvrant la dette",
                      "Contrat d'enlèvement couvrant l'essentiel des volumes",
                      "Ventes au marché avec contrats annuels",
                      "Ventes au marché sans contrat"],
    ("D4.1", "AGR"): ["Contrats de vente pluriannuels avec prix plancher",
                      "Contrats de vente annuels avec clients récurrents",
                      "Ventes au marché, débouchés diversifiés",
                      "Débouché unique non contractualisé"],
    ("D4.1", "TOU"): ["Bail ou contrat de gestion avec loyer minimum garanti",
                      "Contrat de gestion avec engagement de résultat partiel",
                      "Contrat de gestion sans garantie, marque reconnue",
                      "Exploitation indépendante sans marque ni garantie"],
    ("D4.1", "MIN"): ["Contrats d'enlèvement couvrant la dette, prix indexé",
                      "Contrats d'enlèvement sur la majorité des volumes",
                      "Ventes au prix spot avec contrats courts",
                      "Ventes au prix spot sans contrat"],
    # ---------------------------------------------------------------- D4.3 Marché
    ("D4.3", "ENR"): ["Production prioritaire, aucun risque d'écrêtement",
                      "Écrêtement faible et compensé",
                      "Écrêtement possible non compensé",
                      "Saturation du réseau ou baisse de prix probable"],
    ("D4.3", "EAU"): ["Déficit hydrique structurel, aucune alternative",
                      "Demande solide, alternatives coûteuses",
                      "Concurrence d'autres ressources en eau",
                      "Demande incertaine ou surcapacité"],
    ("D4.3", "TEL"): ["Marché en pénurie de capacité, clients de premier rang",
                      "Demande soutenue, concurrence limitée",
                      "Nouvelles capacités concurrentes annoncées",
                      "Surcapacité ou baisse des prix de colocation"],
    ("D4.3", "TRA"): ["Itinéraire sans alternative, trafic en croissance",
                      "Alternative gratuite peu attractive",
                      "Itinéraire concurrent ou report modal possible",
                      "Trafic en baisse ou alternative concurrente forte"],
    ("D4.3", "POR"): ["Hinterland captif, aucun port concurrent proche",
                      "Hinterland solide, concurrence régionale limitée",
                      "Concurrence portuaire active sur le transbordement",
                      "Surcapacité portuaire régionale"],
    ("D4.3", "SAN"): ["Besoin de lits avéré, aucune offre concurrente",
                      "Besoin avéré, offre concurrente limitée",
                      "Concurrence de cliniques privées ou de l'hôpital public",
                      "Offre excédentaire dans la zone"],
    ("D4.3", "ETH"): ["Appel prioritaire, besoin de pointe structurel",
                      "Besoin de capacité établi",
                      "Appel incertain face aux renouvelables",
                      "Surcapacité de production"],
    ("D4.3", "IMMO-REND"): ["Zone prime, vacance de marché < 5 %",
                            "Bonne localisation, vacance de marché < 10 %",
                            "Vacance de marché de 10 à 20 % ou offre nouvelle importante",
                            "Vacance de marché > 20 % ou loyers en baisse"],
    ("D4.3", "IND"): ["Produit indispensable, coûts parmi les plus bas du marché",
                      "Position concurrentielle solide",
                      "Concurrence par les importations ou prix volatils",
                      "Surcapacité ou position de coût défavorable"],
    ("D4.3", "AGR"): ["Demande soutenue, prix stables",
                      "Demande solide, volatilité de prix modérée",
                      "Prix volatils ou dépendance à l'export",
                      "Prix en baisse ou débouchés incertains"],
    ("D4.3", "TOU"): ["Destination établie, RevPAR stable sur 5 ans",
                      "Destination établie, saisonnalité marquée",
                      "Offre nouvelle importante ou destination émergente",
                      "Destination en déclin ou suroffre"],
    ("D4.3", "MIN"): ["Coût de production dans le premier quartile mondial",
                      "Coût de production dans la première moitié",
                      "Coût de production dans le troisième quartile",
                      "Coût de production dans le dernier quartile"],
    # ---------------------------------------------------------------- D5.2 Performance
    ("D5.2", "ENR"): ["Disponibilité ≥ 98 %, productible réel ≥ P50",
                      "Disponibilité ≥ 97 %, productible entre P90 et P50",
                      "Disponibilité < 97 % ou productible proche du P90",
                      "Productible durablement sous le P90"],
    ("D5.2", "EAU"): ["Disponibilité ≥ 98 %, consommation sous la garantie",
                      "Disponibilité conforme au contrat",
                      "Disponibilité sous le contrat, déductions appliquées",
                      "Disponibilité durablement inférieure, déductions lourdes"],
    ("D5.2", "TEL"): ["Disponibilité 99,98 %, PUE sous la cible",
                      "Disponibilité conforme aux engagements clients",
                      "Incidents ponctuels, pénalités clients appliquées",
                      "Incidents répétés, clients en résiliation"],
    ("D5.2", "TRA"): ["Disponibilité de la voie ≥ 99 %, aucune pénalité",
                      "Disponibilité conforme, pénalités marginales",
                      "Pénalités de disponibilité récurrentes",
                      "Indisponibilités graves ou mise en demeure"],
    ("D5.2", "POR"): ["Productivité des quais au-dessus des engagements",
                      "Productivité conforme aux engagements",
                      "Productivité inférieure, congestion ponctuelle",
                      "Productivité durablement insuffisante"],
    ("D5.2", "SAN"): ["Indicateurs de performance au-dessus du contrat",
                      "Indicateurs conformes, pénalités marginales",
                      "Pénalités de performance récurrentes",
                      "Performance insuffisante, risque de résiliation"],
    ("D5.2", "ETH"): ["Disponibilité ≥ 95 %, rendement garanti atteint",
                      "Disponibilité ≥ 92 %, rendement proche de la garantie",
                      "Disponibilité < 92 % ou rendement dégradé",
                      "Pannes répétées, pénalités de capacité lourdes"],
    ("D5.2", "IMMO-REND"): ["Taux d'occupation ≥ 95 %, entretien à jour",
                            "Taux d'occupation ≥ 90 %",
                            "Taux d'occupation de 80 à 90 %",
                            "Taux d'occupation < 80 %"],
    ("D5.2", "IND"): ["Taux d'utilisation ≥ 90 %, rendement matière garanti atteint",
                      "Taux d'utilisation de 80 à 90 %",
                      "Taux d'utilisation de 65 à 80 % ou montée en cadence lente",
                      "Taux d'utilisation < 65 %"],
    ("D5.2", "AGR"): ["Rendements ≥ référence sur 3 campagnes",
                      "Rendements proches de la référence",
                      "Rendements irréguliers selon les campagnes",
                      "Rendements durablement sous la référence"],
    ("D5.2", "TOU"): ["Occupation et prix au-dessus du plan d'affaires",
                      "Occupation et prix conformes au plan",
                      "Occupation ou prix sous le plan de 10 à 20 %",
                      "Occupation ou prix sous le plan de plus de 20 %"],
    ("D5.2", "MIN"): ["Teneurs et récupération conformes au plan minier",
                      "Écarts mineurs de teneur ou de récupération",
                      "Teneur ou récupération inférieure au plan",
                      "Écarts majeurs remettant en cause le plan minier"],
}

# Bloc 4 : données sectorielles (libellé, unité). 3 à 6 champs par secteur.
CHAMPS_SECTEUR = {
    "ENR": [("Puissance installée", "MW"), ("Productible P50", "GWh/an"), ("Productible P90 (1 an)", "GWh/an"),
            ("Durée du contrat d'achat", "ans"), ("Prix du contrat d'achat", "MAD/kWh"), ("Dégradation annuelle", "%/an")],
    "EAU": [("Capacité", "m³/jour"), ("Consommation électrique garantie", "kWh/m³"),
            ("Part de la redevance de capacité", "% des recettes"), ("Part du coût de l'énergie répercutée", "%"),
            ("Durée du contrat", "ans")],
    "TEL": [("Capacité", "MW IT"), ("Taux de commercialisation", "%"), ("Durée moyenne des contrats", "ans"),
            ("Efficacité énergétique (PUE)", "ratio"), ("Part du premier client", "% des recettes")],
    "TRA": [("Trafic de référence", "véh./jour"), ("Durée de montée en charge", "ans"),
            ("Mécanisme de recettes", "péage / disponibilité"), ("Garantie de trafic ou de recettes minimum", "Oui / Non"),
            ("Durée résiduelle de la concession", "ans")],
    "POR": [("Capacité", "EVP/an ou t/an"), ("Taux d'utilisation", "%"), ("Part du premier client", "% des volumes"),
            ("Volumes minimaux garantis", "% de la capacité"), ("Durée de la concession", "ans")],
    "SAN": [("Nombre de lits", "lits"), ("Mode de paiement", "disponibilité / activité"), ("Durée du contrat", "ans"),
            ("Pénalités de performance maximales", "% du loyer")],
    "ETH": [("Puissance", "MW"), ("Rendement net", "%"), ("Durée du contrat de combustible", "ans"),
            ("Volume de combustible garanti", "% du besoin"), ("Répercussion du prix du combustible", "%")],
    "IMMO-REND": [("Surface locative", "m²"), ("Taux d'occupation", "%"), ("Durée résiduelle moyenne des baux", "ans"),
                  ("Rendement locatif (loyers / valeur)", "%"), ("Part du premier locataire", "% des loyers")],
    "IND": [("Capacité de production", "t/an"), ("Taux d'utilisation", "%"), ("Part couverte par un contrat d'enlèvement", "%"),
            ("Dépendance à une matière première importée", "% des coûts")],
    "AGR": [("Sécurisation de l'eau", "% du besoin"), ("Rendement de référence", "t/ha"),
            ("Approvisionnement amont contractualisé", "% du besoin"), ("Débouchés aval contractualisés", "% des volumes")],
    "TOU": [("Nombre de chambres", "clés"), ("Taux d'occupation", "%"), ("Prix moyen", "MAD/nuit"),
            ("Revenu par chambre disponible (RevPAR)", "MAD"), ("Part des recettes en haute saison", "%"),
            ("Contrat de gestion", "type et durée")],
    "MIN": [("Réserves prouvées et probables", "Mt"), ("Norme de certification des réserves", "texte"),
            ("Durée de vie de la mine", "ans"), ("Coût de production / prix", "%"), ("Part des ventes sous contrat", "%")],
}
NB_CHAMPS_SECTEUR = max(len(v) for v in CHAMPS_SECTEUR.values())

SECTEURS_DESC = ("D2.1", "D4.1", "D4.3", "D5.2")


def options(cle, secteur=None):
    """Les cinq choix proposés pour un sous-critère (texte complet, niveau en tête)."""
    desc = NIVEAUX_SECTEUR.get((cle, secteur)) or NIVEAUX[cle][1]
    return [f"{n}{SEP}{d}" for n, d in zip(NIVEAUX_LIB, desc)] + [INFO]


def choix(cle, secteur, note):
    """Texte de la liste correspondant à une note 100 / 80 / 50 / 20 ou « Info. insuffisante »."""
    if note is None or note == "":
        return None
    if note == INFO:
        return INFO
    return options(cle, secteur)[{100: 0, 80: 1, 50: 2, 20: 3}[note]]


# Contrôles de cohérence
for _k, (_l, _d) in NIVEAUX.items():
    assert len(_d) == 4, _k
for (_k, _s), _d in NIVEAUX_SECTEUR.items():
    assert _k in SECTEURS_DESC and len(_d) == 4, (_k, _s)
for _s in CHAMPS_SECTEUR:
    assert 3 <= len(CHAMPS_SECTEUR[_s]) <= 6, _s
    for _k in SECTEURS_DESC:
        assert (_k, _s) in NIVEAUX_SECTEUR, (_k, _s)
for _k in NIVEAUX:
    for _s in [None] + list(CHAMPS_SECTEUR):
        for _o in options(_k, _s):
            assert len(_o) <= 95, _o
