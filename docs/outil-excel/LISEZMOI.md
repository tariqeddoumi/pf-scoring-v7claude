# Outil de scoring Project Finance V8 — Excel / VBA (version 4)

- `Outil_Scoring_PF_V8_v4.xlsm` : l'outil avec ses macros.
- `Outil_Scoring_PF_V8_v4.xlsx` : la même chose sans macros (tout se calcule, il n'y a pas de boutons).
- `exemple_propositions_IA.xlsx` : un fichier de propositions de l'IA, au format attendu, pour essayer
  « Nouveau dossier depuis l'IA » (projet fictif de 60 MWc).

Diffuser le `.xlsm` (ou le `.xlsx` si les macros sont interdites) ; ne pas l'enregistrer au format `.xls`, qui perd
les listes, la protection et les macros.

## Scorer un projet en 5 étapes

1. Ouvrez le fichier et **activez les macros** (bandeau « Activer le contenu »).
2. **Accueil › Nouveau dossier (vide)**, **Dupliquer un dossier**, ou **Nouveau dossier depuis l'IA** avec un fichier de
   propositions.
3. Saisissez les **codes** (client T24, radical à 7 chiffres, code projet `PF-AAAA-NNNN`), puis les cellules **orange** :
   ce sont les saisies obligatoires encore vides. Une info-bulle explique chaque cellule.
4. Grille D1 à D9 et indicateurs N4 à N6 : choisissez dans la liste la **situation** qui décrit le dossier ; la note
   (100, 80, 50, 20) s'affiche à côté. Une situation Critique ou « Info. insuffisante » exige un commentaire.
5. Rédigez le **bloc 13 « Commentaires et conditions »**, puis **Contrôler la saisie** et **Fiche comité** (PDF).

## Nouveautés de la version 4 : volet climatique

- **Section 14 « Volet climatique »** de chaque dossier (lien « 14 · Climat » de la navigation) :
  - six aléas (chaleur, sécheresse, inondation, submersion marine, feux, vents), **présélectionnés selon le secteur**,
    avec exposition (Faible, Moyen, Élevé), source et adaptation financée ; exposition déduite et **alerte d'écart**
    avec la case « site à risque climatique élevé » de la section 2 ;
  - **risque de transition** : émissions des scopes 1 et 2, exportations vers l'UE soumises au MACF, actif fossile, plan
    de transition, et niveau calculé (repères 25 000 et 100 000 tCO₂e par an, MACF ≥ 20 % du CA) ;
  - **scénario climatique** : baisse du CFADS (référence du secteur affichée) et DSCR minimum climatique ;
  - c'est aussi la fiche de la **directive BAM 2/W/2025** (grands emprunteurs).
- **Lot 2** : le paramètre **« Lot 2 actif »** de l'onglet **Paramètres** (« Non » par défaut) fait entrer la fiche dans
  la note : exposition déduite des aléas, C11 révisé (adaptation par aléa), **C16** (transition élevée sans plan, note
  max. 6), **C17** (au moins deux aléas élevés sans adaptation, note max. 5), sous-critère calculé **D9.5** « risque de
  transition » (poids de D9 du lot 2 dans l'onglet Paramètres) et, sur un site exposé, scénario climatique pris dans N2.
  À activer seulement après validation par le comité de validation du modèle.
- **Concordance** : deux jeux de notes de référence (lot 2 inactif et actif), choisis selon le paramètre ; « 18 / 18 »
  attendu dans les deux cas. Les règles sont identiques à celles de l'outil web (même fiche climat des 18 cas).
- **Propositions de l'IA** : les champs de la fiche climat (`climat.*`) s'importent comme les autres (onglet Champs IA).
- Fiche comité : ligne « Climat : exposition · transition · DSCR climatique ».

Avec le lot 2 inactif, les notes des 18 dossiers sont inchangées. Avec le lot 2 actif, une seule note change :
l'huilerie d'olives (AGR) passe de 8 à 6 (C11 : sécheresse élevée sans adaptation).

## Nouveautés de la version 3

- **18 dossiers préchargés**, tous fictifs : les six cas d'origine (C1 à C5) et douze cas sectoriels (ENR, EAU, TEL, TRA,
  POR, SAN, ETH, IMMO, IND, AGR, TOU, MIN). L'**Accueil** les présente en catalogue (secteur, régime, phase, note,
  situations illustrées, « Ce que ce cas enseigne »).
- **Identification** (bloc 1) : code client T24, radical (exactement 7 chiffres, zéros conservés), code projet
  (`PF-AAAA-NNNN`), contrôlés et repris dans la synthèse, la fiche comité, le nom du PDF et le journal.
  Bloc 3 : tableau des **crédits** de la banque sur le projet (numéro, nature, montant, devise, durée).
