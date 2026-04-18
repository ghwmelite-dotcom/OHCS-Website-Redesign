'use client';

import Link from 'next/link';
import { Bot, ArrowRight, MessageCircle, Sparkles, Clock } from 'lucide-react';
import { FloatingShapes } from '@/components/home/floating-shapes';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';
import { cn } from '@/lib/utils';

export function AssistantCta() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 lg:py-32 relative overflow-hidden" style={{ backgroundColor: '#FFF8F0' }}>
      <FloatingShapes />
      <div className="relative max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            'relative bg-gradient-to-br from-primary-dark via-primary-dark to-primary rounded-3xl p-10 lg:p-14 overflow-hidden',
            isVisible && 'animate-[reveal_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards]',
            !isVisible && 'opacity-0',
          )}
        >
          {/* Kente mesh */}
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 32px)' }} />

          {/* Animated threads */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[30%] left-0 right-0 h-px opacity-[0.1]" style={{ background: 'linear-gradient(90deg, transparent, #D4A017 30%, #D4A017 70%, transparent)', animation: 'kente-thread-h 8s ease-in-out infinite' }} />
            <div className="absolute top-[70%] left-0 right-0 h-px opacity-[0.06]" style={{ background: 'linear-gradient(90deg, transparent, #E8C547 20%, #E8C547 80%, transparent)', animation: 'kente-thread-h 12s ease-in-out 3s infinite reverse' }} />
          </div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            {/* Left */}
            <div className="lg:max-w-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-xl">
                  <Bot className="h-7 w-7 text-primary-dark" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 mb-1">
                    <Sparkles className="h-3 w-3 text-accent" />
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">AI Powered</span>
                  </div>
                </div>
              </div>
              <h2 className="font-display text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                Meet Lexi.{' '}
                <span className="relative inline-block">
                  Your 24/7 Civil Service Assistant.
                  <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/30 rounded-sm -z-10" />
                </span>
              </h2>
              <p className="text-lg text-white/50 leading-relaxed mb-8">
                Lexi knows everything about Ghana&apos;s Civil Service — recruitment, RTI requests, organisational structure, and more. Available 24/7.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/assistant"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-primary-dark font-semibold text-base rounded-xl hover:bg-accent-light hover:shadow-lg transition-all duration-200"
                >
                  <MessageCircle className="h-5 w-5" />
                  Ask Lexi
                </Link>
                <div className="flex items-center gap-2 text-white/30 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Available 24/7</span>
                </div>
              </div>
            </div>

            {/* Right — Chat preview */}
            <div className="w-full lg:w-80 bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="bg-white/10 rounded-xl rounded-bl-md px-4 py-2.5">
                  <p className="text-sm text-white/70">Good afternoon! How can I help you today? 😊</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-accent/20 rounded-xl rounded-br-md px-4 py-2.5">
                  <p className="text-sm text-white/80">How do I join the Civil Service?</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="bg-white/10 rounded-xl rounded-bl-md px-4 py-2.5">
                  <p className="text-sm text-white/70">Great question! OHCS manages recruitment through the Graduate Entrance Examination...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Kente stripe at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-[4px]" aria-hidden="true" style={{ background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)' }}>
            <div className="h-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)', backgroundSize: '200% 100%', animation: 'kente-shimmer 4s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
