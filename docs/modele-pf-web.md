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
| `/scoring-pf/[id]` | Saisie en onglets : identification et routage (blocs 1-2), financement (3), secteur et hypothèses (4-5), échéancier (6), noyau financier (7), grille (8), résultat et décision (9-13), pièces et IA. |
| `/admin/modele-pf` | Paramètres du modèle (seuils DSCR, écarts sectoriels, poids, ancres, plafonds, seuils des règles). |

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

## Lecture des pièces par l'IA

Onglet « Pièces et IA » : les pièces déposées (stockage privé) sont lues par le fournisseur
d'IA du paramétrage. L'IA contrôle les pièces (complétude, incohérences, ce qu'il faut
demander) et propose une valeur, avec sa source et sa confiance, pour chaque champ des
treize blocs : routage, proportionnalité, plan de financement, données sectorielles,
hypothèses, échéancier, noyau, données des plafonds, grille, verrous et commentaires.
Rien n'est écrit sans validation : chaque proposition s'accepte ou se rejette, et chaque
décision est tracée (`SCORING_PF_PROPOSITIONS_IA`).

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
| `lib/modele-pf/ia.ts` | Critères transmis à l'IA, propositions vérifiées. |
| `components/scoring-pf/` | Onglets de l'écran de saisie. |
