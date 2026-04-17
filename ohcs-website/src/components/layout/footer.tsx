import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Clock, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const currentYear = new Date().getFullYear();

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com/OHCSGhana', Icon: FacebookIcon },
  { label: 'X (Twitter)', href: 'https://x.com/OHCSGhana', Icon: XIcon },
  { label: 'Instagram', href: 'https://instagram.com/OHCSGhana', Icon: InstagramIcon },
  { label: 'YouTube', href: 'https://youtube.com/@OHCSGhana', Icon: YouTubeIcon },
];

const quickLinks = [
  { label: 'About OHCS', href: '/about' },
  { label: 'Directorates', href: '/directorates' },
  { label: 'Departments', href: '/departments' },
  { label: 'Publications', href: '/publications' },
  { label: 'Right to Information', href: '/right-to-information' },
  { label: 'Contact Us', href: '/contact' },
];

const serviceLinks = [
  { label: 'Recruitment', href: '/services/recruitment' },
  { label: 'Submit RTI Request', href: '/services/rti' },
  { label: 'Complaints & Feedback', href: '/services/complaints' },
  { label: 'Track Submission', href: '/track' },
  { label: 'E-Library', href: 'https://ohcselibrary.xyz', external: true },
];

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn('w-full', className)}>
      {/* ── Thick Kente band at top ── */}
      <div aria-hidden="true" style={{ height: 10 }}>
        <div
          className="h-full"
          style={{
            background:
              'repeating-linear-gradient(90deg, #1B5E20 0px, #1B5E20 80px, #D4A017 80px, #D4A017 160px, #B71C1C 160px, #B71C1C 240px, #212121 240px, #212121 320px)',
          }}
        />
      </div>

      {/* ── Main footer ── */}
      <div className="relative bg-primary-dark overflow-hidden">
        {/* Subtle Kente mesh background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(0deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 48px)',
              'repeating-linear-gradient(90deg, #D4A017 0px, #D4A017 1px, transparent 1px, transparent 48px)',
            ].join(', '),
          }}
        />

        <div className="relative max-w-content mx-auto px-6 sm:px-8 pt-16 pb-12 lg:pt-20 lg:pb-16">

          {/* ── Top section: Logo + description + social ── */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 mb-14">
            <div className="max-w-md">
              {/* Logo + name */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <Image
                    src="/images/ohcs-logo.png"
                    alt="OHCS logo"
                    width={32}
                    height={32}
                    className="brightness-0 invert"
                  />
                </div>
                <div>
                  <span className="font-display text-xl font-bold text-white block leading-tight">
                    OHCS
                  </span>
                  <span className="text-xs text-accent font-medium tracking-wider uppercase">
                    Republic of Ghana
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/60 text-base leading-relaxed mb-6">
                The Office of the Head of Civil Service leads and transforms Ghana&apos;s
                Civil Service to deliver excellence, accountability, and innovation in
                public service delivery.
              </p>

              {/* Social links — larger, with hover glow */}
              <div className="flex items-center gap-3">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={cn(
                      'w-10 h-10 rounded-lg bg-white/5 border border-white/10',
                      'flex items-center justify-center',
                      'text-white/50 hover:text-accent hover:bg-accent/10 hover:border-accent/30',
                      'transition-all duration-200',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            </div>

            {/* Office hours badge */}
            <div className="lg:text-right">
              <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <Clock className="h-5 w-5 text-accent" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-white">Office Hours</p>
                  <p className="text-sm text-white/50">Mon – Fri, 8:00 AM – 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Gold divider ── */}
          <div
            aria-hidden="true"
            className="h-px mb-14"
            style={{
              background: 'linear-gradient(90deg, rgba(212,160,23,0.3), rgba(212,160,23,0.1) 50%, rgba(212,160,23,0.3))',
            }}
          />

          {/* ── Links grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">
            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-5">
                Quick Links
              </h3>
              <ul className="space-y-3">
                {quickLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-base text-white/55 hover:text-white hover:translate-x-1 inline-block transition-all duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-5">
                Services
              </h3>
              <ul className="space-y-3">
                {serviceLinks.map((link) => (
                  <li key={link.label}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base text-white/55 hover:text-white inline-flex items-center gap-1.5 transition-all duration-200"
                      >
                        {link.label}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-base text-white/55 hover:text-white hover:translate-x-1 inline-block transition-all duration-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="sm:col-span-2 lg:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-accent mb-5">
                Get in Touch
              </h3>
              <ul className="space-y-5">
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80 mb-0.5">Address</p>
                    <p className="text-base text-white/55 leading-relaxed">
                      Office of the Head of Civil Service,<br />
                      P.O. Box M.49, Accra, Ghana
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="h-5 w-5 text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80 mb-0.5">Phone</p>
                    <a
                      href="tel:+233302665421"
                      className="text-base text-white/55 hover:text-accent transition-colors duration-200"
                    >
                      +233 (0)30 266 5421
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80 mb-0.5">Email</p>
                    <a
                      href="mailto:info@ohcs.gov.gh"
                      className="text-base text-white/55 hover:text-accent transition-colors duration-200"
                    >
                      info@ohcs.gov.gh
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-content mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Coat of arms + copyright */}
            <div className="flex items-center gap-3">
              <Image
                src="/images/coat-of-arms.png"
                alt="Ghana Coat of Arms"
                width={28}
                height={28}
                className="brightness-0 invert opacity-60"
              />
              <p className="text-sm text-white/40">
                &copy; {currentYear} Office of the Head of Civil Service. All rights reserved.
              </p>
            </div>

            {/* Policy links */}
            <nav aria-label="Policy links">
              <ul className="flex items-center gap-6">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Accessibility', href: '/accessibility' },
                  { label: 'Sitemap', href: '/sitemap.xml' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/30 hover:text-white/60 transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
