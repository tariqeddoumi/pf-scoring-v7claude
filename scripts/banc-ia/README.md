# Banc d'essai de l'import par IA

Vérifie de bout en bout l'analyse des pièces sur les 18 cas d'étude, à travers les routes de
l'application : nouveau scoring vide → dépôt des 9 pièces du cas (`docs/cas-etude-pieces`) →
analyse → comparaison de chaque proposition avec la saisie de référence du cas → acceptation de
toutes les propositions → note, verrous et plafonds obtenus, comparés aux résultats attendus.

La saisie de référence comprend la fiche climat fictive du cas (bloc 14, `lib/modele-pf/cas-climat.ts`),
que portent les pièces : tableau des aléas, localisation, risque de transition et scénario climatique
dans la synthèse EIES et climat (08), aléas examinés par l'ingénieur indépendant (05). Le pilote
affiche pour chaque cas `climat x/y` : champs climat renseignés dans la fiche (sources exclues) et
retrouvés à l'identique.

Le banc remplace le modèle d'IA par un **lecteur déterministe** (`serveurs.mjs`) qui répond au
format compatible OpenAI à partir du texte des pièces extrait par l'application, et fournit un
stockage S3 minimal en mémoire. Il valide donc toute la chaîne (dépôt, stockage, extraction du
texte, découpage en lots, schéma de réponse, propositions, application, calcul) et le fait que les
pièces portent l'information ; il ne mesure pas la qualité de lecture d'un vrai modèle.

Importé depuis un script (`import { repondre } from "./serveurs.mjs"`), le module n'ouvre aucun
port : on peut ainsi faire tourner le lecteur hors ligne sur le texte des pièces (extrait par
`pdfEnTexte`, comme l'application) et passer ses réponses à `construirePropositionsPF`.

## Lancer

1. Base locale avec les 18 cas installés (`scripts/db/semer-cas-pf.ts`) et un compte administrateur.
2. Paramètres de l'IA dans la base de test : `IA_FOURNISSEUR=compatible_openai`,
   `IA_MODELE=lecteur-de-test`, `IA_URL_BASE=http://localhost:4999/v1`.
3. `node scripts/banc-ia/serveurs.mjs` (stockage S3 sur 4998, lecteur sur 4999).
4. Application : `STOCKAGE_PIECES=s3 S3_ENDPOINT=http://localhost:4998 S3_FORCE_PATH_STYLE=true
   S3_ACCESS_KEY_ID=test S3_SECRET_ACCESS_KEY=test IA_CLE_API=test npx next dev -p 3200`.
5. `JETON=<jeton administrateur> npx tsx scripts/banc-ia/pilote.ts [filtre]` — une ligne par cas ;
   `BANC_IA_TRACE` choisit le dossier des traces (texte reçu, résultats).

## Résultats

Au 27 octobre 2026, vérification hors ligne (lecteur importé, texte des pièces extrait par la
chaîne de l'application, critères et lots de `criteresIA` et `repartirEnLots`, sans base ni
serveur) : fiche climat retrouvée en entier pour 18 cas sur 18 (185 champs sur 185), aucune
valeur climat proposée hors de la fiche ; propositions des autres blocs identiques à celles des
pièces précédentes.

Au 19 octobre 2026 (banc complet) :

18 cas sur 18 : note, verrous et plafonds identiques aux résultats attendus. Restent non lus, par
construction : la synthèse de l'analyste (bloc 13), propre à l'analyste.
