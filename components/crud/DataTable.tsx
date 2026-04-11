"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Edit2, Eye } from "lucide-react";

interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onView,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">{emptyMessage}</div>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {columns.map((column) => (
              <TableHead
                key={String(column.key)}
                className="text-gray-700 font-semibold"
              >
                {column.label}
              </TableHead>
            ))}
            {(onView || onEdit || onDelete) && (
              <TableHead className="text-gray-700 font-semibold">
                Actions
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow
              key={row.id}
              className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              {columns.map((column) => (
                <TableCell key={String(column.key)} className="py-3 px-4">
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key] || "")}
                </TableCell>
              ))}
              {(onView || onEdit || onDelete) && (
                <TableCell className="py-3 px-4">
                  <div className="flex gap-2">
                    {onView && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onView(row)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(row)}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => onDelete(row)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
