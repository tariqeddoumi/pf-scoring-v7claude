# 🏦 PF Scoring V7++ - Project Finance Evaluation Platform

**Application bancaire complète pour l'évaluation et la gestion des projets de financement.**

Conforme: IFC | EBRD | Basel III | Bank Al-Maghrib

## 🚀 Status Phases

| Phase                       | Status |
| --------------------------- | ------ |
| 1. Core                     | ✅     |
| 2A. Workflow                | ✅     |
| 2B. Governance              | ✅     |
| 3. Advanced                 | ✅     |
| 4. Export & Compliance      | ✅     |
| 5. Analytics & Benchmarking | ✅     |
| 6. Backend & API            | 🔄     |

## 🛠️ Tech Stack

- Next.js 15 | React | TypeScript (strict)
- shadcn/ui + TailwindCSS
- Supabase (PostgreSQL)
- Prisma ORM
- Vercel Deploy

## ⚡ Start

```bash
npm install && npm run dev
# http://localhost:3000
```

## 📊 Features

✅ Dashboard | ✅ Scoring Engine | ✅ Workflow
✅ User Management | ✅ Audit Logs | ✅ Search
✅ Alerts | ✅ Monitoring | ✅ Analytics
✅ Benchmarking | ✅ Exports (PDF/Excel/Word) | ✅ GDPR Compliance

## 🏗️ Modèle Project Finance

Scoring en 13 blocs, aligné sur l'outil Excel (`docs/outil-excel/`) : même moteur, mêmes
paramètres, mêmes 18 cas d'étude. Description complète : [docs/modele-pf-web.md](docs/modele-pf-web.md).

## 🗄️ Base de données

Tout PostgreSQL 14+ (Supabase, hébergé par la banque, RDS, Azure…). Pour changer de base ou
reprendre les données : [docs/changer-de-base.md](docs/changer-de-base.md).

## 📝 Voir DEPLOY.md pour mise en production
