# ⚡ Quick Start: Notion + Claude + PPT Auto

## 🎯 Tu as la clé API! Voici les 5 prochaines étapes

⚠️ **Sécurité**: La clé API est sauvegardée dans `.env.notion` qui ne sera JAMAIS commitée dans Git

---

## ÉTAPE 1: Installer Python (2 min)

```bash
# Vérifier que Python est installé
python --version  # Should be 3.8+

# Installer les dépendances
pip install -r scripts/requirements.txt
```

**Output attendu:**
```
Successfully installed notion-client, python-pptx, ...
```

---

## ÉTAPE 2: Initialiser la Notion Database (3 min)

```bash
# Créer la DB et importer les données du CSV
python scripts/init-notion-db.py
```

**Output attendu:**
```
🚀 PF Scoring - Notion Database Initialization
📦 Creating Notion Database...
✅ Database created successfully!
📝 Database ID: xxxxxxxxxxxxx

📥 Importing data from PF_SCORING_SPECIFICATIONS_TRACKING.csv...
✅ Imported 85 items successfully!
```

**⚠️ IMPORTANT:** Copie l'ID affiché dans `.env.notion`

---

## ÉTAPE 3: Vérifier l'accès (2 min)

```bash
# Vérifier que Claude peut accéder à Notion
python3 << 'EOF'
import os
from notion_client import Client
from dotenv import load_dotenv

load_dotenv(".env.notion")
notion = Client(auth=os.getenv("NOTION_API_KEY"))
db_id = os.getenv("NOTION_DATABASE_ID")

if db_id:
    response = notion.databases.query(database_id=db_id)
    print(f"✅ SUCCESS! Found {len(response['results'])} items")
    print("📊 Notion is connected to Claude!")
else:
    print("❌ NOTION_DATABASE_ID not configured")
EOF
```

**Output attendu:**
```
✅ SUCCESS! Found 85 items
📊 Notion is connected to Claude!
```

---

## ÉTAPE 4: Générer la première PPT (30 sec)

```bash
# Générer la présentation COPIL
python scripts/generate-copil-ppt.py
```

**Output attendu:**
```
🚀 PF Scoring - COPIL Presentation Generator
==================================================
📥 Fetching data from Notion...
✅ Fetched 85 tracking items

📊 Calculating statistics...
✅ Statistics calculated:
   - Total items: 85
   - Integrated: 65
   - In progress: 15
   - Average completion: 85.0%

📝 Creating presentation...
✅ Presentation created successfully!
📁 Saved to: /home/user/.../COPIL_Presentation.pptx
📊 Total slides: 6
```

**Résultat:** `COPIL_Presentation.pptx` prêt! 🎉

---

## ÉTAPE 5: Tester le système (5 min)

### A. Ouvrir la Notion Database

```
1. Va sur: https://notion.so
2. Cherche "PF Scoring PMO Tracking"
3. Tu dois voir 85 items avec:
   - Colonne Statut (INTÉGRÉ/EN COURS/PLANIFIÉ)
   - Colonne Complétion % (0-100)
   - Colonne Bloc (Système, Scoring, etc.)
```

### B. Modifier une tâche dans Notion

```
1. Trouve un item (ex: "D1 - Project Fundamentals")
2. Change Complétion % de 100 → 95
3. Change Notes → "Test from Notion"
4. Sauvegarde (auto)
```

### C. Vérifier que Claude voit le changement

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
    name = props['Name']['title'][0]['plain_text']
    if "Project Fundamentals" in name:
        print(f"✅ Found: {name}")
        print(f"   Completion: {props['Complétion %']['number']}%")
        print(f"   Notes: {props['Notes']['rich_text'][0]['plain_text'] if props['Notes']['rich_text'] else 'None'}")
EOF
```

### D. Régénérer la PPT

```bash
python scripts/generate-copil-ppt.py --output "COPIL_Test.pptx"
```

**La nouvelle PPT doit réfléchir le changement de 100% → 95%!** ✅

---

## 🎯 Flux Quotidien (À partir de maintenant)

### Chaque jour:

```
09:00 - TU:
└─ Mets à jour Notion
   ├─ Complétion %: Progression réelle
   ├─ Statut: INTÉGRÉ / EN COURS / PLANIFIÉ
   └─ Notes: Blocages, détails

16:00 - AVANT COPIL:
└─ Toi ou N8N (automation):
   └─ python scripts/generate-copil-ppt.py
      └─ PPT généré automatiquement! ✅

17:00 - COPIL:
└─ Présente le PPT
   └─ Tous les chiffres sont à jour ✅
```

---

## 📦 Ce que tu as maintenant

```
✅ Notion Database
   └─ Source unique de vérité
   └─ Collaborative (tu peux inviter l'équipe)
   └─ 85 items pré-remplis

✅ Claude Integration
   └─ Peut lire/écrire dans Notion
   └─ Via API automatiquement
   └─ Aucun manuel copier-coller

✅ PPT Auto-Generation
   └─ python script génère PPT de A à Z
   └─ 6 slides professionnels
   └─ Graphiques + Statuts + Risques

✅ Git-integrated
   └─ Code versionnné
   └─ Scripts réutilisables
   └─ Deployable partout
```

---

## 🚀 Prochaines étapes avancées

### Option 1: Automatisation quotidienne avec GitHub Actions

```bash
# Générer PPT automatiquement chaque matin
git push  # Les GitHub Actions vont faire le reste
```

### Option 2: Slack notifications

```python
# notify.py
import slack
client = slack.WebClient(token=SLACK_TOKEN)
client.chat_postMessage(
    channel="#pmo",
    text="✅ COPIL PPT généré! COPIL_Presentation.pptx"
)
```

### Option 3: N8N workflow

```
Notion Change → N8N detects → Runs Python → Uploads PDF → Slack
```

---

## ✅ Validation finale

Pour confirmer que tout fonctionne:

```bash
# 1. Check Python
python --version

# 2. Check dependencies
pip list | grep notion

# 3. Check Notion connection
python scripts/generate-copil-ppt.py --date 2026-04-06

# 4. Check output
ls -lh COPIL_Presentation.pptx
```

**Si tout OK:** Tu vois `COPIL_Presentation.pptx` créé ✅

---

## 🎯 Tu es Prêt!

Tu peux maintenant:

```
1️⃣  Mettre à jour Notion quand tu veux
2️⃣  Générer des PPT en 30 secondes
3️⃣  Présenter des données toujours à jour
4️⃣  Automatiser avec N8N/GitHub Actions
5️⃣  Collaborer avec ton équipe dans Notion
```

---

## 📞 Si tu es bloqué

**Dis-moi:**
```
- Quelle étape?
- Quel erreur?
- Quel commande tu as exécuté?
```

**Et je vais te fixer immédiatement!** 💪

---

**Status**: ✅ READY FOR PRODUCTION

🚀 **Maintenant la phase 9 (Mobile Responsive) peut commencer!**
