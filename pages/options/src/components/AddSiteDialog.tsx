import { useState } from 'react';
import { Plus, Clock, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { cn } from '../lib/utils';
import type { BlockedSite } from '../types/focus';

interface AddSiteDialogProps {
  onAdd: (site: Omit<BlockedSite, 'id'>) => void;
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

export const AddSiteDialog = ({ onAdd }: AddSiteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    urls: '',
    allowedMinutes: 5,
    timeInterval: 60,
    action: 'redirect' as 'close' | 'redirect',
    redirectUrl: '',
    activeDays: [1, 2, 3, 4, 5],
    startTime: '08:00',
    endTime: '17:00',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allUrls = formData.urls
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    onAdd({
      title: formData.title,
      urls: allUrls,
      allowedMinutesPerHour: Math.max(5, formData.allowedMinutes),
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

    setFormData({
      title: '',
      urls: '',
      allowedMinutes: 5,
      timeInterval: 60,
      action: 'redirect',
      redirectUrl: '',
      activeDays: [1, 2, 3, 4, 5],
      startTime: '08:00',
      endTime: '17:00',
    });
    setShowHelp(false);
    setOpen(false);
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
          <Plus className="w-4 h-4" />
          Thêm nhóm mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm nhóm website chặn</DialogTitle>
          <DialogDescription>Tạo nhóm mới để quản lý các trang web gây xao nhãng</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="add-title">Tên nhóm</Label>
            <Input
              id="add-title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="VD: Mạng xã hội"
              required
            />
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <Label htmlFor="add-urls">Danh sách URL</Label>
            <Textarea
              id="add-urls"
              value={formData.urls}
              onChange={e => setFormData(prev => ({ ...prev, urls: e.target.value }))}
              placeholder="facebook.com&#10;*.youtube.com&#10;+exception.com"
              rows={4}
              className="font-mono text-sm"
              required
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
                id="add-allowedMinutes"
                type="number"
                min={5}
                value={formData.allowedMinutes}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    allowedMinutes: Math.max(5, parseInt(e.target.value) || 5),
                  }))
                }
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">phút mỗi</span>
              <Select
                value={formData.timeInterval.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, timeInterval: parseInt(value) }))}
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
                onClick={() => setFormData(prev => ({ ...prev, action: 'close' }))}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                  formData.action === 'close'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Đóng tab
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, action: 'redirect' }))}
                className={cn(
                  'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                  formData.action === 'redirect'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Chuyển hướng
              </button>
            </div>
          </div>

          {/* Redirect URL - Segmented Control */}
          {formData.action === 'redirect' && (
            <div className="space-y-2">
              <Label>URL chuyển hướng</Label>
              <div className="flex p-1 rounded-lg bg-secondary/50">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, redirectUrl: '' }))}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                    formData.redirectUrl === ''
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, redirectUrl: prev.redirectUrl || 'https://notion.so' }))}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                    formData.redirectUrl !== ''
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Tùy chỉnh
                </button>
              </div>
              {formData.redirectUrl !== '' && (
                <Input
                  id="add-redirectUrl"
                  value={formData.redirectUrl}
                  onChange={e => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
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
                <Label htmlFor="add-startTime">Bắt đầu</Label>
                <Input
                  id="add-startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-endTime">Kết thúc</Label>
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
              <Label>Áp dụng chặn theo ngày</Label>
              <div className="flex gap-1.5">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      'flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200',
                      formData.activeDays.includes(day.value)
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

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">Thêm nhóm</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
