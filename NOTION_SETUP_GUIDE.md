# 🚀 Notion + Claude Automation Setup Guide

## Vue d'Ensemble

Tu as configuré une **architecture automatisée complète** où:
- **Notion Database** = Source unique de vérité pour le tracking
- **Claude Code** (moi) = Lire/écrire automatiquement dans Notion
- **Python Scripts** = Générer les PPT automatiquement
- **N8N** (optionnel) = Orchestrer les workflows

---

## 📋 Pré-requis

```bash
✅ Notion API Key: (configuré dans .env.notion)
✅ Python 3.8+
✅ Git (déjà configuré)
✅ Pip (pour installer les dépendances)
```

⚠️ **Note Sécurité**: La clé API est stockée dans `.env.notion` (jamais commitée dans Git)

---

## 🎯 ÉTAPE 1: Initialiser la Notion Database

### Option A: Automatique (RECOMMANDÉ)

```bash
# 1. Installer les dépendances
pip install -r scripts/requirements.txt

# 2. Lancer le script d'initialisation
python scripts/init-notion-db.py
```

**Ce script va:**
- ✅ Créer la Notion Database automatiquement
- ✅ Importer les données du CSV
- ✅ Sauvegarder le Database ID dans `.env.notion`

### Option B: Manuel

```
1. Va sur: https://notion.so
2. Crée une nouvelle "Database" manuellement
3. Ajoute les colonnes (voir DATABASE_SCHEMA dans lib/notion-client.ts)
4. Copie l'ID de la DB dans .env.notion:
   NOTION_DATABASE_ID=xxxxx
```

---

## 🔐 Vérifier que tout fonctionne

### Test 1: Vérifier l'API Key

```bash
# Dans Python:
from notion_client import Client
import os
from dotenv import load_dotenv

load_dotenv(".env.notion")
notion = Client(auth=os.getenv("NOTION_API_KEY"))
response = notion.users.me()
print(response)  # Should show your Notion account
```

### Test 2: Accéder à la Database

```bash
python3 << 'EOF'
from notion_client import Client
import os
from dotenv import load_dotenv

load_dotenv(".env.notion")
notion = Client(auth=os.getenv("NOTION_API_KEY"))

db_id = os.getenv("NOTION_DATABASE_ID")
if db_id:
    response = notion.databases.query(database_id=db_id)
    print(f"✅ Found {len(response['results'])} items in database")
else:
    print("❌ NOTION_DATABASE_ID not configured")
EOF
```

---

## 📊 ÉTAPE 2: Générer le Première PPT

### Lancer le script de génération

```bash
# Générer avec date d'aujourd'hui
python scripts/generate-copil-ppt.py

# Générer avec date personnalisée
python scripts/generate-copil-ppt.py --date 2026-04-10

# Sauvegarder avec nom personnalisé
python scripts/generate-copil-ppt.py --output COPIL_Avril_2026.pptx
```

### Résultat:

```
✅ COPIL_Presentation.pptx créé!
📊 Contient 6 slides:
   1. Cover slide
   2. Executive Summary (KPIs)
   3. Completion by Bloc (bar chart)
   4. Global Gauge
   5. Risks & Blockers
   6. Next Steps
```

---

## 🔄 ÉTAPE 3: Workflow Automatisé

### Flux Quotidien

```
Matin (9h):
└─ Tu mets à jour Notion
   └─ Statut, Complétion %, Notes

Claude Code (via Notion API):
├─ Détecte les changements
├─ Valide les données
└─ Logs les mises à jour

Avant COPIL:
└─ Toi ou N8N déclenche:
   python scripts/generate-copil-ppt.py
   └─ PPT généré automatiquement ✅
```

### Webhooks (Optionnel avec N8N)

```
N8N Workflow:
┌─────────────────────────┐
│ Trigger: Notion Updated │
└────────────┬────────────┘
             ↓
┌──────────────────────────────────┐
│ Check: Complétion % changed?     │
└────────────┬─────────────────────┘
             ↓
┌──────────────────────────────────┐
│ Action: Run Python Script        │
│ $ python generate-copil-ppt.py   │
└────────────┬─────────────────────┘
             ↓
┌──────────────────────────────────┐
│ Upload to Google Drive           │
└────────────┬─────────────────────┘
             ↓
┌──────────────────────────────────┐
│ Send Slack Notification          │
└──────────────────────────────────┘
```

---

## 📁 Structure des Fichiers

```
pf-scoring-v7claude/
├── .env.notion                    ← API Key + Database ID (DON'T COMMIT)
├── .gitignore                     ← .env.notion is ignored
│
├── lib/
│   └── notion-client.ts          ← TypeScript client for Notion API
│
├── scripts/
│   ├── init-notion-db.py         ← Initialize database
│   ├── generate-copil-ppt.py     ← Generate PPT from Notion
│   └── requirements.txt           ← Python dependencies
│
├── NOTION_SETUP_GUIDE.md         ← This file
├── COPIL_Presentation.pptx       ← Generated PPT (output)
└── ...
```

---

## 🛠️ Commandes Utiles

### Lister tous les items du tracking

```bash
python3 << 'EOF'
import os
from notion_client import Client
from dotenv import load_dotenv

load_dotenv(".env.notion")
notion = Client(auth=os.getenv("NOTION_API_KEY"))
db_id = os.getenv("NOTION_DATABASE_ID")

response = notion.databases.query(database_id=db_id)
for page in response["results"]:
    props = page["properties"]
    print(f"{props['Name']['title'][0]['plain_text']}: {props['Statut']['select']['name']}")
EOF
```

### Mettre à jour un item (depuis CLI)

