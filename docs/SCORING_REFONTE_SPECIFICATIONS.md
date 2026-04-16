# PLAN DE REFONTE – PARTIE SCORING
## PROJET : PF SCORING V7++

> **Document de spécifications détaillées pour la refonte complète du moteur de scoring**
> Validé et prêt pour implémentation par phases.

---

## 1. OBJECTIF GENERAL

Refondre complètement la partie scoring pour obtenir un moteur :
- réellement piloté par le paramétrage,
- flexible sur plusieurs niveaux hiérarchiques,
- aligné entre front-end, back-end et base de données,
- maintenable par tout développeur, même novice,
- compatible avec une logique de déploiement multi-instances avec préfixe de tables paramétrable,
- capable d'exploiter automatiquement les données Client et Projet dans l'évaluation.

---

## 2. CONSTATS SUR L'EXISTANT

### 2.1 Double ou triple source de vérité
Le scoring existe simultanément :
- dans des tables legacy de type Domain/Criterion/Option/Range,
- dans de nouvelles tables de type ScoringModel / ScoringNode,
- dans du code TypeScript hardcodé côté moteur.

**Conséquence :** l'admin paramètre une grille, mais le moteur réel peut continuer à utiliser une logique codée en dur.

### 2.2 Partie évaluation incomplète
- l'évaluation n'est pas encore entièrement pilotée par la grille flexible,
- plusieurs champs restent en placeholder,
- le formulaire n'est pas totalement généré dynamiquement à partir du modèle.

### 2.3 Paramétrage des grilles insuffisamment flexible
L'existant reste trop plat et ne permet pas proprement :
- critères,
- sous-critères,
- sous-sous-critères,
- arrêt à n'importe quel niveau.

### 2.4 Incohérences front / back / base
- routes dynamiques fragiles,
- services partiellement alignés avec les modèles,
- naming hétérogène,
- structure legacy encore présente.

### 2.5 Maintenabilité insuffisante
- commentaires trop faibles,
- logique métier parfois dispersée,
- certains fichiers difficiles à reprendre pour un nouveau développeur.

---

## 3. CIBLE D'ARCHITECTURE

La refonte doit reposer sur 5 piliers :

### 3.1 Source unique de vérité
La structure de scoring doit venir principalement de la base et non du code hardcodé.

### 3.2 Modèle hiérarchique universel
Un nœud de scoring peut représenter :
- un domaine,
- un critère,
- un sous-critère,
- un sous-sous-critère,
- un groupe,
- une feuille terminale.

### 3.3 Evaluation dynamique
Le formulaire de scoring doit être généré à partir du modèle publié.

### 3.4 Moteur générique
Le moteur de calcul ne doit plus dépendre de fonctions codées domaine par domaine.

### 3.5 Traçabilité complète
Chaque score doit être justifiable :
- version de modèle utilisée,
- réponses retenues,
- source des données,
- overrides,
- règles déclenchées,
- calcul par nœud.

---

## 4. LOTS DE REFONTE

### LOT 0 – STABILISATION TECHNIQUE (✅ EN COURS)
**Objectif :** rendre le repo buildable et cohérent avant refonte profonde.

**Actions :**
- corriger les erreurs de build Next.js,
- corriger les signatures des routes dynamiques,
- unifier le client Prisma,
- vérifier package.json,
- vérifier la présence de prisma/schema.prisma,
- rétablir package-lock.json pour CI,
- harmoniser les enums de statuts.

**Livrables :**
- build CI OK ✅
- build Vercel/Hostinger OK ✅

---

### LOT 1 – REFONTE DU MODELE DE DONNEES SCORING (⏳ PROCHAIN)
**Objectif :** introduire un modèle réellement flexible.

**Actions :**
- conserver temporairement les tables legacy si nécessaire,
- introduire ou consolider les tables cibles,
- supprimer hardcoding métier.

**Résultat attendu :**
- la base supporte plusieurs niveaux de granularité,
- la structure de scoring devient versionnée,
- les règles et barèmes deviennent configurables.

---

### LOT 2 – REFONTE DU MOTEUR DE SCORING
**Objectif :** remplacer le scoring hardcodé par un moteur générique.

**Composants à créer :**
- `runtime-model-loader`,
- `tree-builder`,
- `value-resolver`,
- `score-calculator`,
- `aggregation-engine`,
- `rule-engine`,
- `explainer`,
- `persistence service`.

