import { Hero } from '@/components/home/hero';
import { QuickServices } from '@/components/home/quick-services';
import { NewsEventsSection } from '@/components/home/news-events-section';
import { LeadershipSpotlight } from '@/components/home/leadership-spotlight';
import { DirectoratesGrid } from '@/components/home/directorates-grid';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <QuickServices />
      <NewsEventsSection />
      <LeadershipSpotlight />
      <DirectoratesGrid />
    </main>
  );
}
