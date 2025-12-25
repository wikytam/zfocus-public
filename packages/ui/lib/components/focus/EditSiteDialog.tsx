import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { useI18n } from '@extension/i18n';
import { Edit2, Trash2, Clock, HelpCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { BlockedSite } from '@extension/storage';

interface EditSiteDialogProps {
  site: BlockedSite;
  onSave: (updates: Partial<BlockedSite>) => void;
  onDelete?: () => void;
  trigger?: React.ReactNode;
}

export const EditSiteDialog = ({ site, onSave, onDelete, trigger }: EditSiteDialogProps) => {
  const { t } = useI18n();

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
  const [editData, setEditData] = useState<{
    title: string;
    urls: string;
    exceptions: string;
    referrers: string;
    keywords: string;
    allowedMinutes: number | '';
    timeInterval: number;
    countOnlyActiveTab: boolean;
    action: 'close' | 'redirect';
    redirectUrl: string;
    activeDays: number[];
    startTime: string;
    endTime: string;
  }>({
    title: site.title,
    urls: site.urls.join('\n'),
    exceptions: (site.exceptions || []).join('\n'),
    referrers: (site.referrers || []).join('\n'),
    keywords: (site.keywords || []).join('\n'),
    allowedMinutes: site.allowedMinutesPerHour,
    timeInterval: 60,
    countOnlyActiveTab: site.countOnlyActiveTab !== false, // Default to true if not set
    action: site.action,
    redirectUrl: site.redirectUrl || '',
    activeDays: site.schedule?.workDays || [1, 2, 3, 4, 5],
    startTime: site.schedule?.startTime || '08:00',
    endTime: site.schedule?.endTime || '17:00',
  });

  useEffect(() => {
    setEditData({
      title: site.title,
      urls: site.urls.join('\n'),
      exceptions: (site.exceptions || []).join('\n'),
      referrers: (site.referrers || []).join('\n'),
      keywords: (site.keywords || []).join('\n'),
      allowedMinutes: site.allowedMinutesPerHour,
      timeInterval: 60,
      countOnlyActiveTab: site.countOnlyActiveTab !== false, // Default to true if not set
      action: site.action,
      redirectUrl: site.redirectUrl || '',
      activeDays: site.schedule?.workDays || [1, 2, 3, 4, 5],
      startTime: site.schedule?.startTime || '08:00',
      endTime: site.schedule?.endTime || '17:00',
    });
    setShowHelp(false);
  }, [site, open]);

  const handleSave = () => {
    const allUrls = editData.urls
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    const exceptions = editData.exceptions
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    const referrers = editData.referrers
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    const keywords = editData.keywords
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    onSave({
      title: editData.title,
      urls: allUrls,
      exceptions: exceptions.length > 0 ? exceptions : undefined,
      referrers: referrers.length > 0 ? referrers : undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
      allowedMinutesPerHour: Math.max(5, typeof editData.allowedMinutes === 'number' ? editData.allowedMinutes : 5),
      countOnlyActiveTab: editData.countOnlyActiveTab,
      action: editData.action,
      redirectUrl: editData.redirectUrl || undefined,
      schedule: {
        workDays: editData.activeDays,
        startTime: editData.startTime,
        endTime: editData.endTime,
        allowOutsideHours: true,
      },
    });
    setOpen(false);
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
      <DialogContent className="max-h-[90vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Edit2 className="text-primary h-4 w-4" />
            </div>
            {t('editWebsiteGroup')}
          </DialogTitle>
          <DialogDescription className="sr-only">{t('editWebsiteGroupDesc')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 px-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t('groupName')}</Label>
              <Input
                id="title"
                value={editData.title}
                onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={t('groupName')}
              />
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="urls">{t('urlList')}</Label>
              <Textarea
                id="urls"
                value={editData.urls}
                onChange={e => setEditData(prev => ({ ...prev, urls: e.target.value }))}
                placeholder="facebook.com&#10;youtube.com&#10;twitter.com"
                rows={4}
                className="font-mono text-sm"
              />
              <p className="text-muted-foreground text-xs">{t('urlListDescription')}</p>

              {/* Expandable Advanced Options */}
              <button
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="text-primary flex items-center gap-1 text-[11px] hover:underline">
                <HelpCircle className="h-3 w-3" />
                {t('advancedOptionsToggle')}
                {showHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showHelp && (
                <div className="bg-secondary/50 space-y-3 rounded-lg p-3 text-xs">
                  <div className="space-y-2">
                    <Label htmlFor="edit-exceptions" className="text-xs">
                      {t('exceptionsLabel')}
                    </Label>
                    <Textarea
                      id="edit-exceptions"
                      value={editData.exceptions}
                      onChange={e => setEditData(prev => ({ ...prev, exceptions: e.target.value }))}
                      placeholder="youtube.com/learn&#10;facebook.com/help"
                      rows={2}
                      className="font-mono text-xs"
                    />
                    <p className="text-muted-foreground text-[10px]">{t('exceptionsDescription')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-referrer" className="text-xs">
                      {t('blockFromReferrer')}
                    </Label>
                    <Textarea
                      id="edit-referrer"
                      value={editData.referrers}
                      onChange={e => setEditData(prev => ({ ...prev, referrers: e.target.value }))}
                      placeholder="facebook.com&#10;twitter.com"
                      rows={2}
                      className="font-mono text-xs"
                    />
                    <p className="text-muted-foreground text-[10px]">{t('blockFromReferrerDesc')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-keywords" className="text-xs">
                      {t('keywordsInUrl')}
                    </Label>
                    <Textarea
                      id="edit-keywords"
                      value={editData.keywords}
                      onChange={e => setEditData(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="game&#10;video&#10;entertainment"
                      rows={2}
                      className="font-mono text-xs"
                    />
                    <p className="text-muted-foreground text-[10px]">{t('keywordsInUrlDesc')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Time Allowed with Interval */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>{t('allowedTimeMinutes')}</Label>
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
                  className="w-20"
                />
                <span className="text-muted-foreground text-sm">{t('minutesPer')}</span>
                <Select
                  value={editData.timeInterval.toString()}
                  onValueChange={value => setEditData(prev => ({ ...prev, timeInterval: parseInt(value) }))}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_INTERVALS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Count only active tab toggle */}
              <div className="bg-secondary/30 border-border/50 flex items-center justify-between rounded-lg border p-3">
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
                      key={day.value}
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
            {/* Action - Segmented Control */}
            <div className="space-y-2">
              <Label>{t('actionWhenTimeUp')}</Label>
              <div className="bg-secondary/50 flex rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, action: 'close' }))}
                  className={cn(
                    'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
                    editData.action === 'close'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}>
                  {t('closeTab')}
                </button>
                <button
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, action: 'redirect' }))}
                  className={cn(
                    'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
                    editData.action === 'redirect'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
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
    </Dialog>
  );
};
