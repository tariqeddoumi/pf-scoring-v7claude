import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma-client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params;
  return withAuth(request, async () => {
    try {

      if (!entity) {
        return NextResponse.json(
          { success: false, error: "Entity parameter required" },
          { status: 400 }
        );
      }

      const sections = await prisma.formSection.findMany({
        where: {
          entity,
          visible: true,
        },
        orderBy: {
          orderIndex: "asc",
        },
        include: {
          fields: {
            where: { visible: true },
            orderBy: { orderIndex: "asc" },
          },
        },
      });

      if (sections.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: `No configuration found for entity: ${entity}`,
          },
          { status: 404 }
        );
      }

      const formattedSections = sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        icon: section.icon,
        columns: section.columns,
        layout: section.layout,
        fields: section.fields.map((field) => ({
          name: field.fieldName,
          label: field.label,
          type: field.fieldType as any,
          required: field.required,
          placeholder: field.placeholder,
          help: field.helpText,
          validation: field.validation,
          step: field.step,
          options: field.customOptions
            ? Array.isArray(field.customOptions)
              ? field.customOptions
              : []
            : undefined,
        })),
      }));

      return NextResponse.json({
        success: true,
        data: {
          entity,
          sections: formattedSections,
        },
      });
    } catch (error) {
      console.error("[FORMS CONFIGURATION GET]", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch form configuration" },
        { status: 500 }
      );
    }
  });
}