---

### LOT 3 – REFONTE DE LA PARTIE EVALUATION
**Objectif :** faire de l'évaluation un processus réellement piloté par le modèle.

**Résultat :**
- formulaire généré dynamiquement,
- APIs alignées,
- page d'évaluation moderne,
- traçabilité complète.

---

### LOT 4 – REFONTE DU PARAMETRAGE DES GRILLES
**Objectif :** offrir un vrai designer hiérarchique ultra flexible.

**Fonctionnalités :**
- créer/dupliquer version,
- ajouter/supprimer nœuds,
- définir poids/agrégation,
- paramétrer barèmes/formules/règles,
- tester la cohérence.

---

### LOT 5 – LIAISON CLIENT / PROJET / SCORING
**Objectif :** éviter la ressaisie, pré-remplir le scoring.

**Résultat :**
- données Client/Projet exploitables,
- pré-remplissage automatique,
- traçabilité de source.

---

### LOT 6 – CRUD USERS / HABILITATIONS
**Objectif :** renforcer la partie users pour usage banque.

**Actions :**
- ajouter isActive, mustChangePassword, lastLoginAt, deletedAt,
- améliorer audit,
- structurer rôles/permissions.

---

### LOT 7 – QUALITE / MAINTENABILITE / DOCUMENTATION
**Objectif :** rendre le projet compréhensible et maintenable.

**Actions :**
- ajouter commentaires métier et techniques,
- réduire les `any`,
- ajouter DTO et types clairs,
- ajouter README techniques,
- standardiser conventions.

---

### LOT 8 – PREFIXE DE TABLES PARAMETRABLE (À AMÉLIORER)
**Objectif :** permettre plusieurs déploiements avec des noms de tables différents.

**Note :** Ce point est déjà partiellement implémenté. À améliorer en fin de projet.

---

## 5. SPECIFICATIONS FONCTIONNELLES DETAILLEES – SCORING

### 5.1 Gestion des modèles de scoring
Le système doit permettre :
- créer un modèle,
- dupliquer un modèle,
- créer plusieurs versions,
- publier une version,
- archiver ou retirer une version,
- comparer deux versions.

### 5.2 Gestion hiérarchique de la grille
- Niveau Domaine,
- Niveau Critère,
- Niveau Sous-critère,
- Niveau Sous-sous-critère,
- ou plus si nécessaire techniquement.

Chaque branche peut s'arrêter à un niveau différent.

### 5.3 Nœud terminal
Un nœud terminal :
- porte une réponse ou un score,
- n'a pas d'enfant actif,
- possède une méthode de scoring.

### 5.4 Nœud parent
Un nœud parent :
- agrège les enfants,
- définit une méthode d'agrégation,
- peut être purement structurel ou noté selon le besoin.

### 5.5 Types de réponse attendus
Minimum requis :
- `OPTION_SINGLE`, `OPTION_MULTI`,
- `BOOLEAN`, `NUMERIC`, `PERCENTAGE`,
- `CURRENCY`, `DATE`,
- `TEXT`, `LONG_TEXT`,
- `SCORE_DIRECT`, `FORMULA_INPUT`,
- `LOOKUP_VALUE`, `DOCUMENT_CHECK`.

### 5.6 Méthodes de scoring
- `OPTION_SCORE` — score selon option choisie,
- `RANGE_SCORE` — score selon plage numérique,
- `FORMULA_SCORE` — calcul par formule,
- `MANUAL_SCORE` — score saisi manuellement,
- `LOOKUP_SCORE` — recherche dans table,
- `INHERITED_SCORE` — hérité du parent,
- `CHILDREN_AGGREGATION` — agrégation des enfants.

### 5.7 Méthodes d'agrégation
- `WEIGHTED_AVERAGE` — moyenne pondérée,
- `SIMPLE_AVERAGE` — moyenne simple,
- `SUM` — somme,
- `MIN` — minimum,
- `MAX` — maximum,
- `FIRST_NON_NULL` — première valeur non null,
- `OVERRIDE` — override manuel,
- `CUSTOM_FORMULA` — formule personnalisée.

### 5.8 Gestion des poids
- poids à chaque niveau,
- contrôle automatique des sommes,
- warning ou blocage si incohérence.

### 5.9 Barèmes
- options avec score,
- plages de score,
- formules,
- scores manuels encadrés.

