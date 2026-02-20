'use client';

import useCasesI18nData from '@/data/use-cases-i18n.json';
import {
  Users,
  GraduationCap,
  Briefcase,
  Code,
  BookOpen,
  Target,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Pen,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useMemo, useEffect, useRef } from 'react';

const iconMap: Record<string, typeof GraduationCap> = {
  GraduationCap,
  Briefcase,
  Code,
  Users,
  BookOpen,
  Target,
  Pen,
};

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

export const UseCasesSection = () => {
  const locale = useLocale() as 'en' | 'vi' | 'ko' | 'ja' | 'zh';
  const tUseCase = useTranslations('useCases');

  const useCaseReveal = useScrollReveal();

  const useCasesData = useMemo(
    () =>
      useCasesI18nData.map(useCase => ({
        id: useCase.id,
        icon: useCase.icon,
        title: useCase.title[locale] || useCase.title.en,
        scenario: useCase.scenario[locale] || useCase.scenario.en,
        problem: useCase.problem[locale] || useCase.problem.en,
        solution: useCase.solution[locale] || useCase.solution.en,
        results: useCase.results.map(result => result[locale] || result.en),
      })),
    [locale],
  );

  return (
    <section className="px-6 py-24 md:py-32">
      <div
        ref={useCaseReveal.ref}
        className={`mx-auto max-w-6xl transition-all delay-100 duration-700 ${
          useCaseReveal.isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
        <div className="mb-14 text-center">
          <div className="from-accent/15 to-accent/5 mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
            <Lightbulb className="text-accent h-5 w-5" />
          </div>
          <h2 className="text-foreground mb-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
            {tUseCase('title')}
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-pretty text-lg">{tUseCase('subtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {useCasesData.map(useCase => {
            const IconComponent = iconMap[useCase.icon] || Target;
            return (
              <div
                key={useCase.id}
                className="border-border bg-card card-hover-lift hover:border-accent/25 group relative flex flex-col overflow-hidden rounded-xl border p-6">
                <div
                  className="from-accent/[0.02] pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden="true"
                />

                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="from-accent/15 to-accent/5 icon-hover-glow flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
                      <IconComponent className="text-accent icon-hover-spin h-5 w-5" />
                    </div>
                    <h3 className="text-foreground text-lg font-semibold">{useCase.title}</h3>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="bg-accent/8 text-accent mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {tUseCase('scenario')}
                      </div>
                      <p className="text-foreground text-sm font-medium">{useCase.scenario}</p>
                    </div>

                    <div>
                      <div className="bg-destructive/8 text-destructive mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {tUseCase('problem')}
                      </div>
                      <p className="text-muted-foreground text-sm">{useCase.problem}</p>
                    </div>

                    <div>
                      <div className="bg-foreground/6 text-foreground mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {tUseCase('solution')}
                      </div>
                      <p className="text-muted-foreground text-sm">{useCase.solution}</p>
                    </div>

                    <div>
                      <div className="bg-accent/8 text-accent mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
                        {tUseCase('results')}
                      </div>
                      <ul className="space-y-2">
                        {useCase.results.map((result, idx) => (
                          <li key={idx} className="text-foreground flex items-center gap-2 text-sm">
                            <CheckCircle2 className="text-accent h-4 w-4 flex-shrink-0" />
                            <span>{result}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-foreground/10 bg-foreground mt-10 rounded-xl border p-10 text-center md:p-14">
          <h3 className="text-primary-foreground mb-4 text-balance text-2xl font-bold md:text-3xl">
            {tUseCase('whichFitsYou')}
          </h3>
          <p className="text-primary-foreground/60 mx-auto mb-8 max-w-2xl text-base">{tUseCase('whichFitsYouDesc')}</p>
          <button
            type="button"
            className="group/cta bg-accent text-accent-foreground hover:bg-accent/90 inline-flex items-center gap-2 rounded-full px-7 py-3 text-base font-semibold shadow-[0_2px_12px_rgba(22,130,93,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(22,130,93,0.4)]">
            {tUseCase('getStarted')}
            <ArrowRight className="arrow-hover-nudge h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
};
