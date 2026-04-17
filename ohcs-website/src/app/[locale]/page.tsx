import { Hero } from '@/components/home/hero';
import { KenteAccent } from '@/components/kente/kente-accent';
import { QuickServices } from '@/components/home/quick-services';
import { NewsEventsSection } from '@/components/home/news-events-section';
import { LeadershipSpotlight } from '@/components/home/leadership-spotlight';
import { DirectoratesGrid } from '@/components/home/directorates-grid';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <KenteAccent variant="divider" />
      <QuickServices />
      <KenteAccent variant="divider" />
      <NewsEventsSection />
      <KenteAccent variant="divider" />
      <LeadershipSpotlight />
      <KenteAccent variant="divider" />
      <DirectoratesGrid />
    </main>
  );
}
