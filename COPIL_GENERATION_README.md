# COPIL Presentation Generation Guide

## Overview

This guide explains how to generate COPIL (Steering Committee) presentations from project status data.

## Files Included

### CSV Reports (Data Source)

- **`COPIL_Status_Report.csv`** - Phase-by-phase status tracking
- **`COPIL_Detailed_Metrics.csv`** - Detailed KPIs and metrics

### Python Script (Generator)

- **`scripts/generate-copil-ppt-v2.py`** - New PowerPoint generator (Updated)
- **`scripts/generate-copil-ppt.py`** - Original Notion-based generator

### Documentation

- **`COPIL_Executive_Summary.md`** - Executive summary of Phase 6

---

## Quick Start

### 1. Install Dependencies

```bash
pip install python-pptx pillow
```

### 2. Generate Presentation

```bash
# Generate with default filename
python scripts/generate-copil-ppt-v2.py

# Generate with custom output name
python scripts/generate-copil-ppt-v2.py --output my_presentation.pptx

# Generate with specific date
python scripts/generate-copil-ppt-v2.py --date 2026-04-07
```

### 3. Output

The script creates a PowerPoint file with:

- **Title Slide** - Project name and date
- **Status Summary** - Overall completion and KPIs
- **Timeline** - Phase progression and completion %
- **Deliverables** - All completed items
- **Metrics Dashboard** - Key performance indicators
- **Next Steps** - Upcoming phases and timeline
- **Conclusion** - Summary and readiness statement

---

## Features

### Automatic Data Reading

✅ Reads CSV files for current data  
✅ No manual data entry required  
✅ Easy to update by modifying CSV files

### Professional Formatting

✅ Banking-grade color scheme (blue/orange)  
✅ Consistent styling across slides  
✅ Readable fonts and layouts  
✅ Progress bars and status indicators

### Dynamic Content

✅ Auto-calculated completion percentages  
✅ Color-coded status (✅ Green = Complete, ⏳ Orange = Pending)  
✅ Metrics automatically formatted
✅ Timeline shows all phases

### Easy Customization

✅ Modify CSV files to update presentation  
✅ Change colors in Python code  
✅ Add/remove slides by editing the script  
✅ Support for custom dates

---

## Updating Presentation

### Method 1: Update CSV Files (Recommended)

1. **Update Status Report**

   ```csv
   Phase,Component,Status,Completion %,Owner,Notes
   ```

2. **Update Metrics**

   ```csv
   Metric Category,Metric Name,Value,Status
   ```

3. **Regenerate Presentation**
   ```bash
   python scripts/generate-copil-ppt-v2.py
   ```

### Method 2: Modify Python Script

Edit `scripts/generate-copil-ppt-v2.py` to:

- Change color scheme (COLORS dictionary)
- Modify slide layouts
- Add new slide types
- Customize text content

---

## CSV File Format

### COPIL_Status_Report.csv

```
Phase,Component,Status,Completion %,Start Date,End Date,Owner,Notes
Phase 1,Database Schema,✅ COMPLETED,100%,2026-03-27,2026-03-30,DevTeam,15 tables created
Phase 6,API Routes,✅ COMPLETED,100%,2026-04-07,2026-04-07,DevTeam,25 endpoints
Phase 8,Frontend,⏳ PENDING,0%,2026-04-08,2026-04-12,FrontendTeam,React UI
```

### COPIL_Detailed_Metrics.csv

```
Metric Category,Metric Name,Value,Unit,Status,Comments
Project Status,Overall Completion,100,%,✅ ON TRACK,All core features done
Code Quality,TypeScript Errors,4,count,✅ MINIMAL,No blockers
API Endpoints,Total Endpoints,25,count,✅ IMPLEMENTED,All working
```

---

## Script Usage Examples

### Example 1: Basic Generation

```bash
python scripts/generate-copil-ppt-v2.py
# Creates: COPIL_PF_Scoring_2026-04-07.pptx
```

### Example 2: Custom Output Name

```bash
python scripts/generate-copil-ppt-v2.py --output COPIL_April_2026.pptx
# Creates: COPIL_April_2026.pptx
```

### Example 3: Specific Date

```bash
python scripts/generate-copil-ppt-v2.py --date 2026-04-15
# Creates: COPIL_PF_Scoring_2026-04-15.pptx
```

### Example 4: Custom CSV Paths

