# Diagnostic complet — octobre 2026

Alignement écrans ↔ API ↔ base de données, sécurité, et revue du design de tous les
écrans. Méthode :

- **Base de production** (lecture seule) : colonnes, types, index, contraintes, clés
  étrangères et droits comparés à une base reconstruite depuis `prisma/schema-complet.sql`
  (comparaison automatique, table par table) ; analyseur de sécurité Supabase.
- **Code** : relecture de tous les appels des écrans vers l'API (méthode, corps, forme de
  la réponse) et de toutes les routes vers Prisma, contrôlée par lecture des deux côtés.
- **Écrans** : application lancée sur une base locale à données **fictives**, les 46
  écrans capturés sur ordinateur (1 440 px) et téléphone (390 px), en administrateur et
  en analyste ; erreurs de console, appels API en échec et débordements relevés
  automatiquement, puis revue visuelle de chaque capture.

## Base de données

| Constat | Gravité | Suite |
| --- | --- | --- |
| 28 tables sans sécurité par ligne (RLS), lisibles **et modifiables** par l'API REST de Supabase avec la clé publique — dont actionnaires et bénéficiaires effectifs, entités, groupes d'affaires, évaluations | Haute | Migration `20261020000000_rls_toutes_tables` (à appliquer) |
| Migration du modèle PF (`20261019000000_modele_pf_codes_credits`) pas encore appliquée | Attendu | À appliquer avec la précédente |
| Index `isActive` des référentiels absents | Basse | Même migration |
| Suppression d'un compte = suppression en cascade de ses projets | Haute | Comptes désactivés au lieu d'effacés ; contrainte `RESTRICT` (même migration) |
| `varchar` en base / `text` dans le schéma, dates `date` / `timestamp` | Sans effet | Aucune |
| 3 tables anciennes hors schéma (`BP_PF_evaluations`, `BP_PF_scoring_audit_logs`, `BP_PF_stress_test_results`) | Basse | À archiver plus tard |
| Grille générique (constructeur) en anglais dans la base | Moyenne | Traduction des données, à décider |

Le reste — colonnes, types, clés uniques par banque, clés étrangères — est conforme.

## Sécurité et contrat API (corrigé)

- `PUT /api/users/[id]` : un utilisateur pouvait s'attribuer le rôle administrateur et
  enregistrer un mot de passe en clair ; un administrateur de filiale modifier ou
  supprimer les comptes d'une autre banque. Restreint au profil personnel.
- Connexion OAuth : création automatique d'un compte analyste **sans banque** (donc
  avec accès à toutes les banques) pour toute adresse Google/Microsoft ; état non
  vérifié (CSRF) ; jeton dans l'URL. Corrigé : comptes existants seulement, état vérifié,
  jeton par fragment d'URL.
- `GET /api/admin/configuration/[key]` lisible sans connexion. Corrigé.
- Mises à jour partielles qui remettaient les valeurs par défaut (rôle `read_only`,
  devise MAD, description vide…). Corrigé.
- Scoring PF : séparation des fonctions étendue (auteur, soumetteur, créateur du projet),
  délégation par montant, transitions atomiques (double validation impossible), écritures
  concurrentes protégées, note jamais calculée dans le navigateur des rôles qui ne voient
  pas les scores, paramètres du modèle réservés à un administrateur de toute la plateforme.
- Grille générique : une version publiée pouvait être modifiée par l'éditeur. Corrigé
  (refus 409 + bandeau « consultation seule »).
- Décision des circuits de validation refusée au comité et au gestionnaire des risques ;
  liste des évaluations refusée au comité, à l'audit et à la lecture seule. Corrigé.
- Duplication d'une version : formules, règles d'applicabilité et pièces exigées perdues.
  Corrigé.
- Divers : messages d'erreur bruts, journal d'audit alimentable par le navigateur, crédits
  qui ne suivaient pas un projet changé de banque, montants illisibles enregistrés vides,
  écrans lisant mal l'enveloppe `{ success, data }` (risque pays, diagnostic), comptes
  désactivés introuvables dans l'administration.

## Design (corrigé)

- Deux apparences selon l'écran (pages pré-rendues avec le paramétrage de la compilation) :
  le nom, la couleur et le thème configurés s'appliquent désormais partout.
- Écran « Risque pays » en erreur ; « Diagnostic » vide ; « Champs de formulaire » blanc.
- Débordements sur téléphone (paramètres du modèle PF, diagnostic).
- Page de connexion (émojis, numéro de build), libellés anglais, casse anglaise, fil
  d'Ariane avec des identifiants techniques, rôle affiché en code (`System_admin`),
  boutons illisibles, refus d'accès sans explication.

## Restent à décider

1. **Appliquer les deux migrations** en production (`20261019…` et `20261020…`).
2. **Correspondance note PF (1 à 10) ↔ échelle AAA → D** : une note PF validée est
   aujourd'hui écrite dans `Project.grade`, qui attend une lettre (badge rouge, absente
   des répartitions) ; à valider avec les experts.
3. **Traduction de la grille générique** en base (données de production).
4. Routes sans écran (liste dans le rapport de l'audit) : à retirer ou à conserver.
