# -*- coding: utf-8 -*-
"""Douze études de cas sectorielles — dossiers FICTIFS, réalistes, construits pour
illustrer le modèle V8.1. Aucune correspondance avec une opération, une société ou
un sponsor réels. Montants en millions de dirhams (MMAD)."""

II = 'Info. insuffisante'


def per(liste, debut=1):
    """Périodes semestrielles : [(cfads, service, cfads_stressé facultatif)]."""
    out = []
    for i, x in enumerate(liste):
        an = debut + i // 2
        out.append((f'An {an} · S{i % 2 + 1}',) + tuple(x))
    return out


def base_plafonds(**k):
    d = dict(llcr=None, dsra=6, fx=0, refi=0, strategie_refi='', part_acheteur=1.0, qualite_acheteur='≥ BBB−',
             duree_contrat=None, duree_dette=None, solution_contrat='', plan_climat='', capacite_sponsor='Oui',
             operateur_remplacable='Oui', ecart_om=0, expo_groupe='Non')
    d.update(k)
    return d


def proport(**k):
    d = dict(expo=0, mad='Oui', duree=15, tech_refs='Oui', epc='Oui', acheteur_unique='Oui', premiere_ref='Non',
             consortium='Non', contrat_20='Non', nb_cp=3)
    d.update(k)
    return d


CAS = []

# 1 ─────────────────────────────────────────────────────────────── ENR
CAS.append(dict(
    code='ENR', titre="Parc éolien terrestre 140 MW", spv="« Rih Atlas » SA (fictive)", lieu="Province côtière du Nord",
    regime='R1', secteur='ENR', phase='P1', climat_eleve='Non',
    resume="Parc de 40 éoliennes vendant toute sa production à l'acheteur public national sous contrat d'achat "
           "ferme de 20 ans (quantité garantie, tarif indexé). Financement intégralement en dirhams, EPC clé-en-main.",
    enseigne="Le dossier de référence : régime M (aucune condition d'escalade), toutes les mesures du noyau favorables, "
             "aucun plafond. Il montre ce qu'il faut réunir pour atteindre la note 10.",
    proport=proport(expo=470, duree=18, contrat_20='Non', nb_cp=3),
    emplois=[('Contrat EPC (turbines, fondations, génie civil)', 1180), ('Poste de livraison et raccordement', 70),
             ('Développement, études de vent, assurances', 45), ('Contingence', 60), ('Intérêts intercalaires', 52),
             ('Dotation initiale DSRA', 35), ('BFR de démarrage', 8)],
    ressources=[('Dette senior (18 ans, 5,2 %)', 1000, 'Dette senior'), ('Fonds propres', 400, 'Fonds propres'),
                ('Prêt d’actionnaire subordonné', 50, 'Quasi-fonds propres'),
                ('Ligne de dépassement engagée par le sponsor', 160, 'Engagement sponsor')],
    exploit=[('Puissance installée', '140 MW'), ('Productible P50 / P90 (1 an)', '520 / 470 GWh/an'),
             ("Tarif du contrat d'achat", '0,45 MAD/kWh, indexé à 80 %'), ("Chiffre d'affaires", '234 MMAD/an'),
             ("Charges d'exploitation", '46 MMAD/an'), ('CFADS de référence', '172 MMAD/an'), ('Service de la dette', '96 MMAD/an')],
    choc=0.09, stress_lib="Production P90 sur un an (− 9,6 %) et charges + 5 %",
    periodes=per([(84, 48), (88, 48), (86, 48), (90, 48), (85, 48), (89, 48), (87, 48), (91, 48), (86, 47), (90, 47)]),
    n3_llcr=None, n4=100, n5=80, n6=100,
    n_lib={'N4': 'DSRA 6 mois, compte de réserve de maintenance doté, cascade signée',
           'N5': 'Quote-part de dette 69 % : fonds propres à risque solides mais sous le niveau « très favorable »',
           'N6': 'Intégralement en dirhams, taux fixé par swap sur 100 % de la dette, amortissement complet'},
    plafonds_donnees=base_plafonds(llcr=1.62, dsra=6, duree_contrat=20, duree_dette=18, plan_climat='', capacite_sponsor='Oui'),
    grille={'D1': [100, 100, 80], 'D2': [100, 100, 80], 'D3': [100, 80, 100], 'D4': [100, 80, 100],
            'D5': [100, 100, 80], 'D6': [80, 100, 100], 'D8': [100, 100, 100], 'D9': [100, 80, 100, 80]},
    commentaires={'D1': "Énergéticien international noté BBB+ associé à un fonds d'infrastructure marocain ; engagement de dépassement de 160 MMAD garanti.",
                  'D2': "Turbines d'un fabricant de premier rang, plus de 3 000 machines identiques en exploitation ; mât de mesure de 3 ans sur site.",
                  'D4': "Contrat d'achat de 20 ans couvrant la dette (18 ans) ; indexation limitée à 80 % du tarif : mécanisme de prix noté Favorable.",
                  'D6': "Acheteur public de qualité interne BBB−, historique de paiement régulier ; banques prêteuses de premier rang."},
    verrous={},
))

