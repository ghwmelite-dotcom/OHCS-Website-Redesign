'use client';

import { useState } from 'react';
import {
  useForm,
  type DefaultValues,
  type Path,
  type FieldValues,
  type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';
import { submitForm } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

interface SubmissionFormProps<T extends FieldValues> {
  schema: ZodSchema<T>;
  fields: FieldConfig<T>[];
  submissionType: string;
  submitLabel?: string;
  defaultValues?: DefaultValues<T>;
}

export function SubmissionForm<T extends FieldValues>({
  schema,
  fields,
  submissionType,
  submitLabel = 'Submit',
  defaultValues,
}: SubmissionFormProps<T>) {
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<T>({
    // zodResolver has strict generic variance; cast to satisfy RHF's Resolver type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as Resolver<T>,
    defaultValues,
  });

  if (referenceNumber) {
    return (
      <div className="text-center py-12 px-6 bg-primary/5 rounded-2xl border-2 border-primary/20">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="font-display text-2xl font-bold text-primary-dark mb-3">
          Submission Received
        </h3>
        <p className="text-text-muted text-base mb-6">
          Your submission has been received. Please save your reference number:
        </p>
        <div className="inline-block bg-white rounded-xl border-2 border-accent/30 px-8 py-4 mb-6">
          <p className="text-2xl font-mono font-bold text-primary-dark tracking-wider">
            {referenceNumber}
          </p>
        </div>
        <p className="text-sm text-text-muted">
          Use this reference number to track the status of your submission.
        </p>
      </div>
    );
  }

  const onSubmit = async (data: T) => {
    setSubmitError(null);
    try {
      const result = await submitForm(submissionType, data as Record<string, unknown>);
      setReferenceNumber(result.data.referenceNumber);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {submitError}
        </div>
      )}

      {fields.map((field) => {
        const error = errors[field.name];
        const isTextarea = field.type === 'textarea';

        return (
          <div key={String(field.name)}>
            <label
              htmlFor={String(field.name)}
              className="block text-sm font-semibold text-primary-dark mb-2"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {isTextarea ? (
              <textarea
                id={String(field.name)}
                rows={field.rows ?? 5}
                placeholder={field.placeholder}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border-2 bg-white text-base transition-colors resize-none',
                  error
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-border/60 focus:border-primary',
                  'focus:outline-none',
                )}
                {...register(field.name)}
              />
            ) : (
              <input
                id={String(field.name)}
                type={field.type ?? 'text'}
                placeholder={field.placeholder}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border-2 bg-white text-base transition-colors',
                  error
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-border/60 focus:border-primary',
                  'focus:outline-none',
                )}
                {...register(field.name)}
              />
            )}
            {error && (
              <p className="mt-1.5 text-sm text-red-500">{error.message as string}</p>
            )}
          </div>
        );
      })}

      <Button type="submit" variant="primary" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
