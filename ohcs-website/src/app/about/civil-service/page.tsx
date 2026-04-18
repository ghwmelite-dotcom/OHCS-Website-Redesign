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

export default function CivilServicePage() {
  return (
    <>
      <PageHero
        title="The Ghana Civil Service"
        subtitle="Governed by the 1992 Constitution and the Civil Service Act, 1993 (PNDCL 327), the Civil Service upholds the constitutional mandate of delivering public services with neutrality, efficiency, and accountability."
        breadcrumbs={[{ label: 'About', href: '/about' }, { label: 'The Civil Service' }]}
        accent="green"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-3">
            <div className="space-y-6 text-text-muted text-lg leading-relaxed">
              <p>
                The Ghana Civil Service is the administrative arm of the Executive branch
                of government. It comprises ministries, departments, and agencies that
                implement government policies and deliver public services to citizens.
              </p>
              <p>
                Governed by the Civil Service Act, 1993 (PNDCL 327) and the 1992
                Constitution, the Civil Service operates under the principle of political
                neutrality, ensuring continuity of governance across administrations.
              </p>

              <h2 className="font-display text-2xl font-bold text-primary-dark mt-10 mb-4">
                Historical Background
              </h2>
              <p>
                Ghana&apos;s Civil Service traces its origins to the colonial administrative
                structure established during British rule. Following independence in 1957,
                the Civil Service was reformed to serve the needs of the newly independent
                nation under the leadership of Dr. Kwame Nkrumah.
              </p>

              <h2 className="font-display text-2xl font-bold text-primary-dark mt-10 mb-4">
                Constitutional Mandate
              </h2>
              <p>
                Article 190 of the 1992 Constitution establishes the Civil Service as
                part of the public services of Ghana. The Head of the Civil Service is
                appointed by the President in accordance with the advice of the Public
                Services Commission.
              </p>
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
