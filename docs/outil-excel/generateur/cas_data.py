# -*- coding: utf-8 -*-
"""Cas d'étude V8 — dossiers FICTIFS construits à des fins pédagogiques.
Aucune correspondance avec une opération, une société ou un sponsor réels.
Montants en millions de dirhams (MMAD) sauf mention contraire."""

CAS = {}

# =====================================================================
# CAS 1 — Centrale solaire PV 80 MWc, région de Drâa-Tafilalet
# R1 · ENR · P1 · régime M
# =====================================================================
CAS['C1'] = {
    'meta': {
        'ref': 'CAS 1', 'nom': 'Centrale solaire photovoltaïque 80 MWc',
        'spv': 'SPV « Solaris Drâa » SA (fictive)', 'lieu': 'Région de Drâa-Tafilalet',
        'secteur': 'ENR', 'secteur_lib': 'Énergies renouvelables',
        'regime': 'R1', 'regime_lib': 'Contrat ferme à quantité garantie (take-or-pay)',
        'phase': 'P1', 'phase_lib': 'Construction',
        'proport': 'M', 'proport_motif': 'CAPEX 707 MMAD : au-dessus du seuil S (200 MMAD), en deçà du seuil L (1 500 MMAD)',
        'resume': "Centrale PV vendant sa production à l'acheteur public national sous contrat d'achat de 25 ans "
                  "à quantité garantie et tarif indexé. Financement en dirhams, EPC clé-en-main forfaitaire.",
    },
    'emplois': [('Contrat EPC (modules, structures, postes)', 590), ('Raccordement au réseau', 25),
                ('Développement, frais et assurances', 20), ('Contingence', 30),
                ('Intérêts intercalaires', 18), ('Dotation initiale DSRA', 20), ('BFR de démarrage', 4)],
    'ressources': [('Dette senior (20 ans, 5,5 %)', 465), ('Fonds propres et quasi-fonds propres', 242),
                   ('Engagement sponsor de dépassement (engagé, non tiré)', 40)],
    'exploit': [('Production nette P50', '152 GWh/an'), ("Tarif du contrat d'achat", '0,48 MAD/kWh, indexé'),
                ("Chiffre d'affaires", '73 MMAD/an'), ("Charges d'exploitation", '11 MMAD/an'),
                ('EBITDA', '62 MMAD/an'), ('CFADS de référence', '54 MMAD/an'),
                ('Service de la dette', '38,9 MMAD/an, semestriel')],
    'fin': {
        'periodes': [
            {'lib': 'An 1 · S1', 'cfads': 25.9, 'service': 19.45},
            {'lib': 'An 1 · S2', 'cfads': 28.1, 'service': 19.45},
            {'lib': 'An 10 · S1', 'cfads': 25.5, 'service': 19.45},
            {'lib': 'An 10 · S2', 'cfads': 27.7, 'service': 19.45},
            {'lib': 'An 20 · S1', 'cfads': 25.2, 'service': 19.45},
            {'lib': 'An 20 · S2', 'cfads': 27.2, 'service': 19.45},
        ],
        'dscr_stresse': 1.117, 'llcr': 1.36,
        'stress_lib': 'Production P90 (− 8 %) et charges d’exploitation + 10 %',
        'n3': 80, 'n3_lib': 'Test de financement à terminaison : ressources 747 / besoin 707 = 105,7 %',
        'n4': 100, 'n4_lib': 'DSRA 6 mois de service, MRA doté, cascade de paiement signée',
        'n5': 100, 'n5_lib': 'Quote-part de dette 65,8 %, gearing 1,92, fonds propres à risque 34,2 %',
        'n6': 100, 'n6_lib': 'Intégralement en dirhams, taux fixe, amortissement complet sans ballon',
        'dsra_mois': 6.0, 'fx_net_pct': 0, 'quote_part_dette': 65.8,
    },
    'qualitatif': {
        'D1': [80, 100, 80], 'D2': [100, 80, 80], 'D3': [100, 80, 80], 'D4': [100, 80, 100],
        'D5': [80, 80, 80], 'D6': [80, 50, 100], 'D8': [80, 80, 100], 'D9': [100, 80, 80, 80],
    },
    'commentaires': {
        'D1': "Développeur international associé à un institutionnel marocain. Lettre d'engagement de fonds propres et engagement de dépassement signés : l'obligation juridique de soutien est établie, pas seulement la capacité.",
        'D3': "EPC clé-en-main forfaitaire à prix et délai garantis, pénalités de retard plafonnées à 15 % du contrat. Interface unique restante : le raccordement, porté par un tiers.",
        'D4': "Contrat de 25 ans couvrant intégralement la durée de la dette (20 ans). Indexation portant sur 70 % du tarif seulement : le mécanisme de prix est noté Favorable et non Très favorable.",
        'D6': "Acheteur public national, qualité de crédit interne équivalente BBB−, historique de paiement satisfaisant mais délais constatés de 60 à 90 jours. Concentration des fournisseurs de modules notée Vigilance.",
    },
    'lecon': "Cas de référence. Deux points méritent attention malgré la note élevée : le test de financement à terminaison "
             "ne donne que 5,7 % de marge, ce qui vaut 8 et non 10 sur N3 ; et le DSCR sous stress P90 tombe à 1,12, "
             "soit Vigilance. Un dossier solide n'obtient pas 10 partout.",
}

