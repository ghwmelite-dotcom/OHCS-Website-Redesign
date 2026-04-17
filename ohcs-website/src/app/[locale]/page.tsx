import { Hero } from '@/components/home/hero';
import { KenteAccent } from '@/components/kente/kente-accent';
import { QuickServices } from '@/components/home/quick-services';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <KenteAccent variant="divider" />
      <QuickServices />
    </main>
  );
}
