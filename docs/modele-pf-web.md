# Modèle Project Finance — outil web

L'outil web reprend le modèle Project Finance de l'outil Excel (`docs/outil-excel/`) : même
parcours en treize blocs, même calcul, mêmes paramètres. Les dix-huit cas d'étude (fictifs)
donnent exactement les mêmes résultats dans les deux outils
(`__tests__/unit/modele-pf-moteur.test.ts`).

## Où le trouver

| Écran | Rôle |
| --- | --- |
| Fiche client | Radical client (7 chiffres, unique par entité), en plus du code client T24. |
| Fiche projet | Code projet `PF-AAAA-NNNN` (proposé à la création, unique par entité) ; crédits de la banque rattachés (en attendant leur reprise depuis Evolan) ; liste des scorings Project Finance. |
| `/scoring-pf/[id]` | Saisie en onglets : identification et routage (blocs 1-2), financement (3), secteur et hypothèses (4-5), échéancier et stress (6), noyau financier (7), grille (8), climat (14), résultat et décision (9-13), pièces et IA. |
| `/admin/modele-pf` | Paramètres du modèle (seuils DSCR, écarts sectoriels, poids, ancres, plafonds, seuils des règles, interrupteur du lot 2 du volet climatique). |

Un scoring se crée vide, par copie d'un scoring du projet, ou à partir d'un des dix-huit cas
d'étude. La saisie s'enregistre automatiquement ; le calcul se refait en direct dans le
navigateur et le serveur le refait à chaque enregistrement (son résultat fait foi).

## Cycle de vie

