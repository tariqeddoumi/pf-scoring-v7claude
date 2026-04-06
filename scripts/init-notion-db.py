#!/usr/bin/env python3
"""
Initialize Notion Database for PF Scoring PMO
Creates the database structure and imports initial data from CSV

Usage:
    python scripts/init-notion-db.py
"""

import os
import csv
from pathlib import Path
from datetime import datetime

from notion_client import Client
from dotenv import load_dotenv

# Load environment
load_dotenv(".env.notion")

NOTION_API_KEY = os.getenv("NOTION_API_KEY")

if not NOTION_API_KEY:
    print("❌ Error: NOTION_API_KEY not configured in .env.notion")
    sys.exit(1)

notion = Client(auth=NOTION_API_KEY)


def create_notion_database():
    """Create the main PMO tracking database"""
    print("📦 Creating Notion Database...")

    try:
        # Create database in user's workspace
        database = notion.databases.create(
            parent={"type": "workspace", "workspace": True},
            title="PF Scoring PMO Tracking",
            description="Suivi complet des spécifications et phases du projet PF Scoring V7++",
            icon={"type": "emoji", "emoji": "📊"},
            properties={
                "Name": {"title": {}},
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
                            {"name": "Framework", "color": "blue"},
                            {"name": "Database", "color": "purple"},
                            {"name": "Frontend", "color": "pink"},
                            {"name": "Backend", "color": "green"},
                            {"name": "Testing", "color": "yellow"},
                            {"name": "Deployment", "color": "orange"},
                            {"name": "Domaine", "color": "red"},
                            {"name": "Sub-domaine", "color": "gray"},
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
                "Assigné": {"people": {}},
                "Date Maj": {"date": {}},
                "Type Changement": {
                    "select": {
                        "options": [
                            {"name": "FIX", "color": "red"},
                            {"name": "FEATURE", "color": "green"},
                            {"name": "ENHANCEMENT", "color": "blue"},
                            {"name": "DOCUMENTATION", "color": "yellow"},
                            {"name": "", "color": "gray"},
                        ]
                    }
                },
            },
        )

        database_id = database["id"]
        print(f"✅ Database created successfully!")
        print(f"📝 Database ID: {database_id}")
        print(f"\n⚠️  IMPORTANT: Save this ID to .env.notion:")
        print(f"   NOTION_DATABASE_ID={database_id}")

        return database_id

    except Exception as e:
        print(f"❌ Error creating database: {e}")
        raise


def import_from_csv(database_id, csv_file="PF_SCORING_SPECIFICATIONS_TRACKING.csv"):
    """Import data from CSV to Notion"""
    print(f"\n📥 Importing data from {csv_file}...")

    if not Path(csv_file).exists():
        print(f"❌ Error: {csv_file} not found")
        return

    try:
        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0

            for row in reader:
                # Create page in Notion
                try:
                    notion.pages.create(
                        parent={"database_id": database_id},
                        properties={
                            "Name": {
                                "title": [
                                    {
                                        "text": {
                                            "content": row.get("ÉLÉMENT", "")
                                        }
                                    }
                                ]
                            },
                            "Bloc": {
                                "select": {
                                    "name": row.get("BLOC", "")
                                }
                            },
                            "Catégorie": {
                                "select": {
                                    "name": row.get("CATÉGORIE", "")
                                }
                            },
                            "Statut": {
                                "select": {
                                    "name": row.get("STATUT", "PLANIFIÉ")
                                }
                            },
                            "Complétion %": {
                                "number": float(
                                    row.get("COMPLÉTION_%", "0").rstrip("%")
                                )
                                / 100
                            },
                            "Description": {
                                "rich_text": [
                                    {
                                        "text": {
                                            "content": row.get("DESCRIPTION", "")
                                        }
                                    }
                                ]
                            },
                            "Spécification": {
                                "rich_text": [
                                    {
                                        "text": {
                                            "content": row.get("SPÉCIFICATION", "")
                                        }
                                    }
                                ]
                            },
                            "Notes": {
                                "rich_text": [
                                    {"text": {"content": row.get("NOTES", "")}}
                                ]
                            },
                            "Date Maj": {
                                "date": {
                                    "start": row.get("DATE_COMPLÉTION", datetime.now().strftime("%Y-%m-%d"))
                                }
                            },
                            "Type Changement": {
                                "select": {
                                    "name": row.get("TYPE_CHANGEMENT", "")
                                }
                            },
                        },
                    )
                    count += 1
                except Exception as e:
                    print(f"⚠️  Error importing row {row.get('ÉLÉMENT')}: {e}")
                    continue

        print(f"✅ Imported {count} items successfully!")

    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        raise


def main():
    """Main execution"""
    print("\n🚀 PF Scoring - Notion Database Initialization")
    print("=" * 60)

    # Check for existing database ID
    load_dotenv(".env.notion")
    existing_db_id = os.getenv("NOTION_DATABASE_ID")

    if existing_db_id and existing_db_id != "<TO_BE_CONFIGURED>":
        print(f"\n✅ Database ID found: {existing_db_id}")
        print("Skipping database creation...")
        database_id = existing_db_id
    else:
        print("\n📦 Creating new database...")
        database_id = create_notion_database()

        # Save to .env.notion
        env_file = ".env.notion"
        with open(env_file, "r") as f:
            content = f.read()

        content = content.replace(
            "NOTION_DATABASE_ID=<TO_BE_CONFIGURED>",
            f"NOTION_DATABASE_ID={database_id}",
        )

        with open(env_file, "w") as f:
            f.write(content)

        print(f"\n✅ Updated {env_file}")

    # Import data from CSV
    csv_file = "PF_SCORING_SPECIFICATIONS_TRACKING.csv"
    if Path(csv_file).exists():
        import_from_csv(database_id, csv_file)
    else:
        print(f"⚠️  {csv_file} not found, skipping import")

    print("\n" + "=" * 60)
    print("✅ Notion Database Setup Complete!")
    print("\nNext steps:")
    print("1. Open https://notion.so and see your new database")
    print("2. Share it with team members")
    print("3. Run: python scripts/generate-copil-ppt.py")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
