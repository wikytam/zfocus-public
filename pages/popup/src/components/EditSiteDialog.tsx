import { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import type { BlockedSite } from '../types/focus';

interface EditSiteDialogProps {
  site: BlockedSite;
  onSave: (updates: Partial<BlockedSite>) => void;
  trigger?: React.ReactNode;
}

export function EditSiteDialog({ site, onSave, trigger }: EditSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState({
    title: site.title,
    urls: site.urls.join('\n'),
    allowedMinutesPerHour: site.allowedMinutesPerHour,
    action: site.action,
    redirectUrl: site.redirectUrl || '',
  });

  useEffect(() => {
    setEditData({
      title: site.title,
      urls: site.urls.join('\n'),
      allowedMinutesPerHour: site.allowedMinutesPerHour,
      action: site.action,
      redirectUrl: site.redirectUrl || '',
    });
  }, [site]);

  const handleSave = () => {
    onSave({
      title: editData.title,
      urls: editData.urls
        .split('\n')
        .map(u => u.trim())
        .filter(Boolean),
      allowedMinutesPerHour: editData.allowedMinutesPerHour,
      action: editData.action,
      redirectUrl: editData.redirectUrl || undefined,
    });
    setOpen(false);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Edit2 className="w-4 h-4 text-primary" />
            </div>
            Chỉnh sửa website
          </DialogTitle>
          <DialogDescription>Cập nhật thông tin cho "{site.title}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên nhóm</Label>
            <Input
              id="title"
              value={editData.title}
              onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Tên nhóm"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allowedMinutes">Thời gian cho phép/giờ</Label>
              <Input
                id="allowedMinutes"
                type="number"
                min={0}
                max={60}
                value={editData.allowedMinutesPerHour}
                onChange={e =>
                  setEditData(prev => ({
                    ...prev,
                    allowedMinutesPerHour: parseInt(e.target.value) || 0,
                  }))
                }
              />
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

          {editData.action === 'redirect' && (
            <div className="space-y-2">
              <Label htmlFor="redirectUrl">URL chuyển hướng</Label>
              <Input
                id="redirectUrl"
                value={editData.redirectUrl}
                onChange={e => setEditData(prev => ({ ...prev, redirectUrl: e.target.value }))}
                placeholder="Để trống = dashboard"
              />
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
}

