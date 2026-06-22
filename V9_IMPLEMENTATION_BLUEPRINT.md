# V9 IMPLEMENTATION BLUEPRINT — Seed, API routes, Components

> Pseudo-code / structures de référence pour Phase 4 de la mission. À transformer
> en fichiers réels lors de l'implémentation. Le schéma Prisma est dans
> `prisma/schema.v9.prisma`.

---

## 1. Seed script V9 (`prisma/seed-v9.ts`)

```ts
import { PrismaClient } from "@prisma/client";
import v9 from "./migrations/2026XXXX_v9_sectoral/v9_source_data.json";
const prisma = new PrismaClient();

// 12 secteurs (réutilisés depuis V8 si déjà présents)
const SECTORS = [
  { code: "ENR", label: "Énergies renouvelables" },
  { code: "EAU", label: "Eau / Dessalement" },
  { code: "TRA", label: "Transport / Autoroutes" },
  { code: "POR", label: "Ports / Logistique" },
  { code: "IND", label: "Industrie / Manufacturing" },
  { code: "MIN", label: "Mines / Extraction" },
  { code: "TOU", label: "Tourisme / Hôtellerie" },
  { code: "TEL", label: "Télécom / Data Centers" },
  { code: "SAN", label: "Santé / Cliniques" },
  { code: "AGR", label: "Agro-industrie" },
  { code: "ETH", label: "Énergie thermique / Gaz" },
  { code: "IMM", label: "Immobilier / Promotion structurée" },
];

async function main() {
  // 1) Secteurs
  for (const [i, s] of SECTORS.entries()) {
    await prisma.v9Sector.upsert({
      where: { code: s.code },
      update: { label: s.label, orderIndex: i + 1 },
      create: { code: s.code, label: s.label, orderIndex: i + 1 },
    });
  }
  const byCode = Object.fromEntries(
    (await prisma.v9Sector.findMany()).map((s) => [s.code, s.id])
  );

  // 2) Seuils / red flags / indicateurs / stress — depuis le JSON Excel
  for (const t of v9.thresholds)   // {sector, ratioType, level, min, max, score}
    await prisma.v9SectorThreshold.upsert({
      where: { sectorId_ratioType_level: { sectorId: byCode[t.sector], ratioType: t.ratioType, level: t.level } },
      update: { minValue: t.min, maxValue: t.max, score: t.score },
      create: { sectorId: byCode[t.sector], ratioType: t.ratioType, level: t.level, minValue: t.min, maxValue: t.max, score: t.score },
    });

  for (const r of v9.redFlags)     // {sector, code, description, isNoGo, penalty, order}
    await prisma.v9RedFlag.upsert({
      where: { sectorId_code: { sectorId: byCode[r.sector], code: r.code } },
      update: { description: r.description, isNoGo: r.isNoGo, penalty: r.penalty, orderIndex: r.order },
      create: { sectorId: byCode[r.sector], code: r.code, description: r.description, isNoGo: r.isNoGo, penalty: r.penalty, orderIndex: r.order },
    });

  for (const ind of v9.indicators) { /* upsert v9Indicator … */ }
  for (const st of v9.stressTests) { /* upsert v9StressTest … */ }
  for (const m of v9.malusBonus)   { /* upsert v9MalusBonus by code … */ }
  for (const a of v9.antiDouble)   { /* upsert v9AntiDoubleCount by (factorCode,domainCode) … */ }

  // 3) Config par défaut
  const DEFAULT_CONFIG = [
    { key: "APP_NAME", value: "PF Scoring", type: "string", category: "branding", isPublic: true },
    { key: "APP_LOGO_URL", value: "/logo.svg", type: "url", category: "branding", isPublic: true },
    { key: "PRIMARY_COLOR", value: "oklch(0.55 0.13 250)", type: "color", category: "theme", isPublic: true },
    { key: "FONT_FAMILY", value: "Inter", type: "string", category: "theme", isPublic: true },
    { key: "THEME_MODE", value: "dark", type: "enum", category: "theme", isPublic: true, metadata: '["dark","light"]' },
    { key: "CURRENCY", value: "MAD", type: "string", category: "behavior", isPublic: true },
  ];
  for (const c of DEFAULT_CONFIG)
    await prisma.appConfiguration.upsert({ where: { key: c.key }, update: {}, create: c });
}
main().finally(() => prisma.$disconnect());
```

