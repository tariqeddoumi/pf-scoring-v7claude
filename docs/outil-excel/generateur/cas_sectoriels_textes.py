# -*- coding: utf-8 -*-
"""Explications détaillées des douze cas : lecture d'ensemble, justification de chaque note
de la grille (domaine par domaine) et points à soumettre au comité. Les notes justifiées ici
sont celles de cas.py (100 Très favorable, 80 Favorable, 50 Vigilance, 20 Critique)."""

EXPL = {}

EXPL['ENR'] = dict(
    lecture="Un dossier de très bonne facture : sponsor solide et engagé juridiquement, technologie éprouvée, contrat d'achat ferme qui couvre toute la durée de la dette, construction confiée à un constructeur unique à prix et délai garantis, financement intégralement en dirhams. Les seules réserves portent sur l'indexation partielle du tarif, la gouvernance actionnariale (pacte récent) et le levier, qui reste dans la norme sans être exceptionnel.",
    domaines={
        'D1': "Capacité financière **100** : le sponsor principal est noté BBB+ et ses fonds propres disponibles dépassent largement l'apport restant. Obligation juridique de soutien **100** : l'engagement de dépassement de 160 MMAD est garanti par une banque. Structure actionnariale **80** : le pacte d'actionnaires est signé mais le co-investisseur marocain n'a pas encore d'historique commun avec le sponsor.",
        'D2': "Technologie **100** : turbines d'un fabricant de premier rang, plus de 3 000 machines identiques en exploitation. Site **100** : foncier acquis, accès réalisés, trois ans de mesures de vent sur site validées par un expert indépendant. Planning **80** : 22 mois de construction, réaliste mais sans marge pour les intempéries hivernales.",
        'D3': "Contrat EPC **100** : clé-en-main forfaitaire, prix et délai garantis, pénalités de retard de 15 % et garantie de bonne fin. Interfaces **80** : le raccordement au réseau reste porté par le gestionnaire du réseau, hors du contrat EPC. Assurances **100** : tous risques chantier et pertes d'exploitation anticipées souscrites, délégation au profit des prêteurs.",
        'D4': "Structure des recettes **100** : contrat d'achat ferme de 20 ans, quantité garantie, durée supérieure à la dette (18 ans). Prix **80** : indexation limitée à 80 % du tarif, la part fixe s'érode avec l'inflation. Marché **100** : aucun risque de marché, l'acheteur public achète toute la production.",
        'D5': "Opérateur **100** : contrat d'exploitation et de maintenance de 15 ans avec le turbinier, disponibilité garantie à 97 %. Performance **100** : rendement attendu documenté par l'expert indépendant. Coûts **80** : gros entretien provisionné, mais les prix des pièces après la garantie restent à négocier.",
        'D6': "Acheteur **80** : acheteur public de qualité interne BBB−, historique de paiement régulier mais délais de 60 jours observés. Fournisseurs **100** : turbinier de premier rang avec garanties de performance. Prêteurs **100** : banques marocaines de premier rang, accord intercréanciers signé.",
        'D8': "Documentation **100** : contrats signés avec accords directs prêteurs (droit de substitution). Sûretés **100** : nantissement des comptes, cession des créances du contrat d'achat et hypothèque, avis juridique sans réserve. Autorisations **100** : autorisation de production, étude d'impact et permis de construire obtenus.",
        'D9': "Environnement **100** : étude d'impact approuvée, suivi de l'avifaune prévu. Social **80** : consultation des riverains menée, mécanisme de réclamation en cours de mise en place. Gouvernance ESG **100** : plan d'action environnemental et social intégré aux contrats. Climat résiduel **80** : vents extrêmes pris en compte dans le dimensionnement, sans étude climatique prospective.",
    },
    comite=["Vérifier l'ajustement de l'indexation tarifaire lors de la revue annuelle.", "Suivre la mise en place du mécanisme de réclamation des riverains avant la mise en service."],
)