# =====================================================================
# CAS 2 — Usine de dessalement 100 000 m³/j, Souss-Massa
# R2 · EAU · P2 · régime L
# =====================================================================
CAS['C2'] = {
    'meta': {
        'ref': 'CAS 2', 'nom': 'Usine de dessalement 100 000 m³/jour',
        'spv': 'SPV « Aqua Souss » SA (fictive)', 'lieu': 'Littoral de Souss-Massa',
        'secteur': 'EAU', 'secteur_lib': 'Eau et dessalement',
        'regime': 'R2', 'regime_lib': 'Paiement à la disponibilité',
        'phase': 'P2', 'phase_lib': 'Montée en charge (18 mois après réception)',
        'proport': 'L', 'proport_motif': 'CAPEX 2 400 MMAD > 1 500 MMAD ; consortium bancaire ; dette partiellement en euros',
        'resume': "Usine d'osmose inverse rémunérée par une redevance de capacité versée par l'acheteur public, "
                  "assortie d'une redevance variable répercutant le coût de l'énergie dans une limite plafonnée.",
    },
    'emplois': [('Contrat EPC (prise d’eau, osmose inverse, rejet)', 1780), ('Canalisations et raccordement électrique', 240),
                ('Développement, frais et assurances', 95), ('Contingence', 110),
                ('Intérêts intercalaires', 100), ('Dotation initiale DSRA', 50), ('BFR de démarrage', 25)],
    'ressources': [('Dette senior (20 ans, 6,0 %), dont 35 % en euros', 1680), ('Fonds propres', 720)],
    'exploit': [('Capacité contractuelle', '100 000 m³/jour'), ('Redevance de capacité', '290 MMAD/an'),
                ('Redevance variable énergie', 'Répercutée à 60 % seulement au-delà d’un plafond'),
                ('Charges hors énergie', '60 MMAD/an'), ('EBITDA', '230 MMAD/an'),
                ('CFADS à régime établi', '196 MMAD/an'), ('Service de la dette', '146,5 MMAD/an, semestriel')],
    'fin': {
        'periodes': [
            {'lib': 'An 1 · S1 (disponibilité 94 %)', 'cfads': 90.0, 'service': 73.25},
            {'lib': 'An 1 · S2 (disponibilité 95 %)', 'cfads': 93.0, 'service': 73.25},
            {'lib': 'An 3 · S1 (régime établi)', 'cfads': 97.0, 'service': 73.25},
            {'lib': 'An 3 · S2 (régime établi)', 'cfads': 99.0, 'service': 73.25},
        ],
        'dscr_stresse': 1.094, 'llcr': 1.34,
        'stress_lib': 'Coût de l’énergie + 15 % répercuté à 60 % seulement, disponibilité ramenée à 92 %',
        'n3': 80, 'n3_lib': 'LLCR 1,34 — couverture acceptable sur la durée du prêt',
        'n4': 80, 'n4_lib': 'DSRA 4 mois de service ; pas de ligne de secours dédiée',
        'n5': 80, 'n5_lib': 'Quote-part de dette 70 %, gearing 2,33',
        'n6': 50, 'n6_lib': '35 % de la dette en euros, couverte à 60 % : exposition nette 14 % du service',
        'dsra_mois': 4.0, 'fx_net_pct': 14, 'quote_part_dette': 70.0,
    },
    'qualitatif': {
        'D1': [80, 80, 80], 'D2': [100, 50, 80], 'D3': [80, 50, 50], 'D4': [80, 50, 100],
        'D5': [80, 50, 50], 'D6': [80, 50, 100], 'D8': [80, 50, 80], 'D9': [50, 80, 80, 80],
    },
    'commentaires': {
        'D2': "Technologie d'osmose inverse largement éprouvée, notée Très favorable. Le site concentre le risque : prise d'eau en mer, exutoire de saumure, autorisation d'occupation du domaine public maritime — noté Vigilance.",
        'D4': "La redevance de capacité couvre 25 ans. Le mécanisme de prix est noté Vigilance : le plafond de répercussion du coût de l'énergie laisse au projet une exposition résiduelle sur son principal poste de charges.",
        'D5': "Disponibilité constatée de 94 % contre 97 % contractuels : des déductions s'appliquent. En régime R2, la performance technique est portée par le projet, non par l'acheteur.",
        'D8': "Sûretés constituées, mais la substitution du prêteur dans l'autorisation d'occupation du domaine public maritime reste à confirmer auprès de l'autorité concédante.",
    },
    'lecon': "Un paiement à la disponibilité n'est pas un take-or-pay. L'acheteur porte le risque de demande ; le projet porte "
             "le risque de performance et, ici, une part du risque énergie. La phase de montée en charge relève le seuil de "
             "0,05, et le stress énergie fait tomber N2 à 20, ce qui suffit à ramener le noyau à 57,5.",
}