### 5.10 Règles métier et prudentielles
- `HARD_STOP` — arrête tout,
- `NO_GO` — pénalité lourde,
- `MALUS` — réduction de score,
- `WARNING` — alerte info,
- `REQUIRE_REVIEW` — demande vérification,
- `BLOCK_PUBLICATION` — bloque publication,
- `VISIBILITY` — visibilité conditionnelle,
- `MANDATORY_IF` — obligatoire sous condition.

### 5.11 Applicabilité conditionnelle
Un nœud peut être visible ou non selon :
- type de projet,
- secteur,
- pays,
- technologie,
- revenue model,
- présence EPC,
- phase du projet,
- segment.

### 5.12 Exigences documentaires
Chaque nœud peut définir :
- document attendu,
- caractère obligatoire,
- type de pièce,
- niveau de contrôle.

---

## 6. SPECIFICATIONS TECHNIQUES DETAILLEES – TABLES CIBLES

### 6.1 ScoringModel
Représente un modèle métier de scoring.

**Champs :**
- `id`, `code`, `label`, `description`,
- `businessSegment`, `projectType`,
- `status`, `isActive`,
- `ownerBusinessId`, `ownerRiskId`,
- `createdAt`, `updatedAt`.

### 6.2 ScoringModelVersion
Versionne un modèle.

**Champs :**
- `id`, `modelId`, `versionNumber`, `label`,
- `status`, `isPublished`,
- `effectiveDate`, `expiryDate`,
- `changeReason`, `releaseNotes`,
- `createdBy`, `validatedBy`, `publishedBy`,
- `createdAt`, `validatedAt`, `publishedAt`.

### 6.3 ScoringNode
Représente un nœud universel de la grille.

**Champs clés :**
- `id`, `versionId`, `parentNodeId`,
- `nodeType`, `code`, `label`,
- `description`, `helpText`,
- `displayPath`, `depth`, `orderIndex`,
- `isActive`, `isTerminal`, `isScored`, `isMandatory`,
- `allowsChildren`,
- `weight`, `weightMode`, `aggregationMethod`,
- `answerType`, `scoringMethod`,
- `scoreMin`, `scoreMax`,
- `defaultValue`, `unit`, `currency`,
- `uiSchemaJson`, `metadataJson`,
- `createdAt`, `updatedAt`.

### 6.4 ScoringNodeOption
**Champs :**
- `id`, `nodeId`, `code`, `label`, `value`,
- `score`, `riskLevel`, `color`,
- `orderIndex`, `isDefault`, `isActive`,
- `metadataJson`.

### 6.5 ScoringNodeRange
**Champs :**
- `id`, `nodeId`, `label`,
- `minValue`, `maxValue`,
- `minIncluded`, `maxIncluded`,
- `score`, `color`,
- `orderIndex`, `isActive`.

### 6.6 ScoringNodeFormula
**Champs :**
- `id`, `nodeId`,
- `expression`, `variablesJson`,
- `minOutput`, `maxOutput`,
- `roundingMode`,
- `fallbackValue`,
- `isActive`.

### 6.7 ScoringNodeRule
**Champs :**
- `id`, `nodeId`, `versionId`,
- `ruleType`, `code`, `label`, `description`,
- `conditionExpression`,
- `severity`, `actionType`,
- `penaltyValue`, `blocking`,
- `messageUser`, `messageCommittee`,
- `orderIndex`, `isActive`.

### 6.8 ScoringNodeApplicabilityRule
**Champs :**
- `id`, `nodeId`,
- `conditionExpression`,
- `effectType`, `priority`,
- `isActive`.

### 6.9 ScoringNodeDocumentRequirement
**Champs :**
- `id`, `nodeId`,
- `documentType`, `label`, `description`,
- `isRequired`,
- `allowedMimeTypes`, `maxFileSizeMb`,
- `validationLevel`,
- `isActive`.

### 6.10 ScoringEvaluation
Représente une instance de scoring d'un projet.

**Champs :**
- `id`, `projectId`, `clientId`,
- `modelId`, `modelVersionId`,
- `analystId` ou `createdBy`,
- `status`, `finalScore`, `rating`, `recommendation`,
- `malusTotal`,
- `triggeredRulesJson`, `summaryJson`,
- `notes`,
- `submittedAt`, `validatedAt`, `approvedAt`,
- `createdAt`, `updatedAt`.