### Exemple concret — 2 secteurs complets (ENR, TRA)

```jsonc
// extrait de v9_source_data.json
{
  "thresholds": [
    { "sector": "ENR", "ratioType": "DSCR", "level": "EXCELLENT",   "min": 1.45, "max": null, "score": 100 },
    { "sector": "ENR", "ratioType": "DSCR", "level": "BON",         "min": 1.30, "max": 1.45, "score": 80 },
    { "sector": "ENR", "ratioType": "DSCR", "level": "ACCEPTABLE",  "min": 1.15, "max": 1.30, "score": 55 },
    { "sector": "ENR", "ratioType": "DSCR", "level": "INSUFFISANT", "min": null, "max": 1.15, "score": 20 },
    { "sector": "TRA", "ratioType": "DSCR", "level": "EXCELLENT",   "min": 1.35, "max": null, "score": 100 },
    { "sector": "TRA", "ratioType": "DSCR", "level": "INSUFFISANT", "min": null, "max": 1.10, "score": 20 }
    // … LLCR, LEVERAGE idem
  ],
  "redFlags": [
    { "sector": "ENR", "code": "RF_ENR_1", "description": "Productible P90 < 0.85 × P50", "isNoGo": false, "penalty": -3, "order": 1 },
    { "sector": "ENR", "code": "RF_ENR_2", "description": "PPA non signé à la clôture",   "isNoGo": true,  "penalty": null, "order": 2 },
    { "sector": "TRA", "code": "RF_TRA_1", "description": "Étude de trafic > 5 ans",       "isNoGo": false, "penalty": -2, "order": 1 }
  ],
  "indicators": [
    { "sector": "ENR", "code": "ENR_I1", "label": "Facteur de charge", "unit": "%", "targetValue": ">=25", "direction": "HIGHER_BETTER", "order": 1 },
    { "sector": "TRA", "code": "TRA_I1", "label": "Trafic moyen journalier", "unit": "veh/j", "targetValue": ">=20000", "direction": "HIGHER_BETTER", "order": 1 }
  ]
}
```

---

## 2. API routes V9

### `GET /api/v9/configuration` — paramètres publics (cache)

```ts
// app/api/v9/configuration/route.ts
import { getAppConfig } from "@/lib/services/app-config-service";
export async function GET() {
  const all = await getAppConfig();            // cache 5 min
  const publicOnly = await filterPublic(all);  // is_public = true
  return Response.json(
    { success: true, data: publicOnly },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
  );
}
```

### `GET /api/v9/scoring-model` — structure complète

```ts
// renvoie modèle + socle (depuis questionnaire v7pp) + comptes de contrôle
export async function GET() {
  const model = await prisma.v9ScoringModel.findFirst({ where: { isActive: true } });
  const socle = await buildQuestionnaire();    // réutilise le builder v7pp existant
  return Response.json({ success: true, data: { model, socle } });
}
```

### `GET /api/v9/sectors` — secteurs + seuils + red flags + indicateurs

```ts
export async function GET() {
  const sectors = await prisma.v9Sector.findMany({
    where: { isActive: true },
    orderBy: { orderIndex: "asc" },
    include: { thresholds: true, domainWeights: true, redFlags: true, indicators: true, stressTests: true },
  });
  return Response.json({ success: true, data: sectors });
}
```

### `GET /api/v9/control` — vérification des comptes

