#!/bin/bash
# Quick Start: Télécharge et prépare les fichiers pour Google Drive
# Usage: chmod +x QUICK_START_GOOGLE_DRIVE.sh && ./QUICK_START_GOOGLE_DRIVE.sh

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPORT_DIR="$PROJECT_DIR/google_drive_export"

echo "🚀 PF Scoring PMO - Google Drive Export Setup"
echo "==============================================="
echo ""

# Create export directory
mkdir -p "$EXPORT_DIR"
echo "✅ Créé dossier: $EXPORT_DIR"

# Copy files
echo ""
echo "📋 Copie des fichiers..."

# CSV (Main tracking)
cp "$PROJECT_DIR/PF_SCORING_SPECIFICATIONS_TRACKING.csv" "$EXPORT_DIR/"
echo "✅ PF_SCORING_SPECIFICATIONS_TRACKING.csv"

# JSON (Backup + API)
cp "$PROJECT_DIR/SPECIFICATIONS_TRACKING.json" "$EXPORT_DIR/"
echo "✅ SPECIFICATIONS_TRACKING.json"

# Markdown guides
cp "$PROJECT_DIR/IMPORT_GUIDE_GOOGLE_SHEETS.md" "$EXPORT_DIR/"
echo "✅ IMPORT_GUIDE_GOOGLE_SHEETS.md"

cp "$PROJECT_DIR/PROJECT_TRACKING_SETUP.md" "$EXPORT_DIR/"
echo "✅ PROJECT_TRACKING_SETUP.md"

echo ""
echo "==============================================="
echo "📦 Fichiers prêts à télécharger:"
echo "==============================================="
echo ""
ls -lh "$EXPORT_DIR"
echo ""

echo "🎯 PROCHAINES ÉTAPES:"
echo "==============================================="
echo ""
echo "1️⃣ TÉLÉCHARGE les fichiers depuis: $EXPORT_DIR"
echo ""
echo "2️⃣ VA SUR Google Drive: https://drive.google.com/drive/folders/1NHWJtB5OP44zbhdfdl3IInnhe1C8KYLi"
echo ""
echo "3️⃣ IMPORTE le CSV:"
echo "   • Clique 'Nouveau' → 'Google Sheets' → 'À partir d'un fichier'"
echo "   • Sélectionne: PF_SCORING_SPECIFICATIONS_TRACKING.csv"
echo "   • Google crée automatiquement la feuille"
echo ""
echo "4️⃣ FORMATE (voir IMPORT_GUIDE_GOOGLE_SHEETS.md):"
echo "   • Couleurs conditionnelles pour STATUT"
echo "   • Barre de progression pour COMPLÉTION_%"
echo "   • Groupage par BLOC"
echo ""
echo "5️⃣ PARTAGE avec l'équipe:"
echo "   • Product Manager: Editor"
echo "   • Tech Lead: Editor"
echo "   • Stakeholders: Viewer"
echo ""
echo "==============================================="
echo ""
echo "💡 TIPS:"
echo "   • JSON = Backup ou intégration API"
echo "   • MD = Guides de configuration"
echo "   • CSV = Import principal dans Google Sheets"
echo ""
echo "✅ DONE! Les fichiers sont prêts."
echo ""