# 2 ─────────────────────────────────────────────────────────────── EAU
CAS.append(dict(
    code='EAU', titre="Usine de dessalement couplée à l'irrigation, 120 000 m³/jour", spv="« Bahr Sud » SA (fictive)",
    lieu="Littoral du Sud", regime='R2', secteur='EAU', phase='P2', climat_eleve='Oui',
    resume="Usine d'osmose inverse rémunérée par une redevance de capacité versée par l'acheteur public (25 ans), "
           "complétée par une redevance variable. Dette pour partie en euros, couverte à 85 %.",
    enseigne="Montre la majoration de phase P2 (+ 0,05 sur les seuils), le noyau hors construction (N3 fondé sur le LLCR), "
             "un risque climatique élevé neutralisé par un plan d'adaptation financé, et l'escalade en régime L par la durée "
             "du contrat et la part en devises.",
    proport=proport(expo=520, mad='Non', duree=20, contrat_20='Oui', consortium='Oui', nb_cp=4),
    emplois=[('Contrat EPC (prise d’eau, osmose inverse, rejet)', 1060), ('Réseau de transport et stockage', 180),
             ('Développement, frais, assurances', 60), ('Intérêts intercalaires', 70), ('Dotation DSRA', 45), ('BFR', 15)],
    ressources=[('Dette senior consortiale (20 ans), dont 30 % en euros', 1000, 'Dette senior'),
                ('Fonds propres', 380, 'Fonds propres'), ('Subvention d’investissement encaissée', 60, 'Subvention encaissée')],
    exploit=[('Capacité', '120 000 m³/jour'), ('Consommation électrique garantie', '3,4 kWh/m³'),
             ('Redevance de capacité', '72 % des recettes'), ("Chiffre d'affaires", '205 MMAD/an'),
             ('CFADS de référence', '128 MMAD/an'), ('Service de la dette', '98 MMAD/an')],
    choc=0.08, stress_lib="Disponibilité 93 % au lieu de 98 % et hausse non répercutée du coût de l'énergie",
    periodes=per([(63, 49), (64, 49), (66, 49), (65, 49), (67, 49), (66, 49), (68, 49), (67, 49), (69, 49), (68, 49)]),
    n3_llcr=80, n4=80, n5=80, n6=50,
    n_lib={'N3': 'LLCR 1,38 : Favorable', 'N4': 'DSRA 6 mois mais pas de réserve de gros entretien dotée à la réception',
           'N5': 'Quote-part de dette 70 %', 'N6': 'Dette à 30 % en euros couverte à 85 % : exposition nette résiduelle de 12 % du service'},
    plafonds_donnees=base_plafonds(llcr=1.38, dsra=6, fx=0.12, duree_contrat=25, duree_dette=20, plan_climat='Oui', part_acheteur=0.95, qualite_acheteur='≥ BBB−'),
    grille={'D1': [80, 80, 80], 'D2': [80, 80, 80], 'D3': [80, 80, 80], 'D4': [100, 80, 80],
            'D5': [80, 50, 80], 'D6': [80, 50, 80], 'D8': [80, 80, 80], 'D9': [80, 80, 80, 50]},
    commentaires={'D5': "Disponibilité moyenne de 96 % sur 12 mois, sous la garantie de 98 % : pénalités appliquées deux fois.",
                  'D6': "Fournisseur unique de membranes ; acheteur public adossé à l'État.",
                  'D9': "Site exposé à l'élévation du niveau marin et aux tempêtes : plan d'adaptation de 25 MMAD financé (C11 non actif)."},
    verrous={},
))

