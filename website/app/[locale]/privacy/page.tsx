'use client';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { Link } from '@/i18n/navigation';
import { Shield, Database, Lock, Eye, Trash2, Mail, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function PrivacyPage() {
  const t = useTranslations('privacyPolicy');

  return (
    <>
      <Header />
      <main className="bg-background min-h-dvh">
        <div className="pt-16">
          <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-1.5 text-sm transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('backToHome')}
            </Link>

            <h1 className="text-foreground mb-3 text-3xl font-bold tracking-tight md:text-4xl">{t('title')}</h1>
            <p className="text-muted-foreground mb-10 text-sm">{t('lastUpdated')}</p>

            {/* Table of Contents */}
            <div className="bg-card border-border mb-10 rounded-lg border p-6">
              <p className="text-foreground mb-4 text-sm font-semibold">Nội dung chính:</p>
              <nav className="space-y-2">
                <a href="#single-purpose" className="text-accent hover:text-accent/80 block text-sm transition-colors">
                  1. {t('singlePurpose.title')}
                </a>
                <a href="#data-collection" className="text-accent hover:text-accent/80 block text-sm transition-colors">
                  2. {t('dataCollection.title')}
                </a>
                <a href="#data-storage" className="text-accent hover:text-accent/80 block text-sm transition-colors">
                  3. {t('dataStorage.title')}
                </a>
                <a href="#permissions" className="text-accent hover:text-accent/80 block text-sm transition-colors">
                  4. {t('permissions.title')}
                </a>
                <a href="#third-party" className="text-accent hover:text-accent/80 block text-sm transition-colors">
                  5. {t('thirdParty.title')}
                </a>
                <a href="#data-deletion" className="text-accent hover:text-accent/80 block text-sm transition-colors">
                  6. {t('dataDeletion.title')}
                </a>
                <a href="#changes" className="text-accent hover:text-accent/80 block text-sm transition-colors">
                  7. {t('changes.title')}
                </a>
                <a href="#contact" className="text-accent hover:text-accent/80 block text-sm transition-colors">
                  8. {t('contact.title')}
                </a>
              </nav>
            </div>

            {/* Single Purpose Declaration */}
            <div
              id="single-purpose"
              className="bg-accent/5 border-accent/30 mb-10 scroll-mt-24 rounded-lg border-l-4 px-5 py-4">
              <p className="text-accent text-sm font-semibold">{t('singlePurpose.title')}</p>
              <p className="text-foreground/80 mt-1 text-sm leading-relaxed">{t('singlePurpose.description')}</p>
            </div>

            {/* Data Collection */}
            <section id="data-collection" className="mb-10 scroll-mt-24">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Eye className="text-accent h-4 w-4" />
                </div>
                <h2 className="text-foreground text-xl font-semibold">{t('dataCollection.title')}</h2>
              </div>
              <p className="text-foreground mb-3 text-sm font-semibold">{t('dataCollection.noData')}</p>
              <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{t('dataCollection.description')}</p>
              <ul className="text-muted-foreground space-y-2 pl-1 text-sm">
                {(['noBrowsingHistory', 'noPersonalInfo', 'noAnalytics', 'noTracking', 'noDataSold'] as const).map(
                  key => (
                    <li key={key} className="flex items-start gap-2">
                      <span className="text-accent mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                      {t(`dataCollection.items.${key}`)}
                    </li>
                  ),
                )}
              </ul>
            </section>

            {/* Data Storage */}
            <section id="data-storage" className="mb-10 scroll-mt-24">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Database className="text-accent h-4 w-4" />
                </div>
                <h2 className="text-foreground text-xl font-semibold">{t('dataStorage.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{t('dataStorage.description')}</p>
              <div className="space-y-3">
                {(['settings', 'statistics', 'timerData'] as const).map(key => (
                  <div key={key} className="bg-card border-border rounded-lg border p-4">
                    <p className="text-foreground text-sm font-medium">{t(`dataStorage.items.${key}.title`)}</p>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {t(`dataStorage.items.${key}.description`)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{t('dataStorage.noServer')}</p>
            </section>

            {/* Permissions */}
            <section id="permissions" className="mb-10 scroll-mt-24">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Shield className="text-accent h-4 w-4" />
                </div>
                <h2 className="text-foreground text-xl font-semibold">{t('permissions.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{t('permissions.description')}</p>
              <div className="space-y-3">
                {(
                  [
                    'storage',
                    'tabs',
                    'alarms',
                    'scripting',
                    'webNavigation',
                    'notifications',
                    'idle',
                    'hostPermissions',
                  ] as const
                ).map(key => (
                  <div key={key} className="bg-card border-border rounded-lg border p-4">
                    <p className="text-foreground text-sm font-medium">
                      <code className="bg-secondary rounded px-1.5 py-0.5 font-mono text-xs">
                        {t(`permissions.items.${key}.name`)}
                      </code>
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {t(`permissions.items.${key}.reason`)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-4 text-sm leading-relaxed">{t('permissions.onlyForCore')}</p>
            </section>

            {/* Third-Party Services */}
            <section id="third-party" className="mb-10 scroll-mt-24">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Lock className="text-accent h-4 w-4" />
                </div>
                <h2 className="text-foreground text-xl font-semibold">{t('thirdParty.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-2 text-sm leading-relaxed">{t('thirdParty.noServices')}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">{t('thirdParty.errorMonitoring')}</p>
            </section>

            {/* Data Deletion */}
            <section id="data-deletion" className="mb-10 scroll-mt-24">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Trash2 className="text-accent h-4 w-4" />
                </div>
                <h2 className="text-foreground text-xl font-semibold">{t('dataDeletion.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{t('dataDeletion.description')}</p>
              <ol className="text-muted-foreground list-inside list-decimal space-y-1.5 text-sm">
                <li>{t('dataDeletion.steps.step1')}</li>
                <li>{t('dataDeletion.steps.step2')}</li>
                <li>{t('dataDeletion.steps.step3')}</li>
              </ol>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{t('dataDeletion.uninstall')}</p>
            </section>

            {/* Changes */}
            <section id="changes" className="mb-10 scroll-mt-24">
              <h2 className="text-foreground mb-3 text-xl font-semibold">{t('changes.title')}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{t('changes.description')}</p>
            </section>

            {/* Contact */}
            <section id="contact" className="mb-10 scroll-mt-24">
              <div className="mb-4 flex items-center gap-2.5">
                <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
                  <Mail className="text-accent h-4 w-4" />
                </div>
                <h2 className="text-foreground text-xl font-semibold">{t('contact.title')}</h2>
              </div>
              <p className="text-muted-foreground mb-3 text-sm leading-relaxed">{t('contact.description')}</p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Email: </span>
                  <a href="mailto:hvdtam@gmail.com" className="text-accent hover:underline">
                    hvdtam@gmail.com
                  </a>
                </p>
                {/* <p>
                  <span className="text-muted-foreground">GitHub: </span>
                  <a
                    href="https://github.com/wikytam/z-focus/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline">
                    {t('contact.openIssue')}
                  </a>
                </p> */}
              </div>
            </section>
          </div>
          <Footer />
        </div>
      </main>
    </>
  );
}
