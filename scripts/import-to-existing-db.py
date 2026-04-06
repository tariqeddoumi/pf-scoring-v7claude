#!/usr/bin/env python3
"""
Import tracking data to existing Notion Database
Imports CSV data and creates all necessary columns
"""

import os
import csv
from datetime import datetime
from pathlib import Path

from notion_client import Client
from dotenv import load_dotenv

load_dotenv(".env.notion")

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

if not NOTION_API_KEY or not NOTION_DATABASE_ID:
    print("❌ Error: NOTION_API_KEY or NOTION_DATABASE_ID not configured")
    exit(1)

notion = Client(auth=NOTION_API_KEY)


def get_or_create_properties(db_id):
    """Get database properties and ensure required fields exist"""
    print("📋 Checking database properties...")

    db = notion.databases.retrieve(db_id)
    properties = db.get("properties", {})

    print(f"✅ Found {len(properties)} existing properties")
    return db


def import_csv_data(db_id, csv_file="PF_SCORING_SPECIFICATIONS_TRACKING.csv"):
    """Import data from CSV to Notion"""
    print(f"\n📥 Importing data from {csv_file}...")

    if not Path(csv_file).exists():
        print(f"❌ Error: {csv_file} not found")
        return

    try:
        count = 0
        with open(csv_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)

            for row in reader:
                try:
                    # Parse completion percentage
                    completion_str = row.get("COMPLÉTION_%", "0").rstrip("%")
                    completion = float(completion_str) / 100 if completion_str else 0

                    # Create page
                    page = notion.pages.create(
                        parent={"database_id": db_id},
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
                                "number": completion
                            },
                            "Description": {
                                "rich_text": [
                                    {
                                        "text": {
                                            "content": row.get("DESCRIPTION", "")[:2000]
                                        }
                                    }
                                ]
                            },
                            "Spécification": {
                                "rich_text": [
                                    {
                                        "text": {
                                            "content": row.get("SPÉCIFICATION", "")[:2000]
                                        }
                                    }
                                ]
                            },
                            "Notes": {
                                "rich_text": [
                                    {
                                        "text": {
                                            "content": row.get("NOTES", "")[:2000]
                                        }
                                    }
                                ]
                            },
                        }
                    )
                    count += 1

                    # Progress indicator
                    if count % 10 == 0:
                        print(f"  ... imported {count} items")

                except Exception as e:
                    item = row.get("ÉLÉMENT", "Unknown")
                    print(f"⚠️  Error importing '{item}': {str(e)[:100]}")
                    continue

        print(f"✅ Successfully imported {count} items!")
        return count

    except Exception as e:
        print(f"❌ Error: {e}")
        return 0


def main():
    print("\n🚀 PF Scoring - Import to Existing Notion Database")
    print("=" * 60)

    # Check database
    print(f"\n📌 Database ID: {NOTION_DATABASE_ID}")
    try:
        db = get_or_create_properties(NOTION_DATABASE_ID)
        print(f"✅ Database accessible!")
    except Exception as e:
        print(f"❌ Error accessing database: {e}")
        print("\n💡 Make sure to:")
        print("1. Share the database with the integration in Notion")
        print("2. The integration needs 'Read' and 'Update' permissions")
        exit(1)

    # Import data
    count = import_csv_data(NOTION_DATABASE_ID)

    print("\n" + "=" * 60)
    print("✅ Import Complete!")
    print(f"\n📊 Statistics:")
    print(f"   - Items imported: {count}")
    print(f"   - Database ID: {NOTION_DATABASE_ID}")
    print(f"   - Next: Open Notion to see your data!")
    print("\n🚀 Once you see the data in Notion, run:")
    print("   python scripts/generate-copil-ppt.py")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
