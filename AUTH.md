# Système d'Authentification - PF Scoring

## 📋 Vue d'ensemble

L'application PF Scoring intègre un système d'authentification complet avec:

- **Authentification OAuth** (Google et Microsoft)
- **Authentification traditionnelle** (Email/Mot de passe)
- **Gestion des comptes** (création, suppression, mise à jour)
- **Mode test/bypass** pour le développement

## 🚀 Utilisation immédiate (Mode Bypass)

### Pour tester la création de projets rapidement:

1. Accédez à la page de login: `/login`
2. Cochez la case **"Mode test (contourner l'authentification)"**
3. Cliquez sur **"Accéder au tableau de bord"**

Cela crée automatiquement une session avec l'utilisateur admin et vous permet de créer des projets immédiatement.

**API Bypass:**

- **POST** `/api/projects-bypass` - Créer un projet sans authentification
- **GET** `/api/projects-bypass` - Lister les projets

```bash
curl -X POST http://localhost:3000/api/projects-bypass \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Nouveau Projet",
    "description": "Description",
    "secteur": "Infrastructure",
    "montant": 1000000,
    "countryCode": "MA"
  }'
```

## 🔐 Authentification OAuth

### Configuration requise

Pour activer OAuth (Google et Microsoft), vous devez configurer les variables d'environnement:

```env
# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Microsoft OAuth
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx

# URL de base de l'application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Configurer Google OAuth

1. **Créer un projet Google Cloud:**
   - Allez à [Google Cloud Console](https://console.cloud.google.com)
   - Créez un nouveau projet

2. **Créer des identifiants OAuth 2.0:**
   - Allez à **APIs & Services** > **Credentials**
   - Cliquez **Create Credentials** > **OAuth client ID**
   - Sélectionnez **Web application**
   - Ajoutez **Authorized JavaScript origins:**
     - `http://localhost:3000`
     - `https://votre-domaine.com`
   - Ajoutez **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/oauth/google`
     - `https://votre-domaine.com/api/auth/oauth/google`

3. **Copier les identifiants:**
   - `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` dans votre `.env.local`

### Configurer Microsoft OAuth

1. **Créer une application Azure:**
   - Allez à [Azure Portal](https://portal.azure.com)
   - **Azure Active Directory** > **App registrations**
   - Cliquez **New registration**

2. **Configurer les redirect URIs:**
   - **Authentication** > **Add a platform** > **Web**
   - Ajoutez les **Redirect URIs:**
     - `http://localhost:3000/api/auth/oauth/microsoft`
     - `https://votre-domaine.com/api/auth/oauth/microsoft`

3. **Créer un secret client:**
   - **Certificates & secrets** > **New client secret**
   - Copiez la valeur du secret

4. **Ajouter à votre `.env.local`:**
   ```env
   MICROSOFT_CLIENT_ID=xxx
   MICROSOFT_CLIENT_SECRET=xxx
   ```

## 👥 Gestion des Comptes

### Créer un compte (Admin uniquement)

**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=votre_token_jwt" \
  -d '{
    "email": "nouveau@exemple.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "password": "SecurePassword123!",
    "role": "analyste"
  }'
```

**Rôles disponibles:**

- `admin` - Administrateur système
- `manager` - Gestionnaire de projets
- `analyste` - Analyste de scoring
- `lecteur` - Accès lecture seule

### Lister les utilisateurs

**Endpoint:** `GET /api/auth/users`

```bash
curl http://localhost:3000/api/auth/users \
  -H "Cookie: auth_token=votre_token_jwt"
```

Les admins voient tous les utilisateurs, les autres ne voient que leurs infos.

### Mettre à jour un profil

**Endpoint:** `PUT /api/auth/users`

```bash
curl -X PUT http://localhost:3000/api/auth/users \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=votre_token_jwt" \
  -d '{
    "id": "user_id",
    "nom": "Nouveau Nom",
    "prenom": "Nouveau Prénom",
    "password": "NewPassword123!"
  }'
```

### Supprimer un compte (Admin uniquement)

**Endpoint:** `DELETE /api/auth/users/{id}`

```bash
curl -X DELETE http://localhost:3000/api/auth/users/user_id \
  -H "Cookie: auth_token=votre_token_jwt"
