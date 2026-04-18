import { Hero } from '@/components/home/hero';
import { KenteSectionDivider } from '@/components/kente/kente-section-divider';
import { QuickServices } from '@/components/home/quick-services';
import { StatsBanner } from '@/components/home/stats-banner';
import { NewsEventsSection } from '@/components/home/news-events-section';
import { LeadershipSpotlight } from '@/components/home/leadership-spotlight';
import { DirectoratesGrid } from '@/components/home/directorates-grid';
import { CtaSection } from '@/components/home/cta-section';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <KenteSectionDivider />
      <QuickServices />
      <KenteSectionDivider />
      <StatsBanner />
      <KenteSectionDivider />
      <NewsEventsSection />
      <KenteSectionDivider />
      <LeadershipSpotlight />
      <KenteSectionDivider />
      <DirectoratesGrid />
      <KenteSectionDivider />
      <CtaSection />
      <KenteSectionDivider />
    </main>
  );
}