EXPL['EAU'] = dict(
    lecture="Projet utile et structurellement sain (paiement à la disponibilité par un acheteur adossé à l'État), mais en phase de montée en charge : la disponibilité constatée est inférieure à la garantie, la dette en euros n'est couverte qu'à 85 % et le site est exposé aux risques côtiers. Aucun plafond ne s'applique : le risque climatique est traité par un plan financé.",
    domaines={
        'D1': "Capacité financière **80**, soutien **80** et gouvernance **80** : consortium d'un spécialiste international du dessalement et d'un groupe marocain, solide sans être noté ; soutien juridique limité aux fonds propres et à une garantie de complétion désormais levée.",
        'D2': "Technologie **80** : osmose inverse éprouvée, mais à une échelle de 120 000 m³/j encore peu répandue. Site **80** et planning **80** : prise d'eau et rejet autorisés, réception intervenue avec trois mois de retard.",
        'D3': "Construction **80** sur les trois sous-critères : l'usine est réceptionnée ; il reste des réserves mineures et une garantie de parfait achèvement de 24 mois en cours. En phase P2, ce domaine ne pèse plus que 8 %.",
        'D4': "Structure des recettes **100** : redevance de capacité représentant 72 % des recettes, due dès lors que l'usine est disponible. Prix **80** : redevance variable répercutant l'énergie dans une limite plafonnée. Marché **80** : besoin en eau structurel de la région, sans concurrence directe.",
        'D5': "Opérateur **80** : exploitant du groupe constructeur. Performance **50** : disponibilité de 96 % sur 12 mois contre 98 % garantis, pénalités appliquées deux fois. Coûts **80** : consommation électrique conforme à la garantie (3,4 kWh/m³).",
        'D6': "Acheteur **80** : office public adossé à l'État. Fournisseurs **50** : fournisseur unique de membranes, sans second fournisseur qualifié. Prêteurs **80** : consortium de quatre banques, accord intercréanciers signé.",
        'D8': "Documentation, sûretés et autorisations **80** : ensemble complet et opposable ; l'avis juridique relève une réserve mineure sur la cession des créances publiques, levée par une autorisation à obtenir.",
        'D9': "Environnement **80** : suivi des rejets de saumure conforme. Social **80** et gouvernance ESG **80** : plan d'action suivi. Climat résiduel **50** : élévation du niveau marin et tempêtes ; le plan d'adaptation de 25 MMAD est financé, ce qui neutralise le plafond C11, mais le risque résiduel reste noté Vigilance.",
    },
    comite=["Exiger le retour de la disponibilité à 98 % avant la fin de la montée en charge.", "Porter la couverture de change de 85 % à 100 % (N6 et escalade en régime L).", "Qualifier un second fournisseur de membranes."],
)

EXPL['TEL'] = dict(
    lecture="Un actif de qualité, mais un modèle de recettes encore en construction : 62 % de la capacité est contractualisée, le reste dépend du rythme de commercialisation. Le score (74,6) donnerait la note 7, mais le scénario défavorable fait tomber le DSCR sous 1,00 : la note est plafonnée à 4. C'est l'illustration type d'un risque que la moyenne masquerait.",
    domaines={
        'D1': "Les trois sous-critères à **80** : opérateur de centres de données présent dans plusieurs pays, associé à un investisseur institutionnel ; soutien limité aux fonds propres apportés.",
        'D2': "Technologie **100** : conception Tier III certifiée, redondances électriques et de refroidissement. Site **80** : double alimentation électrique, mais une seule arrivée de fibre est réalisée. Planning **80** : extension modulaire prévue.",
        'D3': "Les trois sous-critères à **80** : bâtiment réceptionné, extension modulaire confiée au même constructeur ; domaine pesant 8 % en P2.",
        'D4': "Structure des recettes **50** : 62 % de la capacité seulement est contractualisée, sur des durées de 5 à 10 ans plus courtes que la dette. Prix **80** : prix indexés et répercussion de l'électricité. Marché **50** : marché en croissance mais concurrence de deux nouveaux centres annoncés.",
        'D5': "Les trois sous-critères à **80** : exploitation interne expérimentée, disponibilité de 99,98 % depuis l'ouverture, efficacité énergétique (PUE de 1,45) dans la norme.",
        'D6': "Les trois sous-critères à **80** : clients de premier rang (opérateurs, banques) sans concentration excessive (premier client à 35 %), fournisseurs d'énergie et prêteurs solides.",
        'D8': "Les trois sous-critères à **80** : contrats clients standardisés et cédés en garantie ; autorisations obtenues.",
        'D9': "Les quatre sous-critères à **80** : consommation d'énergie et d'eau suivie, contrat d'achat d'électricité verte en cours.",
    },
    comite=["Conditionner les tirages de la tranche d'extension à un taux de commercialisation de 75 %.", "Demander un compte de réserve complémentaire tant que le DSCR défavorable reste sous 1,00 (levée du plafond C3)."],
)