# =====================================================================
# CAS 3 — Hôtel 4 étoiles 220 clés, Marrakech
# R4 · TOU · P2 · régime L — démonstration anti-compensation
# =====================================================================
CAS['C3'] = {
    'meta': {
        'ref': 'CAS 3', 'nom': 'Hôtel 4 étoiles, 220 clés',
        'spv': 'SPV « Atlas Hospitality » SA (fictive)', 'lieu': 'Marrakech',
        'secteur': 'TOU', 'secteur_lib': 'Tourisme et hôtellerie',
        'regime': 'R4', 'regime_lib': 'Exposition au marché',
        'phase': 'P2', 'phase_lib': 'Montée en charge (deuxième année d’exploitation)',
        'proport': 'L', 'proport_motif': 'Régime de revenus R4 : escalade automatique vers le régime approfondi',
        'resume': "Hôtel exploité sous contrat de gestion par un groupe international. Aucun contrat de revenus : "
                  "prix et volume sont intégralement portés par le projet.",
    },
    'emplois': [('Construction et second œuvre', 330), ('Terrain', 60), ('Mobilier et équipements', 45),
                ('Frais, intérêts intercalaires et pré-ouverture', 30), ('Dotation initiale DSRA', 15)],
    'ressources': [('Dette senior (15 ans, 6,5 %)', 240), ('Fonds propres', 240)],
    'exploit': [('Taux d’occupation retenu', '65 %'), ('Prix moyen (ADR)', '1 350 MAD'),
                ('Chiffre d’affaires', '98 MMAD/an'), ('Charges d’exploitation', '62 MMAD/an'),
                ('EBITDA (GOP après loyer de gestion)', '36 MMAD/an'), ('CFADS', '30 MMAD/an'),
                ('Service de la dette', '25,5 MMAD/an, semestriel'),
                ('Saisonnalité', 'S1 55 % du CFADS annuel, S2 45 %')],
    'fin': {
        'periodes': [
            {'lib': 'An 2 · S1 (haute saison)', 'cfads': 16.5, 'service': 12.75},
            {'lib': 'An 2 · S2 (creux estival)', 'cfads': 13.5, 'service': 12.75},
            {'lib': 'An 5 · S1', 'cfads': 17.2, 'service': 12.75},
            {'lib': 'An 5 · S2', 'cfads': 14.1, 'service': 12.75},
        ],
        'dscr_stresse': 0.752, 'llcr': 1.175,
        'stress_lib': 'Occupation ramenée de 65 % à 55 %, soit un chiffre d’affaires en recul de 15 %',
        'n3': 50, 'n3_lib': 'LLCR 1,175 — au-dessus du plancher de 1,10 mais faible',
        'n4': 80, 'n4_lib': 'DSRA 6 mois de service, pas de ligne saisonnière dédiée',
        'n5': 100, 'n5_lib': 'Quote-part de dette 50 %, gearing 1,00 — structure très capitalisée',
        'n6': 80, 'n6_lib': 'Dirhams, taux fixe ; amortissement complet sur 15 ans',
        'dsra_mois': 6.0, 'fx_net_pct': 0, 'quote_part_dette': 50.0,
    },
    'qualitatif': {
        'D1': [100, 100, 100], 'D2': [100, 100, 80], 'D3': [100, 80, 100], 'D4': [50, 50, 50],
        'D5': [100, 80, 80], 'D6': [50, 80, 100], 'D8': [100, 100, 100], 'D9': [80, 100, 100, 50],
    },
    'commentaires': {
        'D1': "Sponsor de premier rang, fonds propres intégralement libérés, gouvernance exemplaire : le domaine est noté 100.",
        'D4': "Aucun contrat de revenus. Prix et volume sont exposés au marché, la concurrence marrakchie est intense : le domaine est noté 50 sur ses trois sous-critères.",
        'D8': "Documentation, sûretés et autorisations sans réserve : le domaine est noté 100.",
        'D9': "Consommation d'eau en zone de stress hydrique : le climat résiduel est noté Vigilance malgré un dossier social et environnemental de bonne facture.",
    },
    'lecon': "C'est la démonstration centrale du modèle. Le dossier est excellent presque partout : D1 et D8 à 100, D3 à 95, "
             "D2 à 95. Le score calculé atteint 73,7, soit la note 7. Mais le DSCR minimum tombe à 1,06 sur le creux estival, "
             "très en dessous du seuil critique de 1,60 applicable à un hôtel exposé au marché, et le DSCR sous stress passe "
             "sous 1,00. Les plafonds C2 et C3 ramènent la note approuvée à 4. Aucune qualité de sponsor ne compense "
             "une trésorerie qui ne couvre pas une échéance.",
}