### 6.11 ScoringEvaluationAnswer
Stocke la valeur retenue pour un nœud.

**Champs clés :**
- `id`, `evaluationId`, `nodeId`,
- `answerType`,
- `valueString`, `valueNumber`, `valueBoolean`, `valueDate`, `valueJson`,
- `manualScore`, `comment`,
- `sourceType`, `sourceEntity`, `sourceField`, `sourcePath`, `sourceBindingId`,
- `sourceValueSnapshotJson`, `resolvedValueSnapshotJson`,
- `isAutoFilled`, `isOverridden`,
- `overrideReason`, `overriddenBy`, `overriddenAt`,
- `createdAt`, `updatedAt`.

### 6.12 ScoringEvaluationNodeResult
Stocke le résultat calculé pour chaque nœud.

**Champs :**
- `id`, `evaluationId`, `nodeId`,
- `rawScore`, `weightedScore`, `normalizedScore`,
- `aggregationMethod`,
- `ruleImpactJson`,
- `explanation`, `traceJson`,
- `createdAt`.

### 6.13 ScoringChangeLog
Audite les changements de paramétrage.

**Champs :**
- `id`,
- `entityType`, `entityId`, `versionId`,
- `action`,
- `fieldName`,
- `oldValueJson`, `newValueJson`,
- `changedBy`, `changedAt`,
- `comment`.

---

## 7. LIAISON CLIENT / PROJET / SCORING

### 7.1 Principe
Les données Client et Projet doivent pouvoir alimenter automatiquement les nœuds du scoring.

### 7.2 Table centrale : ScoringNodeDataBinding
Indique pour un nœud d'où vient la donnée.

**Champs :**
- `id`, `nodeId`,
- `sourceEntity`, `sourceField`, `sourcePath`,
- `bindingMode`, `dataType`,
- `transformType`, `transformConfigJson`,
- `defaultValueString`, `defaultValueNumber`, `defaultValueBoolean`,
- `fallbackValueString`, `fallbackValueNumber`, `fallbackValueBoolean`,
- `isRequired`, `isReadOnly`,
- `allowOverride`, `overrideRequiresReason`,
- `priority`, `isActive`,
- `description`,
- `createdAt`, `updatedAt`.

### 7.3 Valeurs possibles de sourceEntity
- `CLIENT`
- `PROJECT`
- `EVALUATION`
- `DOCUMENT`
- `CALCULATED`
- `EXTERNAL_REFERENCE`
- `MANUAL`.

### 7.4 Valeurs possibles de bindingMode
- `AUTO_READONLY` — chargé automatiquement, non éditable,
- `AUTO_EDITABLE` — chargé automatiquement, éditable,
- `AUTO_IF_EMPTY` — chargé que si vide,
- `MANUAL_ONLY` — entré manuellement,
- `CALCULATED_ONLY` — calculé uniquement.

### 7.5 Valeurs possibles de transformType
- `NONE` — aucune transformation,
- `LOOKUP` — recherche dans table,
- `FORMAT` — formatage,
- `MAP_VALUE` — mappage de valeurs,
- `AGGREGATE` — agrégation,
- `FORMULA` — calcul,
- `NORMALIZE` — normalisation.

### 7.6 Registre des champs bindables (Optionnel)
Table `ScoringDataFieldRegistry`

Objectif :
- sécuriser le paramétrage,
- éviter les erreurs de saisie admin,
- centraliser les champs disponibles côté Client et Projet.

### 7.7 Champs calculés mutualisés (Optionnel)
Table `ScoringCalculatedField`

Objectif :
- définir des calculs réutilisables par plusieurs nœuds.

---

## 8. REGLES DE CALCUL ET DE RESOLUTION

### 8.1 Résolution d'une valeur de nœud
Pour chaque nœud terminal :
1. charger les bindings actifs,
2. trier par priorité,
3. lire la source,
4. appliquer la transformation,
5. vérifier le type,
6. retenir la première valeur valide,
7. sinon utiliser default,
8. sinon fallback,
9. sinon laisser vide.

### 8.2 Priorité de résolution recommandée
1. override manuel déjà validé,
2. binding priorité 1,
3. binding priorité 2,
4. binding priorité n,
5. default,
6. fallback,
7. vide.

### 8.3 Snapshot obligatoire
Au moment de la sauvegarde d'une réponse :
- stocker la valeur source brute,
- stocker la valeur résolue,
- stocker le binding utilisé,
- stocker la source,
- stocker l'horodatage.

