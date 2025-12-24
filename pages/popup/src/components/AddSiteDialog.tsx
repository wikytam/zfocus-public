import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import type { BlockedSite } from '../types/focus';

interface AddSiteDialogProps {
  onAdd: (site: Omit<BlockedSite, 'id'>) => void;
}

export function AddSiteDialog({ onAdd }: AddSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    urls: string;
    allowedMinutesPerHour: number;
    action: 'close' | 'redirect';
    redirectUrl: string;
  }>({
    title: '',
    urls: '',
    allowedMinutesPerHour: 5,
    action: 'redirect',
    redirectUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onAdd({
      title: formData.title,
      urls: formData.urls
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean),
      allowedMinutesPerHour: formData.allowedMinutesPerHour,
      action: formData.action,
      redirectUrl: formData.redirectUrl || undefined,
      isActive: true,
      schedule: {
        startTime: '08:00',
        endTime: '17:00',
        workDays: [1, 2, 3, 4, 5],
        allowOutsideHours: true,
      },
    });

    setFormData({
      title: '',
      urls: '',
      allowedMinutesPerHour: 5,
      action: 'redirect',
      redirectUrl: '',
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm nhóm mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm nhóm website chặn</DialogTitle>
          <DialogDescription>Tạo nhóm mới để quản lý các trang web gây xao nhãng</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tên nhóm</label>
            <Input
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="VD: Mạng xã hội"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Danh sách URL</label>
            <Textarea
              value={formData.urls}
              onChange={e => setFormData(prev => ({ ...prev, urls: e.target.value }))}
              placeholder="facebook.com&#10;twitter.com&#10;instagram.com"
              rows={6}
              className="font-mono text-base min-h-[150px]"
              required
            />
            <p className="text-xs text-muted-foreground">Mỗi dòng một URL, chỉ cần nhập domain</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Thời gian cho phép</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={formData.allowedMinutesPerHour}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      allowedMinutesPerHour: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">phút/giờ</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hành động</label>
              <Select
                value={formData.action}
                onValueChange={(value: 'close' | 'redirect') => setFormData(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium">URL chuyển hướng</label>
              <Input
                value={formData.redirectUrl}
                onChange={e => setFormData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                placeholder="Để trống = quay về Dashboard"
              />
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
}

