'use client';

import { PageHero } from '@/components/layout/page-hero';
import { FloatingShapes } from '@/components/home/floating-shapes';
import { KenteSectionDivider } from '@/components/kente/kente-section-divider';
import {
  MessageSquare,
  Bot,
  Shield,
  Clock,
  CheckCircle,
  Headphones,
} from 'lucide-react';

const FEATURES = [
  { icon: Bot, title: 'AI-Powered', desc: 'Our intelligent assistant guides you through the process step by step.' },
  { icon: Shield, title: 'Confidential', desc: 'Your complaint is handled with strict confidentiality and data protection.' },
  { icon: Clock, title: 'Fast Response', desc: 'Receive a reference number instantly and track progress in real-time.' },
  { icon: CheckCircle, title: 'Action Taken', desc: 'Every complaint is reviewed and acted upon by the appropriate directorate.' },
];

export default function ComplaintsPage() {
  return (
    <>
      <PageHero
        title="Complaints & Feedback"
        subtitle="Your voice matters. Report issues or share feedback about civil service delivery — our AI assistant will guide you."
        breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Complaints & Feedback' }]}
        accent="warm"
      />

      {/* ── AI Bot Intro Section ── */}
      <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/15 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-sm font-semibold text-accent tracking-wide">Powered by AI</span>
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark mb-6">
            Meet Your{' '}
            <span className="relative inline-block">
              Assistant
              <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
            </span>
          </h2>
          <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-xl mx-auto">
            Our AI-powered assistant helps you file complaints and share feedback efficiently.
            It understands your concerns and routes them to the right department.
          </p>

          {/* Bot Preview Card */}
          <div className="relative bg-primary-dark rounded-2xl p-8 lg:p-12 overflow-hidden max-w-lg mx-auto">
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Headphones className="h-10 w-10 text-primary-dark" aria-hidden="true" />
              </div>

              {/* Chat preview bubbles */}
              <div className="space-y-3 mb-8">
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%]">
                    <p className="text-sm text-white/80 text-left">Hello! I&apos;m the OHCS Assistant. How can I help you today?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-accent/20 border border-accent/20 rounded-2xl rounded-br-md px-5 py-3 max-w-[80%]">
                    <p className="text-sm text-white/80 text-right">I&apos;d like to file a complaint about...</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%]">
                    <p className="text-sm text-white/80 text-left">I understand. Let me help you with that. Can you tell me more about the issue?</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-white/30" aria-hidden="true" />
                <span className="text-sm text-white/30">AI Assistant coming soon...</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-text-muted mt-6">
            The AI Assistant is currently being developed. We&apos;ll notify you when it&apos;s ready.
          </p>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── Features ── */}
      <section className="py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark">
              Why Use Our{' '}
              <span className="relative inline-block">
                System
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border-2 border-border/40 p-7 text-center hover:-translate-y-1 hover:shadow-xl hover:border-accent/30 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center mx-auto mb-5 shadow-sm">
                  <f.icon className="h-7 w-7 text-primary-dark" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-lg text-primary-dark mb-2">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