### 8.4 Valeur utilisée au scoring
Le moteur doit utiliser :
- la valeur finale enregistrée dans `ScoringEvaluationAnswer`,
et non relire directement la source métier brute.

---

## 9. REGLES D'OVERRIDE

### 9.1 Override interdit
Si `allowOverride = false` :
- le champ est lecture seule,
- toute modification manuelle est refusée.

### 9.2 Override autorisé
Si `allowOverride = true` :
- la modification est permise,
- la réponse passe en `isOverridden = true`.

### 9.3 Override avec justification obligatoire
Si `overrideRequiresReason = true` :
- la sauvegarde sans motif est refusée.

### 9.4 Rafraîchissement après évolution de Client/Projet
Si la source change après création d'une évaluation :
- ne jamais écraser automatiquement une valeur override,
- proposer un refresh contrôlé,
- journaliser les écarts.

---

## 10. APIS CIBLES

### 10.1 APIs modèles et versions
```
GET    /api/admin/scoring/models
POST   /api/admin/scoring/models
GET    /api/admin/scoring/models/:id
PATCH  /api/admin/scoring/models/:id
POST   /api/admin/scoring/models/:id/duplicate
GET    /api/admin/scoring/models/:id/versions
POST   /api/admin/scoring/models/:id/versions
POST   /api/admin/scoring/versions/:id/publish
POST   /api/admin/scoring/versions/:id/retire
GET    /api/admin/scoring/versions/:id/compare/:otherId
```

### 10.2 APIs arbre / nœuds
```
GET    /api/admin/scoring/versions/:id/tree
POST   /api/admin/scoring/versions/:id/nodes
PATCH  /api/admin/scoring/nodes/:id
DELETE /api/admin/scoring/nodes/:id
POST   /api/admin/scoring/nodes/:id/move
POST   /api/admin/scoring/nodes/:id/duplicate
POST   /api/admin/scoring/nodes/:id/convert-terminal
POST   /api/admin/scoring/nodes/:id/convert-parent
```

### 10.3 APIs barèmes
```
GET    /api/admin/scoring/nodes/:id/options
POST   /api/admin/scoring/nodes/:id/options
PATCH  /api/admin/scoring/options/:id
DELETE /api/admin/scoring/options/:id
GET    /api/admin/scoring/nodes/:id/ranges
POST   /api/admin/scoring/nodes/:id/ranges
PATCH  /api/admin/scoring/ranges/:id
DELETE /api/admin/scoring/ranges/:id
GET    /api/admin/scoring/nodes/:id/formula
PUT    /api/admin/scoring/nodes/:id/formula
```

### 10.4 APIs règles
```
GET    /api/admin/scoring/nodes/:id/rules
POST   /api/admin/scoring/nodes/:id/rules
PATCH  /api/admin/scoring/rules/:id
DELETE /api/admin/scoring/rules/:id
```

### 10.5 APIs bindings
```
GET    /api/admin/scoring/nodes/:id/bindings
POST   /api/admin/scoring/nodes/:id/bindings
PATCH  /api/admin/scoring/bindings/:id
DELETE /api/admin/scoring/bindings/:id
POST   /api/admin/scoring/bindings/reorder
GET    /api/admin/scoring/source-fields
POST   /api/admin/scoring/source-fields/sync
```

### 10.6 APIs validation / simulation
```
POST   /api/admin/scoring/versions/:id/validate
POST   /api/admin/scoring/versions/:id/simulate
```

### 10.7 APIs évaluation
```
POST   /api/scoring/evaluations
GET    /api/scoring/evaluations/:id/form
PATCH  /api/scoring/evaluations/:id/answers
POST   /api/scoring/evaluations/:id/refresh-bindings
POST   /api/scoring/evaluations/:id/calculate
POST   /api/scoring/evaluations/:id/submit
GET    /api/scoring/evaluations/:id/results
```

---

## 11. ECRANS CIBLES

### 11.1 Catalogue des modèles
- liste, recherche, filtre,
- création, duplication, archivage.

### 11.2 Gestion des versions
- création, duplication,
- soumission, validation,
- publication, retrait,
- comparaison.

### 11.3 Designer de grille
- arbre à gauche,
- détail du nœud au centre,
- panneau règles/barèmes/aperçu à droite.

### 11.4 Paramétrage des barèmes
- options, plages, formules.