# =====================================================================
# CAS 4 A — Agro-industrie, Doukkala-Abda — structure initiale
# R3 · AGR · P3 · régime M — démonstration saisonnalité + change
# =====================================================================
_agro_qual = {
    'D1': [80, 50, 80], 'D2': [80, 50, 80], 'D4': [50, 50, 50],
    'D5': [80, 80, 50], 'D6': [50, 50, 80], 'D8': [80, 80, 80], 'D9': [50, 80, 50, 20],
}
CAS['C4A'] = {
    'meta': {
        'ref': 'CAS 4 — variante A', 'nom': 'Unité agro-industrielle de trituration et conditionnement',
        'spv': 'SPV « Doukkala Agro » SA (fictive)', 'lieu': 'Région de Doukkala-Abda',
        'secteur': 'AGR', 'secteur_lib': 'Agro-industrie',
        'regime': 'R3', 'regime_lib': 'Contrat à risque de volume',
        'phase': 'P3', 'phase_lib': 'Exploitation stabilisée',
        'proport': 'M', 'proport_motif': 'CAPEX 420 MMAD, régime R3, exposition en devises : régime standard',
        'resume': "Unité transformant une production agricole locale sous contrats d'enlèvement à prix convenu "
                  "mais volume exposé. Structure initiale : amortissement semestriel linéaire, change non couvert.",
    },
    'emplois': [('Ligne de production et bâtiments', 300), ('Stockage et froid', 70),
                ('Terrain et aménagements', 25), ('Frais et intérêts intercalaires', 17), ('Dotation DSRA', 8)],
    'ressources': [('Dette senior (10 ans, 6,0 %), amortissement linéaire', 250), ('Fonds propres', 170)],
    'exploit': [('Chiffre d’affaires', '380 MMAD/an'), ('Charges d’exploitation', '320 MMAD/an'),
                ('EBITDA', '60 MMAD/an'), ('CFADS', '52 MMAD/an'),
                ('Saisonnalité', 'Campagne concentrée sur le premier semestre : 42 MMAD contre 10 MMAD'),
                ('Service de la dette', '34 MMAD/an, soit 17 MMAD par semestre'),
                ('Achats importés non couverts', '45 MMAD/an nets des recettes à l’export')],
    'fin': {
        'periodes': [
            {'lib': 'An 3 · S1 (campagne)', 'cfads': 42.0, 'service': 17.0},
            {'lib': 'An 3 · S2 (intercampagne)', 'cfads': 10.0, 'service': 17.0},
            {'lib': 'An 6 · S1 (campagne)', 'cfads': 43.0, 'service': 17.0},
            {'lib': 'An 6 · S2 (intercampagne)', 'cfads': 10.5, 'service': 17.0},
        ],
        'dscr_stresse': 0.395, 'llcr': 1.53,
        'stress_lib': 'Récolte en recul de 20 % sous stress hydrique, soit un chiffre d’affaires en baisse de 15 %',
        'n3': 80, 'n3_lib': 'LLCR 1,53 — couverture satisfaisante sur la durée du prêt',
        'n4': 50, 'n4_lib': 'DSRA 3 mois ; aucune ligne de campagne dédiée au creux d’intercampagne',
        'n5': 100, 'n5_lib': 'Quote-part de dette 59,5 %, gearing 1,47',
        'n6': 20, 'n6_lib': 'Exposition nette en devises de 45 MMAD non couverte, soit 132 % du service annuel',
        'dsra_mois': 3.0, 'fx_net_pct': 132, 'quote_part_dette': 59.5,
    },
    'qualitatif': _agro_qual,
    'commentaires': {
        'D4': "Contrats d'enlèvement à prix convenu mais sans quantité garantie : la structure des recettes, le mécanisme de prix et le marché sont tous notés Vigilance.",
        'D9': "Le climat résiduel est noté Critique : la ressource en eau du bassin conditionne directement le volume d'intrants, sans plan d'adaptation financé.",
    },
    'lecon': "Le piège du ratio annuel. Le DSCR annuel ressort à 1,53, ce qui aurait été lu comme Favorable sur l'ancienne "
             "ligne sectorielle agro-industrie. Le DSCR minimum par échéance est de 0,59 sur le semestre d'intercampagne : "
             "l'échéance n'est pas payable sans trésorerie externe. Le plafond C1 s'applique, le stress hydrique fait passer "
             "le DSCR stressé sous 1,00 (C3) et l'exposition de change non couverte déclenche C6.",
}

