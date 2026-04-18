'use client';

import { useState } from 'react';
import { PageHero } from '@/components/layout/page-hero';
import { FloatingShapes } from '@/components/home/floating-shapes';
import { KenteSectionDivider } from '@/components/kente/kente-section-divider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle,
  ExternalLink,
  Navigation,
} from 'lucide-react';

const CONTACT_CARDS = [
  {
    icon: MapPin,
    label: 'Visit Us',
    value: 'Office of the Head of the Civil Service',
    detail: 'P.O. Box M.49, Accra, Ghana',
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50',
    border: 'border-green-200 hover:border-green-400',
  },
  {
    icon: Phone,
    label: 'Call Us',
    value: '+233 (0)30 266 5421',
    detail: 'Monday – Friday, 8 AM – 5 PM',
    href: 'tel:+233302665421',
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200 hover:border-blue-400',
  },
  {
    icon: Mail,
    label: 'Email Us',
    value: 'info@ohcs.gov.gh',
    detail: 'We respond within 2 business days',
    href: 'mailto:info@ohcs.gov.gh',
    gradient: 'from-amber-500 to-yellow-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200 hover:border-amber-400',
  },
  {
    icon: Clock,
    label: 'Office Hours',
    value: 'Mon – Fri, 8:00 AM – 5:00 PM',
    detail: 'Closed on public holidays',
    gradient: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200 hover:border-purple-400',
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="Have a question or need assistance? We're here to help. Reach out through any of the channels below."
        breadcrumbs={[{ label: 'Contact' }]}
        accent="green"
      >
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
            <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-white/60">Mon – Fri, 8 AM – 5 PM</span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
            <Mail className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-sm text-white/60">2-day response time</span>
          </div>
        </div>
      </PageHero>

      {/* ── Contact Cards ── */}
      <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary tracking-wide">Reach Out</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark">
              Get in{' '}
              <span className="relative inline-block">
                Touch
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTACT_CARDS.map((card) => {
              const content = (
                <div className={cn(
                  'h-full rounded-2xl border-2 p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                  card.bg, card.border,
                )}>
                  <div className={cn('w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mx-auto mb-5 shadow-sm', card.gradient)}>
                    <card.icon className="h-7 w-7 text-white" aria-hidden="true" />
                  </div>
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-2">{card.label}</h3>
                  <p className="font-semibold text-base text-primary-dark mb-1">{card.value}</p>
                  <p className="text-sm text-text-muted">{card.detail}</p>
                </div>
              );

              return card.href ? (
                <a key={card.label} href={card.href} className="block">
                  {content}
                </a>
              ) : (
                <div key={card.label}>{content}</div>
              );
            })}
          </div>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── Map + Form Section ── */}
      <section className="py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Map Side */}
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/15 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span className="text-sm font-semibold text-accent tracking-wide">Find Us</span>
                </div>
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-primary-dark">
                  Our{' '}
                  <span className="relative inline-block">
                    Location
                    <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
                  </span>
                </h2>
              </div>

              {/* Embedded Map */}
              <div className="rounded-2xl overflow-hidden border-2 border-border/40 shadow-lg">
                <iframe
                  title="OHCS Office Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1985.8!2d-0.19752!3d5.55269!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwMzMnMDkuNyJOIDDCsDExJzUxLjEiVw!5e0!3m2!1sen!2sgh!4v1"
                  width="100%"
                  height="350"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <a
                href="https://www.google.com/maps/dir//5.55269,-0.19752"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-xl bg-primary/5 border-2 border-primary/10 text-base font-semibold text-primary hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Get Directions
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>

            {/* Enquiry Form */}
            <div>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
                  <span className="text-sm font-semibold text-primary tracking-wide">Write to Us</span>
                </div>
                <h2 className="font-display text-2xl lg:text-3xl font-bold text-primary-dark">
                  Send an{' '}
                  <span className="relative inline-block">
                    Enquiry
                    <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-sm -z-10" />
                  </span>
                </h2>
              </div>

              {submitted ? (
                <div className="bg-primary/5 border-2 border-primary/20 rounded-2xl p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-primary-dark mb-3">Message Sent!</h3>
                  <p className="text-base text-text-muted">
                    Thank you for your enquiry. We&apos;ll respond within 2 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-border/40 p-8 shadow-sm">
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-primary-dark mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input id="name" name="name" type="text" required placeholder="Kwame Asante"
                          className="w-full px-4 py-3.5 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-primary-dark mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input id="email" name="email" type="email" required placeholder="you@example.com"
                          className="w-full px-4 py-3.5 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-primary-dark mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <input id="subject" name="subject" type="text" required placeholder="What is your enquiry about?"
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all" />
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-primary-dark mb-2">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea id="message" name="message" rows={6} required placeholder="Tell us how we can help..."
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all resize-none" />
                    </div>
                    <Button type="submit" variant="primary" size="lg" loading={submitting} className="w-full sm:w-auto">
                      <Send className="h-4 w-4" aria-hidden="true" />
                      Send Message
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── Social + Quick Links ── */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-2xl font-bold text-primary-dark mb-4">Follow Us</h2>
          <p className="text-base text-text-muted mb-8">Stay connected with OHCS on social media for updates and announcements.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { label: 'Facebook', href: 'https://facebook.com/OHCSGhana' },
              { label: 'X (Twitter)', href: 'https://x.com/OHCSGhana' },
              { label: 'Instagram', href: 'https://instagram.com/OHCSGhana' },
              { label: 'YouTube', href: 'https://youtube.com/@OHCSGhana' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/5 border-2 border-primary/10 text-base font-medium text-primary hover:border-primary/30 hover:shadow-sm transition-all"
              >
                {s.label}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
