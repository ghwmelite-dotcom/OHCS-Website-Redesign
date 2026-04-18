'use client';

import { PageHero } from '@/components/layout/page-hero';
import { FloatingShapes } from '@/components/home/floating-shapes';
import { KenteSectionDivider } from '@/components/kente/kente-section-divider';
import {
  MessageSquare,
  Bot,
  ThumbsUp,
  Star,
  TrendingUp,
  Headphones,
  Heart,
} from 'lucide-react';

const IMPACT = [
  { icon: TrendingUp, title: 'Service Improvement', desc: 'Your feedback directly shapes how we improve public service delivery.', gradient: 'from-green-500 to-emerald-600' },
  { icon: Star, title: 'Recognition', desc: 'Outstanding civil servants are recognised based on citizen feedback.', gradient: 'from-amber-500 to-yellow-600' },
  { icon: ThumbsUp, title: 'Accountability', desc: 'Feedback ensures transparency and accountability across all departments.', gradient: 'from-sky-500 to-blue-600' },
  { icon: Heart, title: 'Citizen Voice', desc: 'Every piece of feedback strengthens the bond between government and citizens.', gradient: 'from-rose-500 to-pink-600' },
];

export default function FeedbackPage() {
  return (
    <>
      <PageHero
        title="Share Your Feedback"
        subtitle="Help us improve Ghana's Civil Service. Your feedback — positive or constructive — drives meaningful change."
        breadcrumbs={[{ label: 'Services', href: '/services' }, { label: 'Feedback' }]}
        accent="gold"
      />

      {/* ── AI Bot Intro ── */}
      <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
        <FloatingShapes />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/15 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
            <span className="text-sm font-semibold text-accent tracking-wide">AI-Assisted</span>
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark mb-6">
            Share Through Our{' '}
            <span className="relative inline-block">
              Assistant
              <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/20 rounded-sm -z-10" />
            </span>
          </h2>
          <p className="text-lg text-text-muted leading-relaxed mb-10 max-w-xl mx-auto">
            Our AI assistant makes sharing feedback effortless — whether it&apos;s a compliment,
            suggestion, or concern about any aspect of civil service delivery.
          </p>

          {/* Bot Preview */}
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
                <Bot className="h-10 w-10 text-primary-dark" aria-hidden="true" />
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%]">
                    <p className="text-sm text-white/80 text-left">Hi! I&apos;d love to hear your feedback. What would you like to share today?</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-accent/20 border border-accent/20 rounded-2xl rounded-br-md px-5 py-3 max-w-[80%]">
                    <p className="text-sm text-white/80 text-right">The staff at the Accra office were very helpful...</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-md px-5 py-3 max-w-[80%]">
                    <p className="text-sm text-white/80 text-left">That&apos;s wonderful! I&apos;ll make sure this positive feedback reaches the right team. 🌟</p>
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
            The AI Feedback Assistant is being developed and will be available soon.
          </p>
        </div>
      </section>

      <KenteSectionDivider />

      {/* ── Impact Section ── */}
      <section className="py-20 lg:py-24 relative overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
        <FloatingShapes />
        <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              <span className="text-sm font-semibold text-primary tracking-wide">Your Impact</span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-primary-dark">
              Feedback{' '}
              <span className="relative inline-block">
                Matters
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-primary/15 rounded-sm -z-10" />
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {IMPACT.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border-2 border-border/40 p-7 text-center hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-5 shadow-sm`}>
                  <item.icon className="h-7 w-7 text-white" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-lg text-primary-dark mb-2">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
