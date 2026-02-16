'use client';

import { FAQSection } from '@/components/faq-section';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="bg-background min-h-dvh">
        <div className="pt-16">
          <FAQSection />
          <Footer />
        </div>
      </main>
    </>
  );
}
