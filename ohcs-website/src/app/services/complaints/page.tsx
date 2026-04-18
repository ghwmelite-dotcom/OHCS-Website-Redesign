'use client';

import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SubmissionForm } from '@/components/forms/submission-form';
import { complaintFormSchema, type ComplaintFormData } from '@/lib/validations';
import type { Path } from 'react-hook-form';

const fields: Array<{
  name: Path<ComplaintFormData>;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number;
}> = [
  { name: 'name', label: 'Full Name', placeholder: 'Enter your full name', required: true },
  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
  { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+233 XX XXX XXXX' },
  { name: 'subject', label: 'Subject', placeholder: 'Brief subject of your complaint' },
  {
    name: 'body',
    label: 'Complaint Details',
    type: 'textarea',
    placeholder: 'Describe your complaint in detail...',
    required: true,
    rows: 6,
  },
];

export default function ComplaintsPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Services', href: '/services' },
          { label: 'Complaints' },
        ]}
      />

      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-bold text-primary-dark mb-4">
          File a Complaint
        </h1>
        <p className="text-lg text-text-muted mb-8">
          Use this form to report any issues you have experienced with civil service
          delivery. All complaints are reviewed and you will receive a reference
          number to track the progress of your submission.
        </p>

        <SubmissionForm<ComplaintFormData>
          schema={complaintFormSchema}
          fields={fields}
          submissionType="complaint"
          submitLabel="Submit Complaint"
        />
      </div>
    </main>
  );
}
