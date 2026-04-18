'use client';

import { PageHero } from '@/components/layout/page-hero';
import { SubmissionForm } from '@/components/forms/submission-form';
import { rtiFormSchema, type RtiFormData } from '@/lib/validations';
import type { Path } from 'react-hook-form';

const fields: Array<{
  name: Path<RtiFormData>;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number;
}> = [
  { name: 'name', label: 'Full Name', placeholder: 'Enter your full name', required: true },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
    required: true,
  },
  { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+233 XX XXX XXXX' },
  {
    name: 'subject',
    label: 'Subject of Request',
    placeholder: 'What information are you requesting?',
    required: true,
  },
  {
    name: 'body',
    label: 'Request Details',
    type: 'textarea',
    placeholder: 'Provide a detailed description of the information you are requesting...',
    required: true,
    rows: 6,
  },
];

export default function RtiPage() {
  return (
    <>
      <PageHero
        title="Right to Information"
        breadcrumbs={[
          { label: 'Services', href: '/services' },
          { label: 'Right to Information' },
        ]}
        accent="green"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-lg text-text-muted mb-4">
            Under the Right to Information Act, 2019 (Act 989), every person has the
            right to information held by or under the control of a public institution.
            Use this form to submit your request.
          </p>
          <p className="text-sm text-text-muted mb-8">
            Please provide as much detail as possible to help us process your request
            promptly. A valid email address is required so we can correspond with you
            regarding your request.
          </p>

          <SubmissionForm<RtiFormData>
            schema={rtiFormSchema}
            fields={fields}
            submissionType="rti"
            submitLabel="Submit RTI Request"
          />
        </div>
      </div>
    </>
  );
}
