import { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Globe } from 'lucide-react';
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

const WEBSITE_ICONS = [
  { id: 'tiktok', label: 'TikTok', icon: '🎵', pattern: 'tiktok.com' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', pattern: 'youtube.com' },
  { id: 'youtube-short', label: 'YouTube Shorts', icon: '📱', pattern: 'youtube.com/shorts' },
  { id: 'facebook', label: 'Facebook', icon: '📘', pattern: 'facebook.com' },
  { id: 'instagram', label: 'Instagram', icon: '📷', pattern: 'instagram.com' },
  { id: 'twitter', label: 'Twitter/X', icon: '🐦', pattern: 'twitter.com, x.com' },
  { id: 'reddit', label: 'Reddit', icon: '🤖', pattern: 'reddit.com' },
  { id: 'twitch', label: 'Twitch', icon: '🎮', pattern: 'twitch.tv' },
];

const DAYS = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
];

export const AddSiteDialog = ({ onAdd }: AddSiteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    urls: string;
    allowedMinutes: number;
    action: 'close' | 'redirect';
    redirectUrl: string;
    activeDays: number[];
    selectedIcons: string[];
  }>({
    title: '',
    urls: '',
    allowedMinutes: 5,
    action: 'redirect',
    redirectUrl: '',
    activeDays: [1, 2, 3, 4, 5],
    selectedIcons: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Combine URLs from selected icons and manual input
    let allUrls = formData.urls
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    // Add patterns from selected icons
    formData.selectedIcons.forEach(iconId => {
      const icon = WEBSITE_ICONS.find(i => i.id === iconId);
      if (icon) {
        const patterns = icon.pattern.split(', ').map(p => p.trim());
        patterns.forEach(p => {
          if (!allUrls.includes(p)) {
            allUrls.push(p);
          }
        });
      }
    });

    onAdd({
      title: formData.title,
      urls: allUrls,
      allowedMinutesPerHour: Math.max(5, formData.allowedMinutes),
      action: formData.action,
      redirectUrl: formData.redirectUrl || undefined,
      isActive: true,
      schedule: {
        startTime: '08:00',
        endTime: '17:00',
        workDays: formData.activeDays,
        allowOutsideHours: true,
      },
    });

    setFormData({
      title: '',
      urls: '',
      allowedMinutes: 5,
      action: 'redirect',
      redirectUrl: '',
      activeDays: [1, 2, 3, 4, 5],
      selectedIcons: [],
    });
    setOpen(false);
  };

  const toggleIcon = (iconId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedIcons: prev.selectedIcons.includes(iconId)
        ? prev.selectedIcons.filter(id => id !== iconId)
        : [...prev.selectedIcons, iconId],
    }));
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

          {/* Toggle Advanced Mode */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-between text-muted-foreground hover:text-foreground"
            onClick={() => setIsAdvanced(!isAdvanced)}
          >
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {isAdvanced ? 'Chế độ nâng cao' : 'Hiển thị nâng cao'}
            </span>
            {isAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>

          {!isAdvanced ? (
            /* Basic Mode */
            <div className="space-y-2">
              <Label htmlFor="add-urls">Danh sách URL</Label>
              <Textarea
                id="add-urls"
                value={formData.urls}
                onChange={e => setFormData(prev => ({ ...prev, urls: e.target.value }))}
                placeholder="facebook.com&#10;twitter.com&#10;instagram.com"
                rows={6}
                className="font-mono text-base min-h-[150px]"
                required={formData.selectedIcons.length === 0}
              />
              <p className="text-xs text-muted-foreground">Mỗi dòng một URL, chỉ cần nhập domain</p>
            </div>
          ) : (
            /* Advanced Mode */
            <div className="space-y-4">
              {/* Website Icon Selection */}
              <div className="space-y-2">
                <Label>Chọn theo website</Label>
                <div className="grid grid-cols-4 gap-2">
                  {WEBSITE_ICONS.map(icon => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => toggleIcon(icon.id)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-all duration-200 border',
                        formData.selectedIcons.includes(icon.id)
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary',
                      )}
                      title={icon.pattern}
                    >
                      <span className="text-lg">{icon.icon}</span>
                      <span className="truncate w-full text-center">{icon.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* URL Input with Wildcard Support */}
              <div className="space-y-2">
                <Label htmlFor="add-urls-advanced">Danh sách URL (nâng cao)</Label>
                <Textarea
                  id="add-urls-advanced"
                  value={formData.urls}
                  onChange={e => setFormData(prev => ({ ...prev, urls: e.target.value }))}
                  placeholder="facebook.com&#10;*.youtube.com&#10;+exception.com&#10;>referrer.com&#10;~keyword"
                  rows={4}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Hỗ trợ: <code className="px-1 py-0.5 bg-secondary rounded">*</code> hoặc{' '}
                  <code className="px-1 py-0.5 bg-secondary rounded">**</code> wildcard,{' '}
                  <code className="px-1 py-0.5 bg-secondary rounded">+</code> ngoại lệ,{' '}
                  <code className="px-1 py-0.5 bg-secondary rounded">&gt;</code> referrer,{' '}
                  <code className="px-1 py-0.5 bg-secondary rounded">~</code> từ khóa
                </p>
              </div>

              {/* Active Days */}
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
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-allowedMinutes">Thời gian cho phép (phút)</Label>
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
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">min: 5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-action">Hành động</Label>
              <Select
                value={formData.action}
                onValueChange={(value: 'close' | 'redirect') => setFormData(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger id="add-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="close">Đóng tab</SelectItem>
                  <SelectItem value="redirect">Chuyển hướng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.action === 'redirect' && (
            <div className="space-y-2">
              <Label htmlFor="add-redirectUrl">URL chuyển hướng</Label>
              <Select
                value={formData.redirectUrl === '' ? 'dashboard' : 'custom'}
                onValueChange={(value) => {
                  if (value === 'dashboard') {
                    setFormData(prev => ({ ...prev, redirectUrl: '' }));
                  } else {
                    setFormData(prev => ({ ...prev, redirectUrl: prev.redirectUrl || 'https://notion.so' }));
                  }
                }}
              >
                <SelectTrigger id="add-redirectUrl">
                  <SelectValue placeholder="Chọn đích chuyển hướng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard mặc định</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
              {formData.redirectUrl !== '' && (
                <Input
                  id="add-redirectUrl-custom"
                  value={formData.redirectUrl}
                  onChange={e => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                  placeholder="https://notion.so"
                />
              )}
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