EXPL['TRA'] = dict(
    lecture="Autoroute en exploitation depuis six ans, avec un trafic en croissance régulière. Le dossier est bien géré mais pleinement exposé au trafic : en régime R4, les seuils DSCR sont les plus exigeants (1,40 critique avec l'écart transport). Le DSCR minimum de 1,37 est donc critique et plafonne la note à 5, alors que le score donnerait 6.",
    domaines={
        'D1': "Capacité financière **80** : concessionnaire expérimenté. Soutien **50** : aucune obligation juridique de soutien au-delà des fonds propres apportés, ce qui pèse dans un projet exposé au trafic. Gouvernance **80**.",
        'D2': "Technologie **100** : infrastructure classique, sans risque technologique. Site **80** : emprise acquise, deux tronçons sensibles aux intempéries. Planning **80** : élargissement de 18 km à réaliser en exploitation.",
        'D3': "Notes **80**, mais le domaine pèse 0 % en phase P3 : il n'entre pas dans le score. Les travaux d'élargissement sont suivis par la réserve de gros entretien.",
        'D4': "Structure des recettes **50** : péage sans garantie de trafic ni de recettes minimales. Prix **80** : tarifs indexés contractuellement. Marché **50** : concurrence d'une route nationale gratuite et du rail.",
        'D5': "Les trois sous-critères à **80** : exploitation et entretien maîtrisés, programme de grosses réparations planifié.",
        'D6': "Usagers dispersés (pas d'acheteur unique) **80** ; fournisseurs **80** ; prêteurs **100** : consortium de premier rang ayant refinancé la dette en 2025.",
        'D8': "Documentation **80** et sûretés **80** : convention de concession et accords directs avec le concédant. Autorisations **100** : toutes obtenues, aucun litige.",
        'D9': "Les quatre sous-critères à **80** : impacts maîtrisés, sécurité routière suivie.",
    },
    comite=["Le plafond C2 ne se lève qu'en améliorant le DSCR minimum au-dessus de 1,40 : allonger la maturité ou constituer une réserve de lissage.", "Suivre le trafic trimestriel face au cas de base."],
)

EXPL['POR'] = dict(
    lecture="Un terminal stratégique adossé à un armateur international, mais trois fragilités se cumulent en phase de construction : le contrat de construction n'est pas signé (blocage B2), le financement à terminaison n'est couvert qu'à 97 % (rattrapé par un plan de remédiation approuvé) et 90 % du trafic dépend d'un seul armateur non noté (C10), dans un secteur où la banque est déjà fortement exposée (C14).",
    domaines={
        'D1': "Les trois sous-critères à **80** : opérateur portuaire mondial associé à l'armateur ; engagement de fonds propres signé, sans garantie de dépassement.",
        'D2': "Technologie **80** : portiques et systèmes standards. Site **80** : bassin dragué par l'autorité portuaire. Planning **50** : calendrier serré lié au dragage et à la livraison des portiques.",
        'D3': "Contrat de construction **50** : non signé, prix et délai encore ouverts. Interfaces **50** : la SPV porte l'interface entre génie civil et équipements. Assurances **80** : programme défini, à souscrire à la signature.",
        'D4': "Les trois sous-critères à **80** : volume minimum garanti de 60 % de la capacité, tarifs indexés, demande régionale en croissance.",
        'D5': "Les trois sous-critères à **80** : l'opérateur exploite plus de 40 terminaux.",
        'D6': "Acheteur principal **50** : l'armateur apporte 90 % du trafic et n'est pas noté par la banque (plafond C10). Fournisseurs **80** et prêteurs **80**.",
        'D8': "Les trois sous-critères à **80** : convention de concession de 30 ans, droits directs prévus.",
        'D9': "Les quatre sous-critères à **80** : étude d'impact approuvée, gestion des sédiments de dragage encadrée.",
    },
    comite=["Signature du contrat de construction à prix et délai garantis : condition de l'octroi (levée de B2).", "Obtenir une garantie de la maison mère de l'armateur pour lever le plafond C10.", "Arbitrer le plafond C14 avec la direction des risques (concentration sur le transport maritime)."],
)

