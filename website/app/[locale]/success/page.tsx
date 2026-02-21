'use client';

import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { CheckCircle, Chrome, ArrowRight, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Suspense, useEffect, useState } from 'react';

const CHROME_WEBSTORE_URL = 'https://chromewebstore.google.com/detail/zfocus';

interface CheckoutData {
  checkout_id: string;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  product_name: string | null;
  amount: number | null;
  currency: string | null;
}

const formatAmount = (amount: number | null, currency: string | null): string => {
  if (amount == null) return '';
  const value = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency ?? 'USD',
  }).format(value);
};

const SuccessContent = () => {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get('checkout_id');
  const t = useTranslations('success');
  const [checkout, setCheckout] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(!!checkoutId);

  useEffect(() => {
    if (!checkoutId) return;

    const verify = async () => {
      try {
        const res = await fetch(`/api/checkout/verify?checkout_id=${encodeURIComponent(checkoutId)}`);
        const json = await res.json();
        if (json.success) {
          setCheckout(json.data);
        }
      } catch {
        // Silently fail - still show generic success page
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [checkoutId]);

  return (
    <main className="bg-background min-h-dvh">
      <Header />
      <div className="flex min-h-[80vh] items-center justify-center px-4 pt-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mb-8 flex justify-center">
            <div className="from-accent/15 to-accent/5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br">
              <CheckCircle className="text-accent h-10 w-10" />
            </div>
          </div>

          <h1 className="text-foreground mb-4 text-3xl font-bold tracking-tight md:text-4xl">{t('title')}</h1>

          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">{t('description')}</p>

          {loading && (
            <div className="mb-8 flex items-center justify-center gap-2">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              <span className="text-muted-foreground text-sm">{t('loading')}</span>
            </div>
          )}

          {checkout && (
            <div className="bg-card border-border mb-8 rounded-2xl border p-6 text-left">
              <h3 className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wider">
                {t('orderDetails')}
              </h3>
              <dl className="space-y-3 text-sm">
                {checkout.customer_name && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('customerName')}</dt>
                    <dd className="text-foreground font-medium">{checkout.customer_name}</dd>
                  </div>
                )}
                {checkout.customer_email && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('customerEmail')}</dt>
                    <dd className="text-foreground font-medium">{checkout.customer_email}</dd>
                  </div>
                )}
                {checkout.product_name && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('product')}</dt>
                    <dd className="text-foreground font-medium">{checkout.product_name}</dd>
                  </div>
                )}
                {checkout.amount != null && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{t('totalAmount')}</dt>
                    <dd className="text-foreground font-medium">{formatAmount(checkout.amount, checkout.currency)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div className="bg-card border-border mb-8 rounded-2xl border p-6">
            <h3 className="text-foreground mb-4 text-sm font-semibold uppercase tracking-wider">{t('nextSteps')}</h3>
            <ol className="space-y-4 text-left">
              <li className="flex items-start gap-3">
                <span className="bg-accent text-accent-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  1
                </span>
                <span className="text-foreground text-sm">{t('step1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-accent text-accent-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  2
                </span>
                <span className="text-foreground text-sm">{t('step2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-accent text-accent-foreground flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  3
                </span>
                <span className="text-foreground text-sm">{t('step3')}</span>
              </li>
            </ol>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 h-12 gap-2 rounded-full px-7 text-base font-semibold shadow-[0_2px_16px_rgba(22,130,93,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(22,130,93,0.4)]"
              asChild>
              <a href={CHROME_WEBSTORE_URL} target="_blank" rel="noopener noreferrer">
                <Chrome className="h-5 w-5" />
                {t('installExtension')}
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-border hover:bg-secondary h-12 gap-2 rounded-full px-7 text-base font-semibold transition-all duration-300"
              asChild>
              <a href="/">
                <ArrowRight className="h-4 w-4" />
                {t('backToHome')}
              </a>
            </Button>
          </div>

          {checkoutId && (
            <p className="text-muted-foreground mt-8 text-xs">
              {t('orderRef')}: {checkoutId.slice(0, 8)}...
            </p>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
};

const SuccessPage = () => (
  <Suspense>
    <SuccessContent />
  </Suspense>
);

export default SuccessPage;