```bash
python scripts/generate-copil-ppt-v2.py \
  --status-csv path/to/status.csv \
  --metrics-csv path/to/metrics.csv \
  --output custom_report.pptx
```

---

## Slide Descriptions

### Slide 1: Title Slide

- Project name: "PF Scoring V7++"
- Report date
- Professional banking color scheme

### Slide 2: Status Summary

- Overall completion percentage
- 6 key metrics in colored boxes:
  - Core Backend status
  - API Endpoints count
  - Database tables
  - TypeScript errors
  - Test scenarios
  - Documentation

### Slide 3: Timeline

- Phase-by-phase progress
- Visual progress bars
- Color-coded status (Green = Done, Orange = Pending)
- Completion percentages

### Slide 4: Deliverables

- All completed items
- Grouped by category
- Description of each deliverable
- Status indicator

### Slide 5: Metrics Dashboard

- 6 key performance indicators
- Organized in card layout
- Color-coded values
- Status badges

### Slide 6: Next Steps

- 4 upcoming phases with dates
- Timeline for each phase
- Brief description
- Numbered steps

### Slide 7: Conclusion

- "Ready for Production" message
- Key achievements
- Report date

---

## Customization Guide

### Change Color Scheme

Edit the `COLORS` dictionary in the script:

```python
COLORS = {
    "primary": RGBColor(0, 51, 102),      # Dark blue
    "secondary": RGBColor(0, 102, 153),   # Medium blue
    "accent": RGBColor(255, 153, 0),      # Orange
    "green": RGBColor(76, 175, 80),       # Green
    "red": RGBColor(244, 67, 54),         # Red
}
```

### Add New Slide

1. Create a method in the class:

```python
def add_custom_slide(self):
    slide = self.add_content_slide("My Slide Title")
    # Add content to slide
    ...
```

2. Call it in the `generate()` method:

```python
def generate(self):
    self.add_title_slide()
    self.add_status_summary()
    # ... other slides ...
    self.add_custom_slide()  # New slide
    self.add_contact_slide()
```

### Modify Metrics Calculation

Edit the metrics extraction in `add_metrics_dashboard()`:

```python
kpis = [
    ("Your Metric", "Your Value", "Status", COLOR),
    # Add more rows
]
```

---

## Troubleshooting

### Issue: "No such file or directory: COPIL_Status_Report.csv"

**Solution**: Ensure CSV files are in the same directory as the script, or specify their paths:

```bash
python scripts/generate-copil-ppt-v2.py \
  --status-csv path/to/status.csv \
  --metrics-csv path/to/metrics.csv
```

### Issue: "No module named 'pptx'"

**Solution**: Install python-pptx:

```bash
pip install python-pptx
```

### Issue: Presentation looks broken

**Solution**:

1. Check Python version (3.7+)
2. Update python-pptx: `pip install --upgrade python-pptx`
3. Verify CSV file format

### Issue: Text not appearing

**Solution**: Check font size is not too large or coordinates not off-screen

---

## Best Practices

1. **Update CSV Files First** - Modify data in CSV before generating
2. **Keep Consistent** - Use same date formats and status values
3. **Test Changes** - Generate presentation after each CSV update
4. **Version Control** - Keep previous presentations for comparison
5. **Regular Updates** - Update COPIL reports weekly or bi-weekly

---

## Command Line Reference

```bash
# Show help
python scripts/generate-copil-ppt-v2.py --help

# Basic usage
python scripts/generate-copil-ppt-v2.py

# All options
python scripts/generate-copil-ppt-v2.py \
  --output file.pptx \
  --date 2026-04-07 \
  --status-csv status.csv \
  --metrics-csv metrics.csv
```

---

## Output Example

**File**: `COPIL_PF_Scoring_2026-04-07.pptx`  
**Slides**: 7  
**Size**: ~2-3 MB  
**Format**: PowerPoint 2010+ (PPTX)

---

## Support

For issues or enhancements:

1. Check CSV file format
2. Verify Python dependencies
3. Review script logs
4. Check file paths are correct

---

## Version History

| Version | Date       | Changes                        |
| ------- | ---------- | ------------------------------ |
| v2.0    | 2026-04-07 | CSV-based generation (Current) |
| v1.0    | 2026-04-01 | Notion-based generation        |

---

**Last Updated**: 2026-04-07  
**Status**: ✅ Production Ready
