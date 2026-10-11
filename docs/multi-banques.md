# Multi-banques, habillage par banque, IA paramétrable

## 1. Organisation : groupes, banques, filiales

Paramétrage › **Banques et filiales** décrit l'organisation sous forme d'arbre, sans limite de
profondeur :

```
Groupe Banque Centrale Populaire              (groupe)
├── Banque Populaire Casablanca               (banque régionale)
├── Banque Populaire Rabat                    (banque régionale)
└── Filiales Afrique                          (groupe de filiales)
    ├── Banque Sénégal                        (filiale)
    └── Banque Côte d'Ivoire                  (filiale)
```

Chaque utilisateur, client et projet appartient à une entité. Un projet appartient à la banque de
son client ; une évaluation, ses pièces et sa décision suivent leur projet.

### Règles d'accès

| Qui | Voit | Crée et modifie |
|---|---|---|
| Utilisateur d'une banque (portée « sa banque ») | sa banque et toutes ses filiales | sa banque seulement (les filiales sont en consultation) |
| Utilisateur d'une banque (portée « toute sa branche »), ex. chargé d'affaires grands comptes du groupe | sa banque et toutes ses filiales | sa banque et toutes ses filiales |
| Utilisateur d'une filiale | sa filiale (et ses propres filiales) | sa filiale |
| Administrateur système sans banque | toute la plateforme | toute la plateforme |
| Tout autre compte sans banque (inscription, connexion Google) | **rien** tant qu'un administrateur ne l'a pas rattaché | rien |

Une filiale ne voit jamais sa maison mère ni les banques sœurs (deux banques régionales ne se voient
pas). Désactiver une entité ferme l'accès de ses utilisateurs (et de ceux de ses filiales) sans
masquer ses dossiers à la maison mère.

L'administration suit la même règle : un administrateur rattaché à une banque ne voit et ne gère que
les comptes et les entités de sa branche ; seul un administrateur système attribue ce rôle.

### Mise en œuvre (pourquoi c'est sûr)

- **Cloisonnement au niveau de l'accès aux données**, pas écran par écran : le client de base de
  données (`lib/prisma-client.ts`, extension « cloisonnement-entites ») ajoute le filtre d'entité à
  toutes les lectures, modifications, suppressions et créations sur les dossiers et tout ce qui en
  dépend (évaluations, réponses, pièces, résultats, workflows, décisions, commentaires, dérogations,
  journal). Une route oubliée ou ajoutée plus tard ne peut pas exposer les dossiers d'une autre banque :
  c'est la protection recommandée contre la faille n° 1 du Top 10 OWASP API (« Broken Object Level
  Authorization »).
- Le périmètre est calculé à chaque requête authentifiée depuis la base (entité, portée, rôle), avec un
  cache de 30 secondes : un changement de rattachement prend effet immédiatement côté administration.
- Arbre stocké en **chemin matérialisé** (`/racine/…/entité/`) : la descendance d'une entité se lit en
  une comparaison, quelle que soit la profondeur.
- Contrôlé par des tests unitaires (règles, filtres, rattachement des comptes) et par un essai de bout
  en bout sur une base réelle (33 contrôles : lecture, création, modification, suppression, saisie,
  tableaux de bord, journal, administration).