### 11.5 Paramétrage des bindings
- source, champ, mode,
- priorité, override, transformation.

### 11.6 Validation de cohérence
- poids, cycles,
- terminal/enfants,
- plages, formules, règles.

### 11.7 Ecran d'évaluation
Doit afficher :
- champ, valeur, source,
- statut, override éventuel,
- commentaire, score si utile.

### 11.8 Ecran de résultats
Doit afficher :
- score final,
- score par domaine,
- score par nœud,
- règles déclenchées,
- justification.

---

## 12. REGLES DE COHERENCE A CONTROLER

Le système doit contrôler :
- unicité des codes de nœud,
- absence de cycle parent/enfant,
- nœud terminal sans enfant actif,
- nœud parent avec méthode d'agrégation,
- cohérence poids = 100 si requis,
- option avec score valide,
- plages non chevauchantes,
- formule compilable,
- règle exécutable,
- binding cohérent avec type de réponse,
- champ obligatoire accessible,
- version non publiable si erreurs bloquantes.

---

## 13. EXIGENCES D'AUDIT

Le système doit tracer :
- création/modification/suppression d'un nœud,
- création/modification/suppression d'un barème,
- création/modification/suppression d'une règle,
- création/modification/suppression d'un binding,
- publication d'une version,
- valeur retenue pour chaque réponse,
- source de la valeur,
- override,
- motif d'override,
- calcul par nœud,
- règles déclenchées.

---

## 14. EXIGENCES DE MAINTENABILITE

Le code doit être commenté de façon utile :
- rôle du fichier,
- rôle de la fonction,
- entrées, sorties,
- logique métier,
- cas limites,
- impacts sur la base.

Le projet doit aussi :
- réduire les `any`,
- utiliser des types clairs,
- avoir des services bien séparés,
- disposer de README techniques.

---

## 15. PREFIXE PARAMETRABLE – REGLES

Le système doit permettre un préfixe de tables paramétrable.

**Exemple :**
```
BCP_SCORE_GP_clients
BCP_SCORE_GP_projects
BCP_SCORE_GP_scoring_models
```

**Solution retenue :**
- template Prisma,
- génération de `prisma/schema.prisma`,
- génération des scripts SQL,
- variable d'environnement du type `TABLE_PREFIX=BCP_SCORE_GP`.

---

## 16. CRITERES D'ACCEPTATION GLOBAUX

La refonte est considérée conforme si :

1. ✅ le build passe,
2. ✅ le schéma Prisma est cohérent,
3. ⏳ l'évaluation lit une version publiée du modèle,
4. ⏳ le formulaire est généré à partir du modèle,
5. ⏳ les réponses sont stockées par nœud,
6. ⏳ les données Client/Projet peuvent pré-remplir le scoring,
7. ⏳ les overrides sont contrôlés et audités,
8. ⏳ le moteur calcule sans hardcoding métier,
9. ⏳ les résultats par nœud sont persistés,
10. ⏳ les grilles sont modifiables sans recoder le moteur,
11. ⏳ le code est maintenable,
12. ⏳ le déploiement multi-préfixe est possible.

---

## 17. ORDRE D'IMPLEMENTATION RECOMMANDE

### Etape 1 : Stabilisation technique ✅
- Build OK,
- Schéma OK,
- Variables OK.

### Etape 2 : Schéma Prisma cible ⏳
- Créer/adapter tables,
- Migrations,
- Validation.

### Etape 3 : Moteur de scoring générique
- Services modulaires,
- Algorithme générique,
- Tests.

### Etape 4 : APIs évaluation
- Endpoints CRUD,
- Intégration,
- Tests.

### Etape 5 : Designer hiérarchique
- UI admin,
- Arbre interactif,
- Paramétrage.

### Etape 6 : Bindings Client/Projet
- Tables bindings,
- Résolution,
- Pré-remplissage.

### Etape 7 : Overrides + audit
- Contrôle overrides,
- Journalisation,
- Traçabilité.

### Etape 8 : Users / permissions
- Rôles,
- Périmètres,
- Audit users.

### Etape 9 : Documentation et tests
- Tests automatisés,
- Documentation,
- Guides.

---

## Document de référence

**Créé :** 2026-04-16  
**Version :** 1.0  
**Status :** Validé  
**Auteur :** Tariq Eddoumi  
**Reviewers :** À confirmer
