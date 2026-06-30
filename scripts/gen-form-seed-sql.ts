/**
 * Generates idempotent SQL to seed form configuration (FormSection +
 * FieldConfiguration) and app configuration directly into Supabase.
 * Mirrors prisma/seed-complete.ts (project entity) but emits raw SQL.
 */
import { PROJECT_SECTIONS } from "../lib/field-config";

const q = (v: unknown): string => {
  if (v === undefined || v === null) return "NULL";
  return `'${String(v).replace(/'/g, "''")}'`;
};

const jsonOrNull = (v: unknown): string => {
  if (v === undefined || v === null) return "NULL";
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
};

const lines: string[] = [];

PROJECT_SECTIONS.forEach((section, sIdx) => {
  lines.push(
    `INSERT INTO "BP_PF_form_sections" (id,entity,title,description,icon,columns,"orderIndex",layout,visible,"createdAt","updatedAt") VALUES ` +
      `(gen_random_uuid(),'project',${q(section.title)},${q(section.description)},${q(section.icon)},${section.columns ?? 2},${sIdx},'tabs',true,now(),now()) ` +
      `ON CONFLICT (entity,title) DO UPDATE SET description=EXCLUDED.description,icon=EXCLUDED.icon,columns=EXCLUDED.columns,"orderIndex"=EXCLUDED."orderIndex",layout=EXCLUDED.layout,visible=EXCLUDED.visible,"updatedAt"=now();`
  );

  section.fields.forEach((field, fIdx) => {
    const sectionSub = `(SELECT id FROM "BP_PF_form_sections" WHERE entity='project' AND title=${q(section.title)})`;
    lines.push(
      `INSERT INTO "BP_PF_field_configurations" (id,entity,"sectionId","fieldName",label,"fieldType",required,placeholder,"helpText",validation,step,"orderIndex",visible,editable,"customOptions","createdAt","updatedAt") VALUES ` +
        `(gen_random_uuid(),'project',${sectionSub},${q(field.name)},${q(field.label)},${q(field.type)},${field.required ? "true" : "false"},${q(field.placeholder)},${q(field.help)},${q(field.validation)},${q(field.step !== undefined ? String(field.step) : undefined)},${fIdx},true,true,${jsonOrNull(field.options)},now(),now()) ` +
        `ON CONFLICT (entity,"fieldName") DO UPDATE SET "sectionId"=EXCLUDED."sectionId",label=EXCLUDED.label,"fieldType"=EXCLUDED."fieldType",required=EXCLUDED.required,placeholder=EXCLUDED.placeholder,"helpText"=EXCLUDED."helpText",validation=EXCLUDED.validation,step=EXCLUDED.step,"orderIndex"=EXCLUDED."orderIndex",visible=true,editable=true,"customOptions"=EXCLUDED."customOptions","updatedAt"=now();`
    );
  });
});

console.log(lines.join("\n"));