Référentiels appliqués : NIST SP 800-162 (contrôle d'accès par attributs : l'entité est un attribut
du sujet et de la ressource), OWASP ASVS V4 (contrôle d'accès, refus par défaut), modèle « pool » des
architectures SaaS multi-locataires (AWS SaaS Lens), principe du moindre privilège.

### Habillage par banque

Pour chaque entité : nom de l'outil, logo (adresse https://… ou chemin /…) et couleur principale.
Une valeur vide est reprise de l'entité mère la plus proche, puis du paramétrage général
(Paramétrage de l'outil). L'utilisateur voit l'habillage de sa banque dès sa connexion.

## 2. Mise en production — ordre à respecter

1. **Appliquer la migration** `prisma/migrations/20261011000000_multi_entites/migration.sql` sur la
   base de production (éditeur SQL Supabase, ou `psql -f`). Elle est **additive et rejouable** : elle
   crée la table des entités et les colonnes de rattachement, crée une entité racine « Groupe », y
   rattache les clients, projets et comptes existants (accès inchangé) et ajoute les paramètres de
   l'IA. La version actuellement en service l'ignore.
2. Déployer la nouvelle version.
3. Paramétrage › Banques et filiales : renommer la racine, créer les banques et filiales, puis
   rattacher utilisateurs et clients.

Déployer avant d'appliquer la migration rendrait l'application indisponible (colonnes absentes).

## 3. IA paramétrable

Paramétrage de l'outil › **Intelligence artificielle** :

| Paramètre | Valeurs |
|---|---|
| `IA_FOURNISSEUR` | `anthropic` (défaut), `openai`, `azure_openai`, `compatible_openai` |
| `IA_MODELE` | vide = `claude-opus-5-5` pour Anthropic ; obligatoire sinon (ex. `gpt-…`, `mistral-large-latest`) |
| `IA_URL_BASE` | vide = adresse officielle ; obligatoire pour Azure (`https://<ressource>.openai.azure.com/openai/v1`) et les API compatibles (Mistral `https://api.mistral.ai/v1`, modèle interne vLLM/Ollama/LiteLLM `http://…/v1`) |

La **clé d'API** reste une variable d'environnement (`ANTHROPIC_API_KEY`, ou `IA_CLE_API` pour les
autres fournisseurs) : un secret ne s'enregistre pas en base, où il serait lisible par tout accès à la
base et recopié dans les sauvegardes.

Différences à connaître : Claude lit les PDF page par page, tableaux et graphiques compris ; avec les
autres fournisseurs, le texte des PDF est extrait avant l'envoi (un document scanné n'est pas lu,
les images restent transmises). La sortie est contrainte par le même schéma JSON et revérifiée
contre la grille, quel que soit le fournisseur. Un modèle hébergé dans le réseau de la banque garde
les pièces sur ses serveurs, ce qui peut répondre à une exigence de confidentialité ou de résidence
des données.

## 4. Une base de données par filiale ?

**Possible techniquement, déconseillé dans un même déploiement**, pour trois raisons :

- la maison mère doit consulter les dossiers de ses filiales : avec une base par filiale, chaque
  écran de consolidation (tableau de bord, recherche, comparaison, alertes) devrait interroger et
  fusionner plusieurs bases, sans jointure ni transaction communes ;
- la grille de notation, le barème et les référentiels devraient être recopiés et tenus synchronisés
  dans chaque base, au risque que deux filiales ne notent plus de la même façon (exigence de
  cohérence du dispositif de notation, Bâle — IRB, BCBS 239 sur l'agrégation des données de risque) ;
- chaque base supplémentaire multiplie les sauvegardes, les migrations et les contrôles.

**Recommandation** :
- par défaut, une base unique avec le cloisonnement par entité ci-dessus (modèle « pool ») ;
- lorsqu'une filiale est soumise à une obligation légale de localisation des données (par exemple
  dans certains pays d'Afrique), un **déploiement séparé pour cette filiale** — application et base
  dans le pays — rendu possible par le kit de bascule (`npm run db:basculer`) et l'IA paramétrable
  (modèle hébergé localement). La maison mère y accède alors par un compte dédié, ou reçoit des
  exports consolidés.

## 5. Changer de base

Voir `docs/changer-de-base.md` : une commande (`npm run db:basculer`) prépare toute base PostgreSQL
14+ (Supabase, PostgreSQL de la banque, Azure, AWS, Google Cloud), y copie les données et la contrôle ;
il reste à changer `DATABASE_URL` et à redéployer. Paramétrage › **Base de données** montre la base en
service et la conformité du schéma.
