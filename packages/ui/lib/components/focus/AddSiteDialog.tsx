import { cn } from '../../utils';
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
import { validateAddSiteForm } from '@extension/shared';
import { Plus, Clock, HelpCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState } from 'react';
import type { BlockedSite, AddSiteFormData } from '@extension/shared';

interface AddSiteDialogProps {
  onAdd: (site: Omit<BlockedSite, 'id'>) => void;
}

export const AddSiteDialog = ({ onAdd }: AddSiteDialogProps) => {
  const { t } = useI18n();
  const { showToast, ToastContainer } = useToast();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
      const allUrls = validatedData.urls
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean);

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
      console.error('Form validation failed:', error);
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
                value={formData.urls}
                onChange={urls => setFormData(prev => ({ ...prev, urls }))}
                placeholder="facebook.com, youtube.com, twitter.com"
              />
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
                  {/* Exceptions */}
                  <div className="space-y-2">
                    <Label htmlFor="add-exceptions" className="text-sm">
                      {t('exceptionsLabel')}
                    </Label>
                    <TagsInput
                      value={formData.exceptions}
                      onChange={exceptions => setFormData(prev => ({ ...prev, exceptions }))}
                      placeholder="youtube.com/learn, facebook.com/help"
                    />
                    <p className="text-muted-foreground text-xs">{t('exceptionsDescription')}</p>
                  </div>

                  {/* Keywords */}
                  <div className="space-y-2">
                    <Label htmlFor="add-keywords" className="text-sm">
                      {t('keywordsInUrl')}
                    </Label>
                    <TagsInput
                      value={formData.keywords}
                      onChange={keywords => setFormData(prev => ({ ...prev, keywords }))}
                      placeholder="game, video, entertainment"
                    />
                    <p className="text-muted-foreground text-xs">{t('keywordsInUrlDesc')}</p>
                  </div>

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

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t('cancel')}
              </Button>
              <Button type="submit">{t('addGroup')}</Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
      <ToastContainer />
    </Dialog>
  );
};