- **Bloc 4 sectoriel** : trois à six données propres au secteur choisi ; les lignes inutiles sont « Sans objet ».
- **Situations descriptives** : liste de quatre situations par sous-critère et pour N4 à N6, plus « Info. insuffisante ».
  Pour D2.1, D4.1, D4.3 et D5.2, la description dépend du secteur. Le détail est dans l'onglet **Référentiel des niveaux**.
- **Bloc 13 « Commentaires et conditions »** : synthèse (obligatoire), forces, faiblesses et mitigants, conditions,
  justification des écarts (obligatoire si un plafond, un verrou ou une information insuffisante est actif), avis
  risques, décision du comité. Il alimente la **Fiche comité**.
- Onglets **Comparaison** (deux dossiers côte à côte, écarts surlignés) et **Concordance** (notes de référence des 18 cas
  recalculées par un moteur indépendant ; « 18 / 18 » attendu).
- **Propositions de l'IA** : « Importer les propositions IA » lit le fichier produit par l'outil web, refuse l'import si
  les codes client ou projet diffèrent de ceux du dossier, affiche chaque proposition en bleu avec sa source à côté de la
  valeur actuelle (onglet **Revue IA**), puis « Appliquer les décisions » écrit les seules propositions acceptées et
  trace chaque décision au **Journal**. Le format est décrit dans l'onglet **Champs IA**.
- Corrections : cas d'origine incomplets (la ligne « À SAISIR » ne tombait jamais à zéro), faits générateurs des plafonds
  tronqués à l'écran, synthèse limitée à 23 dossiers. Le détail figure dans l'onglet **Diagnostic**.

Les notes approuvées des six cas d'origine sont inchangées (C1 9, C2 6, C3 4, C4A 3, C4B 6, C5 6).

## Format du fichier de propositions de l'IA

Classeur `.xlsx` avec une feuille **Propositions** :

| Cellule | Contenu |
|---|---|
| B1 | `PF-PROPOSITIONS-IA v1` |
| B2, B3, B4 | code client T24, radical (texte, 7 chiffres), code projet |
| B5, B6 | date de génération, documents analysés |
| ligne 8 | en-têtes ; à partir de la ligne 9 : A clé, B valeur proposée, C source (document, page), D confiance |

Les clés (`regime`, `expo`, `emploi.1.montant`, `D2.1`, `N4.justification`, `bloc13.forces`…) sont listées dans
l'onglet **Champs IA** avec la cellule alimentée et les valeurs admises. Les pourcentages s'écrivent en fraction
(0,15 pour 15 %) ; une situation s'écrit par son niveau (« Favorable »…). La décision du comité ne s'importe pas.

## Fichiers techniques

- `sources-vba/` : le code des macros (`modOutil.bas`, `modIA.bas`, `ThisWorkbook.txt`). Il s'importe dans l'éditeur VBA
  (Alt+F11) si la politique de sécurité impose de reconstruire le projet.
- `generateur/` : les scripts Python qui produisent le classeur (`python build_tool.py [--sans-vba]`, dépendance :
  `xlsxwriter`) :
  - `cas_tous.py` réunit les 18 dossiers (`cas_data.py`, `cas_sectoriels.py`, `complements.py`) ;
  - `referentiel.py` contient les situations de chaque sous-critère et les données sectorielles ;
  - `moteur_reference.py` recalcule chaque dossier en Python (notes de l'onglet Concordance) ;
  - `verifier.py` compare un classeur recalculé au moteur de référence :
    ```
    soffice --headless --convert-to xlsx --outdir /tmp/recalc Outil_Scoring_PF_V8_v4.xlsx
    python verifier.py /tmp/recalc/Outil_Scoring_PF_V8_v4.xlsx
    ```
    (LibreOffice réglé sur « toujours recalculer » au chargement.) Résultat attendu : `0 écart(s) sur 18 dossiers`.
    Pour le lot 2 : `python build_tool.py --sans-vba --lot2` (variante « Lot 2 actif », non livrée), recalcul, puis
    `python verifier.py --lot2 …/Outil_Scoring_PF_V8_v4_lot2.xlsx`.
  - `cas_climat.json` : fiches climat des 18 cas et référentiel climatique, exportés de l'outil web
    (`npx tsx scripts/docs/exporter-climat-excel.ts`) ; le moteur de référence et le classeur les lisent.

Les dossiers, sociétés, codes et numéros de crédit sont **fictifs** ; les paramètres sont des **candidats** à valider.
