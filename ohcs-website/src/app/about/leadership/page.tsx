import Image from 'next/image';
import { PageHero } from '@/components/layout/page-hero';

const LEADERS = [
  {
    name: 'Evans Aggrey-Darkoh, Ph.D.',
    title: 'Head of the Civil Service',
    bio: 'Leading the transformation and modernisation of Ghana\u2019s civil service to deliver efficient, transparent, and accountable public services to all citizens.',
    photoUrl: '/images/hero/head-of-civil-service.jpg',
  },
  {
    name: 'Mr. Sylvanus Kofi Adzornu',
    title: 'Chief Director',
    bio: 'Overseeing the administrative operations of OHCS and driving institutional excellence across all directorates and departments.',
    photoUrl: '/images/hero/chief-director.jpg',
  },
];

export default function LeadershipPage() {
  return (
    <>
      <PageHero
        title="Our Leadership"
        breadcrumbs={[{ label: 'About', href: '/about' }, { label: 'Our Leadership' }]}
        accent="warm"
      />

      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="space-y-8">
          {LEADERS.map((leader) => (
            <div key={leader.name} className="bg-white rounded-2xl border-2 border-border/40 overflow-hidden shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                <div className="relative h-64 md:h-auto md:min-h-[300px]">
                  <Image
                    src={leader.photoUrl}
                    alt={leader.name}
                    fill
                    className="object-cover object-[85%_20%] scale-[1.2]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="md:col-span-2 p-8 lg:p-10 flex flex-col justify-center">
                  <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">
                    {leader.title}
                  </p>
                  <h2 className="font-display text-2xl lg:text-3xl font-bold text-primary-dark mb-4">
                    {leader.name}
                  </h2>
                  <p className="text-lg text-text-muted leading-relaxed">
                    {leader.bio}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
