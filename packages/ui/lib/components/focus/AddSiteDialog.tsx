import { cn } from '../../utils';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Plus, Clock, HelpCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useState } from 'react';
import type { BlockedSite } from '@extension/storage';

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
  const [formData, setFormData] = useState<{
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
    title: '',
    urls: '',
    exceptions: '',
    referrers: '',
    keywords: '',
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

    const allUrls = formData.urls
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    const exceptions = formData.exceptions
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    const referrers = formData.referrers
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    const keywords = formData.keywords
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    onAdd({
      title: formData.title,
      urls: allUrls,
      exceptions: exceptions.length > 0 ? exceptions : undefined,
      referrers: referrers.length > 0 ? referrers : undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
      allowedMinutesPerHour: Math.max(5, typeof formData.allowedMinutes === 'number' ? formData.allowedMinutes : 5),
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

    setFormData({
      title: '',
      urls: '',
      exceptions: '',
      referrers: '',
      keywords: '',
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
          Thêm nhóm mới
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
              placeholder="facebook.com&#10;youtube.com&#10;twitter.com"
              rows={4}
              className="font-mono text-sm"
              required
            />
            <p className="text-muted-foreground text-xs">
              Nhập mỗi URL một dòng. Mặc định sẽ áp dụng cho tất cả subdomain và path.
            </p>

            {/* Expandable Advanced Options */}
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-primary flex items-center gap-1 text-[11px] hover:underline">
              <HelpCircle className="h-3 w-3" />
              Tùy chọn nâng cao
              {showHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showHelp && (
              <div className="bg-secondary/50 space-y-3 rounded-lg p-3 text-xs">
                <div className="space-y-2">
                  <Label htmlFor="add-exceptions" className="text-xs">
                    Ngoại lệ (cho phép)
                  </Label>
                  <Textarea
                    id="add-exceptions"
                    value={formData.exceptions}
                    onChange={e => setFormData(prev => ({ ...prev, exceptions: e.target.value }))}
                    placeholder="youtube.com/learn&#10;facebook.com/help"
                    rows={2}
                    className="font-mono text-xs"
                  />
                  <p className="text-muted-foreground text-[10px]">Các URL này sẽ được cho phép truy cập</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-referrer" className="text-xs">
                    Chặn từ nguồn (Referrer)
                  </Label>
                  <Textarea
                    id="add-referrer"
                    value={formData.referrers}
                    onChange={e => setFormData(prev => ({ ...prev, referrers: e.target.value }))}
                    placeholder="facebook.com&#10;twitter.com"
                    rows={2}
                    className="font-mono text-xs"
                  />
                  <p className="text-muted-foreground text-[10px]">Chặn các link được click từ các trang này</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-keywords" className="text-xs">
                    Từ khóa trong URL
                  </Label>
                  <Textarea
                    id="add-keywords"
                    value={formData.keywords}
                    onChange={e => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="game&#10;video&#10;entertainment"
                    rows={2}
                    className="font-mono text-xs"
                  />
                  <p className="text-muted-foreground text-[10px]">Chặn URL chứa các từ khóa này (mỗi từ một dòng)</p>
                </div>
              </div>
            )}
          </div>

          {/* Time Allowed with Interval */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Thời gian cho phép (phút)</Label>
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
                className="w-20"
              />
              <span className="text-muted-foreground text-sm">phút mỗi</span>
              <Select
                value={formData.timeInterval.toString()}
                onValueChange={value => setFormData(prev => ({ ...prev, timeInterval: parseInt(value) }))}>
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
                <div className="cursor-help" title="Ví dụ: nghe nhạc Youtube Background thì không tính vào">
                  <Info className="text-muted-foreground h-4 w-4" />
                </div>
                <Label htmlFor="add-countOnlyActiveTab" className="cursor-pointer text-sm font-medium">
                  Chỉ ghi nhận tab active
                </Label>
              </div>
              <Switch
                id="add-countOnlyActiveTab"
                checked={formData.countOnlyActiveTab}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, countOnlyActiveTab: checked }))}
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="border-border space-y-4 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="text-primary h-4 w-4" />
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
          {/* Action - Segmented Control */}
          <div className="space-y-2">
            <Label>Hành động khi hết thời gian</Label>
            <div className="bg-secondary/50 flex rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, action: 'close' }))}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
                  formData.action === 'close'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                Đóng tab
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, action: 'redirect' }))}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all',
                  formData.action === 'redirect'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                Chuyển hướng
              </button>
            </div>
          </div>

          {/* Redirect URL */}
          {formData.action === 'redirect' && (
            <div className="space-y-2">
              <Label>URL chuyển hướng</Label>
              <Input
                id="add-redirectUrl"
                value={formData.redirectUrl}
                onChange={e => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                placeholder="https://notion.so"
              />
              <p className="text-muted-foreground text-xs">Để trống sẽ chuyển đến trang popup của extension</p>
            </div>
          )}

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
