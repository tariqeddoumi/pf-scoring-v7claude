# 🚀 Démarrage Rapide - Mode Test

## Créer un projet en 2 minutes

### Option 1: Utiliser le Mode Bypass (Plus facile)

1. **Allez à la page de login:**
   ```
   https://votre-app.vercel.app/login
   ```

2. **Cochez la case "Mode test":**
   - Cochez: **"Mode test (contourner l'authentification)"**

3. **Cliquez sur "Accéder au tableau de bord"**

4. **Vous êtes connecté!** Allez à `/projects/new` pour créer un projet

### Option 2: Utiliser l'API directement

```bash
# Créer un projet
curl -X POST https://votre-app.vercel.app/api/projects-bypass \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Mon Projet",
    "description": "Description du projet",
    "secteur": "Infrastructure",
    "montant": 1000000,
    "countryCode": "MA"
  }'

# Récupérer vos projets
curl https://votre-app.vercel.app/api/projects-bypass
```

## ✅ Tester l'authentification

### Connexion avec un compte

1. **Allez à `/login`**
2. **Entrez les identifiants:**
   - Email: `admin@pf-scoring.ma`
   - Mot de passe: `Admin123!`
3. **Cliquez "Se connecter"**

## 🔐 Configurer OAuth (Optionnel)

Pour activer la connexion avec Google ou Microsoft:

1. **Créer une application Google/Microsoft** (voir [AUTH.md](./AUTH.md))
2. **Ajouter les identifiants dans `.env.local`:**
   ```env
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   MICROSOFT_CLIENT_ID=xxx
   MICROSOFT_CLIENT_SECRET=xxx
   ```
3. **Redémarrer l'application**
4. **Cliquer sur "Continuer avec Google" ou "Microsoft"**

## 📊 Créer des Projets

### Via l'interface web

1. **Connectez-vous** (login page ou mode bypass)
2. **Allez à `/projects/new`**
3. **Remplissez le formulaire:**
   - Nom du projet
   - Description
   - Secteur
   - Montant
   - Pays
4. **Cliquez "Créer le projet"**

### Via l'API

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=votre_token" \
  -d '{
    "nom": "Nouveau Projet",
    "description": "Description",
    "secteur": "Énergie",
    "montant": 500000,
    "countryCode": "MA"
  }'
```

## 👥 Gérer les Utilisateurs (Admin)

### Créer un nouvel utilisateur

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=votre_token_admin" \
  -d '{
    "email": "nouveau@exemple.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "password": "SecurePassword123!",
    "role": "analyste"
  }'
```

### Supprimer un utilisateur

```bash
curl -X DELETE http://localhost:3000/api/auth/users/user_id \
  -H "Cookie: auth_token=votre_token_admin"
```

### Lister tous les utilisateurs

```bash
curl http://localhost:3000/api/auth/users \
  -H "Cookie: auth_token=votre_token_admin"
```

## 🔑 Comptes de Test Disponibles

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| admin@pf-scoring.ma | Admin123! | Admin |
| analyste@pf-scoring.ma | Analyste123! | Analyste |

## 📱 Points d'accès principaux

- **Page de login:** `/login`
- **Tableau de bord:** `/dashboard`
- **Créer un projet:** `/projects/new`
- **Liste des projets:** `/projects`
- **Détail d'un projet:** `/projects/{id}`
- **Évaluation d'un projet:** `/projects/{id}/evaluate`
- **Méthodologie:** `/methodology`
- **Journal d'audit:** `/audit`
- **Admin:** `/admin`

## 🐛 Dépannage Rapide

**Je ne peux pas me connecter:**
- Vérifiez l'email exact
- Vérifiez le mot de passe (sensible à la casse)
- Utilisez le mode bypass pour contourner

**Je ne vois pas ma session:**
- Vérifiez les cookies du navigateur
- Essayez de vous reconnecter
- Videz le cache du navigateur

**L'API retourne 401:**
- Vous n'êtes pas connecté
- Utilisez `/api/projects-bypass` pour tester sans auth
- Vérifiez que le token JWT est valide

**OAuth ne fonctionne pas:**
- Vérifiez les identifiants dans `.env.local`
- Vérifiez les redirect URIs configurées
- Consulter [AUTH.md](./AUTH.md) pour la configuration complète

## 📚 Documentation Complète

Pour plus de détails sur:
- **Authentification OAuth:** Voir [AUTH.md](./AUTH.md)
- **Gestion des comptes:** Voir [AUTH.md - Gestion des Comptes](./AUTH.md#-gestion-des-comptes)
- **Configuration:** Voir [AUTH.md - Configuration](./AUTH.md#-configuration-de-lenvironnement)
- **Sécurité:** Voir [AUTH.md - Sécurité](./AUTH.md#-sécurité)

## 💡 Tips & Astuces

1. **Utiliser le mode bypass pendant le développement** - C'est plus rapide
2. **Tester OAuth localement** - Utiliser `http://localhost:3000`
3. **Sauvegarder les identifiants OAuth** - Vous en aurez besoin pour la prod
4. **Changer le JWT_SECRET en production** - Ne pas utiliser la valeur par défaut
5. **Activer les CORS si nécessaire** - Pour les appels API cross-domain

## ✨ Prochaines étapes

- [ ] Créer des projets de test
- [ ] Configurer OAuth (Google/Microsoft)
- [ ] Créer des comptes utilisateurs
- [ ] Tester le scoring de projets
- [ ] Consulter les logs d'audit

Besoin d'aide? Consultez [AUTH.md](./AUTH.md) pour la documentation complète!
