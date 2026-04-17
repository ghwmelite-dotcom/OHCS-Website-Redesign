import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KenteAccent } from '@/components/kente/kente-accent';

const currentYear = new Date().getFullYear();

const quickLinks = [
  { label: 'About OHCS', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Publications', href: '/publications' },
  { label: 'Right to Information', href: '/right-to-information' },
  { label: 'Contact', href: '/contact' },
];

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

const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://facebook.com/OHCSGhana',
    Icon: FacebookIcon,
  },
  {
    label: 'X (Twitter)',
    href: 'https://x.com/OHCSGhana',
    Icon: XIcon,
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/OHCSGhana',
    Icon: InstagramIcon,
  },
];

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn('w-full', className)}>
      {/* Kente band at top */}
      <KenteAccent variant="header-band" />

      {/* Main footer content */}
      <div className="bg-[var(--color-primary-dark,#0a2a1a)] text-white/90">
        <div className="max-w-[var(--max-w-content,1280px)] mx-auto px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-16">

            {/* Column 1 — About */}
            <div className="space-y-5">
              {/* Logo + name */}
              <div className="flex items-center gap-3">
                <Image
                  src="/images/ohcs-logo.png"
                  alt="OHCS logo"
                  width={40}
                  height={40}
                  className="brightness-0 invert"
                  onError={() => {/* fallback handled by alt text */}}
                />
                <span className="font-semibold text-lg tracking-wide">OHCS</span>
              </div>

              {/* Description */}
              <p className="text-white/70 text-sm leading-relaxed">
                The Office of the Head of Civil Service leads and transforms Ghana's
                Civil Service to deliver excellence in public service.
              </p>

              {/* Social links */}
              <div className="flex items-center gap-4 pt-1">
                {socialLinks.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-white/60 hover:text-[var(--color-accent,#D4A017)] transition-colors duration-200"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2 — Quick Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base uppercase tracking-wider text-white">
                Quick Links
              </h3>
              <ul className="space-y-2.5">
                {quickLinks.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-white/60 hover:text-[var(--color-accent,#D4A017)] transition-colors duration-200"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 — Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base uppercase tracking-wider text-white">
                Contact
              </h3>
              <ul className="space-y-4">
                {/* Address */}
                <li className="flex items-start gap-3">
                  <MapPin
                    className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-accent,#D4A017)]"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-white/70 leading-relaxed">
                    Office of the Head of Civil Service,{' '}
                    P.O. Box M.49, Accra, Ghana
                  </span>
                </li>

                {/* Phone */}
                <li className="flex items-center gap-3">
                  <Phone
                    className="h-4 w-4 shrink-0 text-[var(--color-accent,#D4A017)]"
                    aria-hidden="true"
                  />
                  <a
                    href="tel:+233302665421"
                    className="text-sm text-white/70 hover:text-[var(--color-accent,#D4A017)] transition-colors duration-200"
                  >
                    +233 (0)30 266 5421
                  </a>
                </li>

                {/* Email */}
                <li className="flex items-center gap-3">
                  <Mail
                    className="h-4 w-4 shrink-0 text-[var(--color-accent,#D4A017)]"
                    aria-hidden="true"
                  />
                  <a
                    href="mailto:info@ohcs.gov.gh"
                    className="text-sm text-white/70 hover:text-[var(--color-accent,#D4A017)] transition-colors duration-200"
                  >
                    info@ohcs.gov.gh
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-[var(--max-w-content,1280px)] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Coat of arms + copyright */}
            <div className="flex items-center gap-3">
              <Image
                src="/images/coat-of-arms.png"
                alt="Ghana Coat of Arms"
                width={24}
                height={24}
                className="brightness-0 invert"
              />
              <p className="text-xs text-white/50">
                &copy; {currentYear} Office of the Head of Civil Service. All rights reserved.
              </p>
            </div>

            {/* Policy links */}
            <nav aria-label="Policy links">
              <ul className="flex items-center gap-5">
                {[
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Accessibility', href: '/accessibility' },
                  { label: 'Sitemap', href: '/sitemap.xml' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-xs text-white/40 hover:text-white/70 transition-colors duration-200"
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