# 3 ─────────────────────────────────────────────────────────────── TEL
CAS.append(dict(
    code='TEL', titre="Centre de données Tier III, 24 MW informatiques", spv="« Data Atlas » SA (fictive)",
    lieu="Zone industrielle périurbaine", regime='R3', secteur='TEL', phase='P2', climat_eleve='Non',
    resume="Centre de données en colocation commercialisé à 62 % après 15 mois ; contrats clients de 5 à 10 ans "
           "rémunérant la capacité réservée, le reste étant exposé au rythme de commercialisation.",
    enseigne="Le scénario défavorable fait tomber le DSCR sous 1,00 : plafond C3 (note 4 au plus) malgré un score de 6. "
             "Le plafond fait aussi passer le régime calculé M en régime L.",
    proport=proport(expo=360, duree=12, nb_cp=3),
    emplois=[('Bâtiment et équipements techniques', 720), ('Raccordement électrique double alimentation', 90),
             ('Développement et frais', 40), ('Intérêts intercalaires', 35), ('Dotation DSRA', 30), ('BFR', 10)],
    ressources=[('Dette senior (12 ans, 6,1 %)', 600, 'Dette senior'), ('Fonds propres', 340, 'Fonds propres')],
    exploit=[('Capacité', '24 MW informatiques'), ('Taux de commercialisation', '62 % (cible 85 % en année 4)'),
             ('Durée moyenne des contrats', '6,5 ans'), ("Efficacité énergétique (PUE)", '1,45'),
             ("Chiffre d'affaires année 3", '210 MMAD'), ('CFADS de référence', '118 MMAD/an')],
    choc=0.33, stress_lib="Commercialisation bloquée à 62 % et départ d'un client de 4 MW",
    periodes=per([(56, 38), (57, 38), (59, 39), (62, 40), (64, 41), (66, 41), (67, 42), (68, 42)], debut=2),
    n3_llcr=80, n4=80, n5=80, n6=80,
    n_lib={'N3': 'LLCR 1,41', 'N4': 'DSRA 6 mois', 'N5': 'Quote-part de dette 64 %', 'N6': 'Taux variable couvert à 70 %'},
    plafonds_donnees=base_plafonds(llcr=1.41, dsra=6, duree_contrat=7, duree_dette=12, solution_contrat='Oui', part_acheteur=0.35),
    grille={'D1': [80, 80, 80], 'D2': [100, 80, 80], 'D3': [80, 80, 80], 'D4': [50, 80, 50],
            'D5': [80, 80, 80], 'D6': [80, 80, 80], 'D8': [80, 80, 80], 'D9': [80, 80, 80, 80]},
    commentaires={'D4': "Recettes contractuelles sur 62 % de la capacité ; renouvellements et commercialisation du solde exposés au marché.",
                  'D6': "Clients de premier rang (opérateurs, banques) ; aucun client au-delà de 35 % des recettes."},
    verrous={},
))

# 4 ─────────────────────────────────────────────────────────────── TRA
CAS.append(dict(
    code='TRA', titre="Autoroute à péage de 95 km", spv="« Trik Express » SA (fictive)", lieu="Corridor interurbain",
    regime='R4', secteur='TRA', phase='P3', climat_eleve='Non',
    resume="Concession de 30 ans en exploitation depuis 6 ans ; recettes de péage exposées au trafic, sans garantie de recettes "
           "minimales. Refinancement de la dette de construction réalisé en 2025.",
    enseigne="Régime R4 : les seuils DSCR sont les plus exigeants (1,40 critique avec Δ transport). Un DSCR minimum de 1,37 "
             "déclenche C2. Le plafond C5 est sans objet en R4, faute de contrat de recettes. Le régime R4 impose le régime L.",
    proport=proport(expo=650, duree=16, contrat_20='Oui', consortium='Oui', nb_cp=2),
    emplois=[('Refinancement de la dette de construction', 2350), ('Travaux d’élargissement (2×3 voies, 18 km)', 310),
             ('Frais et DSRA', 90)],
    ressources=[('Dette senior de refinancement (16 ans)', 2200, 'Dette senior'), ('Fonds propres existants et réinvestis', 650, 'Fonds propres')],
    exploit=[('Trafic moyen journalier', '21 400 véhicules (+ 3,1 %/an sur 5 ans)'), ('Tarif moyen', '0,62 MAD/km, indexé'),
             ("Chiffre d'affaires", '445 MMAD/an'), ('CFADS de référence', '305 MMAD/an'), ('Service de la dette', '218 MMAD/an')],
    choc=0.15, stress_lib="Trafic − 15 % (récession et report modal)",
    periodes=per([(150, 108), (154, 108), (149, 109), (158, 109), (152, 110), (162, 110), (158, 111), (166, 111), (162, 112), (171, 112)], debut=7),
    n3_llcr=80, n4=100, n5=80, n6=80,
    n_lib={'N3': 'LLCR 1,42', 'N4': 'DSRA 6 mois et réserve de gros entretien dotée', 'N5': 'Quote-part de dette 80 %', 'N6': 'Taux fixe à 75 %'},
    plafonds_donnees=base_plafonds(llcr=1.42, dsra=6, duree_contrat=None, duree_dette=16, part_acheteur=0.0, qualite_acheteur='Non noté'),
    grille={'D1': [80, 50, 80], 'D2': [100, 80, 80], 'D3': [80, 80, 80], 'D4': [50, 80, 50],
            'D5': [80, 80, 80], 'D6': [80, 80, 100], 'D8': [80, 80, 100], 'D9': [80, 80, 80, 80]},
    commentaires={'D4': "Pas de garantie de trafic ni de recettes minimales : structure des recettes notée Vigilance. Indexation contractuelle des tarifs.",
                  'D1': "Concessionnaire expérimenté ; aucune obligation juridique de soutien au-delà des fonds propres apportés."},
    verrous={},
))

