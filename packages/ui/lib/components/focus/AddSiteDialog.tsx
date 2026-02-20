import { cn } from '../../utils';
import { ActivationCodeDialog } from '../premium/ActivationCodeDialog';
import { PremiumFeatureLock } from '../premium/PremiumFeatureLock';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { TagsInput } from '../ui/tags-input';
import { useToast } from '../ui/toast';
import { useI18n } from '@extension/i18n';
import { validateAddSiteForm, validateUrls, normalizeUrlPatterns } from '@extension/shared';
import { Plus, Clock, HelpCircle, ChevronDown, ChevronUp, Info, AlertCircle, Sparkles } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { BlockedSite, AddSiteFormData, UrlValidationError } from '@extension/shared';

interface AddSiteDialogProps {
  onAdd: (site: Omit<BlockedSite, 'id'>) => void;
  isPremium?: boolean;
  onActivatePremium?: (code: string) => Promise<boolean>;
}

export const AddSiteDialog = ({ onAdd, isPremium = false, onActivatePremium }: AddSiteDialogProps) => {
  const { t } = useI18n();
  const { showToast, ToastContainer } = useToast();

  // Debug log
  console.log('[ZFocus] AddSiteDialog: isPremium =', isPremium);

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
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    urls: string[];
    exceptions: string[];
    referrers: string[];
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
    referrers: [],
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
  const canSubmit = useMemo(
    () => formData.title.trim() !== '' && formData.urls.length > 0 && urlErrors.length === 0,
    [formData.title, formData.urls.length, urlErrors.length],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for validation errors before proceeding
    if (!canSubmit) {
      showToast({
        message: t('validationError'),
        type: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      // Parse and validate form data (convert arrays to newline-separated strings)
      const formDataToValidate: AddSiteFormData = {
        title: formData.title,
        urls: formData.urls.join('\n'),
        exceptions: formData.exceptions.length > 0 ? formData.exceptions.join('\n') : undefined,
        referrers: formData.referrers.length > 0 ? formData.referrers.join('\n') : undefined,
        keywords: formData.keywords.length > 0 ? formData.keywords.join('\n') : undefined,
        allowedMinutes: formData.allowedMinutes === '' ? 1 : Number(formData.allowedMinutes),
        countOnlyActiveTab: formData.countOnlyActiveTab,
        action: formData.action,
        redirectUrl: formData.redirectUrl || undefined,
        startTime: formData.startTime,
        endTime: formData.endTime,
        workDays: formData.activeDays,
        allowOutsideHours: true,
      };

      // Validate with Zod
      const validatedData = validateAddSiteForm(formDataToValidate);

      // Convert validated data to the format expected by onAdd
      // Normalize URLs: strip protocol (https://) and www. prefix
      const allUrls = normalizeUrlPatterns(validatedData.urls.split('\n').filter(Boolean));

      const exceptions = (validatedData.exceptions || '')
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);

      const referrers = (validatedData.referrers || '')
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);

      const keywords = (validatedData.keywords || '')
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);

      onAdd({
        title: validatedData.title,
        urls: allUrls,
        exceptions: exceptions.length > 0 ? exceptions : undefined,
        referrers: referrers.length > 0 ? referrers : undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        allowedMinutesPerHour: validatedData.allowedMinutes,
        countOnlyActiveTab: validatedData.countOnlyActiveTab,
        action: validatedData.action,
        redirectUrl: validatedData.redirectUrl || undefined,
        isActive: true,
        schedule: {
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          workDays: validatedData.workDays,
          allowOutsideHours: validatedData.allowOutsideHours,
        },
      });

      showToast({
        message: t('siteAdded'),
        type: 'success',
        duration: 3000,
      });

      setFormData({
        title: '',
        urls: [],
        exceptions: [],
        referrers: [],
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
      setShowHelp(false);
      setOpen(false);
    } catch (error) {
      // Validation errors are expected user input errors, not application errors
      // Use debug level to avoid polluting Chrome Extension Errors tab
      if (process.env.NODE_ENV === 'development') {
        console.debug('[AddSite] Validation failed:', error);
      }
      showToast({
        message: t('validationError'),
        type: 'error',
        duration: 3000,
      });
      return;
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      activeDays: prev.activeDays.includes(day)
        ? prev.activeDays.filter(d => d !== day)
        : [...prev.activeDays, day].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t('addNewGroup')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('addWebsiteGroup')}</DialogTitle>
          <DialogDescription>{t('addWebsiteGroupDesc')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]" enableBodyScroll>
          <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="add-title">{t('groupName')}</Label>
              <Input
                id="add-title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('groupNamePlaceholder')}
                required
              />
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="add-urls">{t('urlList')}</Label>
              <TagsInput
                id="add-urls"
                value={formData.urls}
                onChange={urls => setFormData(prev => ({ ...prev, urls }))}
                placeholder="facebook.com, youtube.com, twitter.com"
                className={urlErrors.length > 0 ? 'border-destructive' : ''}
              />
              {/* Inline validation errors for each URL */}
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

            {/* Time Allowed with Interval */}
            <div className="space-y-2">
              <Label>
                {t('allowedTimeLabel')}{' '}
                <Input
                  id="add-allowedMinutes"
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
                  onBlur={e => {
                    // Ensure value is at least 1 when focus is lost
                    if (e.target.value === '' || parseInt(e.target.value) < 1) {
                      setFormData(prev => ({
                        ...prev,
                        allowedMinutes: 1,
                      }));
                    }
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
                      <SelectItem key={`add-interval-${opt.value}`} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>

              {/* Count only active tab toggle */}
              <div className="bg-secondary/30 border-border/50 space-y-1.5 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="cursor-help" title={t('countOnlyActiveTabTooltip')}>
                      <Info className="text-muted-foreground h-4 w-4" />
                    </div>
                    <Label htmlFor="add-countOnlyActiveTab" className="cursor-pointer text-sm font-medium">
                      {t('countOnlyActiveTabLabel')}
                    </Label>
                  </div>
                  <Switch
                    id="add-countOnlyActiveTab"
                    checked={formData.countOnlyActiveTab}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, countOnlyActiveTab: checked }))}
                  />
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Example: Allow background music like YouTube
                </p>
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
                  <Label htmlFor="add-startTime">{t('startTime')}</Label>
                  <Input
                    id="add-startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-endTime">{t('endTime')}</Label>
                  <Input
                    id="add-endTime"
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
                      key={`add-day-${day.value}`}
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

            {/* Advanced Options - Moved to bottom */}
            <div className="border-border space-y-2 border-t pt-4">
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-primary flex items-center gap-1 text-sm font-medium hover:underline">
                <HelpCircle className="h-4 w-4" />
                {t('advancedOptionsToggle')}
                {showHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showHelp && (
                <div className="space-y-4">
                  {/* Exceptions - Premium Feature */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="add-exceptions" className="text-sm">
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
                    <PremiumFeatureLock isPremium={isPremium} onActivate={onActivatePremium || (async () => false)}>
                      <TagsInput
                        id="add-exceptions"
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
                      <Label htmlFor="add-keywords" className="text-sm">
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
                    <PremiumFeatureLock isPremium={isPremium} onActivate={onActivatePremium || (async () => false)}>
                      <TagsInput
                        id="add-keywords"
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

                  {/* Action - Inline */}
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
                        id="add-redirectUrl"
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
          </form>
        </ScrollArea>

        {/* Footer Buttons - Outside ScrollArea to always be visible */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={!canSubmit ? 'cursor-not-allowed opacity-50' : ''}>
            {t('addGroup')}
          </Button>
        </div>
      </DialogContent>
      <ToastContainer />
    </Dialog>
  );
};