# =====================================================================
# CAS 4 B — même actif, structure corrigée
# =====================================================================
CAS['C4B'] = {
    'meta': {
        'ref': 'CAS 4 — variante B', 'nom': 'Unité agro-industrielle — structure restructurée',
        'spv': 'SPV « Doukkala Agro » SA (fictive)', 'lieu': 'Région de Doukkala-Abda',
        'secteur': 'AGR', 'secteur_lib': 'Agro-industrie',
        'regime': 'R3', 'regime_lib': 'Contrat à risque de volume',
        'phase': 'P3', 'phase_lib': 'Exploitation stabilisée',
        'proport': 'M', 'proport_motif': 'Inchangé',
        'resume': "Même actif, même marché, même grille qualitative. Trois corrections de montage : amortissement "
                  "sculpté sur la campagne, apport complémentaire de 40 MMAD, couverture de change portée à 90 %.",
    },
    'emplois': [('Ligne de production et bâtiments', 300), ('Stockage et froid', 70),
                ('Terrain et aménagements', 25), ('Frais et intérêts intercalaires', 17), ('Dotation DSRA', 8)],
    'ressources': [('Dette senior (10 ans, 6,0 %), amortissement sculpté', 210), ('Fonds propres', 210),
                   ('Ligne de campagne dédiée (engagée)', 25)],
    'exploit': [('Chiffre d’affaires', '380 MMAD/an — inchangé'), ('CFADS', '52 MMAD/an — inchangé'),
                ('Service sculpté', '25 MMAD en campagne, 3,5 MMAD en intercampagne'),
                ('Couverture de change', '90 % des achats importés'),
                ('Exposition nette résiduelle', '4,5 MMAD, soit 16 % du service annuel')],
    'fin': {
        'periodes': [
            {'lib': 'An 3 · S1 (campagne)', 'cfads': 42.0, 'service': 25.0},
            {'lib': 'An 3 · S2 (intercampagne)', 'cfads': 10.0, 'service': 3.5},
            {'lib': 'An 6 · S1 (campagne)', 'cfads': 43.0, 'service': 25.0},
            {'lib': 'An 6 · S2 (intercampagne)', 'cfads': 10.5, 'service': 3.5},
        ],
        'dscr_stresse': 1.132, 'llcr': 1.82,
        'stress_lib': 'Même choc : récolte en recul de 20 % sous stress hydrique',
        'n3': 100, 'n3_lib': 'LLCR 1,82 — couverture solide après réduction de la dette',
        'n4': 100, 'n4_lib': 'DSRA 6 mois et ligne de campagne engagée de 25 MMAD',
        'n5': 100, 'n5_lib': 'Quote-part de dette 50 %, gearing 1,00',
        'n6': 80, 'n6_lib': 'Couverture de change portée à 90 % : exposition nette ramenée à 16 % du service',
        'dsra_mois': 6.0, 'fx_net_pct': 16, 'quote_part_dette': 50.0,
    },
    'qualitatif': _agro_qual,
    'commentaires': {},
    'lecon': "Trois corrections de montage, aucun changement de marché ni de grille qualitative, et la note passe de 3 à 6. "
             "Le modèle n'a pas seulement sanctionné : il a désigné précisément quoi corriger — le profil d'amortissement, "
             "le niveau de dette et la couverture de change.",
}