# 5 ─────────────────────────────────────────────────────────────── POR
CAS.append(dict(
    code='POR', titre="Terminal à conteneurs de 1,2 million d'EVP", spv="« Marsa Terminal » SA (fictive)",
    lieu="Port en eau profonde", regime='R3', secteur='POR', phase='P1', climat_eleve='Non',
    resume="Concession de 30 ans ; un armateur international s'engage sur un volume minimum couvrant 60 % de la capacité "
           "et apporte 90 % du trafic attendu. Contrat de construction encore en négociation finale.",
    enseigne="Construction avec un financement à terminaison couvert à 97 % seulement : N3 Vigilance grâce au plan de remédiation "
             "approuvé (sans plan, Critique). EPC non signé : blocage B2, note provisoire. Concentration sur un armateur non noté (C10) "
             "et exposition du groupe sur le transport maritime (C14).",
    proport=proport(expo=700, duree=18, epc='Non', contrat_20='Oui', consortium='Oui', nb_cp=4),
    emplois=[('Quais, terre-pleins, génie civil', 1450), ('Portiques et équipements', 620), ('Systèmes et frais', 110),
             ('Contingence', 120), ('Intérêts intercalaires', 140), ('Dotation DSRA', 60)],
    ressources=[('Dette senior consortiale (18 ans)', 1700, 'Dette senior'), ('Fonds propres', 725, 'Fonds propres')],
    exploit=[('Capacité', '1,2 million EVP/an'), ('Volume minimum garanti', '720 000 EVP/an (60 %)'),
             ("Part du premier client", '90 % du trafic'), ("Chiffre d'affaires cible", '520 MMAD/an'), ('CFADS de référence', '300 MMAD/an')],
    choc=0.12, stress_lib="Trafic ramené au volume minimum garanti",
    periodes=per([(140, 95), (146, 95), (150, 96), (152, 96), (155, 97), (158, 97), (160, 98), (162, 98)], debut=4),
    plan_remediation='Oui', n3_llcr=None, n4=80, n5=80, n6=80,
    n_lib={'N4': 'DSRA 6 mois', 'N5': 'Quote-part de dette 68 %', 'N6': 'Recettes en dirhams indexées au dollar, dette en dirhams'},
    plafonds_donnees=base_plafonds(llcr=1.35, dsra=6, duree_contrat=30, duree_dette=18, part_acheteur=0.90, qualite_acheteur='Non noté',
                                   expo_groupe='Oui'),
    grille={'D1': [80, 80, 80], 'D2': [80, 80, 50], 'D3': [50, 50, 80], 'D4': [80, 80, 80],
            'D5': [80, 80, 80], 'D6': [50, 80, 80], 'D8': [80, 80, 80], 'D9': [80, 80, 80, 80]},
    commentaires={'D3': "Contrat de construction non signé (prix et délai encore ouverts) ; interfaces quais / équipements portées par la SPV.",
                  'D6': "Armateur apportant 90 % du trafic, non noté par la banque : acheteur principal noté Vigilance, plafond C10."},
    verrous={'B2': 'Oui'},
))

# 6 ─────────────────────────────────────────────────────────────── SAN
CAS.append(dict(
    code='SAN', titre="Centre hospitalier de 600 lits en partenariat public-privé", spv="« Shifa PPP » SA (fictive)",
    lieu="Capitale régionale", regime='R2', secteur='SAN', phase='P1', climat_eleve='Non',
    resume="Conception, construction, financement et maintenance d'un hôpital ; l'autorité publique verse un loyer de "
           "disponibilité pendant 20 ans, minoré de pénalités de performance. L'exploitation médicale reste publique.",
    enseigne="Deux sous-critères en « Info. insuffisante » : ils comptent pour 20, la complétude tombe sous 100 % (blocage B7) "
             "et le plafond C15 s'applique. Le contrat de maintenance biomédicale expire 7 ans avant la dette avec un prestataire "
             "non remplaçable (C13).",
    proport=proport(expo=420, duree=20, nb_cp=3),
    emplois=[('Contrat de conception-construction', 980), ('Équipements biomédicaux lourds', 170), ('Frais et assurances', 50),
             ('Contingence', 55), ('Intérêts intercalaires', 60), ('Dotation DSRA', 30)],
    ressources=[('Dette senior (20 ans)', 1000, 'Dette senior'), ('Fonds propres', 300, 'Fonds propres'),
                ('Garantie de bonne fin du constructeur', 60, 'Autre ressource')],
    exploit=[('Capacité', '600 lits'), ('Loyer de disponibilité', '148 MMAD/an, indexé'), ('Pénalités maximales', '10 % du loyer'),
             ('CFADS de référence', '118 MMAD/an'), ('Service de la dette', '94 MMAD/an')],
    choc=0.07, stress_lib="Pénalités de performance au maximum contractuel",
    periodes=per([(58, 47), (59, 47), (60, 47), (60, 47), (61, 47), (61, 47), (62, 47), (62, 47)], debut=3),
    n3_llcr=None, n4=80, n5=80, n6=100,
    n_lib={'N4': 'DSRA 6 mois', 'N5': 'Quote-part de dette 74 %', 'N6': 'Intégralement en dirhams, taux fixe'},
    plafonds_donnees=base_plafonds(llcr=1.30, dsra=6, duree_contrat=20, duree_dette=20, part_acheteur=1.0, qualite_acheteur='≥ BBB−',
                                   operateur_remplacable='Non', ecart_om=7),
    grille={'D1': [80, 80, 80], 'D2': [80, 100, 80], 'D3': [80, 80, 100], 'D4': [100, 80, 100],
            'D5': [50, 80, II], 'D6': [100, 80, 80], 'D8': [80, 80, 80], 'D9': [80, II, 80, 80]},
    commentaires={'D5': "Coûts de gros entretien : aucun plan pluriannuel chiffré fourni (« Info. insuffisante »).",
                  'D9': "Étude d'impact social et plan de réinstallation des occupants du site non reçus (« Info. insuffisante »)."},
    verrous={},
))