```bash
python3 << 'EOF'
import os
from notion_client import Client
from dotenv import load_dotenv

load_dotenv(".env.notion")
notion = Client(auth=os.getenv("NOTION_API_KEY"))

# Remplacer par ID réel
page_id = "xxxxxxxxxxxxx"

notion.pages.update(
    page_id=page_id,
    properties={
        "Complétion %": {"number": 0.85},
        "Statut": {"select": {"name": "EN COURS"}},
        "Notes": {"rich_text": [{"text": {"content": "Updated from CLI"}}]}
    }
)

print("✅ Page updated!")
EOF
```

---

## 📊 Utilisation Notion Database

### Comment ajouter une tâche manuellement

```
1. Ouvre ta Notion Database
2. Clique "Add a new page" ou "+"
3. Remplis:
   - Name: Titre de la tâche
   - Bloc: Catégorie
   - Catégorie: Type
   - Statut: INTÉGRÉ / EN COURS / PLANIFIÉ / BLOQUÉ
   - Complétion %: 0-100
   - Description: Détail
   - Spécification: Cahier des charges
   - Notes: Comments/blocages
   - Date Maj: Aujourd'hui
4. Sauvegarde (Notion auto-save)
```

### Filtrer et Trier

```
Notion supporte nativement:
- Filters: Par Statut, Bloc, Complétion %, etc.
- Sorts: Par Date Maj (DESC = récent en premier)
- Groups: Par Bloc ou Statut (vue groupée)
- Search: Texte libre
```

---

## 🤖 Integration avec Claude Code

### Comment Claude accède à Notion

```typescript
// lib/notion-client.ts
import { notion } from "@/lib/notion-client";

// Lire les données
const items = await notion.databases.query({
  database_id: NOTION_DATABASE_ID
});

// Mettre à jour
await notion.pages.update({
  page_id: pageId,
  properties: {
    "Complétion %": { number: 85 }
  }
});
```

### Utilisation dans les Routes API

```typescript
// app/api/pmo/sync/route.ts
import { getTrackingItems, getTrackingStats } from "@/lib/notion-client";

export async function GET() {
  const items = await getTrackingItems();
  const stats = await getTrackingStats();
  
  return Response.json({ items, stats });
}
```

---

## 📈 Générer des Rapports Personnalisés

### Modifier le template PPT

Édite `scripts/generate-copil-ppt.py`:

```python
def add_custom_slide(prs, stats):
    """Ajoute une slide personnalisée"""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    
    # Ajoute ton contenu
    title_box = slide.shapes.add_textbox(...)
    # ...
```

### Exporter en PDF

```bash
# PPT → PDF (via LibreOffice)
libreoffice --headless --convert-to pdf COPIL_Presentation.pptx
```

---

## ⚠️ Dépannage

### Erreur: NOTION_API_KEY not found

```bash
# Solution:
echo "NOTION_API_KEY=<your_api_key_here>" > .env.notion
echo "NOTION_DATABASE_ID=<found_later>" >> .env.notion

# Notes:
# - Clé API obtenue depuis https://www.notion.com/my-integrations
# - Ne JAMAIS commit .env.notion dans Git
```

### Erreur: NOTION_DATABASE_ID not configured

```bash
# Lancer le script d'init pour créer la DB:
python scripts/init-notion-db.py

# Ou ajouter manuellement à .env.notion:
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxx
```

### PPT generation fails

```bash
# Vérifier les dépendances:
pip install --upgrade -r scripts/requirements.txt

# Vérifier la DB:
python3 -c "
from notion_client import Client
import os
from dotenv import load_dotenv

load_dotenv('.env.notion')
notion = Client(auth=os.getenv('NOTION_API_KEY'))
response = notion.databases.query(database_id=os.getenv('NOTION_DATABASE_ID'))
print(f'Items: {len(response[\"results\"])}')
"
```

---

## 🚀 Automatisation Avancée (Optionnel)

### Avec GitHub Actions

```yaml
# .github/workflows/copil-ppt-daily.yml
name: Daily COPIL PPT Generation
on:
  schedule:
    - cron: '0 8 * * 1'  # Every Monday at 8am

jobs:
  generate-ppt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: pip install -r scripts/requirements.txt
      
      - name: Generate PPT
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DATABASE_ID: ${{ secrets.NOTION_DATABASE_ID }}
        run: python scripts/generate-copil-ppt.py --output "COPIL_$(date +%Y%m%d).pptx"
      
      - name: Upload to Google Drive
        run: |
          # Your upload script here
```

### Avec N8N (Self-hosted)

1. Download: https://n8n.io
2. Create workflow:
   - Trigger: Cron (daily)
   - Action: Run Python script
   - Action: Upload file
   - Action: Send notification

---

## ✅ Checklist

- [ ] API Key obtained (from https://www.notion.com/my-integrations)
- [ ] `.env.notion` file created
- [ ] Python dependencies installed (`pip install -r scripts/requirements.txt`)
- [ ] Notion Database initialized (`python scripts/init-notion-db.py`)
- [ ] Database ID saved in `.env.notion`
- [ ] First PPT generated (`python scripts/generate-copil-ppt.py`)
- [ ] Data synchronized to Notion
- [ ] Shared with team members
- [ ] (Optional) N8N workflow configured
- [ ] (Optional) GitHub Actions configured

---

## 📞 Support

**Problème?** Dis-moi:
```
- Quel error tu vois?
- À quelle étape?
- Tu as exécuté quel commande?
```

Et je vais te fixer! 💪

---

**Créé**: 2026-04-06
**Version**: 1.0
**Status**: READY FOR PRODUCTION

🚀 **Bon suivi!**
