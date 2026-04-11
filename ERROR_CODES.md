# 📋 Système de Codes d'Erreur - PF Scoring

## Vue d'ensemble

L'application PF Scoring utilise un système structuré de codes d'erreur pour faciliter la traçabilité, le débogage et la compréhension des problèmes.

Chaque erreur est identifiée par:

- **Code d'erreur**: Identifiant unique (ex: `ERR_DB_001`)
- **Catégorie**: Classification de l'erreur (réseau, base de données, authentification, etc.)
- **Message**: Message utilisateur en français
- **Statut HTTP**: Code HTTP associé
- **Description**: Explication détaillée pour les développeurs

## Structure des erreurs dans les réponses API

Toutes les réponses d'erreur suivent ce format:

```json
{
  "success": false,
  "error": {
    "code": "ERR_DB_001",
    "message": "Erreur de connexion à la base de données",
    "category": "DATABASE",
    "timestamp": "2024-03-31T10:30:45.123Z",
    "requestId": "req_123456"
  }
}
```

## Catégories d'erreurs

### 1. 🌐 RÉSEAU (NETWORK)

Erreurs liées à la connectivité réseau et aux communications.

| Code          | Message                               | Description                                                          | Status HTTP |
| ------------- | ------------------------------------- | -------------------------------------------------------------------- | ----------- |
| `ERR_NET_001` | Impossible de se connecter au serveur | La connexion au serveur a échoué. Vérifiez votre connexion Internet. | 503         |
| `ERR_NET_002` | Délai d'attente dépassé               | La requête a dépassé le délai maximum d'attente.                     | 408         |
| `ERR_NET_003` | Service indisponible                  | Le service est temporairement indisponible. Réessayez plus tard.     | 503         |

**Actions recommandées:**

- Vérifier votre connexion Internet
- Vérifier que le serveur est accessible
- Réessayer après quelques secondes
- Contacter l'administrateur système

---

### 2. 💾 BASE DE DONNÉES (DATABASE)

Erreurs liées à la base de données et aux opérations Prisma.

| Code         | Message                                        | Description                                                                            | Status HTTP |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------- | ----------- |
| `ERR_DB_001` | Erreur de connexion à la base de données       | Impossible de se connecter à la base de données. Vérifiez les paramètres de connexion. | 503         |
| `ERR_DB_002` | Erreur lors de la requête à la base de données | Une erreur s'est produite lors de l'exécution de la requête.                           | 500         |
| `ERR_DB_003` | Enregistrement non trouvé                      | L'enregistrement demandé n'existe pas.                                                 | 404         |
| `ERR_DB_004` | Enregistrement en doublon                      | Cet enregistrement existe déjà.                                                        | 409         |
| `ERR_DB_005` | Erreur de contrainte de base de données        | Les données fournies violent une contrainte de la base de données.                     | 409         |

**Actions recommandées:**

- Vérifier les paramètres de connexion à la base de données
- Vérifier que Supabase est accessible
- Vérifier les variables d'environnement (`DATABASE_URL`, `SUPABASE_*`)
- Contacter l'administrateur si le problème persiste

---

### 3. 🔐 AUTHENTIFICATION (AUTH)

Erreurs liées à l'authentification, aux tokens et aux permissions.

| Code           | Message                           | Description                                                                    | Status HTTP |
| -------------- | --------------------------------- | ------------------------------------------------------------------------------ | ----------- |
| `ERR_AUTH_001` | Token d'authentification manquant | Aucun token d'authentification trouvé. Veuillez vous connecter.                | 401         |
| `ERR_AUTH_002` | Token d'authentification invalide | Le token d'authentification est invalide ou expiré. Veuillez vous reconnecter. | 401         |
| `ERR_AUTH_003` | Token d'authentification expiré   | Votre session a expiré. Veuillez vous reconnecter.                             | 401         |
| `ERR_AUTH_004` | Identifiants incorrects           | L'email ou le mot de passe est incorrect.                                      | 401         |
| `ERR_AUTH_005` | Utilisateur non trouvé            | Cet utilisateur n'existe pas.                                                  | 404         |
| `ERR_AUTH_006` | Permissions insuffisantes         | Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.    | 403         |
| `ERR_AUTH_007` | Compte créé avec succès           | Le compte a été créé. Veuillez vous connecter.                                 | 201         |

