'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { adminLogin } from '@/lib/admin-auth';
import { Button } from '@/components/ui/button';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(email, password);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative bg-primary-dark overflow-hidden">
      {/* Kente mesh bg */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: [
            'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 48px)',
            'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 48px)',
          ].join(', '),
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 40%, rgba(46,125,50,0.2) 0%, transparent 60%)',
        }}
      />

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 lg:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4">
              <Image
                src="/images/ohcs-crest.png"
                alt="OHCS"
                width={64}
                height={64}
                className="object-contain"
                style={{ width: 'auto', height: 64 }}
              />
            </div>
            <h1 className="font-display text-2xl font-bold text-primary-dark mb-1">
              Admin Portal
            </h1>
            <p className="text-sm text-text-muted">
              Office of the Head of the Civil Service
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-primary-dark mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/40"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@ohcs.gov.gh"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-primary-dark mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/40"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              Sign In
            </Button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-6 border-t border-border/40 text-center">
            <p className="text-xs text-text-muted">
              Access restricted to authorised OHCS staff with{' '}
              <strong>@ohcs.gov.gh</strong> email addresses only.
            </p>
          </div>
        </div>

        {/* Kente stripe at bottom */}
        <div
          aria-hidden="true"
          className="mt-6 h-[4px] rounded-full overflow-hidden"
          style={{
            background:
              'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)',
          }}
        />
      </div>
    </div>
  );
}