# 7 ─────────────────────────────────────────────────────────────── ETH
CAS.append(dict(
    code='ETH', titre="Centrale à cycle combiné au gaz de 450 MW", spv="« Nour Gaz » SA (fictive)", lieu="Zone portuaire",
    regime='R1', secteur='ETH', phase='P3', climat_eleve='Non',
    resume="Centrale en exploitation depuis 8 ans, rémunérée par un contrat d'achat de capacité (tolling) ; le combustible "
           "est fourni par l'acheteur. La dette restante comporte un remboursement final de 35 % du nominal à refinancer.",
    enseigne="Un LLCR de 1,08 déclenche C4 (note 4 au plus) ; le ballon de 35 % sans stratégie de refinancement approuvée déclenche "
             "C8 (5). Le plafond le plus contraignant s'applique : 4.",
    proport=proport(expo=800, duree=10, contrat_20='Non', consortium='Oui', nb_cp=3),
    emplois=[('Refinancement partiel et rénovation des turbines', 1650)],
    ressources=[('Dette senior (10 ans, ballon 35 %)', 1300, 'Dette senior'), ('Fonds propres', 350, 'Fonds propres')],
    exploit=[('Puissance', '450 MW'), ('Disponibilité garantie', '92 %'), ('Paiement de capacité', '310 MMAD/an'),
             ('CFADS de référence', '238 MMAD/an'), ('Service de la dette (hors ballon)', '186 MMAD/an')],
    choc=0.12, stress_lib="Indisponibilité prolongée d'une turbine à gaz (6 mois)",
    periodes=per([(118, 92), (120, 92), (119, 93), (121, 93), (120, 94), (122, 94), (120, 94), (123, 94)], debut=9),
    n3_llcr=20, n4=80, n5=80, n6=50,
    n_lib={'N3': 'LLCR 1,08 : Critique', 'N4': 'DSRA 6 mois', 'N5': 'Quote-part de dette 79 %',
           'N6': 'Remboursement final de 35 % à refinancer, sans stratégie approuvée'},
    plafonds_donnees=base_plafonds(llcr=1.08, dsra=6, refi=0.35, strategie_refi='Non', duree_contrat=12, duree_dette=10,
                                   part_acheteur=1.0, qualite_acheteur='≥ BBB−'),
    grille={'D1': [80, 80, 80], 'D2': [80, 80, 80], 'D3': [80, 80, 80], 'D4': [100, 80, 80],
            'D5': [80, 80, 50], 'D6': [80, 80, 80], 'D8': [80, 80, 80], 'D9': [50, 80, 80, 50]},
    commentaires={'D5': "Révisions majeures des turbines à financer en années 10 et 14 ; dépendance au constructeur d'origine pour les pièces.",
                  'D9': "Émissions de CO₂ : exposition aux futures obligations de réduction (climat de transition noté Vigilance)."},
    verrous={},
))