**Actions recommandées:**

- Se connecter ou se reconnecter
- Vérifier les identifiants (email/mot de passe)
- Vérifier que les cookies sont activés
- Contacter l'administrateur pour les permissions insuffisantes
- Vérifier que le `JWT_SECRET` est correctement configuré

---

### 4. ✔️ VALIDATION (VALIDATION)

Erreurs liées à la validation des données et des entrées.

| Code          | Message                     | Description                                                                 | Status HTTP |
| ------------- | --------------------------- | --------------------------------------------------------------------------- | ----------- |
| `ERR_VAL_001` | Données invalides           | Les données fournies ne sont pas valides. Vérifiez les champs obligatoires. | 400         |
| `ERR_VAL_002` | Email invalide              | L'email fourni n'est pas au format valide.                                  | 400         |
| `ERR_VAL_003` | Mot de passe faible         | Le mot de passe ne respecte pas les critères de sécurité minimum.           | 400         |
| `ERR_VAL_004` | Champ obligatoire manquant  | Un ou plusieurs champs obligatoires ne sont pas fournis.                    | 400         |
| `ERR_VAL_005` | Format de données incorrect | Le format des données n'est pas correct.                                    | 400         |

**Actions recommandées:**

- Vérifier tous les champs obligatoires
- Vérifier le format des données (email, numéros, etc.)
- Vérifier que le mot de passe respecte les critères de sécurité:
  - Au moins 8 caractères
  - Au moins une majuscule
  - Au moins une minuscule
  - Au moins un chiffre
  - Au moins un caractère spécial

---

### 5. ⚙️ CONFIGURATION (CONFIG)

Erreurs liées à la configuration de l'application.

| Code          | Message                            | Description                                                | Status HTTP |
| ------------- | ---------------------------------- | ---------------------------------------------------------- | ----------- |
| `ERR_CFG_001` | Variable d'environnement manquante | Une variable d'environnement requise n'est pas configurée. | 500         |
| `ERR_CFG_002` | Configuration invalide             | La configuration de l'application est invalide.            | 500         |
| `ERR_CFG_003` | OAuth non configuré                | Les paramètres OAuth ne sont pas correctement configurés.  | 500         |

**Actions recommandées:**

- Vérifier les variables d'environnement dans `.env.local`:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_JWT_SECRET`
  - Pour OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.
- Redémarrer l'application après avoir modifié les variables d'environnement
- Consulter [AUTH.md](./AUTH.md) pour la configuration complète

---

### 6. 💼 LOGIQUE MÉTIER (BUSINESS)

Erreurs liées à la logique métier et aux opérations applicatives.

| Code          | Message                                     | Description                                                   | Status HTTP |
| ------------- | ------------------------------------------- | ------------------------------------------------------------- | ----------- |
| `ERR_BUS_001` | Projet non trouvé                           | Le projet demandé n'existe pas.                               | 404         |
| `ERR_BUS_002` | Utilisateur non trouvé                      | L'utilisateur demandé n'existe pas.                           | 404         |
| `ERR_BUS_003` | Action non autorisée                        | Cette action n'est pas autorisée pour cet utilisateur.        | 403         |
| `ERR_BUS_004` | Erreur lors de la création du projet        | Impossible de créer le projet. Vérifiez les données fournies. | 500         |
| `ERR_BUS_005` | Erreur lors de la création de l'utilisateur | Impossible de créer l'utilisateur.                            | 500         |

**Actions recommandées:**

- Vérifier que la ressource existe (projet, utilisateur, etc.)
- Vérifier que vous avez les permissions nécessaires
- Vérifier les données fournies et leur format
- Contacter l'administrateur si le problème persiste

---

### 7. 🔧 SERVEUR (SERVER)

Erreurs génériques du serveur.

