#!/usr/bin/env python3
"""
Populate Notion database items with data from CSV
Updates all properties for each item
"""

import os
import csv
from notion_client import Client
from dotenv import load_dotenv

load_dotenv(".env.notion")

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

if not NOTION_API_KEY or not NOTION_DATABASE_ID:
    print("❌ Error: NOTION_API_KEY or NOTION_DATABASE_ID not configured")
    exit(1)

notion = Client(auth=NOTION_API_KEY)


def populate_notion_items():
    """Read CSV and update Notion items with all data"""
    print("📥 Loading CSV data...")

    # Read CSV into dictionary by ÉLÉMENT name
    csv_data = {}
    with open("PF_SCORING_SPECIFICATIONS_TRACKING.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            element_name = row.get("ÉLÉMENT", "").strip()
            csv_data[element_name] = row

    print(f"✅ Loaded {len(csv_data)} items from CSV\n")

    # Fetch all pages from Notion database
    print("📋 Fetching items from Notion...")
    all_pages = []
    has_more = True
    start_cursor = None

    while has_more:
        response = notion.databases.query_database(
            database_id=NOTION_DATABASE_ID,
            start_cursor=start_cursor,
            page_size=100
        )
        all_pages.extend(response.get("results", []))
        has_more = response.get("has_more", False)
        start_cursor = response.get("next_cursor")

    print(f"✅ Found {len(all_pages)} items in Notion\n")

    # Update each page with CSV data
    print("🔄 Updating items with CSV data...\n")
    updated_count = 0

    for page in all_pages:
        try:
            # Get the title of the page
            properties = page.get("properties", {})
            title_prop = properties.get("title", {})

            # Get text from title property
            title_text = ""
            if title_prop.get("type") == "title":
                title_array = title_prop.get("title", [])
                if title_array:
                    title_text = title_array[0].get("text", {}).get("content", "").strip()

            # Find matching CSV data
            if title_text not in csv_data:
                continue

            row_data = csv_data[title_text]

            # Parse completion percentage
            completion_str = row_data.get("COMPLÉTION_%", "0").rstrip("%").strip()
            try:
                completion = float(completion_str) / 100 if completion_str else 0
            except:
                completion = 0

            # Build update properties
            update_props = {}

            # Bloc
            bloc = row_data.get("BLOC", "").strip()
            if bloc:
                update_props["Bloc"] = {"select": {"name": bloc}}

            # Catégorie
            categorie = row_data.get("CATÉGORIE", "").strip()
            if categorie:
                update_props["Catégorie"] = {"select": {"name": categorie}}

            # Statut
            statut = row_data.get("STATUT", "PLANIFIÉ").strip()
            if statut:
                update_props["Statut"] = {"select": {"name": statut}}

            # Complétion %
            if completion > 0:
                update_props["Complétion %"] = {"number": completion}

            # Description
            description = row_data.get("DESCRIPTION", "").strip()[:2000]
            if description:
                update_props["Description"] = {
                    "rich_text": [{"text": {"content": description}}]
                }

            # Spécification
            spec = row_data.get("SPÉCIFICATION", "").strip()[:2000]
            if spec:
                update_props["Spécification"] = {
                    "rich_text": [{"text": {"content": spec}}]
                }

            # Notes
            notes = row_data.get("NOTES", "").strip()[:2000]
            if notes:
                update_props["Notes"] = {
                    "rich_text": [{"text": {"content": notes}}]
                }

            # Update page if there's data
            if update_props:
                notion.pages.update(
                    page_id=page["id"],
                    properties=update_props
                )
                updated_count += 1

                if updated_count % 10 == 0:
                    print(f"   ✓ Updated {updated_count} items...")

        except Exception as e:
            print(f"   ⚠️  Error updating item: {str(e)[:80]}")
            continue

    return updated_count


if __name__ == "__main__":
    print("\n🚀 Populating Notion Database with CSV Data")
    print("=" * 60)

    updated = populate_notion_items()

    print("\n" + "=" * 60)
    print(f"✅ Successfully updated {updated} items!")
    print("\nNext steps:")
    print("1. Open Notion to verify the data")
    print("2. Run: python scripts/generate-copil-ppt.py")
    print("   to generate the PowerPoint presentation")
    print("=" * 60 + "\n")
