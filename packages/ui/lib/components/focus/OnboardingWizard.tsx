import { cn } from '../../utils';
import { ActivationCodeDialog } from '../premium/ActivationCodeDialog';
import { PremiumFeatureLock } from '../premium/PremiumFeatureLock';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { TagsInput } from '../ui/tags-input';
import { useI18n } from '@extension/i18n';
import { validateUrls } from '@extension/shared';
import {
  Globe,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  Sparkles,
  Bug,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import type { BlockedSite, UrlValidationError } from '@extension/shared';

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh_CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tieng Viet' },
];

interface OnboardingWizardProps {
  onComplete: (options?: { errorReportingEnabled?: boolean }) => void;
  onLanguageChange: (language: string) => void;
  onAddSite: (site: Omit<BlockedSite, 'id'>) => void;
  currentLanguage?: string;
  isPremium?: boolean;
  onActivatePremium?: (code: string) => Promise<boolean>;
}

export const OnboardingWizard = ({
  onComplete,
  onLanguageChange,
  onAddSite,
  currentLanguage,
  isPremium = false,
  onActivatePremium,
}: OnboardingWizardProps) => {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  // Step 1: Language
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (currentLanguage) return currentLanguage;
    // Detect from browser
    const browserLang = navigator.language.replace('-', '_');
    const found = LANGUAGES.find(l => browserLang.startsWith(l.code));
    return found?.code || 'en';
  });

  // Step 1: Error reporting consent (default off)
  const [errorReportingEnabled, setErrorReportingEnabled] = useState(false);

  // Step 2: Add Website Group
  const DAYS = [
    { value: 1, label: t('monday'), fullLabel: t('mondayFull') },
    { value: 2, label: t('tuesday'), fullLabel: t('tuesdayFull') },
    { value: 3, label: t('wednesday'), fullLabel: t('wednesdayFull') },
    { value: 4, label: t('thursday'), fullLabel: t('thursdayFull') },
    { value: 5, label: t('friday'), fullLabel: t('fridayFull') },
    { value: 6, label: t('saturday'), fullLabel: t('saturdayFull') },
    { value: 0, label: t('sunday'), fullLabel: t('sundayFull') },
  ];

  const TIME_INTERVALS = [
    { value: 10, label: t('tenMinutes') },
    { value: 20, label: t('twentyMinutes') },
    { value: 30, label: t('thirtyMinutes') },
    { value: 60, label: t('oneHour') },
  ];

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    urls: string[];
    exceptions: string[];
    keywords: string[];
    allowedMinutes: number | '';
    timeInterval: number;
    countOnlyActiveTab: boolean;
    action: 'close' | 'redirect';
    redirectUrl: string;
    activeDays: number[];
    startTime: string;
    endTime: string;
  }>({
    title: '',
    urls: [],
    exceptions: [],
    keywords: [],
    allowedMinutes: 5,
    timeInterval: 60,
    countOnlyActiveTab: true,
    action: 'redirect',
    redirectUrl: '',
    activeDays: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '17:00',
  });

  // Real-time URL validation
  const urlErrors: UrlValidationError[] = useMemo(() => {
    if (formData.urls.length === 0) return [];
    return validateUrls(formData.urls);
  }, [formData.urls]);

  // Check if form can be submitted
  const canSubmitGroup = useMemo(
    () => formData.title.trim() !== '' && formData.urls.length > 0 && urlErrors.length === 0,
    [formData.title, formData.urls.length, urlErrors.length],
  );

  // Apply language change when selected
  useEffect(() => {
    onLanguageChange(selectedLanguage);
  }, [selectedLanguage, onLanguageChange]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = () => {
    // Add the website group if form is valid
    if (canSubmitGroup) {
      onAddSite({
        title: formData.title,
        urls: formData.urls,
        exceptions: formData.exceptions.length > 0 ? formData.exceptions : undefined,
        keywords: formData.keywords.length > 0 ? formData.keywords : undefined,
        allowedMinutesPerHour: formData.allowedMinutes === '' ? 1 : Number(formData.allowedMinutes),
        countOnlyActiveTab: formData.countOnlyActiveTab,
        action: formData.action,
        redirectUrl: formData.redirectUrl || undefined,
        isActive: true,
        schedule: {
          startTime: formData.startTime,
          endTime: formData.endTime,
          workDays: formData.activeDays,
          allowOutsideHours: true,
        },
      });
    }
    onComplete({ errorReportingEnabled });
  };

  const handleSkip = () => {
    onComplete({ errorReportingEnabled });
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      activeDays: prev.activeDays.includes(day)
        ? prev.activeDays.filter(d => d !== day)
        : [...prev.activeDays, day].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)),
    }));
  };

  const getCurrentLanguageName = () => {
    const lang = LANGUAGES.find(l => selectedLanguage.startsWith(l.code));
    return lang?.nativeName || 'English';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="border-border/50 bg-background relative mx-4 flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden shadow-2xl">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-primary/10 absolute -right-20 -top-20 h-40 w-40 rounded-full blur-3xl" />
          <div className="bg-accent/10 absolute -bottom-20 -left-20 h-32 w-32 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
              <Sparkles className="text-primary h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t('onboardingWelcome')}</h2>
              <p className="text-muted-foreground text-sm">
                {t('onboardingStepOf', [String(step), String(totalSteps)])}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-all duration-300',
                  i < step ? 'bg-primary' : 'bg-muted',
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full py-6" enableBodyScroll>
            <div className="relative max-h-[70vh] space-y-4 px-6 py-6">
              {/* Step 1: Language Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
                      <Globe className="text-primary h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-semibold">{t('onboardingSelectLanguage')}</h3>
                    <p className="text-muted-foreground mt-2 text-sm">{t('onboardingSelectLanguageDesc')}</p>
                  </div>

                  <div className="space-y-3">
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue>{getCurrentLanguageName()}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(lang => (
                          <SelectItem key={lang.code} value={lang.code} className="py-3">
                            <div className="flex flex-col">
                              <span className="font-medium">{lang.nativeName}</span>
                              <span className="text-muted-foreground text-xs">{lang.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-center text-xs">{t('onboardingAutoDetected')}</p>
                  </div>

                  {/* Error Reporting Consent */}
                  <div className="border-border mt-6 space-y-3 border-t pt-6">
                    <div className="bg-secondary/30 border-border/50 rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="onboard-error-reporting"
                          checked={errorReportingEnabled}
                          onCheckedChange={checked => setErrorReportingEnabled(checked === true)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 space-y-1">
                          <Label htmlFor="onboard-error-reporting" className="cursor-pointer text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Bug className="h-4 w-4" />
                              {t('errorReportingLabel')}
                            </div>
                          </Label>
                          <p className="text-muted-foreground text-xs leading-relaxed">
                            {t('errorReportingOnboardingDesc')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Add Website Group */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">{t('onboardingAddFirstGroup')}</h3>
                    <p className="text-muted-foreground mt-2 text-sm">{t('onboardingAddFirstGroupDesc')}</p>
                  </div>

                  {/* Group Name */}
                  <div className="space-y-2">
                    <Label htmlFor="onboard-title">{t('groupName')}</Label>
                    <Input
                      id="onboard-title"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={t('groupNamePlaceholder')}
                    />
                  </div>

                  {/* URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="onboard-urls">{t('urlList')}</Label>
                    <TagsInput
                      value={formData.urls}
                      onChange={urls => setFormData(prev => ({ ...prev, urls }))}
                      placeholder="facebook.com, youtube.com, twitter.com"
                      className={urlErrors.length > 0 ? 'border-destructive' : ''}
                    />
                    {/* Inline validation errors */}
                    {urlErrors.length > 0 && (
                      <div className="space-y-1">
                        {urlErrors.map((error, idx) => (
                          <div key={idx} className="text-destructive flex items-center gap-1.5 text-xs">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            <span>
                              <span className="font-medium">"{error.url}"</span>: {error.message}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Time Allowed */}
                  <div className="space-y-2">
                    <Label>
                      {t('allowedTimeLabel')}{' '}
                      <Input
                        id="onboard-allowedMinutes"
                        type="number"
                        min={1}
                        value={formData.allowedMinutes}
                        onChange={e => {
                          const value = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            allowedMinutes: (value === '' ? '' : Math.max(1, parseInt(value) || 1)) as number | '',
                          }));
                        }}
                        className="mx-1 inline-flex w-16"
                      />{' '}
                      {t('minutes')} /{' '}
                      <Select
                        value={formData.timeInterval.toString()}
                        onValueChange={value => setFormData(prev => ({ ...prev, timeInterval: parseInt(value) }))}>
                        <SelectTrigger className="mx-1 inline-flex w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_INTERVALS.map(opt => (
                            <SelectItem key={`onboard-interval-${opt.value}`} value={opt.value.toString()}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Label>

                    {/* Count only active tab */}
                    <div className="bg-secondary/30 border-border/50 space-y-1.5 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="cursor-help" title={t('countOnlyActiveTabTooltip')}>
                            <Info className="text-muted-foreground h-4 w-4" />
                          </div>
                          <Label htmlFor="onboard-countOnlyActiveTab" className="cursor-pointer text-sm font-medium">
                            {t('countOnlyActiveTabLabel')}
                          </Label>
                        </div>
                        <Switch
                          id="onboard-countOnlyActiveTab"
                          checked={formData.countOnlyActiveTab}
                          onCheckedChange={checked => setFormData(prev => ({ ...prev, countOnlyActiveTab: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Schedule Section */}
                  <div className="border-border space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="text-primary h-4 w-4" />
                      {t('scheduleLabel')}
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="onboard-startTime">{t('startTime')}</Label>
                        <Input
                          id="onboard-startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                          className="text-center"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="onboard-endTime">{t('endTime')}</Label>
                        <Input
                          id="onboard-endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                          className="text-center"
                        />
                      </div>
                    </div>

                    {/* Work Days */}
                    <div className="space-y-2">
                      <Label>{t('applyBlockingDays')}</Label>
                      <div className="flex gap-1.5">
                        {DAYS.map(day => (
                          <button
                            key={`onboard-day-${day.value}`}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={cn(
                              'flex-1 rounded-lg px-1 py-2 text-xs font-medium transition-all duration-200',
                              formData.activeDays.includes(day.value)
                                ? 'gradient-primary text-primary-foreground shadow-md'
                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                            )}
                            title={day.fullLabel}>
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Advanced Options */}
                  <div className="border-border space-y-2 border-t pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
                      <HelpCircle className="h-4 w-4" />
                      {t('advancedOptionsToggle')}
                      {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showAdvanced && (
                      <div className="space-y-4">
                        {/* Exceptions - Premium Feature */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="onboard-exceptions" className="text-sm">
                              {t('exceptionsLabel')}
                            </Label>
                            {!isPremium && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowActivationDialog(true)}
                                className="text-primary hover:bg-primary/10 h-auto gap-1 px-2 py-1 text-xs">
                                <Sparkles className="h-3 w-3" />
                                {t('unlockPremium')}
                              </Button>
                            )}
                          </div>
                          <PremiumFeatureLock
                            isPremium={isPremium}
                            onActivate={onActivatePremium || (async () => false)}>
                            <TagsInput
                              value={formData.exceptions}
                              onChange={exceptions => setFormData(prev => ({ ...prev, exceptions }))}
                              placeholder="youtube.com/learn, facebook.com/help"
                            />
                          </PremiumFeatureLock>
                          <p className="text-muted-foreground text-xs">{t('exceptionsDescription')}</p>
                        </div>

                        {/* Keywords - Premium Feature */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="onboard-keywords" className="text-sm">
                              {t('keywordsInUrl')}
                            </Label>
                            {!isPremium && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowActivationDialog(true)}
                                className="text-primary hover:bg-primary/10 h-auto gap-1 px-2 py-1 text-xs">
                                <Sparkles className="h-3 w-3" />
                                {t('unlockPremium')}
                              </Button>
                            )}
                          </div>
                          <PremiumFeatureLock
                            isPremium={isPremium}
                            onActivate={onActivatePremium || (async () => false)}>
                            <TagsInput
                              value={formData.keywords}
                              onChange={keywords => setFormData(prev => ({ ...prev, keywords }))}
                              placeholder="game, video, entertainment"
                            />
                          </PremiumFeatureLock>
                          <p className="text-muted-foreground text-xs">{t('keywordsInUrlDesc')}</p>
                        </div>

                        {/* Activation Code Dialog */}
                        {onActivatePremium && (
                          <ActivationCodeDialog
                            open={showActivationDialog}
                            onOpenChange={setShowActivationDialog}
                            onActivate={onActivatePremium}
                          />
                        )}

                        {/* Action */}
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{t('actionWhenTimeUp')}</Label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, action: 'close' }))}
                              className={cn(
                                'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                                formData.action === 'close'
                                  ? 'gradient-primary text-primary-foreground shadow-sm'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                              )}>
                              {t('closeTab')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, action: 'redirect' }))}
                              className={cn(
                                'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                                formData.action === 'redirect'
                                  ? 'gradient-primary text-primary-foreground shadow-sm'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                              )}>
                              {t('redirect')}
                            </button>
                          </div>
                        </div>

                        {/* Redirect URL */}
                        {formData.action === 'redirect' && (
                          <div className="space-y-2">
                            <Label>{t('redirectUrlLabel')}</Label>
                            <Input
                              id="onboard-redirectUrl"
                              value={formData.redirectUrl}
                              onChange={e => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                              placeholder="https://notion.so"
                            />
                            <p className="text-muted-foreground text-xs">{t('redirectUrlDescription')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-between border-t px-6 py-4">
          <div>
            {step === 2 && (
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground">
                {t('onboardingSkip')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button variant="outline" size="sm" onClick={handleBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                {t('onboardingBack')}
              </Button>
            )}

            {step < totalSteps ? (
              <Button size="sm" onClick={handleNext}>
                {t('onboardingNext')}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={formData.urls.length > 0 && !canSubmitGroup}
                className={formData.urls.length > 0 && !canSubmitGroup ? 'cursor-not-allowed opacity-50' : ''}>
                <Check className="mr-1 h-4 w-4" />
                {t('onboardingFinish')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
