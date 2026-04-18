'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHero } from '@/components/layout/page-hero';
import { FloatingShapes } from '@/components/home/floating-shapes';
import { KenteSectionDivider } from '@/components/kente/kente-section-divider';
import { Button } from '@/components/ui/button';
import { submitForm } from '@/lib/api';
import { recruitmentFormSchema, type RecruitmentFormData } from '@/lib/validations';
import { cn } from '@/lib/utils';
import {
  User,
  GraduationCap,
  Briefcase,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Shield,
  Users,
  Clock,
} from 'lucide-react';
import type { Resolver } from 'react-hook-form';

const STEPS = [
  { id: 1, title: 'Personal Info', icon: User, desc: 'Your contact details' },
  { id: 2, title: 'Qualifications', icon: GraduationCap, desc: 'Education & skills' },
  { id: 3, title: 'Experience', icon: Briefcase, desc: 'Work history' },
  { id: 4, title: 'Review & Submit', icon: FileCheck, desc: 'Final check' },
];

const FEATURES = [
  { icon: Shield, text: 'Secure & confidential application process' },
  { icon: Users, text: 'Positions across all ministries and agencies' },
  { icon: Clock, text: 'Track your application status in real-time' },
];

export default function RecruitmentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RecruitmentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recruitmentFormSchema as any) as Resolver<RecruitmentFormData>,
    mode: 'onTouched',
  });

  const stepFields: Record<number, (keyof RecruitmentFormData)[]> = {
    1: ['name', 'email', 'phone'],
    2: ['position', 'qualifications'],
    3: ['experience', 'coverLetter'],
    4: [],
  };

  const goNext = async () => {
    const fields = stepFields[currentStep];
    if (fields && fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (data: RecruitmentFormData) => {
    setSubmitError(null);
    try {
      const result = await submitForm('recruitment', data as Record<string, unknown>);
      setReferenceNumber(result.data.referenceNumber);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    }
  };

  const inputClass = (name: keyof RecruitmentFormData) =>
    cn(
      'w-full px-4 py-3.5 rounded-xl border-2 bg-white text-base transition-all duration-200',
      errors[name] ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/10',
      'focus:outline-none',
    );

  // ── Success State ──
  if (referenceNumber) {
    return (
      <>
        <PageHero
          title="Application Submitted"
          subtitle="Your application has been received and is being processed."
          breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Recruitment' }]}
          accent="green"
        />
        <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
          <FloatingShapes />
          <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-primary-dark mb-4">
              Application Received Successfully
            </h2>
            <p className="text-lg text-text-muted mb-8">
              Please save your reference number. You will need it to track the status of your application.
            </p>
            <div className="inline-block bg-primary-dark rounded-2xl px-10 py-6 mb-8">
              <p className="text-xs text-accent uppercase tracking-wider mb-2 font-semibold">Your Reference Number</p>
              <p className="text-3xl font-mono font-bold text-white tracking-[0.15em]">
                {referenceNumber}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/track"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-light transition-colors"
              >
                Track Your Application
              </a>
              <a
                href="/services"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-border/60 text-text-muted font-semibold rounded-xl hover:border-primary/30 transition-colors"
              >
                Back to Services
              </a>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        title="Civil Service Recruitment"
        subtitle="Join Ghana's Civil Service — serve your nation with excellence, loyalty, and dedication."
        breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Recruitment' }]}
        accent="green"
      >
        {/* Feature badges in hero */}
        <div className="flex flex-wrap gap-3 mt-2">
          {FEATURES.map((f) => (
            <div key={f.text} className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
              <f.icon className="h-4 w-4 text-accent" aria-hidden="true" />
              <span className="text-sm text-white/60">{f.text}</span>
            </div>
          ))}
        </div>
      </PageHero>

      <KenteSectionDivider />

      <section className="py-16 lg:py-20 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Step Progress Bar ── */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative">
              {/* Background line */}
              <div className="absolute top-6 left-0 right-0 h-[2px] bg-border/40" aria-hidden="true" />
              {/* Active line */}
              <div
                className="absolute top-6 left-0 h-[2px] bg-primary transition-all duration-500"
                aria-hidden="true"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
              />

              {STEPS.map((step) => {
                const isActive = currentStep === step.id;
                const isComplete = currentStep > step.id;
                return (
                  <div key={step.id} className="relative flex flex-col items-center z-10" style={{ width: `${100 / STEPS.length}%` }}>
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                        isComplete
                          ? 'bg-primary border-primary text-white shadow-md'
                          : isActive
                            ? 'bg-white border-primary text-primary shadow-lg scale-110'
                            : 'bg-white border-border/40 text-text-muted/40',
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={cn(
                      'text-xs font-semibold mt-3 text-center',
                      isActive || isComplete ? 'text-primary-dark' : 'text-text-muted/50',
                    )}>
                      {step.title}
                    </span>
                    <span className={cn(
                      'text-[10px] mt-0.5 text-center hidden sm:block',
                      isActive || isComplete ? 'text-text-muted' : 'text-text-muted/30',
                    )}>
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {submitError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-base mb-8">
                {submitError}
              </div>
            )}

            {/* Step 1: Personal Info */}
            <div className={cn(currentStep === 1 ? 'block' : 'hidden')}>
              <div className="bg-white rounded-2xl border-2 border-border/40 p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-primary-dark">Personal Information</h2>
                    <p className="text-sm text-text-muted">Your contact and identification details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-primary-dark mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input id="name" type="text" placeholder="e.g. Kwame Asante" className={inputClass('name')} {...register('name')} />
                    {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-primary-dark mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input id="email" type="email" placeholder="you@example.com" className={inputClass('email')} {...register('email')} />
                    {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-primary-dark mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input id="phone" type="tel" placeholder="+233 XX XXX XXXX" className={inputClass('phone')} {...register('phone')} />
                    {errors.phone && <p className="mt-1.5 text-sm text-red-500">{errors.phone.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Qualifications */}
            <div className={cn(currentStep === 2 ? 'block' : 'hidden')}>
              <div className="bg-white rounded-2xl border-2 border-border/40 p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-primary-dark">Education & Qualifications</h2>
                    <p className="text-sm text-text-muted">Your academic background and certifications</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="position" className="block text-sm font-semibold text-primary-dark mb-2">
                      Position Applied For <span className="text-red-500">*</span>
                    </label>
                    <input id="position" type="text" placeholder="e.g. Administrative Officer, Principal Secretary" className={inputClass('position')} {...register('position')} />
                    {errors.position && <p className="mt-1.5 text-sm text-red-500">{errors.position.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="qualifications" className="block text-sm font-semibold text-primary-dark mb-2">
                      Academic Qualifications <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-text-muted mb-2">List your degrees, diplomas, and professional certifications</p>
                    <textarea
                      id="qualifications"
                      rows={5}
                      placeholder="e.g.&#10;• BSc Administration, University of Ghana (2018)&#10;• MSc Public Policy, GIMPA (2021)&#10;• ICAG Chartered Accountant"
                      className={cn(inputClass('qualifications'), 'resize-none')}
                      {...register('qualifications')}
                    />
                    {errors.qualifications && <p className="mt-1.5 text-sm text-red-500">{errors.qualifications.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Experience */}
            <div className={cn(currentStep === 3 ? 'block' : 'hidden')}>
              <div className="bg-white rounded-2xl border-2 border-border/40 p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-primary-dark">Work Experience & Cover Letter</h2>
                    <p className="text-sm text-text-muted">Your professional history and motivation</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="experience" className="block text-sm font-semibold text-primary-dark mb-2">
                      Work Experience <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-text-muted mb-2">Describe your relevant professional experience, starting with the most recent</p>
                    <textarea
                      id="experience"
                      rows={6}
                      placeholder="e.g.&#10;• Senior Administrative Assistant, Ministry of Finance (2021–Present)&#10;  Managed departmental records, coordinated procurement processes&#10;&#10;• Administrative Assistant, Ghana Health Service (2018–2021)&#10;  Processed staff documentation, maintained filing systems"
                      className={cn(inputClass('experience'), 'resize-none')}
                      {...register('experience')}
                    />
                    {errors.experience && <p className="mt-1.5 text-sm text-red-500">{errors.experience.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="coverLetter" className="block text-sm font-semibold text-primary-dark mb-2">
                      Cover Letter <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-text-muted mb-2">Explain why you are suitable for this position and what you bring to the Civil Service</p>
                    <textarea
                      id="coverLetter"
                      rows={8}
                      placeholder="Dear Recruitment Committee,&#10;&#10;I am writing to express my interest in the position of..."
                      className={cn(inputClass('coverLetter'), 'resize-none')}
                      {...register('coverLetter')}
                    />
                    {errors.coverLetter && <p className="mt-1.5 text-sm text-red-500">{errors.coverLetter.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Review */}
            <div className={cn(currentStep === 4 ? 'block' : 'hidden')}>
              <div className="bg-white rounded-2xl border-2 border-border/40 p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-primary-dark">Review Your Application</h2>
                    <p className="text-sm text-text-muted">Please verify all details before submitting</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Review cards */}
                  {[
                    { label: 'Full Name', value: getValues('name'), step: 1 },
                    { label: 'Email', value: getValues('email'), step: 1 },
                    { label: 'Phone', value: getValues('phone'), step: 1 },
                    { label: 'Position', value: getValues('position'), step: 2 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-3 border-b border-border/30">
                      <div>
                        <span className="text-xs text-text-muted uppercase tracking-wider block">{item.label}</span>
                        <span className="text-base font-medium text-primary-dark">{item.value || '—'}</span>
                      </div>
                      <button type="button" onClick={() => setCurrentStep(item.step)} className="text-xs text-primary font-semibold hover:underline">
                        Edit
                      </button>
                    </div>
                  ))}

                  {[
                    { label: 'Qualifications', value: getValues('qualifications'), step: 2 },
                    { label: 'Experience', value: getValues('experience'), step: 3 },
                    { label: 'Cover Letter', value: getValues('coverLetter'), step: 3 },
                  ].map((item) => (
                    <div key={item.label} className="py-3 border-b border-border/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-text-muted uppercase tracking-wider">{item.label}</span>
                        <button type="button" onClick={() => setCurrentStep(item.step)} className="text-xs text-primary font-semibold hover:underline">
                          Edit
                        </button>
                      </div>
                      <p className="text-sm text-text-muted whitespace-pre-line line-clamp-4">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="mt-8 bg-accent/5 border border-accent/15 rounded-xl p-5">
                  <p className="text-sm text-text-muted leading-relaxed">
                    By submitting this application, you confirm that all information provided is accurate and complete.
                    False or misleading information may result in disqualification or termination of appointment.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Navigation Buttons ── */}
            <div className="flex items-center justify-between mt-8">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex items-center gap-2 px-6 py-3 text-base font-semibold text-text-muted hover:text-primary-dark transition-colors rounded-xl hover:bg-primary/5"
                  >
                    <ChevronLeft className="h-5 w-5" /> Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-text-muted">
                  Step {currentStep} of {STEPS.length}
                </span>
                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex items-center gap-2 px-8 py-3.5 bg-primary text-white font-semibold text-base rounded-xl hover:bg-primary-light hover:shadow-md transition-all"
                  >
                    Continue <ChevronRight className="h-5 w-5" />
                  </button>
                ) : (
                  <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
                    Submit Application
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
