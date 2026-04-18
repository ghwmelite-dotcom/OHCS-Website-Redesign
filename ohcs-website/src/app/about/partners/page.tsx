import { PageHero } from '@/components/layout/page-hero';
import { Sidebar } from '@/components/layout/sidebar';

const ABOUT_SIDEBAR = [
  {
    title: 'About OHCS',
    links: [
      { label: 'Overview', href: '/about' },
      { label: 'The Civil Service', href: '/about/civil-service' },
      { label: 'Our Leadership', href: '/about/leadership' },
      { label: 'Organisational Structure', href: '/about/structure' },
      { label: 'Our Partners', href: '/about/partners' },
    ],
  },
];

const PARTNERS = [
  { name: 'Public Services Commission', description: 'Constitutional body overseeing the Civil Service' },
  { name: 'Ghana Institute of Management and Public Administration (GIMPA)', description: 'Premier institution for public sector management education' },
  { name: 'Ministry of Finance', description: 'Fiscal policy and budgetary coordination' },
  { name: 'Office of the President', description: 'Executive oversight and policy direction' },
  { name: 'United Nations Development Programme (UNDP)', description: 'Development partnership and capacity building' },
  { name: 'World Bank', description: 'Public sector reform and governance strengthening' },
];

export default function PartnersPage() {
  return (
    <>
      <PageHero
        title="Our Partners"
        subtitle="OHCS collaborates with national and international organisations to strengthen Ghana's Civil Service and improve public service delivery."
        breadcrumbs={[{ label: 'About', href: '/about' }, { label: 'Our Partners' }]}
        accent="gold"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <div className="space-y-4">
              {PARTNERS.map((partner) => (
                <div key={partner.name} className="bg-white rounded-xl border-2 border-border/40 p-6">
                  <h3 className="font-semibold text-lg text-primary-dark mb-1">{partner.name}</h3>
                  <p className="text-base text-text-muted">{partner.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <Sidebar sections={ABOUT_SIDEBAR} />
          </div>
        </div>
      </div>
    </>
  );
}
