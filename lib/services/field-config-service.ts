/**
 * Field Configuration Service
 * Manages loading, caching, and updating form field configurations
 * Bridges between database and frontend components
 */

import prisma from '@/lib/prisma';
import { FieldConfiguration, FormSection, FormPreset } from '@prisma/client';

// In-memory cache for field configurations (with TTL)
let configCache: {
  data: Map<string, any>;
  timestamp: number;
  ttl: number;
} = {
  data: new Map(),
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes TTL
};

/**
 * Clear cache entry
 */
export const clearFieldConfigCache = (entity?: string) => {
  if (entity) {
    configCache.data.delete(`sections_${entity}`);
    configCache.data.delete(`fields_${entity}`);
  } else {
    configCache.data.clear();
  }
};

/**
 * Check if cache is valid
 */
const isCacheValid = (): boolean => {
  return Date.now() - configCache.timestamp < configCache.ttl;
};

/**
 * Get all form sections for an entity
 */
export const getFormSections = async (
  entity: string
): Promise<FormSection[]> => {
  const cacheKey = `sections_${entity}`;

  // Check cache first
  if (isCacheValid() && configCache.data.has(cacheKey)) {
    return configCache.data.get(cacheKey);
  }

  try {
    const sections = await prisma.formSection.findMany({
      where: { entity, visible: true },
      orderBy: { orderIndex: 'asc' },
      include: {
        fields: {
          where: { visible: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    // Update cache
    configCache.data.set(cacheKey, sections);
    configCache.timestamp = Date.now();

    return sections;
  } catch (error) {
    console.error(`Error fetching sections for entity ${entity}:`, error);
    throw new Error(`Failed to load form sections for ${entity}`);
  }
};

/**
 * Get all visible fields for an entity
 */
export const getEntityFields = async (
  entity: string
): Promise<FieldConfiguration[]> => {
  const cacheKey = `fields_${entity}`;

  // Check cache first
  if (isCacheValid() && configCache.data.has(cacheKey)) {
    return configCache.data.get(cacheKey);
  }

  try {
    const fields = await prisma.fieldConfiguration.findMany({
      where: { entity, visible: true },
      orderBy: [{ sectionId: 'asc' }, { orderIndex: 'asc' }],
    });

    // Update cache
    configCache.data.set(cacheKey, fields);
    configCache.timestamp = Date.now();

    return fields;
  } catch (error) {
    console.error(`Error fetching fields for entity ${entity}:`, error);
    throw new Error(`Failed to load fields for ${entity}`);
  }
};

/**
 * Get a specific field configuration
 */
export const getFieldConfig = async (
  entity: string,
  fieldName: string
): Promise<FieldConfiguration | null> => {
  try {
    return await prisma.fieldConfiguration.findUnique({
      where: { entity_fieldName: { entity, fieldName } },
    });
  } catch (error) {
    console.error(
      `Error fetching field config for ${entity}.${fieldName}:`,
      error
    );
    return null;
  }
};

/**
 * Create a new field configuration
 */
export const createFieldConfig = async (
  data: Omit<FieldConfiguration, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FieldConfiguration> => {
  try {
    const { customOptions, ...rest } = data;
    const field = await prisma.fieldConfiguration.create({
      data: {
        ...rest,
        id: require('crypto').randomUUID(),
        customOptions: customOptions ? JSON.parse(typeof customOptions === 'string' ? customOptions : JSON.stringify(customOptions)) : undefined,
      } as any,
    });

    // Clear cache to force refresh
    clearFieldConfigCache(data.entity);

    return field;
  } catch (error) {
    console.error('Error creating field configuration:', error);
    throw new Error('Failed to create field configuration');
  }
};

/**
 * Update a field configuration
 */
export const updateFieldConfig = async (
  id: string,
  data: Partial<FieldConfiguration>
): Promise<FieldConfiguration> => {
  try {
    const { customOptions, ...rest } = data;
    const updateData: any = {
      ...rest,
      updatedAt: new Date(),
    };
    if (customOptions !== undefined) {
      updateData.customOptions = customOptions ? JSON.parse(typeof customOptions === 'string' ? customOptions : JSON.stringify(customOptions)) : null;
    }

    const updated = await prisma.fieldConfiguration.update({
      where: { id },
      data: updateData,
    });

    // Clear cache to force refresh
    if (data.entity) {
      clearFieldConfigCache(data.entity);
    }

    return updated;
  } catch (error) {
    console.error('Error updating field configuration:', error);
    throw new Error('Failed to update field configuration');
  }
};

/**
 * Delete a field configuration
 */
export const deleteFieldConfig = async (id: string): Promise<void> => {
  try {
    const field = await prisma.fieldConfiguration.findUnique({
      where: { id },
    });

    if (!field) {
      throw new Error('Field configuration not found');
    }

    await prisma.fieldConfiguration.delete({
      where: { id },
    });

    // Clear cache to force refresh
    clearFieldConfigCache(field.entity);
  } catch (error) {
    console.error('Error deleting field configuration:', error);
    throw new Error('Failed to delete field configuration');
  }
};

/**
 * Create a new form section
 */
export const createFormSection = async (
  data: Omit<FormSection, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FormSection> => {
  try {
    const section = await prisma.formSection.create({
      data: {
        ...data,
        id: require('crypto').randomUUID(),
      },
    });

    // Clear cache to force refresh
    clearFieldConfigCache(data.entity);

    return section;
  } catch (error) {
    console.error('Error creating form section:', error);
    throw new Error('Failed to create form section');
  }
};

/**
 * Update a form section
 */
export const updateFormSection = async (
  id: string,
  data: Partial<FormSection>
): Promise<FormSection> => {
  try {
    const updated = await prisma.formSection.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Clear cache to force refresh
    if (data.entity) {
      clearFieldConfigCache(data.entity);
    }

    return updated;
  } catch (error) {
    console.error('Error updating form section:', error);
    throw new Error('Failed to update form section');
  }
};

/**
 * Delete a form section (and its fields)
 */
export const deleteFormSection = async (id: string): Promise<void> => {
  try {
    const section = await prisma.formSection.findUnique({
      where: { id },
    });

    if (!section) {
      throw new Error('Form section not found');
    }

    // Delete all fields in this section first
    await prisma.fieldConfiguration.deleteMany({
      where: { sectionId: id },
    });

    // Then delete the section
    await prisma.formSection.delete({
      where: { id },
    });

    // Clear cache to force refresh
    clearFieldConfigCache(section.entity);
  } catch (error) {
    console.error('Error deleting form section:', error);
    throw new Error('Failed to delete form section');
  }
};

/**
 * Get all form presets for an entity
 */
export const getFormPresets = async (entity: string): Promise<FormPreset[]> => {
  try {
    return await prisma.formPreset.findMany({
      where: { entity },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error(`Error fetching presets for entity ${entity}:`, error);
    throw new Error(`Failed to load form presets for ${entity}`);
  }
};

/**
 * Create a new form preset
 */
export const createFormPreset = async (
  data: Omit<FormPreset, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FormPreset> => {
  try {
    return await prisma.formPreset.create({
      data: {
        ...data,
        id: require('crypto').randomUUID(),
      },
    });
  } catch (error) {
    console.error('Error creating form preset:', error);
    throw new Error('Failed to create form preset');
  }
};

/**
 * Update a form preset
 */
export const updateFormPreset = async (
  id: string,
  data: Partial<FormPreset>
): Promise<FormPreset> => {
  try {
    return await prisma.formPreset.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating form preset:', error);
    throw new Error('Failed to update form preset');
  }
};

/**
 * Delete a form preset
 */
export const deleteFormPreset = async (id: string): Promise<void> => {
  try {
    await prisma.formPreset.delete({
      where: { id },
    });
  } catch (error) {
    console.error('Error deleting form preset:', error);
    throw new Error('Failed to delete form preset');
  }
};

/**
 * Initialize field configurations from code-based config (one-time)
 * This seeds the database with initial field configuration from lib/field-config.ts
 */
export const initializeFieldConfigurationsFromCode = async (): Promise<void> => {
  try {
    // Check if already initialized by seeing if client sections exist
    const existingClientSections = await prisma.formSection.findMany({
      where: { entity: 'client' },
    });

    if (existingClientSections.length > 0) {
      console.log(
        'Field configurations already initialized in database, skipping...'
      );
      return;
    }

    console.log(
      'Initializing field configurations from code-based config...'
    );

    // Import the code-based config
    const { CLIENT_SECTIONS, PROJECT_SECTIONS } = await import(
      '@/lib/field-config'
    );

    // Seed client sections and fields
    for (const section of CLIENT_SECTIONS) {
      const createdSection = await prisma.formSection.create({
        data: {
          id: require('crypto').randomUUID(),
          entity: 'client',
          title: section.title,
          description: section.description,
          icon: section.icon,
          columns: section.columns || 2,
          orderIndex: CLIENT_SECTIONS.indexOf(section),
          layout: 'accordion',
          visible: true,
        },
      });

      // Create fields for this section
      for (const field of section.fields) {
        const fieldData: any = {
          id: require('crypto').randomUUID(),
          entity: 'client',
          sectionId: createdSection.id,
          fieldName: field.name,
          label: field.label,
          fieldType: field.type,
          required: field.required || false,
          placeholder: field.placeholder,
          helpText: field.help,
          validation: field.validation,
          orderIndex: section.fields.indexOf(field),
          visible: true,
          editable: true,
        };
        if (field.options) {
          fieldData.customOptions = JSON.stringify(field.options);
        }
        await prisma.fieldConfiguration.create({
          data: fieldData,
        });
      }
    }

    // Seed project sections and fields
    for (const section of PROJECT_SECTIONS) {
      const createdSection = await prisma.formSection.create({
        data: {
          id: require('crypto').randomUUID(),
          entity: 'project',
          title: section.title,
          description: section.description,
          icon: section.icon,
          columns: section.columns || 2,
          orderIndex: PROJECT_SECTIONS.indexOf(section),
          layout: 'tabs', // Projects use tabs
          visible: true,
        },
      });

      // Create fields for this section
      for (const field of section.fields) {
        const fieldData: any = {
          id: require('crypto').randomUUID(),
          entity: 'project',
          sectionId: createdSection.id,
          fieldName: field.name,
          label: field.label,
          fieldType: field.type,
          required: field.required || false,
          placeholder: field.placeholder,
          helpText: field.help,
          validation: field.validation,
          orderIndex: section.fields.indexOf(field),
          visible: true,
          editable: true,
        };
        if (field.options) {
          fieldData.customOptions = JSON.stringify(field.options);
        }
        await prisma.fieldConfiguration.create({
          data: fieldData,
        });
      }
    }

    console.log('Field configurations initialized successfully');
    clearFieldConfigCache();
  } catch (error) {
    console.error('Error initializing field configurations:', error);
    throw new Error('Failed to initialize field configurations');
  }
};
