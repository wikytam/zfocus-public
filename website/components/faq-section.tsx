'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import faqsI18nData from '@/data/faqs-i18n.json';
import { HelpCircle, MessageCircle, ArrowRight, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useMemo, useEffect, useRef } from 'react';

const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

const renderFaqAnswer = (text: string) => {
  const paragraphs = text.split('\n\n');
  return paragraphs.map((paragraph, pIdx) => {
    const parts = paragraph.split(/(\*\*[^*]+\*\*)/);
    const rendered = parts.map((part, i) => {
      const boldMatch = part.match(/^\*\*(.+)\*\*$/);
      if (boldMatch) {
        return (
          <strong key={i} className="text-foreground font-semibold">
            {boldMatch[1]}
          </strong>
        );
      }
      return part;
    });
    return (
      <p key={pIdx} className="text-muted-foreground text-sm leading-relaxed">
        {rendered}
      </p>
    );
  });
};

export const FAQSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const locale = useLocale() as 'en' | 'vi' | 'ko' | 'ja' | 'zh';
  const t = useTranslations('faq');

  const faqReveal = useScrollReveal();

  const faqsData = useMemo(
    () =>
      faqsI18nData.map(faq => ({
        id: faq.id,
        question: faq.question[locale] || faq.question.en,
        answer: faq.answer[locale] || faq.answer.en,
        category: faq.category,
      })),
    [locale],
  );

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return faqsData;
    const query = searchQuery.toLowerCase();
    return faqsData.filter(
      faq =>
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query),
    );
  }, [searchQuery, faqsData]);

  return (
    <section className="px-6 py-24 md:py-32">
      <div
        ref={faqReveal.ref}
        className={`mx-auto w-full max-w-3xl transition-all duration-700 ${
          faqReveal.isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        <div className="mb-14 text-center">
          <div className="from-accent/15 to-accent/5 mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
            <HelpCircle className="text-accent h-5 w-5" />
          </div>
          <h2 className="text-foreground mb-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {t('title')}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-pretty text-lg">{t('subtitle')}</p>
        </div>

        <div className="mb-8">
          <div className="relative mx-auto max-w-xl">
            <Search className="text-muted-foreground absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-border bg-card focus-visible:ring-accent/20 focus-visible:border-accent/30 h-12 rounded-xl border pl-11 text-sm shadow-sm transition-all duration-200"
            />
          </div>
          {searchQuery && (
            <p className="text-muted-foreground mt-3 text-center text-sm">
              {t('found')} {filteredFaqs.length} {filteredFaqs.length === 1 ? t('question') : t('questions')}
            </p>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {filteredFaqs.map(faq => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="group/faq border-border bg-card hover:border-accent/25 data-[state=open]:border-accent/25 rounded-xl border px-6 py-5 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] data-[state=open]:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <AccordionTrigger className="py-0 text-left hover:no-underline">
                <div className="flex flex-1 items-start gap-3 pr-4">
                  <div className="from-accent/15 to-accent/5 text-accent mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold transition-all duration-300 group-hover/faq:scale-110 group-hover/faq:shadow-[0_0_8px_rgba(22,130,93,0.15)]">
                    Q
                  </div>
                  <span className="text-foreground text-base font-semibold">{faq.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-3">
                <div className="flex items-start gap-3 pl-10">
                  <div className="flex-1 space-y-2">{renderFaqAnswer(faq.answer)}</div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredFaqs.length === 0 && (
          <div className="py-12 text-center">
            <HelpCircle className="text-muted-foreground/30 mx-auto mb-4 h-12 w-12" />
            <h3 className="text-foreground mb-2 text-lg font-semibold">{t('noResults')}</h3>
            <p className="text-muted-foreground text-sm">{t('tryDifferent')}</p>
          </div>
        )}

        <div className="border-border bg-card card-hover-lift hover:border-accent/25 mt-10 rounded-xl border p-8 text-center">
          <div className="from-accent/15 to-accent/5 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
            <MessageCircle className="text-accent h-6 w-6" />
          </div>
          <h3 className="text-foreground mb-2 text-xl font-bold">{t('stillHaveQuestions')}</h3>
          <p className="text-muted-foreground mx-auto mb-6 max-w-md text-sm">{t('checkDocs')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="group/link bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(22,130,93,0.25)]">
              {t('viewDocs')}
              <ArrowRight className="arrow-hover-nudge h-4 w-4" />
            </button>
            <button
              type="button"
              className="group/link border-border bg-card text-foreground hover:border-accent/25 hover:bg-secondary/60 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5">
              {t('joinCommunity')}
              <ArrowRight className="arrow-hover-nudge h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
