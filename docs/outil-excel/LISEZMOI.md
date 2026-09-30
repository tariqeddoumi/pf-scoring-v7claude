# Outil de scoring Project Finance V8 — Excel / VBA

`Outil_Scoring_PF_V8.xlsm` : classeur dynamique reprenant les six cas d'étude
(C1 à C5, dont 4A et 4B), corrigés et recalculés.

- Ouvrir le fichier et **activer les macros** (bandeau « Activer le contenu »).
  Sans macros, tout se calcule quand même ; seuls les boutons sont inactifs.
- Saisir uniquement les cellules **jaunes à texte bleu**.
- Onglet **Diagnostic** : les quinze anomalies relevées dans
  `Cas_Etude_PF_Maroc_V8.xlsx` et la correction apportée.
- Onglet **Paramètres** : barèmes candidats (non approuvés) lus par tous les dossiers.

`sources-vba/` : le code des macros, importable dans l'éditeur VBA (Alt+F11)
si la politique de sécurité impose de reconstruire le projet.

`generateur/` : scripts Python qui produisent le classeur
(`python build_tool.py`, dépendance : `xlsxwriter`).

Les dossiers sont **fictifs** ; les paramètres sont des **candidats** à valider.
