import Link from 'next/link';
import { PageHero } from '@/components/layout/page-hero';
import { UserPlus, FileText, MessageSquareWarning, Send } from 'lucide-react';

const services = [
  {
    title: 'Recruitment',
    description: 'Apply for civil service positions across Ghana',
    href: '/services/recruitment',
    icon: UserPlus,
    gradient: 'from-primary to-primary-light',
  },
  {
    title: 'Right to Information',
    description: 'Submit RTI requests for public records and data',
    href: '/services/rti',
    icon: FileText,
    gradient: 'from-accent to-accent-light',
  },
  {
    title: 'Complaints',
    description: 'Report issues about civil service delivery',
    href: '/services/complaints',
    icon: MessageSquareWarning,
    gradient: 'from-error to-red-400',
  },
  {
    title: 'Feedback',
    description: 'Share your feedback to help us improve',
    href: '/services/feedback',
    icon: Send,
    gradient: 'from-success to-emerald-400',
  },
] as const;

export default function ServicesPage() {
  return (
    <>
      <PageHero
        title="Our Services"
        subtitle="The Office of the Head of Civil Service provides a range of services to public sector workers and citizens of Ghana. Select a service below to get started."
        breadcrumbs={[{ label: 'Services' }]}
        accent="green"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.href}
                href={service.href}
                className="group relative bg-white rounded-2xl border-2 border-border/40 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-4`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="font-display text-xl font-bold text-primary-dark mb-2 group-hover:text-primary transition-colors">
                  {service.title}
                </h2>
                <p className="text-text-muted text-sm mb-4">{service.description}</p>
                <span className="text-primary font-semibold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  Get started
                  <span aria-hidden="true">&rarr;</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