# =====================================================================
# CAS 5 — Autoproduction PV 12 MWc, zone industrielle de Kénitra
# R1 · ENR · P1 · régime S — démonstration proportionnalité
# =====================================================================
CAS['C5'] = {
    'meta': {
        'ref': 'CAS 5', 'nom': 'Centrale PV d’autoproduction 12 MWc',
        'spv': 'SPV « Gharb Énergie » SARL (fictive)', 'lieu': 'Zone industrielle de Kénitra',
        'secteur': 'ENR', 'secteur_lib': 'Énergies renouvelables',
        'regime': 'R1', 'regime_lib': 'Contrat ferme à quantité garantie',
        'phase': 'P1', 'phase_lib': 'Construction (EPC clé-en-main de 10 mois)',
        'proport': 'S', 'proport_motif': 'CAPEX 105,6 MMAD ≤ 200 ; exposition banque 60 MMAD ≤ 100 ; régime R1 ; '
                                         'technologie éprouvée ; dirhams uniquement ; durée 12 ans ; acheteur unique identifié',
        'resume': "Centrale vendant sa production à un industriel privé voisin sous contrat ferme de 15 ans. "
                  "Petit ticket éligible au régime d'instruction simplifié.",
    },
    'emplois': [('Contrat EPC clé-en-main', 88), ('Raccordement et poste de livraison', 7),
                ('Frais et contingence', 5), ('Intérêts intercalaires', 2), ('Dotation DSRA', 3.6)],
    'ressources': [('Dette senior (12 ans, 6,0 %)', 60), ('Fonds propres', 48)],
    'exploit': [('Production nette', '21,6 GWh/an'), ('Tarif contractuel', '0,80 MAD/kWh'),
                ('Chiffre d’affaires', '17,3 MMAD/an'), ('Charges d’exploitation', '2,3 MMAD/an'),
                ('CFADS', '13,2 MMAD/an'), ('Service de la dette', '7,16 MMAD/an, semestriel')],
    'fin': {
        'periodes': [
            {'lib': 'An 1 · S1', 'cfads': 6.3, 'service': 3.58},
            {'lib': 'An 1 · S2', 'cfads': 6.9, 'service': 3.58},
            {'lib': 'An 12 · S1', 'cfads': 6.0, 'service': 3.58},
            {'lib': 'An 12 · S2', 'cfads': 6.6, 'service': 3.58},
        ],
        'dscr_stresse': 1.564, 'llcr': 1.78,
        'stress_lib': 'Production P90 (− 8 %) et retard de paiement de l’acheteur de 90 jours',
        'n3': 80, 'n3_lib': 'Test de financement à terminaison : ressources 108 / besoin 105,6 = 102,3 %',
        'n4': 100, 'n4_lib': 'DSRA 6 mois de service',
        'n5': 100, 'n5_lib': 'Quote-part de dette 56,8 %, gearing 1,25',
        'n6': 100, 'n6_lib': 'Dirhams, taux fixe, amortissement complet',
        'dsra_mois': 6.0, 'fx_net_pct': 0, 'quote_part_dette': 56.8,
    },
    'qualitatif': {
        'D1': [80, 80, 50], 'D2': [100, 80, 100], 'D3': [80, 100, 80], 'D4': [80, 50, 80],
        'D5': [80, 80, 80], 'D6': [50, 80, 80], 'D8': [80, 80, 80], 'D9': [100, 80, 50, 80],
    },
    'plafonds': [('C10', "Acheteur portant 100 % des recettes, qualité de crédit interne inférieure à BBB−", 6)],
    'commentaires': {
        'D6': "L'acheteur est un industriel privé non noté, qui porte 100 % des recettes du projet. L'analyse interne le situe en catégorie spéculative. Aucun preneur de substitution n'est identifié à ce tarif.",
    },
    'lecon': "Le régime simplifié en action : 25 notes de sous-critère au lieu de 75, aucune revue externe imposée. "
             "Le noyau financier reste complet et ressort à 97, ce qui est excellent. Mais la concentration sur un acheteur "
             "unique non noté déclenche le plafond C10, et la note approuvée tombe de 8 à 6. Alléger la grille de jugement "
             "n'allège jamais les plafonds.",
}
