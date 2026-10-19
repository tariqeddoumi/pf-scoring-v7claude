# Banc d'essai de l'import par IA

Vérifie de bout en bout l'analyse des pièces sur les 18 cas d'étude, à travers les routes de
l'application : nouveau scoring vide → dépôt des 9 pièces du cas (`docs/cas-etude-pieces`) →
analyse → comparaison de chaque proposition avec la saisie de référence du cas → acceptation de
toutes les propositions → note, verrous et plafonds obtenus, comparés aux résultats attendus.

Le banc remplace le modèle d'IA par un **lecteur déterministe** (`serveurs.mjs`) qui répond au
format compatible OpenAI à partir du texte des pièces extrait par l'application, et fournit un
stockage S3 minimal en mémoire. Il valide donc toute la chaîne (dépôt, stockage, extraction du
texte, découpage en lots, schéma de réponse, propositions, application, calcul) et le fait que les
pièces portent l'information ; il ne mesure pas la qualité de lecture d'un vrai modèle.

## Lancer

1. Base locale avec les 18 cas installés (`scripts/db/semer-cas-pf.ts`) et un compte administrateur.
2. Paramètres de l'IA dans la base de test : `IA_FOURNISSEUR=compatible_openai`,
   `IA_MODELE=lecteur-de-test`, `IA_URL_BASE=http://localhost:4999/v1`.
3. `node scripts/banc-ia/serveurs.mjs` (stockage S3 sur 4998, lecteur sur 4999).
4. Application : `STOCKAGE_PIECES=s3 S3_ENDPOINT=http://localhost:4998 S3_FORCE_PATH_STYLE=true
   S3_ACCESS_KEY_ID=test S3_SECRET_ACCESS_KEY=test IA_CLE_API=test npx next dev -p 3200`.
5. `JETON=<jeton administrateur> npx tsx scripts/banc-ia/pilote.ts [filtre]` — une ligne par cas ;
   `BANC_IA_TRACE` choisit le dossier des traces (texte reçu, résultats).

## Résultat au 19 octobre 2026

18 cas sur 18 : note, verrous et plafonds identiques aux résultats attendus. Restent non lus, par
construction : la synthèse de l'analyste (bloc 13), propre à l'analyste.