EXPL['SAN'] = dict(
    lecture="Un partenariat public-privé classique et solide : loyer de disponibilité versé par l'autorité publique, constructeur de premier plan, financement en dirhams. Mais le dossier est incomplet : le plan de gros entretien et l'étude d'impact social manquent. Ces deux « informations insuffisantes » coûtent des points (comptées 20), rendent la note provisoire (B7) et la plafonnent à 6 (C15).",
    domaines={
        'D1': "Les trois sous-critères à **80** : groupement d'un constructeur et d'un fonds d'infrastructure ; soutien limité aux fonds propres.",
        'D2': "Technologie **80** : bâtiment hospitalier classique. Site **100** : terrain public mis à disposition, raccordements existants. Planning **80** : 30 mois de travaux.",
        'D3': "Contrat de construction **80** : forfaitaire, pénalités plafonnées à 10 %. Interfaces **80** : équipements biomédicaux fournis par un lot séparé. Assurances **100** : programme complet et garantie de bonne fin du constructeur de 60 MMAD.",
        'D4': "Structure des recettes **100** : loyer de disponibilité de 20 ans, indépendant de l'activité médicale. Prix **80** : loyer indexé à 70 %. Marché **100** : aucun risque de demande.",
        'D5': "Opérateur **50** : la maintenance biomédicale dépend d'un prestataire non remplaçable, dont le contrat expire 7 ans avant la dette (plafond C13). Performance **80**. Coûts de gros entretien : **Info. insuffisante**, aucun plan pluriannuel chiffré n'a été fourni.",
        'D6': "Payeur **100** : autorité publique avec ligne budgétaire dédiée. Fournisseurs **80** et prêteurs **80**.",
        'D8': "Les trois sous-critères à **80** : contrat de partenariat signé, accords directs prévus, autorisations obtenues.",
        'D9': "Environnement **80**. Social : **Info. insuffisante**, l'étude d'impact social et le plan de réinstallation des occupants du site n'ont pas été reçus. Gouvernance ESG **80** et climat **80**.",
    },
    comite=["Obtenir le plan de gros entretien et l'étude d'impact social : leur réception lève B7 et C15.", "Prolonger le contrat de maintenance biomédicale jusqu'à l'échéance de la dette ou qualifier un second prestataire (levée de C13)."],
)

EXPL['ETH'] = dict(
    lecture="Une centrale qui fonctionne bien et un acheteur solide, mais une structure de dette fragile : le LLCR de 1,08 montre que les flux futurs couvrent à peine la dette restante, et 35 % du nominal reste à refinancer à l'échéance sans stratégie approuvée. Deux plafonds s'appliquent (C4 à 4, C8 à 5) : la note approuvée est 4 alors que le score donnerait 6.",
    domaines={
        'D1': "Les trois sous-critères à **80** : producteur indépendant international, présent dans la centrale depuis l'origine.",
        'D2': "Les trois sous-critères à **80** : turbines largement répandues, site portuaire raccordé au gaz.",
        'D3': "Notes **80**, mais le domaine pèse 0 % en phase P3 : il n'entre pas dans le score.",
        'D4': "Structure des recettes **100** : contrat de capacité (tolling) ; l'acheteur fournit le combustible et paie la disponibilité. Prix **80** : indexation partielle. Marché **80** : centrale nécessaire à l'équilibre du réseau.",
        'D5': "Opérateur **80** et performance **80** : disponibilité de 93 %. Coûts **50** : révisions majeures des turbines à financer en années 10 et 14 et dépendance au constructeur d'origine pour les pièces.",
        'D6': "Les trois sous-critères à **80** : acheteur public de qualité BBB−, fournisseur de maintenance de premier rang.",
        'D8': "Les trois sous-critères à **80** : documentation et sûretés en place depuis l'origine.",
        'D9': "Environnement **50** : émissions de CO₂ élevées. Social **80** et gouvernance **80**. Climat **50** : exposition aux futures obligations de réduction des émissions (risque de transition).",
    },
    comite=["Approuver une stratégie de refinancement du ballon de 35 % (levée de C8).", "Le plafond C4 (LLCR) ne se lève qu'avec une réduction de la dette ou une prolongation du contrat de capacité."],
)

