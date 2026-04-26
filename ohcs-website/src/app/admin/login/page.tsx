'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { adminLogin } from '@/lib/admin-auth';
import { MagicLinkForm } from '@/components/admin/magic-link-form';
import { Button } from '@/components/ui/button';
import {
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  Crown,
  Briefcase,
  FileText,
  Eye as EyeIcon,
  ChevronRight,
  Loader2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'magic' | 'demo';

// Demo accounts surfaced as one-click sign-in buttons when demo mode is on.
// These mirror the credentials hardcoded in src/lib/admin-auth.ts (which are
// already public via client-side JS — exposing them via the UI just makes
// internal testing one-click instead of copy-paste). The whole panel
// disappears the moment Settings → Auth Mode toggles demo mode off.
const DEMO_QUICK_ACCOUNTS = [
  {
    email: 'admin@ohcs.gov.gh',
    password: 'changeme123',
    label: 'Super Admin',
    name: 'Kwame Mensah',
    icon: Crown,
    accent: 'bg-primary text-white hover:bg-primary-light border-primary',
  },
  {
    email: 'recruitment@ohcs.gov.gh',
    password: 'recruit123',
    label: 'Recruitment Admin',
    name: 'Kofi Adjei',
    icon: Briefcase,
    accent: 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300',
  },
  {
    email: 'content@ohcs.gov.gh',
    password: 'content123',
    label: 'Content Manager',
    name: 'Abena Osei',
    icon: FileText,
    accent: 'bg-blue-100 text-blue-900 hover:bg-blue-200 border-blue-300',
  },
  {
    email: 'viewer@ohcs.gov.gh',
    password: 'viewer123',
    label: 'Viewer',
    name: 'Ama Darko',
    icon: EyeIcon,
    accent: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300',
  },
] as const;

export default function AdminLoginPage() {
  const router = useRouter();
  const [demoModeOn, setDemoModeOn] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('magic');

  // Demo form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [demoSubmitting, setDemoSubmitting] = useState(false);

  // Quick sign-in (one-click) state — tracks which role button is mid-flight
  const [quickSubmittingEmail, setQuickSubmittingEmail] = useState<string | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);

  async function quickSignIn(accountEmail: string, accountPassword: string) {
    if (quickSubmittingEmail) return;
    setQuickSubmittingEmail(accountEmail);
    setQuickError(null);
    try {
      await adminLogin(accountEmail, accountPassword);
      router.push('/admin');
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Sign-in failed');
      setQuickSubmittingEmail(null);
    }
  }

  // Hide the public header/footer on mount
  useEffect(() => {
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');
    if (header) header.style.display = 'none';
    if (footer) footer.style.display = 'none';
    return () => {
      if (header) header.style.display = '';
      if (footer) footer.style.display = '';
    };
  }, []);

  // Fetch site config to determine demo mode
  useEffect(() => {
    fetch('/api/admin/site-config')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((b) => {
        const body = b as { data: { key: string; value: string }[] };
        const row = body.data.find((c) => c.key === 'admin_demo_mode_enabled');
        setDemoModeOn(row?.value === 'true');
      })
      .catch(() => setDemoModeOn(false));
  }, []);

  async function onDemoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDemoSubmitting(true);
    setDemoError(null);
    try {
      await adminLogin(email, password);
      router.push('/admin');
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setDemoSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* ── Left Panel — Branded visual ── */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-primary-dark overflow-hidden flex-col justify-between p-12">
        {/* Animated Kente threads */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[15%] left-0 right-0 h-px opacity-[0.12]" style={{ background: 'linear-gradient(90deg, transparent, #D4A017 30%, #D4A017 70%, transparent)', animation: 'kente-thread-h 8s ease-in-out infinite' }} />
          <div className="absolute top-[40%] left-0 right-0 h-px opacity-[0.08]" style={{ background: 'linear-gradient(90deg, transparent, #E8C547 20%, #E8C547 80%, transparent)', animation: 'kente-thread-h 12s ease-in-out 2s infinite reverse' }} />
          <div className="absolute top-[65%] left-0 right-0 h-px opacity-[0.1]" style={{ background: 'linear-gradient(90deg, transparent, #D4A017 40%, #D4A017 60%, transparent)', animation: 'kente-thread-h 10s ease-in-out 4s infinite' }} />
          <div className="absolute top-[85%] left-0 right-0 h-px opacity-[0.06]" style={{ background: 'linear-gradient(90deg, transparent, #E8C547 35%, #E8C547 65%, transparent)', animation: 'kente-thread-h 14s ease-in-out 1s infinite' }} />
          <div className="absolute left-[20%] top-0 bottom-0 w-px opacity-[0.08]" style={{ background: 'linear-gradient(0deg, transparent, #2E7D32 30%, #2E7D32 70%, transparent)', animation: 'kente-thread-v 9s ease-in-out 1s infinite' }} />
          <div className="absolute left-[60%] top-0 bottom-0 w-px opacity-[0.06]" style={{ background: 'linear-gradient(0deg, transparent, #1B5E20 20%, #1B5E20 80%, transparent)', animation: 'kente-thread-v 11s ease-in-out 3s infinite reverse' }} />
          <div className="absolute left-[85%] top-0 bottom-0 w-px opacity-[0.1]" style={{ background: 'linear-gradient(0deg, transparent, #2E7D32 40%, #2E7D32 60%, transparent)', animation: 'kente-thread-v 7s ease-in-out infinite' }} />
        </div>

        {/* Kente mesh */}
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 48px)' }} />
        <div aria-hidden="true" className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(46,125,50,0.25) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(212,160,23,0.1) 0%, transparent 50%)' }} />

        {/* Gold corner accents */}
        <div aria-hidden="true" className="absolute top-8 left-8 opacity-40" style={{ animation: 'corner-glow 3s ease-in-out infinite' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M2 46V6a4 4 0 014-4h40" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" /><circle cx="6" cy="6" r="2" fill="#D4A017" /></svg>
        </div>
        <div aria-hidden="true" className="absolute bottom-8 right-8 opacity-40" style={{ animation: 'corner-glow 3s ease-in-out 1.5s infinite' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M46 2V42a4 4 0 01-4 4H2" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" /><circle cx="42" cy="42" r="2" fill="#D4A017" /></svg>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="flex items-center gap-3 opacity-0" style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s forwards' }}>
            <Image src="/images/ohcs-crest.png" alt="OHCS" width={48} height={48} className="object-contain" style={{ width: 'auto', height: 48 }} />
            <div className="w-[2px] h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, transparent, #D4A017, transparent)' }} />
            <span className="font-display text-lg font-bold text-white tracking-[2px]">OHCS</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div className="opacity-0" style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.4s forwards' }}>
            <h2 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Management{' '}
              <span className="relative inline-block">
                Portal
                <span aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/30 rounded-sm -z-10" />
              </span>
            </h2>
            <p className="text-lg text-white/50 leading-relaxed max-w-md">
              Securely manage content, monitor submissions, and oversee operations across Ghana&apos;s Civil Service.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 opacity-0" style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s forwards' }}>
            {['Role-Based Access', 'Secure Sessions', 'Audit Logging'].map((f) => (
              <div key={f} className="flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-4 py-2">
                <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span className="text-xs text-white/50 font-medium">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Kente stripe */}
        <div className="relative opacity-0" style={{ animation: 'hero-reveal 0.8s cubic-bezier(0.16,1,0.3,1) 0.8s forwards' }}>
          <div className="h-[4px] rounded-full overflow-hidden" style={{ background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)' }}>
            <div className="h-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)', backgroundSize: '200% 100%', animation: 'kente-shimmer 4s ease-in-out infinite' }} />
          </div>
          <p className="text-[10px] text-white/20 mt-4 tracking-wider">
            &copy; {new Date().getFullYear()} Office of the Head of the Civil Service &bull; Republic of Ghana
          </p>
        </div>
      </div>

      {/* ── Right Panel — Login Form ── */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6 relative">
        {/* Subtle floating shapes */}
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.06]">
          <div className="absolute top-[10%] right-[15%] w-8 h-8 bg-primary rounded-lg rotate-12" />
          <div className="absolute top-[30%] right-[80%] w-5 h-5 bg-accent rounded-md -rotate-20" />
          <div className="absolute bottom-[20%] right-[10%] w-6 h-10 bg-kente-red rounded-md rotate-45" />
          <div className="absolute bottom-[40%] right-[70%] w-4 h-4 bg-primary rounded-full" />
          <div className="absolute top-[60%] right-[40%] w-7 h-3 bg-accent rounded-sm -rotate-15" />
        </div>

        <div className="w-full max-w-sm relative">
          {/* Mobile logo — only shown on small screens */}
          <div className="lg:hidden text-center mb-10">
            <Image src="/images/ohcs-crest.png" alt="OHCS" width={56} height={56} className="object-contain mx-auto mb-4" style={{ width: 'auto', height: 56 }} />
            <h1 className="font-display text-2xl font-bold text-primary-dark">Admin Portal</h1>
            <p className="text-sm text-text-muted mt-1">Office of the Head of the Civil Service</p>
          </div>

          {/* Welcome text — desktop */}
          <div className="hidden lg:block mb-8">
            <h1 className="font-display text-3xl font-bold text-primary-dark mb-2">Welcome back</h1>
            <p className="text-base text-text-muted">Sign in to access the management portal.</p>
          </div>

          {/* Loading state while config is being fetched */}
          {demoModeOn === null && (
            <p className="text-sm text-text-muted text-center py-8">Loading…</p>
          )}

          {/* Magic link only — demo mode off */}
          {demoModeOn === false && <MagicLinkForm />}

          {/* Tabbed interface — demo mode on */}
          {demoModeOn === true && (
            <>
              {/* ── Quick Sign-In panel (demo mode only — auto-disappears at production) ── */}
              <div className="mb-6 rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-amber-700" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-amber-900">Quick demo sign-in</h3>
                </div>
                <p className="text-xs text-amber-900/80 mb-4">
                  Pick a role to sign in instantly. <strong>Demo mode is on</strong> — anyone with this URL can sign in. Disable in <em>Settings → Auth Mode</em> before launch.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_QUICK_ACCOUNTS.map((acc) => {
                    const Icon = acc.icon;
                    const isLoading = quickSubmittingEmail === acc.email;
                    const isDisabled = quickSubmittingEmail !== null && !isLoading;
                    return (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => void quickSignIn(acc.email, acc.password)}
                        disabled={isDisabled}
                        className={cn(
                          'group inline-flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border-2 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed',
                          acc.accent,
                        )}
                      >
                        <span className="inline-flex items-center gap-2 min-w-0">
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" aria-hidden="true" />
                          ) : (
                            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          )}
                          <span className="truncate">{acc.label}</span>
                        </span>
                        <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
                {quickError && (
                  <p className="text-xs text-red-700 mt-3">{quickError}</p>
                )}
                <p className="text-[11px] text-amber-900/60 mt-3 text-center">
                  Or sign in manually below ↓
                </p>
              </div>

              <div className="flex border-b border-border/40 mb-6" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'magic'}
                  onClick={() => setTab('magic')}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    tab === 'magic'
                      ? 'text-primary border-b-2 border-primary -mb-[2px]'
                      : 'text-text-muted hover:text-primary-dark',
                  )}
                >
                  Magic Link
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'demo'}
                  onClick={() => setTab('demo')}
                  className={cn(
                    'flex-1 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    tab === 'demo'
                      ? 'text-primary border-b-2 border-primary -mb-[2px]'
                      : 'text-text-muted hover:text-primary-dark',
                  )}
                >
                  Demo Login
                </button>
              </div>

              {tab === 'magic' && <MagicLinkForm />}

              {tab === 'demo' && (
                <form onSubmit={onDemoSubmit} className="space-y-5">
                  <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                    Demo mode is currently enabled. Disable in Settings → Auth Mode before going live.
                  </div>

                  {demoError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-start gap-3">
                      <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-red-400" aria-hidden="true" />
                      <span>{demoError}</span>
                    </div>
                  )}

                  <div>
                    <label htmlFor="demo-email" className="block text-sm font-semibold text-primary-dark mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/30" aria-hidden="true" />
                      <input
                        id="demo-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@ohcs.gov.gh"
                        autoComplete="email"
                        className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-border/50 bg-white text-base focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="demo-password" className="block text-sm font-semibold text-primary-dark mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted/30" aria-hidden="true" />
                      <input
                        id="demo-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-border/50 bg-white text-base focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted/30 hover:text-text-muted transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={demoSubmitting}
                    className="w-full !py-4 text-base"
                  >
                    Sign in (demo)
                  </Button>
                </form>
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="h-px bg-border/40 mb-6" />
            <div className="flex items-center justify-center gap-2 text-xs text-text-muted/50">
              <Lock className="h-3 w-3" aria-hidden="true" />
              <span>Restricted to <strong className="text-text-muted/70">@ohcs.gov.gh</strong> accounts</span>
            </div>
          </div>

          {/* Mobile Kente stripe */}
          <div className="lg:hidden mt-8 h-[3px] rounded-full overflow-hidden" aria-hidden="true" style={{ background: 'linear-gradient(90deg, #1B5E20 25%, #D4A017 25%, #D4A017 50%, #B71C1C 50%, #B71C1C 75%, #212121 75%)' }} />
        </div>
      </div>
    </div>
  );
}
