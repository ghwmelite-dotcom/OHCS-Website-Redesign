'use client';

import { useState } from 'react';
import { PageHero } from '@/components/layout/page-hero';
import { FloatingShapes } from '@/components/home/floating-shapes';
import { KenteSectionDivider } from '@/components/kente/kente-section-divider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Bell,
  ShieldAlert,
  Clock,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Users,
  FileText,
  GraduationCap,
  Briefcase,
  Mail,
} from 'lucide-react';

const PROCESS_STEPS = [
  {
    icon: FileText,
    title: 'Official Announcement',
    desc: 'Recruitment exercises are announced through official OHCS channels and national media.',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    icon: GraduationCap,
    title: 'Application Window',
    desc: 'A defined period is set for eligible candidates to submit applications through this portal.',
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    icon: Users,
    title: 'Screening & Examination',
    desc: 'Applications are reviewed and shortlisted candidates are invited for examination.',
    gradient: 'from-purple-500 to-violet-600',
  },
  {
    icon: Briefcase,
    title: 'Appointment & Posting',
    desc: 'Successful candidates receive official appointment letters and posting instructions.',
    gradient: 'from-sky-500 to-blue-600',
  },
];

const SCAM_WARNINGS = [
  'OHCS does not charge any fee for recruitment applications',
  'No individual or agent is authorised to collect payments on behalf of OHCS',
  'All official recruitment announcements are published only on ohcs.gov.gh',
  'Report suspected fraud to info@ohcs.gov.gh or call +233 (0)30 266 5421',
];

export default function RecruitmentPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Check if recruitment window is open (synced from admin portal via localStorage)
  const [isOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ohcs_recruitment_open') === 'true';
  });
  const [deadline] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('ohcs_recruitment_deadline') ?? '30 April 2026';
  });

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    // Simulate subscription — replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubscribed(true);
    setSubscribing(false);
  };

  return (
    <>
      <PageHero
        title="Civil Service Recruitment"
        subtitle="The official recruitment portal for Ghana's Civil Service — managed exclusively by OHCS."
        breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Recruitment' }]}
        accent="green"
      />

      {/* ── Status Banner ── */}
      {isOpen ? (
        <section className="bg-green-50 border-b-2 border-green-200">
          <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-lg text-green-900">Recruitment Window is Open!</h2>
                <p className="text-base text-green-700 mt-1">
                  Applications are now being accepted. Deadline: <strong>{deadline}</strong>
                </p>
              </div>
              <a
                href="#apply"
                className="shrink-0 px-6 py-2.5 bg-green-600 text-white font-semibold text-sm rounded-xl hover:bg-green-700 transition-colors"
              >
                Apply Now
              </a>
            </div>
          </div>
        </section>
      ) : (
      <section className="bg-amber-50 border-b-2 border-amber-200">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-amber-900">No Active Recruitment Exercise</h2>
              <p className="text-base text-amber-700 mt-1">
                There is currently no ongoing recruitment exercise. Subscribe below to be notified when the portal opens.
              </p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ── Subscribe Section (hidden when open) ── */}
      {!isOpen && (
      <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-primary tracking-wide">Stay Informed</span>
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark mb-4">
            Be the First to{' '}
            <span className="relative inline-block">
              Know
              <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
            </span>
          </h2>
          <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-xl mx-auto">
            Subscribe to receive official notifications when a new recruitment exercise is announced.
            Only verified updates from OHCS — no spam, no third parties.
          </p>

          {subscribed ? (
            <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-8 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold text-primary-dark mb-2">You&apos;re Subscribed!</h3>
              <p className="text-base text-text-muted">
                We&apos;ll notify you at <span className="font-semibold text-primary-dark">{email}</span> when a recruitment exercise is officially announced.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="max-w-lg mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/40" aria-hidden="true" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" loading={subscribing} className="sm:w-auto whitespace-nowrap">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  Notify Me
                </Button>
              </div>
              <p className="text-xs text-text-muted mt-3">
                Your email is only used for official OHCS recruitment notifications. We never share your data.
              </p>
            </form>
          )}
        </div>
      </section>
      )}

      {/* ── Application Form (only when open) ── */}
      {isOpen && (
        <>
          <KenteSectionDivider />
          <section id="apply" className="py-20 lg:py-24 bg-white relative overflow-hidden">
            <FloatingShapes />
            <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold text-primary tracking-wide">Apply Now</span>
                </div>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark mb-4">
                  Submit Your Application
                </h2>
                <p className="text-lg text-text-muted max-w-xl mx-auto">
                  Complete the form below to apply. You will receive a reference number to track your application.
                </p>
              </div>
              <div className="bg-white rounded-2xl border-2 border-border/40 p-8 shadow-sm">
                <p className="text-center text-text-muted py-8">
                  Application form will load here when connected to the backend.
                  <br />
                  <span className="text-sm text-text-muted/50 mt-2 block">Deadline: {deadline}</span>
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      <KenteSectionDivider />

      {/* ── Scam Warning Section ── */}
      <section className="py-16 lg:py-20 bg-red-50/50 relative overflow-hidden">
        <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-sm">
                <ShieldAlert className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-red-900">Fraud Alert</h2>
                <p className="text-base text-red-700">Protect yourself from recruitment scams</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-red-200 p-8">
              <ul className="space-y-4">
                {SCAM_WARNINGS.map((warning) => (
                  <li key={warning} className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-base text-red-800 font-medium">{warning}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-red-100">
                <p className="text-sm text-red-700">
                  If you have been approached by anyone claiming to offer civil service positions for a fee,
                  please report immediately to the nearest police station or contact OHCS directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── How It Works Section ── */}
      <section className="py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#F0F7F1' }}>
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary tracking-wide">The Process</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark mb-4">
              How Recruitment{' '}
              <span className="relative inline-block">
                Works
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-sm -z-10" />
              </span>
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              The Ghana Civil Service recruitment follows a structured, transparent process managed by OHCS.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.title} className="relative bg-white rounded-2xl border-2 border-border/40 p-7 text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                {/* Step number */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-accent text-primary-dark text-xs font-bold flex items-center justify-center shadow-sm">
                  {i + 1}
                </div>
                <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-5 shadow-sm', step.gradient)}>
                  <step.icon className="h-7 w-7 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-lg text-primary-dark mb-2">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── Official Sources ── */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl font-bold text-primary-dark mb-4">Official Sources Only</h2>
          <p className="text-base text-text-muted mb-8">
            All legitimate recruitment announcements are published exclusively through these official channels:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'ohcs.gov.gh', href: 'https://ohcs.gov.gh' },
              { label: 'OHCS Facebook', href: 'https://facebook.com/OHCSGhana' },
              { label: 'OHCS X (Twitter)', href: 'https://x.com/OHCSGhana' },
            ].map((source) => (
              <a
                key={source.label}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/5 border-2 border-primary/10 text-base font-medium text-primary hover:border-primary/30 hover:shadow-sm transition-all"
              >
                {source.label}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
