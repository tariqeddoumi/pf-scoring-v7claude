"use client";

import React from "react";
import { FieldConfig, FormSection } from "@/lib/field-config";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Tabs, TabPane } from "@/components/ui/TabsCustom";
import { ChevronDown } from "lucide-react";

interface DynamicFormProps {
  sections: FormSection[];
  formData: Record<string, any>;
  fieldErrors: Record<string, string>;
  onChange: (e: React.ChangeEvent<any>) => void;
  layout?: "accordion" | "tabs";
  icon?: Record<string, React.ReactNode>;
}

/**
 * Reusable form component that renders forms based on configuration
 */
export function DynamicForm({
  sections,
  formData,
  fieldErrors,
  onChange,
  layout = "accordion",
  icon = {},
}: DynamicFormProps) {
  if (layout === "tabs") {
    return (
      <Tabs
        items={sections.map((section) => ({
          label: section.title,
          value: section.id,
          icon: icon[section.id],
        }))}
        defaultValue={sections[0]?.id}
      >
        {sections.map((section) => (
          <TabPane key={section.id} value={section.id}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-4">
              {section.description && (
                <p className="text-sm text-slate-400">{section.description}</p>
              )}
              <div
                className={`grid gap-4 ${
                  section.columns === 2 ? "md:grid-cols-2" : "grid-cols-1"
                }`}
              >
                {section.fields.map((field) => (
                  <FormField
                    key={field.name}
                    field={field}
                    value={formData[field.name] || ""}
                    error={fieldErrors[field.name]}
                    onChange={onChange}
                  />
                ))}
              </div>
            </div>
          </TabPane>
        ))}
      </Tabs>
    );
  }

  // Accordion layout (default)
  return (
    <Accordion>
      {sections.map((section) => (
        <AccordionItem
          key={section.id}
          title={section.title}
          icon={icon[section.id]}
          defaultOpen={sections.indexOf(section) === 0}
        >
          {section.description && (
            <p className="text-sm text-slate-400 mb-4">{section.description}</p>
          )}
          <div
            className={`grid gap-4 ${
              section.columns === 2 ? "md:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {section.fields.map((field) => (
              <FormField
                key={field.name}
                field={field}
                value={formData[field.name] || ""}
                error={fieldErrors[field.name]}
                onChange={onChange}
              />
            ))}
          </div>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

/**
 * Individual form field component
 */
interface FormFieldProps {
  field: FieldConfig;
  value: any;
  error?: string;
  onChange: (e: React.ChangeEvent<any>) => void;
}

export function FormField({ field, value, error, onChange }: FormFieldProps) {
  const commonClasses = `w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
    error ? "border-red-500" : "border-slate-600"
  }`;

  return (
    <div>
      <label className="block text-sm font-semibold text-white mb-2">
        {field.label}
        {field.required && <span className="text-red-400"> *</span>}
      </label>

      {field.type === "textarea" ? (
        <textarea
          name={field.name}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          rows={3}
          className={`${commonClasses} resize-none`}
        />
      ) : field.type === "select" ? (
        <select
          name={field.name}
          value={value}
          onChange={onChange}
          className={commonClasses}
        >
          <option value="">-- Sélectionner --</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type}
          name={field.name}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          step={field.type === "number" ? "0.01" : undefined}
          className={commonClasses}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      {field.help && !error && (
        <p className="mt-1 text-xs text-slate-400">{field.help}</p>
      )}
    </div>
  );
}
