-- Réinitialise le mot de passe de TOUS les comptes actifs (non supprimés) et
-- retourne le tableau email / nom / rôle / nouveau mot de passe temporaire.
-- Sûr à exécuter : ne lit ni n'affiche aucun ancien mot de passe (impossible,
-- ils sont hashés bcrypt/one-way) ; ne fait que les remplacer par de nouveaux.
-- pgcrypto's crypt(..., gen_salt('bf')) produit un hash $2a$ compatible bcryptjs
-- (lib/auth.ts utilise bcrypt.compare, qui vérifie les préfixes $2a$/$2b$/$2y$).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH new_creds AS (
  SELECT
    id,
    'Pf' || substr(replace(replace(encode(gen_random_bytes(6), 'base64'), '/', 'x'), '+', 'y'), 1, 8) || '!26' AS plain_password
  FROM "BP_PF_users"
  WHERE "deletedAt" IS NULL
)
UPDATE "BP_PF_users" u
SET
  password = crypt(nc.plain_password, gen_salt('bf', 10)),
  "mustChangePassword" = true,
  "updatedAt" = now()
FROM new_creds nc
WHERE u.id = nc.id
RETURNING
  u.email,
  u.nom,
  u.prenom,
  u.role,
  nc.plain_password AS "nouveauMotDePasse";