```ts
export async function GET() {
  const checks = {
    domains:      await countNodes("DOMAIN"),        // attendu 9
    criteria:     await countNodes("CRITERION"),     // 28
    subCriteria:  await countNodes("SUB_CRITERION"), // 84
    options:      await prisma.scoringNodeOption.count(),        // 336
    sectors:      await prisma.v9Sector.count(),                 // 12
    thresholds:   await prisma.v9SectorThreshold.count(),        // 144
    domainWeights:await prisma.v9SectorDomainWeight.count(),     // 108
    redFlags:     await prisma.v9RedFlag.count(),                // 96
    indicators:   await prisma.v9Indicator.count(),             // 72
    stressTests:  await prisma.v9StressTest.count(),            // 24
    antiDouble:   await prisma.v9AntiDoubleCount.count(),       // 72
  };
  const expected = { domains:9, criteria:28, subCriteria:84, options:336, sectors:12,
    thresholds:144, domainWeights:108, redFlags:96, indicators:72, stressTests:24, antiDouble:72 };
  const ok = Object.entries(expected).every(([k,v]) => checks[k] === v);
  return Response.json({ success: ok, checks, expected });
}
```

### `PUT /api/admin/configuration/[key]` — mise à jour (admin only)

```ts
// app/api/admin/configuration/[key]/route.ts
import { requireRole } from "@/lib/auth-middleware";
import { setAppConfig } from "@/lib/services/app-config-service";
export async function PUT(req: Request, { params }: { params: { key: string } }) {
  const user = await requireRole(req, ["system_admin", "scoring_admin"]);
  const { value } = await req.json();
  await setAppConfig(params.key, value, user.id);   // + history + cache invalidation
  return Response.json({ success: true });
}
```

---

## 3. Components du design system (`components/bank/`)

### `AppConfigProvider.tsx`

```tsx
"use client";
const AppConfigContext = createContext<Record<string,string>>({});
export function AppConfigProvider({ initial, children }) {
  const [cfg] = useState(initial);          // hydraté côté serveur
  return <AppConfigContext.Provider value={cfg}>{children}</AppConfigContext.Provider>;
}
export const useAppConfig = () => useContext(AppConfigContext);
```

### `ThemeWrapper.tsx`

```tsx
"use client";
export function ThemeWrapper({ children }) {
  const cfg = useAppConfig();
  useEffect(() => {
    const r = document.documentElement.style;
    if (cfg.PRIMARY_COLOR) r.setProperty("--primary", cfg.PRIMARY_COLOR);
    if (cfg.SECONDARY_COLOR) r.setProperty("--secondary", cfg.SECONDARY_COLOR);
    if (cfg.FONT_FAMILY) r.setProperty("--font-sans", cfg.FONT_FAMILY);
    document.documentElement.className = cfg.THEME_MODE === "light" ? "" : "dark";
  }, [cfg]);
  return <>{children}</>;
}
```

### `BankButton.tsx`

```tsx
const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "text-foreground hover:bg-surface",
  destructive: "bg-destructive text-white hover:opacity-90",
};
export function BankButton({ variant = "primary", size = "md", className, ...p }) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return <button className={cn("rounded-md font-medium transition-colors", VARIANTS[variant], sz, className)} {...p} />;
}
```

### `BankCard.tsx`

```tsx
export function BankCard({ title, actions, children, className }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
```

### `BankTable.tsx`

```tsx
export function BankTable({ columns, rows }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-surface text-muted-foreground text-xs">
          {columns.map((c) => <th key={c.key} className="px-3 py-2 text-left font-medium">{c.label}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((r, i) => (
          <tr key={i} className="hover:bg-surface/60">
            {columns.map((c) => <td key={c.key} className="px-3 py-2 tabular-nums">{r[c.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Câblage dans `app/layout.tsx`

```tsx
const config = await getAppConfig();            // serveur
<AppConfigProvider initial={config}>
  <ThemeWrapper>{children}</ThemeWrapper>
</AppConfigProvider>
```
