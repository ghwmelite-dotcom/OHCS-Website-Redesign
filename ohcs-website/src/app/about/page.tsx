import { Breadcrumb } from '@/components/layout/breadcrumb';
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

export default function AboutPage() {
  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Breadcrumb items={[{ label: 'About' }]} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <h1 className="font-display text-4xl font-bold text-primary-dark mb-6">
            About OHCS
          </h1>

          <div className="prose max-w-none space-y-6 text-text-muted text-lg leading-relaxed">
            <p>
              The Office of the Head of the Civil Service (OHCS) is the apex administrative
              body responsible for the management, development, and reform of Ghana&apos;s
              Civil Service.
            </p>
            <p>
              Established under the 1992 Constitution of the Republic of Ghana, OHCS
              serves as the principal advisory body to the Government on all matters
              relating to the Civil Service, including recruitment, training, promotions,
              discipline, and conditions of service.
            </p>

            <h2 className="font-display text-2xl font-bold text-primary-dark mt-10 mb-4">
              Our Mission
            </h2>
            <p>
              To lead the transformation and modernisation of Ghana&apos;s Civil Service
              to deliver efficient, transparent, and accountable public services for all
              citizens.
            </p>

            <h2 className="font-display text-2xl font-bold text-primary-dark mt-10 mb-4">
              Our Vision
            </h2>
            <p>
              A world-class Civil Service that is professional, responsive, and
              citizen-centred — driving national development and public trust.
            </p>

            <h2 className="font-display text-2xl font-bold text-primary-dark mt-10 mb-4">
              Core Values
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 not-prose">
              {[
                { value: 'Loyalty', desc: 'Faithful service to the nation and its people' },
                { value: 'Excellence', desc: 'Commitment to the highest standards of performance' },
                { value: 'Service', desc: 'Dedication to public welfare and citizen satisfaction' },
              ].map((item) => (
                <div key={item.value} className="bg-primary/5 rounded-xl p-6 text-center">
                  <h3 className="font-semibold text-xl text-primary-dark mb-2">{item.value}</h3>
                  <p className="text-base text-text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Sidebar sections={ABOUT_SIDEBAR} />
        </div>
      </div>
    </div>
  );
}