| Code          | Message                   | Description                                                      | Status HTTP |
| ------------- | ------------------------- | ---------------------------------------------------------------- | ----------- |
| `ERR_SRV_001` | Erreur interne du serveur | Une erreur interne s'est produite. Veuillez réessayer plus tard. | 500         |
| `ERR_SRV_002` | Erreur d'analyse JSON     | Le corps de la requête n'est pas un JSON valide.                 | 400         |
| `ERR_SRV_003` | Méthode non autorisée     | Cette méthode HTTP n'est pas autorisée pour cette ressource.     | 405         |
| `ERR_SRV_004` | Ressource non trouvée     | La ressource demandée n'a pas été trouvée.                       | 404         |

**Actions recommandées:**

- Vérifier le format de la requête (méthode HTTP, corps JSON)
- Vérifier l'URL de la requête
- Réessayer après quelques secondes
- Consulter les logs du serveur pour plus de détails

---

## Guide de dépannage par scénario

### Je ne peux pas me connecter

1. **ERR_AUTH_004** → Vérifiez votre email et votre mot de passe
2. **ERR_AUTH_001** → Utilisez le mode test ou reconnectez-vous
3. **ERR_CFG_003** → OAuth n'est pas configuré, utilisez email/mot de passe

### Mode test ne fonctionne pas

1. **ERR_NET_001** → Vérifiez votre connexion Internet
2. **ERR_DB_001** → Vérifiez que Supabase est accessible
3. **ERR_VAL_004** → Vérifiez que tous les champs requis sont fournis

### Je ne peux pas créer un projet

1. **ERR_AUTH_006** → Vous n'avez pas les permissions (contactez l'admin)
2. **ERR_VAL_001** → Les données ne sont pas au bon format
3. **ERR_BUS_004** → Erreur lors de la création (réessayez)
4. **ERR_DB_005** → Données en doublon ou invalides

### Erreur lors de l'accès à la base de données

1. **ERR_DB_001** → Vérifiez `DATABASE_URL` et la connectivité à Supabase
2. **ERR_DB_002** → Erreur générique, consultez les logs
3. **ERR_CFG_001** → Variable d'environnement manquante

---

## Utilisation pour les développeurs

### Traiter les erreurs dans les API

```typescript
import { createErrorResponse } from "@/lib/error-handler";

try {
  // Votre code
} catch (error) {
  const { response } = createErrorResponse(
    "ERR_DB_002",
    "Erreur lors de la requête: " + error.message
  );
  return response;
}
```

### Logger les erreurs

```typescript
import { captureError } from "@/lib/error-handler";

try {
  // Votre code
} catch (error) {
  captureError(error, "myFunction", { userId: "123" });
}
```

### Obtenir les informations d'un code

```typescript
import { getErrorCode } from "@/lib/error-codes";

const errorInfo = getErrorCode("ERR_DB_001");
console.log(errorInfo.message); // "Erreur de connexion à la base de données"
```

---

## Meilleures pratiques

✅ **À faire:**

- Toujours utiliser les codes d'erreur fournis
- Inclure des détails contextuels dans les logs
- Tester les erreurs réseau et les timeouts
- Documenter les nouveaux codes d'erreur

❌ **À éviter:**

- Exposer les détails d'erreur technique brut au client
- Créer des codes d'erreur dupliqués
- Ne pas logger les erreurs
- Utiliser des messages d'erreur non descriptifs

---

## Maintenance

Pour ajouter un nouveau code d'erreur:

1. Ajouter le code dans `/lib/error-codes.ts`
2. Documenter dans ce fichier (`ERROR_CODES.md`)
3. Utiliser dans les API endpoints
4. Tester avec la même catégorie

Exemple:

```typescript
// Dans ERROR_CODES.ts
ERR_NEW_001: {
  code: "ERR_NEW_001",
  category: ErrorCategory.BUSINESS,
  message: "Nouvelle erreur",
  httpStatus: 400,
  description: "Description de la nouvelle erreur",
}
```

---

## Support

Pour plus d'informations:

- Consultez les logs détaillés avec le `requestId` fourni
- Consultez [AUTH.md](./AUTH.md) pour les erreurs d'authentification
- Consultez [QUICK_START.md](./QUICK_START.md) pour les erreurs de configuration
- Contactez l'administrateur système