`brouillon` → `soumis` (toutes les saisies exigées sont faites : équivalent de la ligne
« À SAISIR » de l'Excel) → `valide` ou `rejete` (motif obligatoire). La validation est faite
par un autre utilisateur que l'auteur (séparation des fonctions) et seulement si le statut
est « Note validable » ; la note est alors reportée sur le projet. Un scoring soumis ou
validé garde les paramètres de son calcul : sa note reste reproductible après un changement
de paramétrage. Chaque étape est tracée dans le journal d'audit (`SCORING_PF_*`).

Les rôles qui ne voient pas les scores voient la saisie, les contrôles, les DSCR et les
plafonds actifs, mais ni le score, ni les notes, ni les niveaux des plafonds.

## Stress test (bloc 6)

- **Scénario de référence du secteur** (`lib/modele-pf/scenarios.ts`, `SCENARIOS_REFERENCE`) :
  pour chacun des douze secteurs, la variable qui fait le plus bouger les flux, une baisse
  des recettes, une hausse des charges et la source des chiffres (valeurs candidates, à
  valider par le comité). Exemples : ENR, productible P90 à un an (recettes − 8 %, charges
  + 10 %) ; TOU, occupation − 10 points et prix − 5 % (− 15 %, + 5 %) ; MIN, prix du métal
  (− 25 %, + 8 %). Un bouton reprend la description dans la saisie.
- **Aide au calcul du choc** (`components/scoring-pf/CalculChoc.tsx`) : à partir des recettes
  et des charges d'une année type, choc = (recettes perdues + charges supplémentaires) ÷
  CFADS central, plafonné à 95 % (`calculerChoc`). Exemple : recettes 73, charges 11,
  CFADS 62 ; − 8 % et + 10 % donnent (5,84 + 1,1) ÷ 62 = 11,2 %. Le choc réduit chaque
  CFADS de l'échéancier pour N2 et le plafond C3.
- L'analyste peut s'écarter du scénario de référence en le justifiant dans la description ;
  l'origine du choc (calcul, référence, IA) reste affichée sous le champ.

## Origine des valeurs

Chaque valeur qui n'est pas tapée par l'analyste garde son origine dans la saisie
(`saisie.origines`, par clé du fichier d'échange ; `lib/modele-pf/origines.ts`) :

| Type | Cas |
| --- | --- |
| `ia` | Proposition de l'IA acceptée : pièce, emplacement, justification, confiance, date, auteur. |
| `calcul` | Choc calculé par l'aide du bloc 6 (détail du calcul). |
| `reference` | Scénario de référence du secteur repris. |
| `collage` | Échéancier collé depuis Excel. |

L'écran l'affiche en commentaire sous chaque champ (justification dépliable) et par une
icône sur les lignes des tableaux. Si l'analyste modifie la valeur, l'origine reste lisible
comme « valeur initiale ». Les origines `ia` ne s'écrivent que côté serveur, à
l'acceptation d'une proposition : un enregistrement envoyé par le navigateur ne peut ni en
créer ni en effacer (`fusionnerOrigines`).

## Volet climatique

Onglet « Climat » (bloc 14), fichiers `lib/modele-pf/climat.ts` (fiche, évaluation, export)
et `components/scoring-pf/BlocClimat.tsx`. Valeurs candidates, à valider par le comité.

### Lot 1 — en service, sans effet sur la note

- **Fiche des risques physiques** par aléa (chaleur, sécheresse, inondation, submersion,
  feux, vents) : niveau Faible / Moyen / Élevé, source, adaptation financée Oui / Non. Les
  aléas pertinents sont présélectionnés selon le secteur (`ALEAS_PAR_SECTEUR`).
- **Transition** : émissions scopes 1 et 2, part du chiffre d'affaires exportée vers l'UE
  sous MACF, actif fossile, plan de transition. Niveau indicatif : Élevé si émissions
  > 100 000 tCO₂e/an, exportations MACF ≥ 20 %, ou actif fossile sans plan ; Moyen si
  émissions > 25 000 tCO₂e/an, exportations MACF > 0, ou actif fossile avec plan.
- **Scénario climatique** de référence par secteur (`SCENARIOS_CLIMAT`) et DSCR minimum
  climatique indicatif, classé selon les seuils du dossier.
- **Fiche 2/W/2025** : export CSV (`ficheClimatCsv`), avec la complétude des données.
- Contrôle de cohérence entre la fiche et la case « site exposé » du bloc 2, et aperçu des
  plafonds que le lot 2 déclencherait (non appliqués).

### Lot 2 — prêt, inactif par défaut

Paramètre `climat.lot2Actif` (`lib/modele-pf/parametres.ts`, faux par défaut), activable
dans `/admin/modele-pf` après validation par le comité. Inactif, le calcul reste identique
à celui de l'outil Excel. Actif :

| Règle | Effet |
| --- | --- |
| Exposition | Déduite de la fiche (exposé si au moins un aléa évalué « Élevé » ; à défaut, case du bloc 2) ; elle pilote aussi le régime L. |
| C11 (note max. 6) | Révisé : au moins un aléa élevé sans adaptation financée. |
| C16 (note max. 6) | Risque de transition élevé sans plan de transition crédible et financé. |
| C17 (note max. 5) | Au moins deux aléas pertinents élevés sans adaptation financée. |
| D9 | D9.5 « risque de transition » calculé (Faible 100, Moyen 80, Élevé avec plan 50, sans plan 20) pèse 15 % de D9 ; D9.1 25 %, D9.2 25 %, D9.3 10 %, D9.4 « risques physiques résiduels » 25 % (`climat.poidsD9`, `climat.poidsTransition`). |
| N2 | Site exposé : le DSCR stressé retenu est le plus bas du scénario financier et du scénario climatique. |

Les scorings soumis ou validés avant l'ajout du lot 2 gardent leurs paramètres, complétés
des règles nouvelles, inactives.

**Impact sur les 18 cas** (fiches climat fictives, `lib/modele-pf/cas-climat.ts` ; calcul
`npx tsx scripts/docs/impact-climat-lot2.ts`) : une note modifiée (huilerie AGR, 8 → 6 :
note calculée 7, scénario climatique retenu dans N2, plafond C11) ; 8 dossiers avec au moins
un plafond climatique ajouté (C3, C4A, C4B, TEL, ETH, IND, AGR, TOU), sans autre effet sur
la note approuvée car un plafond plus bas ou la note calculée s'applique déjà ; 10 dossiers
dont l'exposition retenue diffère de la case déclarée.

L'outil Excel version 4 (`docs/outil-excel/Outil_Scoring_PF_V8_v4.xlsm`) intègre le volet
climatique ; le lot 2 s'y active dans l'onglet Paramètres.

## Lecture des pièces par l'IA

Onglet « Pièces et IA » : les pièces déposées (stockage privé) sont lues par le fournisseur
d'IA du paramétrage. L'IA contrôle les pièces (complétude, incohérences, ce qu'il faut
demander) et propose une valeur, avec sa source et sa confiance, pour plus de 300 champs
des treize blocs et de la fiche climat : routage, proportionnalité, plan de financement,
données sectorielles, hypothèses, choc et scénario défavorable, échéancier ligne par ligne,
noyau, données des plafonds, grille, verrous, aléas et données de transition, commentaires.
Elle rédige aussi le commentaire de chaque domaine de la grille et calcule le choc à partir
du cas défavorable du modèle financier ou des hypothèses documentées (consignes dans
`lib/modele-pf/ia.ts`). Rien n'est écrit sans validation : chaque proposition s'accepte ou
se rejette, chaque décision est tracée (`SCORING_PF_PROPOSITIONS_IA`), et une proposition
acceptée garde son origine sous le champ.

## Échange avec l'outil Excel

Le fichier `PF-PROPOSITIONS-IA v1` (feuille « Propositions » : B1 format, B2 code client,
B3 radical, B4 code projet, B5 date, B6 documents ; à partir de la ligne 9 : clé, valeur,
source, confiance, libellé) se télécharge depuis l'onglet « Pièces et IA » :

- **Propositions pour l'outil Excel** : les propositions de l'IA non rejetées ;
- **Saisie web pour l'outil Excel** : toute la saisie, pour reprendre le dossier dans l'Excel.

La macro « Importer les propositions IA » de l'Excel le lit et contrôle les codes. Les clés
sont celles de la feuille « Champs IA » (`lib/modele-pf/champs-ia.ts`) ; l'aller-retour des
dix-huit cas redonne la même note (`__tests__/unit/modele-pf-champs-ia.test.ts`). Seule
particularité : dans l'Excel, B6 se saisit à l'inverse (« modèle de flux complet et
rapproché ? »), la conversion est faite à l'export.

## Base de données

Migration `prisma/migrations/20261019000000_modele_pf_codes_credits` (additive, rejouable) :
colonnes `radical` et `codeProjet`, tables `BP_PF_project_credits` et `BP_PF_evaluations_pf`.
Elle doit être appliquée à la base avant la mise en service de ces écrans.

## Code

| Fichier | Contenu |
| --- | --- |
| `lib/modele-pf/parametres.ts` | Paramètres candidats et contrôle de cohérence. |
| `lib/modele-pf/moteur.ts` | Moteur de calcul (portage du moteur de référence Python). |
| `lib/modele-pf/saisie.ts` | Saisie des 13 blocs, contrôles « À saisir ». |
| `lib/modele-pf/serveur.ts` | Paramètres en vigueur, visibilité des notes, droits. |
| `lib/modele-pf/champs-ia.ts` | Clés du fichier d'échange, lecture et écriture dans la saisie. |
| `lib/modele-pf/ia.ts` | Critères transmis à l'IA, consignes (choc, commentaires de domaine), propositions vérifiées. |
| `lib/modele-pf/scenarios.ts` | Scénarios défavorables de référence par secteur, calcul du choc. |
| `lib/modele-pf/origines.ts` | Origine des valeurs de la saisie (IA, calcul, référence, collage). |
| `lib/modele-pf/climat.ts` | Volet climatique : fiche, aléas et scénarios par secteur, évaluation, aperçu du lot 2, export 2/W/2025. |
| `lib/modele-pf/cas-climat.ts` | Fiches climat fictives des 18 cas d'étude. |
| `scripts/docs/impact-climat-lot2.ts` | Impact du lot 2 sur les 18 cas (JSON pour le dossier de validation). |
| `components/scoring-pf/` | Onglets de l'écran de saisie (dont `BlocClimat.tsx`, `CalculChoc.tsx`, `origine.tsx`). |