# 8 ─────────────────────────────────────────────────────────────── IMMO-REND
CAS.append(dict(
    code='IMMO-REND', titre="Ensemble de bureaux et commerces loués, 48 000 m²", spv="« Arkane Business Park » SA (fictive)",
    lieu="Quartier d'affaires", regime='R3', secteur='IMMO-REND', phase='P3', climat_eleve='Non',
    resume="Actif livré et loué à 91 % à 26 locataires ; durée résiduelle moyenne des baux de 5,2 ans. Financement de "
           "rachat à fort levier, avec une réserve de service de la dette de 2 mois seulement.",
    enseigne="Deux plafonds se cumulent : DSRA de 2 mois (C7, note 6 au plus) et quote-part de dette de 88 % (C9, note 5 au plus). "
             "La note approuvée retient le plus contraignant, 5. Le plafond fait passer le régime M en L.",
    proport=proport(expo=480, duree=15, contrat_20='Non', nb_cp=3),
    emplois=[("Acquisition de l'actif", 640), ('Frais et droits', 30), ('Dotation DSRA', 10)],
    ressources=[('Dette senior (15 ans)', 598, 'Dette senior'), ('Fonds propres', 82, 'Fonds propres')],
    exploit=[("Taux d'occupation", '91 %'), ('Durée résiduelle moyenne des baux', '5,2 ans'), ('Loyers nets', '62 MMAD/an'),
             ('Rendement locatif', '9,7 %'), ('CFADS de référence', '56 MMAD/an'), ('Service de la dette', '40 MMAD/an')],
    choc=0.14, stress_lib="Vacance portée à 20 % et baisse des loyers de relocation de 5 %",
    periodes=per([(28.4, 20), (29.0, 20), (28.6, 20), (29.4, 20), (28.8, 20), (29.6, 20), (29.0, 20), (29.8, 20)], debut=1),
    n3_llcr=80, n4=20, n5=20, n6=80,
    n_lib={'N3': 'LLCR 1,36', 'N4': 'DSRA limitée à 2 mois de service', 'N5': 'Quote-part de dette 88 % : fonds propres très minces',
           'N6': 'Taux variable couvert à 80 %'},
    plafonds_donnees=base_plafonds(llcr=1.36, dsra=2, duree_contrat=5.2, duree_dette=15, solution_contrat='Oui', part_acheteur=0.18),
    grille={'D1': [50, 50, 80], 'D2': [100, 100, 80], 'D3': [80, 80, 80], 'D4': [80, 80, 80],
            'D5': [80, 80, 80], 'D6': [80, 80, 80], 'D8': [80, 80, 80], 'D9': [80, 80, 80, 80]},
    commentaires={'D2': "Emplacement de premier ordre, accès et stationnements ; immeuble certifié pour sa performance énergétique.",
                  'D1': "Sponsor de taille moyenne ; aucune garantie au-delà des fonds propres apportés."},
    verrous={},
))

# 9 ─────────────────────────────────────────────────────────────── IND
CAS.append(dict(
    code='IND', titre="Usine de verre plat de 600 tonnes/jour", spv="« Zujaj Industries » SA (fictive)",
    lieu="Plateforme industrielle", regime='R3', secteur='IND', phase='P2', climat_eleve='Non',
    resume="Usine mise en service il y a 14 mois ; un contrat d'enlèvement de 8 ans couvre 70 % de la production. "
           "La dette, à 40 % en euros, n'est pas couverte ; différé d'amortissement de 12 mois.",
    enseigne="Différé : les deux premières périodes (service nul) sont signalées et exclues du DSCR minimum. Exposition en euros "
             "non couverte (C6) et contrat d'enlèvement plus court que la dette sans solution (C5). L'avis juridique sur les sûretés "
             "n'est pas reçu : blocage B5 au stade du décaissement.",
    proport=proport(expo=430, mad='Non', duree=12, nb_cp=3),
    emplois=[('Four, ligne float et bâtiments', 1050), ('Utilités et raccordements', 110), ('Frais et intérêts intercalaires', 90),
             ('Dotation DSRA', 40), ('BFR', 60)],
    ressources=[('Dette senior (12 ans), dont 40 % en euros', 880, 'Dette senior'), ('Fonds propres', 470, 'Fonds propres')],
    exploit=[('Capacité', '600 t/jour'), ("Contrat d'enlèvement", '70 % de la production, 8 ans'),
             ('Part de l’export', '35 %'), ("Chiffre d'affaires", '690 MMAD/an'), ('CFADS de référence', '150 MMAD/an')],
    choc=0.18, stress_lib="Prix du gaz + 25 % non répercuté et baisse des volumes export de 15 %",
    periodes=per([(52, 0), (60, 0), (70, 50), (72, 50), (73, 51), (75, 51), (76, 52), (78, 52)], debut=2),
    n3_llcr=80, n4=80, n5=80, n6=20,
    n_lib={'N3': 'LLCR 1,33', 'N4': 'DSRA 6 mois', 'N5': 'Quote-part de dette 65 %',
           'N6': '40 % de la dette en euros, non couverte ; recettes export partielles'},
    plafonds_donnees=base_plafonds(llcr=1.33, dsra=6, fx=0.30, duree_contrat=8, duree_dette=12, solution_contrat='Non', part_acheteur=0.55),
    grille={'D1': [80, 80, 80], 'D2': [80, 80, 80], 'D3': [80, 80, 80], 'D4': [80, 50, 50],
            'D5': [80, 80, 50], 'D6': [80, 50, 80], 'D8': [80, 50, 80], 'D9': [80, 80, 80, 80]},
    commentaires={'D4': "Prix du contrat d'enlèvement indexé à 50 % sur l'énergie ; 30 % des volumes vendus au prix de marché.",
                  'D8': "Avis juridique sur l'opposabilité des sûretés non encore reçu (blocage B5)."},
    verrous={'B5': 'Oui'},
))

