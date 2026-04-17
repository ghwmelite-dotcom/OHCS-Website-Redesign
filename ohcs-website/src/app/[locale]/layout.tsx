import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { SkipToContent } from '@/components/layout/skip-to-content';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

const supportedLocales = ['en', 'tw'] as const;
type Locale = (typeof supportedLocales)[number];

function isSupportedLocale(locale: string): locale is Locale {
  return (supportedLocales as readonly string[]).includes(locale);
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <body className="min-h-screen flex flex-col bg-surface text-text font-body antialiased">
        <SkipToContent />
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </NextIntlClientProvider>
  );
}