EXPL['IMMO-REND'] = dict(
    lecture="Un très bel actif, bien situé et bien loué, mais financé avec trop de levier : 88 % de dette et une réserve de service de 2 mois seulement. Les deux faiblesses déclenchent chacune un plafond (C9 à 5, C7 à 6) ; le plus contraignant s'applique et la note approuvée est 5.",
    domaines={
        'D1': "Capacité financière **50** et soutien **50** : sponsor de taille moyenne, sans garantie au-delà de 82 MMAD de fonds propres. Gouvernance **80** : gestion locative confiée à un professionnel reconnu.",
        'D2': "Technologie **100** : immeuble récent certifié pour sa performance énergétique. Site **100** : emplacement de premier ordre. Planning **80** : travaux d'aménagement des surfaces vacantes à prévoir.",
        'D3': "Notes **80**, mais le domaine pèse 0 % en phase P3.",
        'D4': "Les trois sous-critères à **80** : 26 locataires, baux de 5,2 ans en moyenne, loyers indexés, marché de bureaux équilibré.",
        'D5': "Les trois sous-critères à **80** : gestionnaire expérimenté, charges maîtrisées.",
        'D6': "Les trois sous-critères à **80** : premier locataire à 18 % des loyers.",
        'D8': "Les trois sous-critères à **80** : hypothèque de premier rang, cession des loyers.",
        'D9': "Les quatre sous-critères à **80**.",
    },
    comite=["Porter la DSRA à 3 mois au moins (levée de C7).", "Réduire la dette sous 85 % du plan de financement par un apport complémentaire (levée de C9)."],
)

EXPL['IND'] = dict(
    lecture="Une usine récente, un contrat d'enlèvement avec un client de qualité, mais trois faiblesses structurelles : 40 % de la dette est en euros sans couverture (C6), le contrat d'enlèvement (8 ans) s'arrête avant la dette (12 ans) sans solution (C5), et l'avis juridique sur les sûretés n'est pas reçu (blocage B5 au décaissement). Le différé d'amortissement est correctement traité : les deux périodes sans service de la dette ne faussent pas le DSCR minimum.",
    domaines={
        'D1': "Les trois sous-critères à **80** : groupe industriel régional expérimenté, engagement de fonds propres honoré.",
        'D2': "Les trois sous-critères à **80** : technologie float éprouvée, site industriel aménagé, montée en charge conforme.",
        'D3': "Les trois sous-critères à **80** : usine réceptionnée, réserves levées ; domaine à 8 % en P2.",
        'D4': "Structure des recettes **80** : contrat d'enlèvement couvrant 70 % des volumes. Prix **50** : indexation à 50 % seulement sur l'énergie, alors que le gaz est le premier coût. Marché **50** : 30 % des volumes vendus au prix de marché, concurrence des importations.",
        'D5': "Opérateur **80** et performance **80**. Coûts **50** : forte dépendance au prix du gaz, réfection du four à prévoir vers l'année 12.",
        'D6': "Acheteur **80** : client principal de bonne qualité. Fournisseurs **50** : fournisseur unique de gaz. Prêteurs **80**.",
        'D8': "Documentation **80** et autorisations **80**. Sûretés **50** : l'avis juridique sur l'opposabilité des sûretés n'est pas encore reçu (blocage B5).",
        'D9': "Les quatre sous-critères à **80** : émissions conformes à la réglementation.",
    },
    comite=["Mettre en place une couverture de change sur la dette en euros (levée de C6 et amélioration de N6).", "Documenter la prolongation du contrat d'enlèvement jusqu'à l'échéance de la dette (levée de C5).", "Avis juridique sans réserve : condition du décaissement (levée de B5)."],
)

EXPL['AGR'] = dict(
    lecture="Un petit projet bien structuré : contrat d'achat ferme avec un groupe agroalimentaire noté BBB, constructeur clé-en-main, financement en dirhams sur 10 ans. Il réunit toutes les conditions du régime simplifié S. Il est noté 8 et non plus, parce que l'écart sectoriel de + 0,15 rend les seuils DSCR exigeants et que les risques agricoles (eau, récoltes) pèsent sur les critères environnementaux et fournisseurs.",
    domaines={
        'D1': "Les trois sous-critères à **80** : coopérative et investisseur régional, engagement de fonds propres signé.",
        'D2': "Technologie **80** et site **80** : procédé de trituration classique, terrain industriel acquis. Planning **100** : 9 mois de travaux, hors campagne oléicole.",
        'D3': "Contrat de construction **100** : clé-en-main forfaitaire à prix et délai garantis. Interfaces **80** et assurances **80**.",
        'D4': "Structure des recettes **100** : achat de 100 % de la production pendant 10 ans. Prix **80** : prix indexé sur le cours de l'huile, avec plancher. Marché **80**.",
        'D5': "Les trois sous-critères à **80** : équipe d'exploitation formée par le constructeur.",
        'D6': "Acheteur **100** : groupe agroalimentaire noté BBB. Fournisseurs **50** : approvisionnement dépendant des récoltes de 1 400 producteurs. Prêteurs **80**.",
        'D8': "Les trois sous-critères à **80**.",
        'D9': "Environnement **50** : rejets de margines à traiter, consommation d'eau dans une région en stress hydrique. Social **80** et gouvernance **80**. Climat **50** : sécheresses répétées affectant les récoltes.",
    },
    comite=["Suivre le traitement des margines (condition environnementale).", "Contrat d'approvisionnement pluriannuel avec les principales coopératives."],
)

