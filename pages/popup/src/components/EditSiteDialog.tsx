import { useState, useEffect } from 'react';
import { Edit2, ChevronDown, ChevronUp, Globe, Trash2, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { cn } from '../lib/utils';
import type { BlockedSite } from '../types/focus';

interface EditSiteDialogProps {
  site: BlockedSite;
  onSave: (updates: Partial<BlockedSite>) => void;
  onDelete?: () => void;
  trigger?: React.ReactNode;
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
  { value: 1, label: 'T2', fullLabel: 'Thứ hai' },
  { value: 2, label: 'T3', fullLabel: 'Thứ ba' },
  { value: 3, label: 'T4', fullLabel: 'Thứ tư' },
  { value: 4, label: 'T5', fullLabel: 'Thứ năm' },
  { value: 5, label: 'T6', fullLabel: 'Thứ sáu' },
  { value: 6, label: 'T7', fullLabel: 'Thứ bảy' },
  { value: 0, label: 'CN', fullLabel: 'Chủ nhật' },
];

export const EditSiteDialog = ({ site, onSave, onDelete, trigger }: EditSiteDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editData, setEditData] = useState({
    title: site.title,
    urls: site.urls.join('\n'),
    allowedMinutes: site.allowedMinutesPerHour,
    action: site.action,
    redirectUrl: site.redirectUrl || '',
    activeDays: site.schedule?.workDays || [1, 2, 3, 4, 5],
    startTime: site.schedule?.startTime || '08:00',
    endTime: site.schedule?.endTime || '17:00',
    allowOutsideHours: site.schedule?.allowOutsideHours ?? true,
    selectedIcons: [] as string[],
  });

  useEffect(() => {
    setEditData({
      title: site.title,
      urls: site.urls.join('\n'),
      allowedMinutes: site.allowedMinutesPerHour,
      action: site.action,
      redirectUrl: site.redirectUrl || '',
      activeDays: site.schedule?.workDays || [1, 2, 3, 4, 5],
      startTime: site.schedule?.startTime || '08:00',
      endTime: site.schedule?.endTime || '17:00',
      allowOutsideHours: site.schedule?.allowOutsideHours ?? true,
      selectedIcons: [],
    });
    setShowDeleteConfirm(false);
  }, [site, open]);

  const handleSave = () => {
    // Combine URLs from selected icons and manual input
    let allUrls = editData.urls
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    // Add patterns from selected icons
    editData.selectedIcons.forEach(iconId => {
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
        allowOutsideHours: editData.allowOutsideHours,
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

  const toggleIcon = (iconId: string) => {
    setEditData(prev => ({
      ...prev,
      selectedIcons: prev.selectedIcons.includes(iconId)
        ? prev.selectedIcons.filter(id => id !== iconId)
        : [...prev.selectedIcons, iconId],
    }));
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
            /* Basic Mode - URL Input Only */
            <div className="space-y-2">
              <Label htmlFor="urls">Danh sách URL</Label>
              <Textarea
                id="urls"
                value={editData.urls}
                onChange={e => setEditData(prev => ({ ...prev, urls: e.target.value }))}
                placeholder="Nhập URL (mỗi dòng một URL)"
                rows={4}
                className="font-mono text-sm"
              />
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
                        editData.selectedIcons.includes(icon.id)
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
                <Label htmlFor="urls-advanced">Danh sách URL (nâng cao)</Label>
                <Textarea
                  id="urls-advanced"
                  value={editData.urls}
                  onChange={e => setEditData(prev => ({ ...prev, urls: e.target.value }))}
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
            </div>
          )}

          {/* Time and Action */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allowedMinutes">Thời gian cho phép (phút)</Label>
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
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">min: 5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Hành động</Label>
              <Select
                value={editData.action}
                onValueChange={(value: 'close' | 'redirect') => setEditData(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="close">Đóng tab</SelectItem>
                  <SelectItem value="redirect">Chuyển hướng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Redirect URL */}
          {editData.action === 'redirect' && (
            <div className="space-y-2">
              <Label htmlFor="redirectUrl">URL chuyển hướng</Label>
              <Select
                value={editData.redirectUrl === '' ? 'dashboard' : 'custom'}
                onValueChange={(value) => {
                  if (value === 'dashboard') {
                    setEditData(prev => ({ ...prev, redirectUrl: '' }));
                  } else {
                    setEditData(prev => ({ ...prev, redirectUrl: prev.redirectUrl || 'https://notion.so' }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đích chuyển hướng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard mặc định</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Schedule Section - Merged from SiteScheduleDialog */}
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

            {/* Allow outside hours */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="space-y-0.5">
                <Label htmlFor="allowOutside" className="cursor-pointer text-sm">
                  Cho phép truy cập ngoài giờ
                </Label>
                <p className="text-[11px] text-muted-foreground">Không chặn trong ngày nghỉ và ngoài giờ làm</p>
              </div>
              <Switch
                id="allowOutside"
                checked={editData.allowOutsideHours}
                onCheckedChange={checked => setEditData(prev => ({ ...prev, allowOutsideHours: checked }))}
              />
            </div>
          </div>

          {/* Delete Section */}
          {onDelete && (
            <div className="pt-4 border-t border-border">
              {!showDeleteConfirm ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa nhóm này
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-center text-muted-foreground">
                    Bạn có chắc muốn xóa nhóm "{site.title}"?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={handleDelete}
                    >
                      Xác nhận xóa
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