# 10 ────────────────────────────────────────────────────────────── AGR
CAS.append(dict(
    code='AGR', titre="Unité de trituration d'olives et de conditionnement d'huile", spv="« Zitouna Valley » SARL (fictive)",
    lieu="Région oléicole de l'intérieur", regime='R1', secteur='AGR', phase='P1', climat_eleve='Non',
    resume="Petite unité industrielle (150 MMAD) dont toute la production est achetée par un groupe agroalimentaire national "
           "noté BBB, sous contrat ferme de 10 ans. Constructeur clé-en-main, financement en dirhams sur 10 ans.",
    enseigne="Toutes les conditions du régime simplifié S sont réunies : dossier allégé. L'écart sectoriel Δ de + 0,15 rend les "
             "seuils plus exigeants qu'en énergie : un DSCR minimum de 1,37 n'est que Favorable.",
    proport=proport(expo=95, duree=10, contrat_20='Non', nb_cp=2),
    emplois=[('Contrat clé-en-main (trituration, conditionnement)', 112), ('Bâtiments et stockage', 18), ('Frais', 5),
             ('Contingence', 6), ('Intérêts intercalaires', 4), ('Dotation DSRA', 3), ('BFR', 2)],
    ressources=[('Dette senior (10 ans)', 95, 'Dette senior'), ('Fonds propres', 55, 'Fonds propres'),
                ('Subvention du fonds de développement agricole encaissée', 12, 'Subvention encaissée')],
    exploit=[('Capacité', '1 200 t d’olives/jour en campagne'), ("Contrat d'achat", '100 % de la production, 10 ans'),
             ('Approvisionnement amont', '1 400 producteurs sous contrat'), ("Chiffre d'affaires", '88 MMAD/an'),
             ('CFADS de référence', '19,5 MMAD/an'), ('Service de la dette', '14 MMAD/an')],
    choc=0.08, stress_lib="Campagne oléicole déficitaire (− 25 % d'olives) partiellement compensée par le prix",
    periodes=per([(9.6, 7), (10.0, 7), (9.8, 7), (10.2, 7), (9.7, 7), (10.1, 7), (9.9, 7), (10.3, 7)], debut=1),
    n3_llcr=None, n4=80, n5=80, n6=100,
    n_lib={'N4': 'DSRA 6 mois', 'N5': 'Quote-part de dette 64 %', 'N6': 'Intégralement en dirhams, taux fixe'},
    plafonds_donnees=base_plafonds(llcr=1.40, dsra=6, duree_contrat=10, duree_dette=10, part_acheteur=1.0, qualite_acheteur='≥ BBB−'),
    grille={'D1': [80, 80, 80], 'D2': [80, 80, 100], 'D3': [100, 80, 80], 'D4': [100, 80, 80],
            'D5': [80, 80, 80], 'D6': [100, 50, 80], 'D8': [80, 80, 80], 'D9': [50, 80, 80, 50]},
    commentaires={'D6': "Acheteur noté BBB ; dépendance à l'approvisionnement des producteurs (fournisseurs critiques notés Vigilance).",
                  'D9': "Stress hydrique de la région et rejets de margines : traitement prévu, risque climatique résiduel noté Vigilance."},
    verrous={},
))

# 11 ────────────────────────────────────────────────────────────── TOU
CAS.append(dict(
    code='TOU', titre="Complexe hôtelier balnéaire de 420 chambres", spv="« Riviera Atlantique » SA (fictive)",
    lieu="Littoral atlantique", regime='R4', secteur='TOU', phase='P2', climat_eleve='Oui',
    resume="Hôtel ouvert il y a 10 mois, exposé à la fréquentation et aux prix ; une saison basse marquée par des travaux de "
           "reprise a produit un flux de trésorerie négatif. Le titre d'occupation du domaine public maritime expire avant la dette.",
    enseigne="Le cas le plus dégradé : seuils les plus élevés (R4, Δ tourisme + 0,20, majoration P2), CFADS négatif (N1 Critique "
             "d'office), DSCR minimum sous 1,05 (C1, note 3 au plus), risque d'érosion côtière sans plan (C11), et titre d'occupation "
             "insuffisant (B4).",
    proport=proport(expo=380, duree=14, contrat_20='Non', nb_cp=3),
    emplois=[('Construction et aménagements', 690), ('Équipements et décoration', 120), ('Frais, intérêts intercalaires', 70),
             ('Dotation DSRA', 25), ('BFR', 15)],
    ressources=[('Dette senior (14 ans)', 560, 'Dette senior'), ('Fonds propres', 360, 'Fonds propres')],
    exploit=[('Chambres', '420'), ("Taux d'occupation année 1", '54 % (plan d’affaires : 68 %)'), ('Prix moyen', '1 450 MAD/nuit'),
             ('RevPAR', '783 MAD'), ("Chiffre d'affaires", '215 MMAD/an'), ('Saisonnalité', '70 % des recettes de mai à octobre')],
    choc=0.20, stress_lib="Occupation − 15 points et prix − 10 %",
    periodes=per([(-6, 32), (58, 32), (24, 33), (62, 33), (30, 33), (66, 33), (34, 34), (70, 34)], debut=1),
    n3_llcr=50, n4=50, n5=80, n6=80,
    n_lib={'N3': 'LLCR 1,18', 'N4': 'DSRA 4,5 mois ; pas de ligne de liquidité saisonnière',
           'N5': 'Quote-part de dette 61 %', 'N6': 'Recettes en partie en devises, dette en dirhams'},
    plafonds_donnees=base_plafonds(llcr=1.18, dsra=4.5, duree_contrat=None, duree_dette=14, plan_climat='Non', part_acheteur=0.25,
                                   qualite_acheteur='Non noté'),
    grille={'D1': [80, 50, 80], 'D2': [80, 50, 80], 'D3': [80, 80, 80], 'D4': [20, 50, 50],
            'D5': [80, 50, 80], 'D6': [50, 80, 80], 'D8': [80, 80, 50], 'D9': [50, 80, 80, 20]},
    commentaires={'D4': "Aucune recette contractuelle (pas de contrat de location ni de garantie d'un opérateur) : structure des recettes Critique.",
                  'D8': "Autorisation d'occupation temporaire du domaine public maritime de 12 ans pour une dette de 14 ans (blocage B4).",
                  'D9': "Recul du trait de côte documenté au droit du site ; aucun plan d'adaptation financé (C11)."},
    verrous={'B4': 'Oui'},
))

