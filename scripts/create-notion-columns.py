#!/usr/bin/env python3
"""
Create required properties/columns in Notion database
"""

import os
from notion_client import Client
from dotenv import load_dotenv

load_dotenv(".env.notion")

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

if not NOTION_API_KEY or not NOTION_DATABASE_ID:
    print("❌ Error: NOTION_API_KEY or NOTION_DATABASE_ID not configured")
    exit(1)

notion = Client(auth=NOTION_API_KEY)


def create_properties():
    """Create all required properties in Notion database"""
    print("📋 Creating database columns/properties...")

    try:
        db = notion.databases.retrieve(NOTION_DATABASE_ID)
        existing_props = db.get("properties", {})
        print(f"Found {len(existing_props)} existing properties")

        # Properties to create
        new_props = {
            "Bloc": {
                "select": {
                    "options": [
                        {"name": "Système & Architecture", "color": "blue"},
                        {"name": "Domaines Scoring", "color": "purple"},
                        {"name": "Règles Métier", "color": "pink"},
                        {"name": "Formulaires", "color": "green"},
                        {"name": "Auth & RBAC", "color": "yellow"},
                        {"name": "Workflow & États", "color": "orange"},
                        {"name": "Pages & Routes", "color": "red"},
                        {"name": "API Routes", "color": "gray"},
                        {"name": "Intégrations", "color": "brown"},
                        {"name": "Conformités", "color": "teal"},
                        {"name": "Cache & Performance", "color": "indigo"},
                        {"name": "Sécurité", "color": "cyan"},
                        {"name": "Tests", "color": "lime"},
                        {"name": "Mobile Responsive", "color": "navy"},
                        {"name": "Déploiement", "color": "maroon"},
                        {"name": "Documentation", "color": "olive"},
                    ]
                }
            },
            "Catégorie": {
                "select": {
                    "options": [
                        {"name": "Framework"},
                        {"name": "Database"},
                        {"name": "Frontend"},
                        {"name": "Backend"},
                        {"name": "Testing"},
                        {"name": "Deployment"},
                        {"name": "Domaine"},
                        {"name": "Sub-domaine"},
                    ]
                }
            },
            "Statut": {
                "select": {
                    "options": [
                        {"name": "INTÉGRÉ", "color": "green"},
                        {"name": "EN COURS", "color": "orange"},
                        {"name": "PLANIFIÉ", "color": "blue"},
                        {"name": "BLOQUÉ", "color": "red"},
                    ]
                }
            },
            "Complétion %": {"number": {"format": "percent"}},
            "Description": {"rich_text": {}},
            "Spécification": {"rich_text": {}},
            "Notes": {"rich_text": {}},
        }

        # Create each property
        created_count = 0
        for prop_name, prop_config in new_props.items():
            if prop_name in existing_props:
                print(f"⏭️  {prop_name}: Already exists")
            else:
                try:
                    notion.databases.update(
                        database_id=NOTION_DATABASE_ID,
                        properties={prop_name: prop_config},
                    )
                    print(f"✅ {prop_name}: Created")
                    created_count += 1
                except Exception as e:
                    print(f"⚠️  {prop_name}: {str(e)[:80]}")

        print(f"\n✅ Created {created_count} new properties!")
        return True

    except Exception as e:
        print(f"❌ Error: {e}")
        return False


if __name__ == "__main__":
    print("\n🚀 Creating Notion Database Properties")
    print("=" * 60)
    success = create_properties()
    print("\n" + "=" * 60)
    if success:
        print("✅ Properties created! Now run: python scripts/import-to-existing-db.py")
    else:
        print("❌ Failed to create properties")
    print("=" * 60 + "\n")
