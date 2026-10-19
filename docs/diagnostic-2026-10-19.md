# Diagnostic complet — 19 octobre 2026

Périmètre : alignement base de production ↔ schéma Prisma, contrat écrans ↔ API,
sécurité et qualité du code serveur, design et ergonomie de tous les écrans (bureau et
téléphone, administrateur et analyste). Données : 18 cas d'étude fictifs.

## 1. Base de production ↔ schéma Prisma

Comparaison colonne par colonne (types, nullabilité, clés étrangères, contraintes
d'unicité) entre la production et une base de référence générée depuis le schéma.

- **Aligné** sur toutes les tables utilisées par l'application.
- Écarts sans conséquence : colonnes `varchar` en production contre `text` au schéma
  (lues de la même façon par Prisma), dates de construction en `date`, valeurs par
  défaut et contraintes d'unicité en double laissées par les anciennes migrations SQL,
  quelques clés étrangères de l'ancien moteur en « NO ACTION » au lieu de « RESTRICT ».
- 4 tables héritées présentes en production, inutilisées par le code
  (`BP_PF_evaluations`, `BP_PF_scoring_audit_logs`, `BP_PF_stress_test_results`,
  `BP_PF_traduction_sauvegarde` — sauvegarde de la traduction de la grille).
- **Seul écart à traiter** : `BP_PF_projects.creePar` est encore en `ON DELETE CASCADE`
  (supprimer un utilisateur emporterait ses projets). La migration
  `projets_createur_restrict` attend l'approbation dans Supabase.

## 2. Corrections apportées

### Sécurité
| Gravité | Constat | Correction |
|---|---|---|
| Critique | Un administrateur du modèle d'une filiale pouvait réécrire la configuration commune (adresse de l'IA, matrice de délégation, paramètres du modèle) | Écriture réservée à l'administrateur système du groupe ; paramètres PF uniquement par leur écran ; adresse IA en https |
| Important | `/api/auth/users/[id]` lisait tout compte sans vérifier le jeton ; `/api/auth/users` et `/api/auth/register` contournaient politique de mot de passe et rôles | Routes retirées (410), aucun écran ne les utilisait |
| Important | Séparation des fonctions contournable : seul le dernier rédacteur était écarté de la décision | Tous les contributeurs (journal) sont écartés, à l'écran comme au serveur |
| Important | Délégation par montant basée sur le montant du projet, modifiable après soumission ; matrice illisible = aucune délégation | Montant retenu = le plus élevé (projet, exposition figée, crédits) ; matrice illisible bloque la validation |
| Important | Un administrateur du modèle pouvait attribuer un rôle de décideur, y compris à lui-même | Rôles décideurs réservés à l'administrateur système ; interdiction de modifier son propre rôle |
| Important | Suppression d'un projet : les scorings PF validés partaient en cascade | Suppression refusée dès qu'un scoring a quitté le brouillon |
| Important | Écritures de l'ancien moteur actives (création ouverte au droit de lecture, validation écrasant le grade du projet) | Routes retirées (410) |
| Important | Connexion Google/Microsoft par simple adresse | Adresse vérifiée exigée, nom principal Microsoft, identité liée au compte |
| Mineur | Journal d'audit ouvert à tous ; erreur 500 sur paramètre non numérique | Droit `audit:read` exigé, entrée de menu masquée ; paramètres bornés |
| Mineur | Barème et niveau des plafonds lisibles par tous via `/api/modele-pf/parametres` | Masqués pour les rôles qui ne voient pas les scores |
| Mineur | Message d'erreur brut et adresses dans les journaux à la connexion ; cache de 5 min sur l'API ; compte réactivé toujours bloqué | Corrigés |

### Alignement écrans ↔ API (suite de l'unification évaluation = scoring PF)
- **Alertes, tableau de bord, compteur du menu** : dérivés des scorings PF (exclusions,
  blocages, plafonds), liens vers l'écran de scoring.
- **Analytique** : calculée sur les scorings PF (score moyen, grades, moyenne par domaine).
- **Validations** : le menu ouvre l'onglet « En attente de validation » des évaluations.
- **Validation d'un scoring** : le projet passe au statut « approuvé ».
- **Note des projets** (listes, fiche projet, fiche client) : à défaut de note validée,
  note du dernier scoring, signalée « proposée, non validée ».
- **Badges Blocage / Exclusion** visibles de tous les rôles (champ `statutNote`).
- Grade d'un dossier soumis calculé avec ses paramètres figés.
- Anciennes pages : redirection de `/evaluations/[id]` vers l'écran de scoring ; trace
  de calcul protégée ; Granularité et Barème ne mélangent plus les scores PF.
- Résultat recalculé depuis la saisie quand il n'est pas enregistré (cas installés par script).

### Design et ergonomie
- **Méthodologie** réécrite sur le modèle PF : construction de la note, poids par phase,
  critères, noyau, seuils DSCR, écarts sectoriels, plafonds, verrous, conversion en grade.
- Écran de scoring : « Note proposée » tant que le comité n'a pas validé, codes libellés
  (Code T24, Radical, Projet, Régime d'analyse) ; motif du dernier rejet affiché ;
  onglet Financement sans débordement (bureau et téléphone).
- Montants : séparateur d'espace (« 95 000 000 MAD ») au lieu du point.
- Tableau de bord : légende des grades issue du modèle PF, parts totalisant 100 %, rejets exclus.
- Journal d'audit : libellés des actions PF, identifiants techniques masqués.
- Administration : écrans de l'ancien questionnaire nommés comme tels, résumé du modèle PF,
  libellés de rôles en français, « rédhibitoire » au lieu de « NO-GO ».
- Corbeille seulement sur les brouillons ; texte anglais résiduel retiré.

## 3. Vérifications
- `tsc`, `next lint` : sans erreur ni avertissement.
- Tests : 41 suites, 461 tests (dont alertes PF, attribution des rôles, masquage des paramètres).
- Build de production : réussi.
- Contrôle sur base locale (18 cas) : analytique (18 dossiers, 9 domaines), 18 alertes
  (6 critiques, 12 vigilances ; 6 pour un analyste), notes des projets, refus attendus
  (analytique et audit pour l'analyste, anciennes routes en 410), aucun débordement horizontal.

## 4. Restant à faire
- Approuver dans Supabase : suppression des anciennes données (« Atlas energie »,
  « testEOLIENE ») et migration `projets_createur_restrict`.
- Fusionner la branche dans `main` (correctif du build Hostinger compris).
- Points mineurs non traités : bornes de taille des pièces côté stockage S3,
  libellés de secteurs en codes sur la fiche client, chevauchement des repères de
  scores sur l'écran Barème de l'ancien questionnaire.
