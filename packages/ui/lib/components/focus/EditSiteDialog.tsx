import { useState, useEffect } from 'react';
import { Edit2, Trash2, Clock, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { cn } from '../../utils';
import type { BlockedSite } from '@extension/storage';

interface EditSiteDialogProps {
  site: BlockedSite;
  onSave: (updates: Partial<BlockedSite>) => void;
  onDelete?: () => void;
  trigger?: React.ReactNode;
}

const DAYS = [
  { value: 1, label: 'T2', fullLabel: 'Thứ hai' },
  { value: 2, label: 'T3', fullLabel: 'Thứ ba' },
  { value: 3, label: 'T4', fullLabel: 'Thứ tư' },
  { value: 4, label: 'T5', fullLabel: 'Thứ năm' },
  { value: 5, label: 'T6', fullLabel: 'Thứ sáu' },
  { value: 6, label: 'T7', fullLabel: 'Thứ bảy' },
  { value: 0, label: 'CN', fullLabel: 'Chủ nhật' },
];

const TIME_INTERVALS = [
  { value: 10, label: '10 phút' },
  { value: 20, label: '20 phút' },
  { value: 30, label: '30 phút' },
  { value: 60, label: '1 tiếng' },
];

export const EditSiteDialog = ({ site, onSave, onDelete, trigger }: EditSiteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editData, setEditData] = useState({
    title: site.title,
    urls: site.urls.join('\n'),
    allowedMinutes: site.allowedMinutesPerHour,
    timeInterval: 60,
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
      allowedMinutes: site.allowedMinutesPerHour,
      timeInterval: 60,
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

    onSave({
      title: editData.title,
      urls: allUrls,
      allowedMinutesPerHour: Math.max(5, editData.allowedMinutes),
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
            <Edit2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-primary" />
            </div>
            Chỉnh sửa website
          </DialogTitle>
          <DialogDescription className="sr-only">Chỉnh sửa cài đặt cho nhóm website</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tên nhóm</Label>
            <Input
              id="title"
              value={editData.title}
              onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Tên nhóm"
            />
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="urls">Danh sách URL</Label>
            <Textarea
              id="urls"
              value={editData.urls}
              onChange={e => setEditData(prev => ({ ...prev, urls: e.target.value }))}
              placeholder="facebook.com&#10;*.youtube.com&#10;+exception.com"
              rows={4}
              className="font-mono text-sm"
            />
            
            {/* Expandable Help */}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              <HelpCircle className="w-3 h-3" />
              Xem cú pháp hỗ trợ
              {showHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {showHelp && (
              <div className="p-3 rounded-lg bg-secondary/50 text-[11px] space-y-2">
                <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                  <code className="px-1 py-0.5 bg-background rounded font-mono">*</code>
                  <span className="text-muted-foreground">Wildcard: <code className="text-foreground">*.youtube.com</code> = tất cả subdomain</span>
                  
                  <code className="px-1 py-0.5 bg-background rounded font-mono">**</code>
                  <span className="text-muted-foreground">Double wildcard: <code className="text-foreground">youtube.com/**</code> = tất cả path</span>
                  
                  <code className="px-1 py-0.5 bg-background rounded font-mono">+</code>
                  <span className="text-muted-foreground">Ngoại lệ: <code className="text-foreground">+youtube.com/learn</code> = cho phép</span>
                  
                  <code className="px-1 py-0.5 bg-background rounded font-mono">&gt;</code>
                  <span className="text-muted-foreground">Referrer: <code className="text-foreground">&gt;facebook.com</code> = chặn từ nguồn</span>
                  
                  <code className="px-1 py-0.5 bg-background rounded font-mono">~</code>
                  <span className="text-muted-foreground">Từ khóa: <code className="text-foreground">~game</code> = chặn URL chứa "game"</span>
                </div>
              </div>
            )}
          </div>

          {/* Time Allowed with Interval */}
          <div className="space-y-2">
            <Label>Thời gian cho phép</Label>
            <div className="flex items-center gap-2">
              <Input
                id="allowedMinutes"
                type="number"
                min={5}
                value={editData.allowedMinutes}
                onChange={e =>
                  setEditData(prev => ({
                    ...prev,
                    allowedMinutes: Math.max(5, parseInt(e.target.value) || 5),
                  }))
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">phút mỗi</span>
              <Select
                value={editData.timeInterval.toString()}
                onValueChange={(value) => setEditData(prev => ({ ...prev, timeInterval: parseInt(value) }))}
              >
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
          </div>

          {/* Action - Segmented Control */}
          <div className="space-y-2">
            <Label>Hành động khi hết thời gian</Label>
            <div className="flex p-1 rounded-lg bg-secondary/50">
              <button
                type="button"
                onClick={() => setEditData(prev => ({ ...prev, action: 'close' }))}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                  editData.action === 'close'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Đóng tab
              </button>
              <button
                type="button"
                onClick={() => setEditData(prev => ({ ...prev, action: 'redirect' }))}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                  editData.action === 'redirect'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Chuyển hướng
              </button>
            </div>
          </div>

          {/* Redirect URL - Segmented Control */}
          {editData.action === 'redirect' && (
            <div className="space-y-2">
              <Label>URL chuyển hướng</Label>
              <div className="flex p-1 rounded-lg bg-secondary/50">
                <button
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, redirectUrl: '' }))}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                    editData.redirectUrl === ''
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, redirectUrl: prev.redirectUrl || 'https://notion.so' }))}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                    editData.redirectUrl !== ''
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Tùy chỉnh
                </button>
              </div>
              {editData.redirectUrl !== '' && (
                <Input
                  id="redirectUrl"
                  value={editData.redirectUrl}
                  onChange={e => setEditData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                  placeholder="https://notion.so"
                />
              )}
            </div>
          )}

          {/* Schedule Section */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="w-4 h-4 text-primary" />
              Lịch chặn
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Bắt đầu</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={editData.startTime}
                  onChange={e => setEditData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Kết thúc</Label>
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
              <Label>Áp dụng chặn theo ngày</Label>
              <div className="flex gap-1.5">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      'flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200',
                      editData.activeDays.includes(day.value)
                        ? 'gradient-primary text-primary-foreground shadow-md'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                    )}
                    title={day.fullLabel}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons - Inline */}
        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Xóa
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button size="sm" onClick={handleSave}>
            Lưu thay đổi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
