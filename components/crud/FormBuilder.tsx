'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodSchema } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  defaultValue?: any;
}

interface FormBuilderProps {
  schema: ZodSchema;
  fields: FormField[];
  onSubmit: (data: any) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  error?: string;
}

export function FormBuilder({
  schema,
  fields,
  onSubmit,
  submitLabel = 'Submit',
  loading = false,
  error,
}: FormBuilderProps) {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: fields.reduce(
      (acc, field) => ({
        ...acc,
        [field.name]: field.defaultValue || '',
      }),
      {}
    ),
  });

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {fields.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: fieldProps }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-medium">{field.label}</FormLabel>
                <FormControl>
                  {field.type === 'textarea' ? (
                    <Textarea
                      {...fieldProps}
                      placeholder={field.placeholder}
                      disabled={loading}
                      className="resize-none"
                      rows={4}
                    />
                  ) : field.type === 'select' ? (
                    <Select
                      value={fieldProps.value}
                      onValueChange={fieldProps.onChange}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      {...fieldProps}
                      type={field.type}
                      placeholder={field.placeholder}
                      disabled={loading}
                      className="h-10"
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading}
        >
          {loading ? 'Submitting...' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
