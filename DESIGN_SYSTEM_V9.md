# DESIGN SYSTEM V9 — « Banque Simple »

> Objectif : une identité sobre, institutionnelle, lisible — adaptée à une banque.
> Pas d'ornement, pas d'emoji dans l'UI de production, hiérarchie typographique
> claire, grille 8px. Entièrement **paramétrable** via `BP_PF_app_configuration`
> (couleurs, police, logo, nom) sans redéploiement.

---

## 1. Audit du design actuel (point de départ)

- **Stack** : TailwindCSS v4 (`@theme inline`), variables CSS en `oklch`, thème
  sombre forcé (`<html class="dark">`), shadcn/ui, icônes `lucide-react`.
- **Palette actuelle** : fond `oklch(0.1 …)` quasi-noir, cartes `slate-800`,
  primaire bleu `oklch(0.65 0.18 250)`, accents multicolores par domaine
  (bleu/violet/vert/emerald/ambre/orange/cyan/rose/rouge) + emojis 💰⚙️📈…
- **Constats** : déjà épuré et cohérent (cf. `app/admin/scoring/page.tsx`,
  `app/admin/system-settings/page.tsx` qui utilise déjà `Card`/`Button`
  shadcn + tokens `bg-background`, `text-muted-foreground`). **Mais** trop de
  couleurs d'accent et des emojis → peu « banque ». V9 rationalise.

**Philosophie layout retenue** (déjà présente, à généraliser) : conteneur
`max-w-4xl`/`max-w-7xl` centré, en-tête avec flèche retour + titre + sous-titre,
contenu en cartes `p-6` espacées de `mb-6`, actions à droite.

---

## 2. Design tokens

### 2.1 Couleurs (mode sombre par défaut, paramétrables)

| Token | Rôle | Valeur par défaut (oklch) | Clé config |
|-------|------|---------------------------|------------|
| `--background` | Fond app | `oklch(0.13 0.005 250)` | — |
| `--surface` | Carte/panneau | `oklch(0.17 0.005 250)` | — |
| `--foreground` | Texte principal | `oklch(0.96 0.005 250)` | — |
| `--muted-foreground` | Texte secondaire | `oklch(0.68 0.01 250)` | — |
| `--primary` | Accent banque | `oklch(0.55 0.13 250)` (bleu sobre) | `PRIMARY_COLOR` |
| `--secondary` | Accent neutre | `oklch(0.30 0.01 250)` | `SECONDARY_COLOR` |
| `--border` | Bordures | `oklch(0.26 0.005 250)` | — |
| `--success` | Validé/Go | `oklch(0.60 0.13 150)` | — |
| `--warning` | Sous conditions | `oklch(0.75 0.13 80)` | — |
| `--destructive` | Rejeté/No-Go | `oklch(0.55 0.18 25)` | — |

Règle « banque simple » : **un seul accent** (bleu primaire). Les 9 domaines ne
sont plus 9 couleurs vives mais des **nuances neutres + un badge code** (`D1`…).
La couleur n'est réservée qu'aux états sémantiques (succès/avertissement/erreur)
et aux grades.

### 2.2 Typographie

- Police : **Inter** (fallback Helvetica Neue, Arial, sans-serif). Paramétrable
  via `FONT_FAMILY`.
- Échelle (multiples cohérents) :

| Usage | Classe | Taille / poids |
|-------|--------|----------------|
| Titre page | `text-2xl font-semibold` | 24px / 600 |
| Titre section | `text-lg font-semibold` | 18px / 600 |
| Corps | `text-sm` | 14px / 400 |
| Label / méta | `text-xs text-muted-foreground` | 12px / 400 |
| Donnée chiffrée | `font-mono tabular-nums` | — |

### 2.3 Espacement & grille

- Base **8px** : `gap-2`(8) `gap-4`(16) `gap-6`(24) `gap-8`(32).
- Grille **12 colonnes** pour les formulaires (`grid grid-cols-12 gap-4`).
- Rayon : `--radius: 0.5rem` (cartes `rounded-lg`, inputs `rounded-md`).
- Conteneur : `max-w-7xl mx-auto px-6`.

### 2.4 Élévation

- Pas d'ombres marquées. Distinction par **bordure + surface** (`border
  border-border bg-surface`). Au survol : `hover:bg-surface/70`.

---

## 3. Composants du design system

Tous sous `components/bank/`, basés sur les tokens (donc re-thémables via config).

| Composant | Rôle | Variantes |
|-----------|------|-----------|
| `BankButton` | Bouton | `primary` · `secondary` · `ghost` · `destructive` ; tailles `sm/md` |
| `BankCard` | Conteneur | en-tête optionnel (titre + actions), `padding` cohérent |
| `BankTable` | Tableau dense | en-tête `bg-surface`, lignes `divide-border`, `tabular-nums` |
| `BankInput` / `BankSelect` | Saisie | état normal / erreur, label + hint |
| `BankBadge` | Étiquette | `neutral` · grades (AAA→D) · statuts |
| `BankPageHeader` | En-tête de page | flèche retour + titre + sous-titre + slot actions |
| `BankStat` | KPI | label + valeur + variation |

Principe : **zéro couleur codée en dur** dans ces composants — uniquement des
classes basées sur les tokens (`bg-primary`, `text-foreground`, `border-border`).

---

## 4. Grades & états (seule couleur tolérée)

| Grade | Couleur | Statut éval | Couleur |
|-------|---------|-------------|---------|
| AAA / AA / A | `success` | Validé | `success` |
| BBB / BB | `warning` | Soumis | `warning` |
| B / CCC / D | `destructive` | Brouillon | `muted` |
| | | Rejeté | `destructive` |

À sortir de l'actuel `lib/ui-constants.ts` (qui mélange `green/blue/cyan…`)
vers des tokens sémantiques.

---

## 5. Pages à redesigner (priorisées)

| # | Page | Fichier | Changement |
|---|------|---------|------------|
| 1 | Navigation / header | `components/layout/Navbar.tsx`, `Sidebar.tsx` | logo + nom depuis config ; accent unique |
| 2 | Login / Register | `app/login/` | carte centrée épurée, logo config |
| 3 | Éditeur grille scoring | `app/admin/scoring/page.tsx` | retirer emojis, badges code neutres, `BankTable` |
| 4 | Formulaire d'évaluation | `app/evaluations/new`, `[id]/edit` | grille 12-col, focus données, `BankInput` |
| 5 | **Page paramétrage** (nouvelle) | `app/admin/configuration/page.tsx` | éditer app_name/logo/couleurs + preview live |

---

## 6. Injection des tokens depuis la config

Au boot, `ThemeWrapper` lit `BP_PF_app_configuration` et écrit les variables CSS
sur `:root` :

```css
:root {
  --primary: var(--cfg-primary, oklch(0.55 0.13 250));
  --font-sans: var(--cfg-font, "Inter", sans-serif);
}
```

```tsx
// pseudo
const cfg = useAppConfig();
document.documentElement.style.setProperty("--cfg-primary", cfg.PRIMARY_COLOR);
document.documentElement.style.setProperty("--cfg-font", cfg.FONT_FAMILY);
```

Changer une couleur en base ⇒ re-render ⇒ thème mis à jour, **sans déploiement**.