EXPL['TOU'] = dict(
    lecture="Le dossier le plus fragile : hôtel ouvert depuis 10 mois, sans aucune recette contractuelle, occupation très en dessous du plan d'affaires et forte saisonnalité. Une saison basse a produit un CFADS négatif. Les seuils sont les plus élevés du modèle (R4, écart tourisme + 0,20, majoration P2). S'y ajoutent l'érosion côtière sans plan d'adaptation et un titre d'occupation du domaine maritime plus court que la dette.",
    domaines={
        'D1': "Capacité financière **80** : groupe hôtelier national. Soutien **50** : lettre de confort sans engagement de financer les pertes. Gouvernance **80**.",
        'D2': "Technologie **80**. Site **50** : site en bord de mer exposé au recul du trait de côte. Planning **80**.",
        'D3': "Les trois sous-critères à **80** : construction achevée ; domaine à 8 % en P2.",
        'D4': "Structure des recettes **20** : aucune recette contractuelle (ni bail, ni garantie d'un opérateur). Prix **50** : prix moyen en dessous du plan. Marché **50** : destination en développement, forte concurrence régionale.",
        'D5': "Opérateur **80** : contrat de gestion avec une enseigne internationale. Performance **50** : occupation de 54 % contre 68 % prévus. Coûts **80**.",
        'D6': "Clientèle **50** : 25 % des ventes par un seul voyagiste non noté. Fournisseurs **80** et prêteurs **80**.",
        'D8': "Documentation **80** et sûretés **80**. Autorisations **50** : autorisation d'occupation temporaire du domaine public maritime de 12 ans pour une dette de 14 ans (blocage B4).",
        'D9': "Environnement **50** : pression sur la ressource en eau et sur le littoral. Social **80** et gouvernance **80**. Climat **20** : recul du trait de côte documenté, aucun plan d'adaptation financé (plafond C11).",
    },
    comite=["Restructuration à examiner : allonger la maturité, prévoir une ligne de liquidité saisonnière et un soutien du sponsor sur les pertes.", "Obtenir une autorisation d'occupation couvrant la dette plus 24 mois (levée de B4).", "Financer un plan de protection du littoral (levée de C11)."],
)

EXPL['MIN'] = dict(
    lecture="Le cas de l'exclusion : le négociant qui achète tout le concentré figure sur une liste de sanctions. Aucune note n'est produite, quel que soit le score. Le calcul complet est présenté pour l'apprentissage : même sans l'exclusion, le dossier serait plafonné à 4 (DSCR sous le seuil, scénario défavorable sous 1,00, acheteur de qualité inférieure à BBB−, sponsor sans capacité résiduelle) et provisoire (financement à terminaison couvert à 92 %, acceptabilité environnementale non obtenue).",
    domaines={
        'D1': "Les trois sous-critères à **50** : sponsor minier junior, sans capacité de financer un dépassement (plafond C12) ; gouvernance en construction.",
        'D2': "Technologie **80** : procédé de flottation classique. Site **50** et planning **50** : accès en montagne à construire, saison des pluies.",
        'D3': "Contrat de construction **80** : EPCM avec un ingénieriste reconnu. Interfaces **50** : multiples lots. Assurances **80**.",
        'D4': "Structure des recettes **50** : contrat d'enlèvement au prix du marché. Prix **20** : aucune couverture du prix du cuivre. Marché **20** : recettes entièrement exposées au cours mondial.",
        'D5': "Opérateur **80** et performance **80**. Coûts **50** : teneur moyenne et coûts en dirhams.",
        'D6': "Acheteur **20** : négociant unique, sous sanctions (exclusion X3). Fournisseurs **50**. Prêteurs **80**.",
        'D8': "Documentation **80** et sûretés **80**. Autorisations **50** : étude d'impact non approuvée (blocage B8).",
        'D9': "Environnement **20** : gestion des résidus et de l'eau non encore validée. Social, gouvernance et climat **50**.",
    },
    comite=["Aucune décision possible tant que la contrepartie sous sanctions n'est pas remplacée.", "Un nouvel acheteur qualifié, un financement à terminaison complété et l'étude d'impact approuvée sont des préalables à toute nouvelle notation."],
)
