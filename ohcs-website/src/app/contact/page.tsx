import { PageHero } from '@/components/layout/page-hero';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const CONTACT_INFO = [
  { icon: MapPin, label: 'Address', value: 'Office of the Head of the Civil Service,\nP.O. Box M.49, Accra, Ghana' },
  { icon: Phone, label: 'Phone', value: '+233 (0)30 266 5421', href: 'tel:+233302665421' },
  { icon: Mail, label: 'Email', value: 'info@ohcs.gov.gh', href: 'mailto:info@ohcs.gov.gh' },
  { icon: Clock, label: 'Office Hours', value: 'Monday – Friday\n8:00 AM – 5:00 PM' },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contact Us"
        subtitle="We welcome your enquiries. Reach out to us through any of the channels below."
        breadcrumbs={[{ label: 'Contact' }]}
        accent="green"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact details */}
          <div>
            <h2 className="font-display text-2xl font-bold text-primary-dark mb-6">
              Get in Touch
            </h2>
            <div className="space-y-6">
              {CONTACT_INFO.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                    <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-semibold text-base text-primary-dark mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-base text-text-muted hover:text-primary transition-colors whitespace-pre-line">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-base text-text-muted whitespace-pre-line">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="mt-10 bg-border/30 rounded-2xl h-64 flex items-center justify-center">
              <p className="text-text-muted">Map coming soon</p>
            </div>
          </div>

          {/* Enquiry form */}
          <div>
            <h2 className="font-display text-2xl font-bold text-primary-dark mb-6">
              Send an Enquiry
            </h2>
            <form className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-primary-dark mb-2">Full Name</label>
                <input id="name" name="name" type="text" required
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-primary-dark mb-2">Email Address</label>
                <input id="email" name="email" type="email" required
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label htmlFor="subject" className="block text-sm font-semibold text-primary-dark mb-2">Subject</label>
                <input id="subject" name="subject" type="text" required
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none transition-colors" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-primary-dark mb-2">Message</label>
                <textarea id="message" name="message" rows={5} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-border/60 bg-white text-base focus:border-primary focus:outline-none transition-colors resize-none" />
              </div>
              <button type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-semibold text-base rounded-xl hover:bg-primary-light hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
