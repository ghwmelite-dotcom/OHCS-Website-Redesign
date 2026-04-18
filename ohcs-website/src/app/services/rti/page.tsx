'use client';

import { useState } from 'react';
import { PageHero } from '@/components/layout/page-hero';
import { FloatingShapes } from '@/components/home/floating-shapes';
import { KenteSectionDivider } from '@/components/kente/kente-section-divider';
import { SubmissionForm } from '@/components/forms/submission-form';
import { rtiFormSchema, type RtiFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import type { Path } from 'react-hook-form';
import {
  FileText,
  Scale,
  Clock,
  Shield,
  CheckCircle,
  BookOpen,
  Users,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

const fields: Array<{
  name: Path<RtiFormData>;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea';
  placeholder?: string;
  required?: boolean;
  rows?: number;
}> = [
  { name: 'name', label: 'Full Name', placeholder: 'Enter your full name', required: true },
  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', required: true },
  { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+233 XX XXX XXXX' },
  { name: 'subject', label: 'Subject of Request', placeholder: 'What information are you requesting?', required: true },
  { name: 'body', label: 'Request Details', type: 'textarea', placeholder: 'Provide a detailed description of the information you are requesting...', required: true, rows: 6 },
];

const YOUR_RIGHTS = [
  { icon: FileText, title: 'Access Public Records', desc: 'Request documents, reports, and data held by any public institution.' },
  { icon: Clock, title: '14-Day Response', desc: 'Institutions must respond to your request within 14 working days.' },
  { icon: Shield, title: 'No Justification Needed', desc: 'You do not need to give a reason for requesting information.' },
  { icon: Scale, title: 'Right to Appeal', desc: 'If denied, you may appeal to the RTI Commission within 21 days.' },
];

const PROCESS = [
  { step: '01', title: 'Submit Request', desc: 'Fill out the form below with details of the information you seek.' },
  { step: '02', title: 'Receive Reference', desc: 'Get a unique reference number to track your request.' },
  { step: '03', title: 'Processing', desc: 'The responsible institution reviews and processes your request.' },
  { step: '04', title: 'Response', desc: 'Receive the requested information or a formal explanation if exempt.' },
];

const FAQS = [
  { q: 'What information can I request?', a: 'Any information held by or under the control of a public institution, subject to limited exemptions for national security, personal privacy, and third-party commercial interests.' },
  { q: 'Is there a fee?', a: 'There is no fee for submitting a request. However, reasonable reproduction costs may apply for physical copies of documents.' },
  { q: 'Who can make a request?', a: 'Any person — citizen, resident, or non-resident — has the right to request information from public institutions in Ghana.' },
  { q: 'What if my request is denied?', a: 'You may appeal to the RTI Commission within 21 days of receiving the denial. The Commission will review your case and may order disclosure.' },
];

export default function RtiPage() {
  const [showForm, setShowForm] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <PageHero
        title="Right to Information"
        subtitle="Every person has the right to information held by public institutions — enshrined in the Right to Information Act, 2019 (Act 989)."
        breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Right to Information' }]}
        accent="green"
      >
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
            <BookOpen className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-white/60">Act 989 (2019)</span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
            <Users className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-white/60">Available to everyone</span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
            <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-white/60">14-day response guarantee</span>
          </div>
        </div>
      </PageHero>

      {/* ── Your Rights Section ── */}
      <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary tracking-wide">Know Your Rights</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark mb-4">
              What the Law{' '}
              <span className="relative inline-block">
                Guarantees
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {YOUR_RIGHTS.map((right) => (
              <div key={right.title} className="bg-green-50 rounded-2xl border-2 border-green-200 p-7 text-center hover:-translate-y-1 hover:shadow-xl hover:border-green-400 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <right.icon className="h-7 w-7 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-lg text-primary-dark mb-2">{right.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{right.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── How It Works ── */}
      <section className="py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/15 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              <span className="text-sm font-semibold text-accent tracking-wide">Simple Process</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark">
              How to Make a{' '}
              <span className="relative inline-block">
                Request
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS.map((item) => (
              <div key={item.step} className="relative bg-white rounded-2xl border-2 border-border/40 p-7 text-center">
                <span className="text-4xl font-bold text-accent/20 block mb-3">{item.step}</span>
                <h3 className="font-semibold text-lg text-primary-dark mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── Submit Request Section ── */}
      <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {!showForm ? (
            /* CTA to open form */
            <div className="text-center">
              <div className="relative bg-primary-dark rounded-2xl p-10 lg:p-14 overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage: [
                      'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)',
                      'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)',
                    ].join(', '),
                  }}
                />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <FileText className="h-8 w-8 text-white" aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">
                    Ready to Submit Your Request?
                  </h2>
                  <p className="text-base text-white/60 max-w-lg mx-auto mb-8 leading-relaxed">
                    Your request will be assigned a unique reference number for tracking.
                    A valid email address is required for correspondence.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-primary-dark font-semibold text-base rounded-xl hover:bg-accent-light hover:shadow-lg transition-all duration-200"
                  >
                    Open Request Form
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* The actual form */
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-primary-dark">RTI Request Form</h2>
                  <p className="text-sm text-text-muted">All fields marked * are required</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-border/40 p-8 lg:p-10">
                <SubmissionForm<RtiFormData>
                  schema={rtiFormSchema}
                  fields={fields}
                  submissionType="rti"
                  submitLabel="Submit RTI Request"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── FAQ Section ── */}
      <section className="py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#F0F7F1' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary tracking-wide">Common Questions</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark">
              Frequently{' '}
              <span className="relative inline-block">
                Asked
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden transition-all duration-300 hover:border-primary/20">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-base text-primary-dark pr-4">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-text-muted shrink-0 transition-transform duration-200',
                      openFaq === i && 'rotate-180',
                    )}
                    aria-hidden="true"
                  />
                </button>
                <div className={cn(
                  'overflow-hidden transition-all duration-300',
                  openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                )}>
                  <div className="px-6 pb-6 pt-0">
                    <p className="text-base text-text-muted leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
