'use client';

import { Breadcrumb } from '@/components/layout/breadcrumb';
import { SubmissionForm } from '@/components/forms/submission-form';
import { feedbackFormSchema, type FeedbackFormData } from '@/lib/validations';
import type { Path } from 'react-hook-form';

const fields: Array<{
  name: Path<FeedbackFormData>;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number;
}> = [
  { name: 'name', label: 'Full Name', placeholder: 'Enter your full name', required: true },
  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
  { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+233 XX XXX XXXX' },
  { name: 'subject', label: 'Subject', placeholder: 'What is your feedback about?' },
  {
    name: 'body',
    label: 'Your Feedback',
    type: 'textarea',
    placeholder: 'Share your feedback with us...',
    required: true,
    rows: 6,
  },
];

export default function FeedbackPage() {
  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16">
      <Breadcrumb
        items={[
          { label: 'Services', href: '/services' },
          { label: 'Feedback' },
        ]}
      />

      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-bold text-primary-dark mb-4">
          Share Your Feedback
        </h1>
        <p className="text-lg text-text-muted mb-8">
          Your feedback helps us improve our services. Whether it is a suggestion,
          commendation, or observation, we would love to hear from you. You will
          receive a reference number to track your submission.
        </p>

        <SubmissionForm<FeedbackFormData>
          schema={feedbackFormSchema}
          fields={fields}
          submissionType="feedback"
          submitLabel="Submit Feedback"
        />
      </div>
    </main>
  );
}
