import { Hero } from '@/components/home/hero';
import { KenteAccent } from '@/components/kente/kente-accent';
import { QuickServices } from '@/components/home/quick-services';
import { NewsEventsSection } from '@/components/home/news-events-section';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <KenteAccent variant="divider" />
      <QuickServices />
      <KenteAccent variant="divider" />
      <NewsEventsSection />
    </main>
  );
}
