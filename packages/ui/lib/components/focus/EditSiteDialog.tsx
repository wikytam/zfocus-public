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
import { validateEditSiteForm, normalizeUrlPattern, normalizeUrlPatterns, KEYWORD_MIN_LENGTH } from '@extension/shared';
import { Edit2, Trash2, Clock, HelpCircle, ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { BlockedSite, EditSiteFormData } from '@extension/shared';
import type React from 'react';

interface EditSiteDialogProps {
  site: BlockedSite;
  onSave: (updates: Partial<BlockedSite>) => void;
  onDelete?: () => void;
  trigger?: React.ReactNode;
  isPremium?: boolean;
  onActivatePremium?: (code: string) => Promise<boolean>;
}

export const EditSiteDialog = ({
  site,
  onSave,
  onDelete,
  trigger,
  isPremium = false,
  onActivatePremium,
}: EditSiteDialogProps) => {
  const { t } = useI18n();
  const { showToast, ToastContainer } = useToast();

  // Helper to translate title if it's an i18n key
  const getDisplayTitle = useCallback(
    (title: string) => {
      if (title.startsWith('seedGroup')) {
        // Type assertion for i18n keys
        return t(title as 'seedGroupSocialMedia' | 'seedGroupEntertainment' | 'seedGroupForums');
      }
      return title;
    },
    [t],
  );

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

  // Track if title was modified by user
  const [isTitleModified, setIsTitleModified] = useState(false);
  const originalI18nKey = site.title.startsWith('seedGroup') ? site.title : null;

  const [editData, setEditData] = useState<{
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
    title: getDisplayTitle(site.title),
    urls: Array.isArray(site.urls) ? site.urls : [],
    exceptions: site.exceptions && Array.isArray(site.exceptions) ? site.exceptions : [],
    keywords: site.keywords && Array.isArray(site.keywords) ? site.keywords : [],
    allowedMinutes: site.allowedMinutesPerHour || 1,
    timeInterval: 60,
    countOnlyActiveTab: site.countOnlyActiveTab !== false, // Default to true if not set
    action: site.action || 'redirect',
    redirectUrl: site.redirectUrl || '',
    activeDays: site.schedule && Array.isArray(site.schedule.workDays) ? site.schedule.workDays : [1, 2, 3, 4, 5],
    startTime: (site.schedule && site.schedule.startTime) || '08:00',
    endTime: (site.schedule && site.schedule.endTime) || '17:00',
  });

  useEffect(() => {
    const newEditData = {
      title: getDisplayTitle(site.title),
      urls: Array.isArray(site.urls) ? site.urls : [],
      exceptions: site.exceptions && Array.isArray(site.exceptions) ? site.exceptions : [],
      keywords: site.keywords && Array.isArray(site.keywords) ? site.keywords : [],
      allowedMinutes: site.allowedMinutesPerHour || 1,
      timeInterval: 60,
      countOnlyActiveTab: site.countOnlyActiveTab !== false, // Default to true if not set
      action: site.action || 'redirect',
      redirectUrl: site.redirectUrl || '',
      activeDays: site.schedule && Array.isArray(site.schedule.workDays) ? site.schedule.workDays : [1, 2, 3, 4, 5],
      startTime: (site.schedule && site.schedule.startTime) || '08:00',
      endTime: (site.schedule && site.schedule.endTime) || '17:00',
    };

    setEditData(newEditData);

    // Auto-expand Advanced Options if any advanced field has data
    const hasAdvancedData =
      (newEditData.exceptions && newEditData.exceptions.length > 0) ||
      (newEditData.keywords && newEditData.keywords.length > 0) ||
      newEditData.action === 'redirect';

    setShowHelp(hasAdvancedData);
    setIsTitleModified(false); // Reset title modification tracking when dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id, open]);

  const handleSave = () => {
    try {
      // Prepare form data for validation (convert arrays to newline-separated strings)
      const formDataToValidate: EditSiteFormData = {
        title: editData.title,
        urls: editData.urls.join('\n'),
        exceptions: editData.exceptions.length > 0 ? editData.exceptions.join('\n') : undefined,
        keywords: editData.keywords.length > 0 ? editData.keywords.join('\n') : undefined,
        allowedMinutes: editData.allowedMinutes || undefined,
        countOnlyActiveTab: editData.countOnlyActiveTab,
        action: editData.action,
        redirectUrl: editData.redirectUrl || undefined,
        startTime: editData.startTime,
        endTime: editData.endTime,
        workDays: editData.activeDays,
        allowOutsideHours: true,
      };

      // Validate with Zod
      const validatedData = validateEditSiteForm(formDataToValidate);

      // Convert validated data to the format expected by onSave
      // Normalize URLs: strip protocol (https://) and www. prefix
      const allUrls = normalizeUrlPatterns(validatedData.urls.split('\n').filter(Boolean));

      const exceptions = (validatedData.exceptions || '')
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);

      const keywords = (validatedData.keywords || '')
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);

      // Determine final title: if user didn't modify and it was an i18n key, keep the key
      // Otherwise use the edited title
      let finalTitle = validatedData.title;
      if (!isTitleModified && originalI18nKey) {
        // User didn't modify title, keep original i18n key
        finalTitle = originalI18nKey;
      } else if (originalI18nKey && validatedData.title === getDisplayTitle(originalI18nKey)) {
        // User's current title matches the translated version of original key
        // Keep the i18n key
        finalTitle = originalI18nKey;
      }

      onSave({
        title: finalTitle,
        urls: allUrls,
        exceptions: exceptions.length > 0 ? exceptions : undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        allowedMinutesPerHour: validatedData.allowedMinutes || site.allowedMinutesPerHour,
        countOnlyActiveTab: validatedData.countOnlyActiveTab,
        action: validatedData.action,
        redirectUrl: validatedData.redirectUrl || undefined,
        schedule: {
          workDays: validatedData.workDays,
          startTime: validatedData.startTime,
          endTime: validatedData.endTime,
          allowOutsideHours: validatedData.allowOutsideHours,
        },
      });

      showToast({
        message: t('siteUpdated'),
        type: 'success',
        duration: 3000,
      });

      setOpen(false);
    } catch (error) {
      // Validation errors are expected user input errors, not application errors
      // Use debug level to avoid polluting Chrome Extension Errors tab
      if (process.env.NODE_ENV === 'development') {
        console.debug('[EditSite] Validation failed:', error);
      }
      showToast({
        message: t('validationError'),
        type: 'error',
        duration: 3000,
      });
      return;
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      setOpen(false);
    }
  };

  const toggleDay = (day: number) => {
    setEditData(prev => ({
      ...prev,
      activeDays: prev.activeDays.includes(day)
        ? prev.activeDays.filter(d => d !== day)
        : [...prev.activeDays, day].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon-sm">
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Edit2 className="text-primary h-4 w-4" />
            </div>
            {t('editWebsiteGroup')}
          </DialogTitle>
          <DialogDescription className="sr-only">{t('editWebsiteGroupDesc')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]" enableBodyScroll>
          <div className="space-y-4 px-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('groupName')}</Label>
              <Input
                id="title"
                value={editData.title}
                onChange={e => {
                  setEditData(prev => ({ ...prev, title: e.target.value }));
                  setIsTitleModified(true);
                }}
                placeholder={t('groupName')}
              />
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="edit-urls">{t('urlList')}</Label>
              <TagsInput
                id="edit-urls"
                value={editData.urls}
                onChange={urls => setEditData(prev => ({ ...prev, urls }))}
                onNormalize={normalizeUrlPattern}
                placeholder="facebook.com, youtube.com, twitter.com"
              />
            </div>

            {/* Time Allowed with Interval */}
            <div className="space-y-2">
              <Label>
                {t('allowedTimeLabel')}{' '}
                <Input
                  id="allowedMinutes"
                  type="number"
                  min={1}
                  value={editData.allowedMinutes}
                  onChange={e => {
                    const value = e.target.value;
                    setEditData(prev => ({
                      ...prev,
                      allowedMinutes: (value === '' ? '' : Math.max(1, parseInt(value) || 1)) as number | '',
                    }));
                  }}
                  onBlur={e => {
                    // Ensure value is at least 1 when focus is lost
                    if (e.target.value === '' || parseInt(e.target.value) < 1) {
                      setEditData(prev => ({
                        ...prev,
                        allowedMinutes: 1,
                      }));
                    }
                  }}
                  className="mx-1 inline-flex w-16"
                />{' '}
                {t('minutes')} /{' '}
                <Select
                  value={editData.timeInterval.toString()}
                  onValueChange={value => setEditData(prev => ({ ...prev, timeInterval: parseInt(value) }))}>
                  <SelectTrigger className="mx-1 inline-flex w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_INTERVALS.map(opt => (
                      <SelectItem key={`interval-${opt.value}`} value={opt.value.toString()}>
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
                    <Label htmlFor="edit-countOnlyActiveTab" className="cursor-pointer text-sm font-medium">
                      {t('countOnlyActiveTabLabel')}
                    </Label>
                  </div>
                  <Switch
                    id="edit-countOnlyActiveTab"
                    checked={editData.countOnlyActiveTab}
                    onCheckedChange={checked => setEditData(prev => ({ ...prev, countOnlyActiveTab: checked }))}
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
                  <Label htmlFor="startTime">{t('startTime')}</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={editData.startTime}
                    onChange={e => setEditData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="text-center"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">{t('endTime')}</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={editData.endTime}
                    onChange={e => setEditData(prev => ({ ...prev, endTime: e.target.value }))}
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
                      key={`day-${day.value}`}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        'flex-1 rounded-lg px-1 py-2 text-xs font-medium transition-all duration-200',
                        editData.activeDays.includes(day.value)
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
                      <Label htmlFor="edit-exceptions" className="text-sm">
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
                        id="edit-exceptions"
                        value={editData.exceptions}
                        onChange={exceptions => setEditData(prev => ({ ...prev, exceptions }))}
                        placeholder="youtube.com/learn, facebook.com/help"
                      />
                    </PremiumFeatureLock>
                    <p className="text-muted-foreground text-xs">{t('exceptionsDescription')}</p>
                  </div>

                  {/* Keywords - Premium Feature */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="edit-keywords" className="text-sm">
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
                        id="edit-keywords"
                        value={editData.keywords}
                        onChange={keywords => setEditData(prev => ({ ...prev, keywords }))}
                        placeholder="game, video, entertainment"
                        minLength={KEYWORD_MIN_LENGTH}
                        minLengthMessage={t('keywordMinLength')}
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
                        onClick={() => setEditData(prev => ({ ...prev, action: 'close' }))}
                        className={cn(
                          'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                          editData.action === 'close'
                            ? 'gradient-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                        )}>
                        {t('closeTab')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditData(prev => ({ ...prev, action: 'redirect' }))}
                        className={cn(
                          'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                          editData.action === 'redirect'
                            ? 'gradient-primary text-primary-foreground shadow-sm'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                        )}>
                        {t('redirect')}
                      </button>
                    </div>
                  </div>

                  {/* Redirect URL */}
                  {editData.action === 'redirect' && (
                    <div className="space-y-2">
                      <Label>{t('redirectUrlLabel')}</Label>
                      <Input
                        id="redirectUrl"
                        value={editData.redirectUrl}
                        onChange={e => setEditData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                        placeholder="https://notion.so"
                      />
                      <p className="text-muted-foreground text-xs">{t('redirectUrlDescription')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer Buttons - Inline */}
        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}>
              <Trash2 className="mr-1 h-4 w-4" />
              {t('delete')}
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button size="sm" onClick={handleSave}>
            {t('saveChanges')}
          </Button>
        </div>
      </DialogContent>
      <ToastContainer />
    </Dialog>
  );
};