```

**Important:** Impossible de supprimer le dernier administrateur du système.

### Récupérer les infos d'un utilisateur

**Endpoint:** `GET /api/auth/users/{id}`

```bash
curl http://localhost:3000/api/auth/users/user_id \
  -H "Cookie: auth_token=votre_token_jwt"
```

## 🔑 Authentification Traditionnelle

### Connexion

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@pf-scoring.ma",
    "password": "Admin123!"
  }'
```

**Réponse:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "admin@pf-scoring.ma",
    "nom": "Utilisateur",
    "prenom": "Admin",
    "role": "admin"
  }
}
```

Le token JWT est automatiquement défini comme cookie httpOnly.

### Déconnexion

**Endpoint:** `POST /api/auth/logout`

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: auth_token=votre_token_jwt"
```

### Vérifier la session actuelle

**Endpoint:** `GET /api/auth/me`

```bash
curl http://localhost:3000/api/auth/me \
  -H "Cookie: auth_token=votre_token_jwt"
```

## 🛡️ Protection des Routes

### Middleware de protection

Le fichier `middleware.ts` protège automatiquement toutes les routes sauf:

- `/login` - Page de connexion
- `/api/auth/*` - Endpoints d'authentification
- `/api/health` - Health check

### Flux de redirection

1. **Utilisateur accède** → `/dashboard`
2. **Pas de token** → Redirection vers `/login`
3. **Connexion réussie** → Redirection vers `/dashboard`
4. **Token expiré** → Redirection vers `/login`

## 📊 Structure de la Base de Données

### Table `pf_scoring_users`

| Colonne       | Type     | Description                       |
| ------------- | -------- | --------------------------------- |
| id            | UUID     | Identifiant unique                |
| email         | String   | Email unique                      |
| password      | String   | Hash bcrypt du mot de passe       |
| nom           | String   | Nom de famille                    |
| prenom        | String   | Prénom                            |
| role          | Enum     | admin, manager, analyste, lecteur |
| oauthProvider | String   | google, microsoft, etc.           |
| oauthId       | String   | Identifiant du fournisseur OAuth  |
| avatar        | String   | URL de l'avatar                   |
| createdAt     | DateTime | Date de création                  |
| updatedAt     | DateTime | Date de mise à jour               |

## 🧪 Comptes de Test

| Email                  | Mot de passe | Rôle     |
| ---------------------- | ------------ | -------- |
| admin@pf-scoring.ma    | Admin123!    | admin    |
| analyste@pf-scoring.ma | Analyste123! | analyste |

## ⚙️ Configuration de l'Environnement

### Variables requises

```env
# Base de données
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...

# JWT
JWT_SECRET=your-secret-key-change-in-production

# OAuth Google
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# OAuth Microsoft
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

## 🚨 Sécurité

- ✅ Mots de passe hashés avec bcryptjs
- ✅ JWT tokens avec expiration 24h
- ✅ Cookies httpOnly (protection XSS)
- ✅ Validation des rôles sur chaque endpoint
- ✅ Middleware de protection des routes
- ✅ OAuth avec vérification de l'état
- ✅ Gestion sécurisée des sessions

## 📝 Notes de Développement

- Le mode bypass est destiné au **développement/test uniquement**
- Supprimer l'endpoint `/api/projects-bypass` en production
- Configurer les variables OAuth avant le déploiement
- Modifier le `JWT_SECRET` en production
- Activer `secure: true` pour les cookies en HTTPS

## 🐛 Dépannage

### Erreur "Email ou mot de passe incorrect"

- Vérifiez que l'utilisateur existe en base de données
- Vérifiez le mot de passe
- Vérifiez que le mot de passe a été hashé correctement

### OAuth échoue

- Vérifiez les identifiants OAuth dans `.env.local`
- Vérifiez les redirect URIs configurées
- Assurez-vous que `NEXT_PUBLIC_BASE_URL` est correct

### Token invalide/expiré

- Reconnectez-vous pour obtenir un nouveau token
- Vérifiez que le `JWT_SECRET` est correct
- Vérifiez la date du serveur (problème de synchronisation de temps)

## 📚 Ressources

- [NextAuth.js Documentation](https://next-auth.js.org) (pour OAuth avancé)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Microsoft OAuth Setup](https://learn.microsoft.com/en-us/azure/active-directory/develop/active-directory-v2-protocols-oauth-code-flow)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
