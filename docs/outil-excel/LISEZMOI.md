# Outil de scoring Project Finance V8 — Excel / VBA (version 2)

- `Outil_Scoring_PF_V8_v2.xlsm` : l'outil avec ses macros.
- `Outil_Scoring_PF_V8_v2.xlsx` : la même chose sans macros (tout se calcule, il n'y a pas de boutons).

## Scorer un projet en 5 étapes

1. Ouvrez le fichier et **activez les macros** (bandeau « Activer le contenu »).
2. **Accueil › Nouveau dossier** : donnez un nom court à l'onglet (ex. `PORT-NADOR`).
3. Remplissez les cellules **orange**. Ce sont les saisies obligatoires encore vides ; elles passent au jaune une fois remplies.
   Quand vous sélectionnez une cellule, une info-bulle explique quoi saisir.
4. La ligne **« À SAISIR »** en haut du dossier compte ce qui manque et donne un lien vers la prochaine cellule.
   Le tableau de bord affiche la note approuvée, les plafonds et les verrous.
5. **Contrôler la saisie**, puis **Fiche comité** : page de synthèse imprimable ou exportable en PDF.

## Nouveautés de la version 2

- Feuilles protégées **sans mot de passe** : une formule ne peut plus être écrasée par erreur.
- Saisies obligatoires en orange, ligne « À SAISIR », info-bulles et contrôles de saisie avec messages en français.
- Onglet **Fiche comité** (graphique des scores par domaine) ; accueil avec la liste des dossiers et un lien vers chacun.
- Boutons **Préparer l'échéancier** (libellés « An n · S1 »…) et **Effacer l'échéancier**.
- Corrections : couleur de la note (un dossier vide ou hors périmètre s'affichait en vert) ; noyau N1-N6 inclus dans la
  complétude (un N4 vide laissait la note « validable ») ; C5 sans objet en régime R4 ; export PDF depuis OneDrive.
  Le détail figure dans l'onglet **Diagnostic**.

Les notes approuvées des six cas d'étude sont inchangées (C1 9, C2 6, C3 4, C4A 3, C4B 6, C5 6).

## Fichiers techniques

- `sources-vba/` : le code des macros. Il s'importe dans l'éditeur VBA (Alt+F11) si la politique de sécurité impose de
  reconstruire le projet.
- `generateur/` : les scripts Python qui produisent le classeur (`python build_tool.py [--sans-vba]`, dépendance : `xlsxwriter`).

Les dossiers sont **fictifs** ; les paramètres sont des **candidats** à valider.
