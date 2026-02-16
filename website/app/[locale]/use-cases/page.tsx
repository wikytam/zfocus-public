'use client';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { UseCasesSection } from '@/components/use-cases-section';

export default function UseCasesPage() {
  return (
    <>
      <Header />
      <main className="bg-background min-h-dvh">
        <div className="pt-16">
          <UseCasesSection />
          <Footer />
        </div>
      </main>
    </>
  );
}
