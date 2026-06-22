# PARAMETRIZATION GUIDE V9 — Configuration globale de l'application

> Comment fonctionne le paramétrage global (nom, logo, couleurs, police, thème) et
> **comment ajouter un nouveau paramètre** sans toucher au moteur. Complète
> `PARAMETERIZATION_GUIDE.md` (paramétrage *scoring*, déjà en place) — ici on traite
> le paramétrage *application / branding*.

---

## 1. Principe

Une table clé/valeur unique, `BP_PF_app_configuration`, source de vérité pour tout
ce qui est affichage et marque. Lue côté serveur (cache) et injectée au boot dans
le front via un Context + des variables CSS. Modifiable depuis `/admin/configuration`
(admin only). Chaque changement est audité dans `BP_PF_app_config_history`.

```
DB (app_configuration) ──GET /api/v9/configuration──▶ AppConfigProvider (SSR cache)
        ▲                                                     │
        │ PUT /api/admin/configuration/{key}                  ▼
   /admin/configuration ◀── preview live ──────── ThemeWrapper (CSS vars)
```

---

## 2. Schéma de la clé

| Colonne | Description |
|---------|-------------|
| `key` | identifiant stable en MAJ_SNAKE (`APP_NAME`) — **PK** |
| `value` | valeur stockée en texte |
| `type` | `string` · `color` · `url` · `enum` · `bool` · `number` |
| `category` | `branding` · `theme` · `behavior` (groupe d'affichage du formulaire) |
| `description` | texte d'aide affiché dans l'UI |
| `is_public` | `true` = exposable sans authentification (ex. nom, logo) |
| `updated_at` / `updated_by` | audit |

### Clés livrées par défaut

| key | type | category | défaut |
|-----|------|----------|--------|
| `APP_NAME` | string | branding | `PF Scoring` |
| `APP_TAGLINE` | string | branding | `Scoring Project Finance` |
| `APP_LOGO_URL` | url | branding | `/logo.svg` |
| `PRIMARY_COLOR` | color | theme | `oklch(0.55 0.13 250)` |
| `SECONDARY_COLOR` | color | theme | `oklch(0.30 0.01 250)` |
| `FONT_FAMILY` | string | theme | `Inter` |
| `THEME_MODE` | enum | theme | `dark` (`dark`\|`light`) |
| `CURRENCY` | string | behavior | `MAD` |
| `DEFAULT_LOCALE` | string | behavior | `fr` |

---

## 3. Couche d'accès

### Service serveur (avec cache TTL)

```ts
// lib/services/app-config-service.ts
const CACHE_TTL = 5 * 60_000;
let cache: { at: number; data: Record<string, string> } | null = null;

export async function getAppConfig(): Promise<Record<string, string>> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data;
  const rows = await prisma.appConfiguration.findMany();
  const data = Object.fromEntries(rows.map(r => [r.key, r.value]));
  cache = { at: Date.now(), data };
  return data;
}

export async function setAppConfig(key: string, value: string, userId: string) {
  const prev = await prisma.appConfiguration.findUnique({ where: { key } });
  await prisma.appConfiguration.update({ where: { key }, data: { value, updatedBy: userId } });
  await prisma.appConfigHistory.create({
    data: { key, oldValue: prev?.value ?? null, newValue: value, changedBy: userId },
  });
  cache = null; // invalidation
}
```

### Hook client

```ts
// lib/hooks/useAppConfig.ts
export function useAppConfig() {
  return useContext(AppConfigContext); // { APP_NAME, PRIMARY_COLOR, ... }
}
```

---

## 4. Ajouter un NOUVEAU paramètre — procédure

> Aucun changement du moteur de scoring. 3 étapes (1 si purement data).

1. **Insérer la ligne** (SQL ou via UI une fois le type ajouté) :
   ```sql
   INSERT INTO "BP_PF_app_configuration"
     (key, value, type, category, description, is_public)
   VALUES
     ('FOOTER_TEXT', '© 2026 Banque X', 'string', 'branding',
      'Texte affiché en pied de page', true);
   ```
2. **(si affiché)** Consommer la clé là où c'est utile :
   ```tsx
   const { FOOTER_TEXT } = useAppConfig();
   <footer>{FOOTER_TEXT}</footer>
   ```
3. **(si c'est un token de thème)** ajouter le mapping CSS dans `ThemeWrapper`
   (une ligne `setProperty`).

C'est tout : la clé apparaît automatiquement dans `/admin/configuration`
(le formulaire est généré à partir des lignes de la table, groupées par
`category`, avec le bon widget selon `type`).

---

## 5. Formulaire d'administration (génération automatique)

`/admin/configuration` lit toutes les lignes et rend un champ par clé selon `type` :

| type | widget |
|------|--------|
| `string` | `BankInput` texte |
| `color` | sélecteur couleur + aperçu |
| `url` | `BankInput` + bouton upload (logo) |
| `enum` | `BankSelect` (valeurs depuis `metadata`) |
| `bool` | switch |
| `number` | `BankInput` numérique |

**Preview live** : les valeurs éditées alimentent un `ThemeWrapper` local
(scoped) montrant en temps réel l'effet sur une carte d'exemple avant
enregistrement. Au `Save` ⇒ `PUT /api/admin/configuration/{key}` par clé modifiée.

---

## 6. Sécurité

- `GET /api/v9/configuration` → ne renvoie que `is_public = true` (sans auth) ;
  la version complète passe par `/api/admin/configuration` (admin only,
  via `auth-middleware` + rôle `system_admin`/`scoring_admin`).
- `PUT` → admin only, journalisé dans `app_config_history` et `audit_logs`.

---

## 7. Bonnes pratiques

- Toujours fournir une **valeur par défaut** côté code (fallback si clé absente).
- Ne **jamais** stocker de secret ici (rester sur les variables d'environnement).
- Clé en `MAJ_SNAKE`, stable (ne pas renommer une clé en usage).
- Utiliser `is_public` avec parcimonie.