# 12 ────────────────────────────────────────────────────────────── MIN
CAS.append(dict(
    code='MIN', titre="Mine de cuivre à ciel ouvert et usine de concentration", spv="« Nhass Mining » SA (fictive)",
    lieu="Massif montagneux", regime='R4', secteur='MIN', phase='P1', climat_eleve='Non',
    resume="Projet minier en construction ; le concentré est vendu au prix du marché à un négociant international. "
           "Le contrôle de conformité révèle que ce négociant figure sur une liste de sanctions.",
    enseigne="Une exclusion X (contrepartie clé sous sanctions) : aucune note n'est produite, quel que soit le score. Le calcul est "
             "présenté pour l'apprentissage : il montre aussi un financement à terminaison couvert à 92 % (N3 Critique et blocage B3 "
             "détecté automatiquement), un sponsor sans capacité résiduelle (C12) et l'acceptabilité environnementale non obtenue (B8).",
    proport=proport(expo=900, mad='Non', duree=9, tech_refs='Oui', contrat_20='Non', consortium='Oui', nb_cp=4),
    emplois=[('Pré-découverture, usine, infrastructures', 2650), ('Fonds de réhabilitation du site', 120), ('Frais', 110),
             ('Contingence', 180), ('Intérêts intercalaires', 160), ('Dotation DSRA', 80)],
    ressources=[('Dette senior consortiale (9 ans, en dollars)', 1900, 'Dette senior'), ('Fonds propres', 1150, 'Fonds propres')],
    exploit=[('Réserves prouvées et probables', '48 Mt à 0,62 % Cu'), ('Durée de vie', '13 ans'),
             ('Coût de production', '2,45 USD/lb face à un prix de référence de 3,80 USD/lb'), ("Chiffre d'affaires", '1 450 MMAD/an'),
             ('CFADS de référence', '520 MMAD/an'), ('Service de la dette', '330 MMAD/an')],
    choc=0.30, stress_lib="Prix du cuivre − 25 % et coûts + 8 %",
    periodes=per([(250, 160), (262, 165), (270, 165), (255, 166), (248, 166), (240, 168), (236, 168), (230, 170)], debut=3),
    n3_llcr=None, n4=50, n5=80, n6=20,
    n_lib={'N4': 'DSRA 3 mois', 'N5': 'Quote-part de dette 58 %', 'N6': 'Dette en dollars ; recettes en dollars mais coûts en dirhams non couverts'},
    plafonds_donnees=base_plafonds(llcr=1.31, dsra=3, fx=0.20, duree_contrat=None, duree_dette=9, part_acheteur=1.0, qualite_acheteur='< BBB−',
                                   capacite_sponsor='Non'),
    grille={'D1': [50, 50, 50], 'D2': [80, 50, 50], 'D3': [80, 50, 80], 'D4': [50, 20, 20],
            'D5': [80, 80, 50], 'D6': [20, 50, 80], 'D8': [80, 80, 50], 'D9': [20, 50, 50, 50]},
    commentaires={'D6': "Négociant unique acheteur du concentré, inscrit sur une liste de sanctions : exclusion X3.",
                  'D9': "Étude d'impact environnemental et social non approuvée ; consultation publique en cours (B8)."},
    verrous={'X3': 'Oui', 'B8': 'Oui'},
))
