-- Create FormSection table for organizing form fields by section/tab/accordion
CREATE TABLE "BP_PF_form_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "columns" INTEGER NOT NULL DEFAULT 2,
    "orderIndex" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "layout" TEXT NOT NULL DEFAULT 'accordion',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BP_PF_form_sections_entity_title_key" UNIQUE("entity", "title")
);

-- Create FieldConfiguration table for individual form fields
CREATE TABLE "BP_PF_field_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "sectionId" TEXT,
    "fieldName" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "helpText" TEXT,
    "validation" TEXT,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "min" DOUBLE PRECISION,
    "max" DOUBLE PRECISION,
    "step" TEXT,
    "orderIndex" INTEGER NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "editable" BOOLEAN NOT NULL DEFAULT true,
    "customOptions" JSONB,
    "defaultValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "BP_PF_field_configurations_entity_fieldName_key" UNIQUE("entity", "fieldName"),
    CONSTRAINT "BP_PF_field_configurations_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "BP_PF_form_sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create FormPreset table for saving user-defined field configurations
CREATE TABLE "BP_PF_form_presets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fieldIds" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "BP_PF_form_presets_entity_name_key" UNIQUE("entity", "name")
);

-- Create indexes for performance
CREATE INDEX "BP_PF_form_sections_entity_idx" ON "BP_PF_form_sections"("entity");
CREATE INDEX "BP_PF_form_sections_orderIndex_idx" ON "BP_PF_form_sections"("orderIndex");
CREATE INDEX "BP_PF_field_configurations_entity_idx" ON "BP_PF_field_configurations"("entity");
CREATE INDEX "BP_PF_field_configurations_sectionId_idx" ON "BP_PF_field_configurations"("sectionId");
CREATE INDEX "BP_PF_field_configurations_visible_idx" ON "BP_PF_field_configurations"("visible");
CREATE INDEX "BP_PF_field_configurations_orderIndex_idx" ON "BP_PF_field_configurations"("orderIndex");
CREATE INDEX "BP_PF_form_presets_entity_idx" ON "BP_PF_form_presets"("entity");
CREATE INDEX "BP_PF_form_presets_isDefault_idx" ON "BP_PF_form_presets"("isDefault");
