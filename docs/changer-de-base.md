# Changer de base de données

L'application fonctionne avec **n'importe quelle base PostgreSQL 14 ou plus récente** : Supabase,
PostgreSQL hébergé par la banque, Azure Database for PostgreSQL, Amazon RDS, Google Cloud SQL…
Le seul réglage est l'adresse de connexion `DATABASE_URL`. Le schéma de référence est
`prisma/schema.prisma` ; il correspond exactement à la base de production actuelle.

Les pièces des dossiers (analyse par IA) sont stockées à part, dans Supabase Storage ou dans tout
stockage compatible S3 (voir la dernière section) : changer de base ne les déplace pas.

## 1. Préparer la nouvelle base

Créez une base vide et un utilisateur propriétaire, puis créez le schéma, au choix :

```bash
# A. Depuis l'application (le plus simple)
DATABASE_URL="postgresql://utilisateur:motdepasse@hote:5432/pfscoring" npm run db:schema

# B. Par un administrateur de base, avec le SQL complet (relu et versionné)
psql "postgresql://…/pfscoring" -v ON_ERROR_STOP=1 -f prisma/schema-complet.sql
```

`prisma/schema-complet.sql` se régénère après toute modification du schéma : `npm run db:schema:sql`.

## 2a. Reprendre les données de l'ancienne base (cas habituel)

```bash
export SOURCE_DATABASE_URL="postgresql://…ancienne base…"
export DATABASE_URL="postgresql://…nouvelle base…"

npm run db:copier                  # à blanc : liste ce qui sera copié, n'écrit rien
npm run db:copier -- --appliquer   # copie réelle
```

- La copie traite toutes les tables de l'application, dans l'ordre des clés étrangères, et compare
  à la fin le nombre de lignes de chaque table entre les deux bases.
- La nouvelle base doit être **vide** : le script refuse sinon. Si une copie est interrompue,
  relancez avec `--appliquer --completer` (les lignes déjà copiées sont ignorées).
- Aucun droit d'administrateur n'est requis sur la nouvelle base.
- Les dates sont conservées à la milliseconde.
- Trois anciennes tables de la production actuelle, que l'application n'utilise plus, ne sont pas
  reprises : `BP_PF_evaluations`, `BP_PF_scoring_audit_logs`, `BP_PF_stress_test_results`. Si leur
  contenu doit être archivé, exportez-les à part (`pg_dump -t '"BP_PF_evaluations"' …`).
- Pendant la copie, suspendez les saisies (ou faites-la hors des heures d'utilisation) : les
  modifications faites dans l'ancienne base après le début de la copie ne seraient pas reprises.

## 2b. Démarrer sur une base neuve (sans reprise)

```bash
npm run db:reference         # barème de notation et listes de paramétrage
npx tsx prisma/seed.ts       # modèle de scoring publié et compte administrateur initial
```

## 3. Contrôler avant de brancher

```bash
DATABASE_URL="postgresql://…nouvelle base…" npm run db:verifier
```

Le contrôle vérifie la version de PostgreSQL et l'identité exacte du schéma avec celui de
l'application. Il vérifie aussi la présence d'une version publiée du modèle, du barème de
notation et d'au moins deux comptes actifs (séparation des fonctions). Il affiche enfin le
volume de chaque table. Tout point marqué ✗ est bloquant.

## 4. Brancher l'application

Remplacez `DATABASE_URL` dans les variables d'environnement (Vercel : Settings → Environment
Variables) puis redéployez.

- **Hébergement « serverless » (Vercel)** : utilisez l'adresse d'un *pooler* de connexions
  (PgBouncer, Supabase Pooler, RDS Proxy…), avec `?pgbouncer=true&connection_limit=1` si le pooler
  est en mode transaction. Les commandes `db:schema`, `db:copier` et `db:verifier` doivent, elles,
  utiliser l'adresse **directe** de la base.
- **Serveur classique** (machine virtuelle, conteneur) : l'adresse directe suffit.
- Imposez le chiffrement : ajoutez `?sslmode=require` (ou `verify-full` avec le certificat de
  l'hébergeur).

Gardez l'ancienne base en lecture seule quelques jours : revenir en arrière consiste à remettre
l'ancienne `DATABASE_URL`.

## Stockage des pièces

| Fournisseur | Variables |
| --- | --- |
| Supabase Storage (par défaut) | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Compatible S3 (AWS S3, MinIO, Ceph…) | `STOCKAGE_PIECES=s3`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_REGION`, `S3_ENDPOINT` (sauf AWS), `S3_FORCE_PATH_STYLE=true` (MinIO) |

Commun : `DOCUMENTS_BUCKET` (`pieces-dossiers` par défaut).

- **Supabase** crée le compartiment automatiquement.
- **S3** : créez le compartiment, **privé**. Autorisez par CORS les requêtes `PUT` venant de
  l'adresse de l'application : le navigateur y dépose les fichiers directement, par un lien signé
  valable 15 minutes.

Pour changer de stockage sans perdre les pièces existantes, recopiez le contenu du compartiment
avec l'outil de l'hébergeur (`aws s3 sync`, `mc mirror`…). Les chemins sont identiques d'un
fournisseur à l'autre.
