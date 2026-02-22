import { routing } from '@/i18n/routing';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata, Viewport } from 'next';
import '../globals.css';

const generateMetadata = async ({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> => {
  const { locale } = await params;
  setRequestLocale(locale);

  const hero = await getTranslations({ locale, namespace: 'hero' });

  return {
    title: `ZFocus - ${hero('title')}`,
    description: hero('subtitle'),
  };
};

const viewport: Viewport = {
  themeColor: '#f8f8f6',
};

const generateStaticParams = () => routing.locales.map(locale => ({ locale }));

const RootLayout = async ({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) => {
  const { locale } = await params;

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
export { generateMetadata, viewport, generateStaticParams };
