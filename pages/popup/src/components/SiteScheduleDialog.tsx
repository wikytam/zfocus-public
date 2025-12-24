import { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { cn } from '../lib/utils';
import type { SiteSchedule } from '../types/focus';

interface SiteScheduleDialogProps {
  schedule: SiteSchedule;
  onSave: (schedule: SiteSchedule) => void;
  siteName: string;
  trigger?: React.ReactNode;
}

const DAYS = [
  { value: 0, label: 'CN', fullLabel: 'Chủ nhật' },
  { value: 1, label: 'T2', fullLabel: 'Thứ hai' },
  { value: 2, label: 'T3', fullLabel: 'Thứ ba' },
  { value: 3, label: 'T4', fullLabel: 'Thứ tư' },
  { value: 4, label: 'T5', fullLabel: 'Thứ năm' },
  { value: 5, label: 'T6', fullLabel: 'Thứ sáu' },
  { value: 6, label: 'T7', fullLabel: 'Thứ bảy' },
];

export function SiteScheduleDialog({ schedule, onSave, siteName, trigger }: SiteScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [localSchedule, setLocalSchedule] = useState<SiteSchedule>(schedule);

  useEffect(() => {
    setLocalSchedule(schedule);
  }, [schedule]);

  const toggleDay = (day: number) => {
    const newDays = localSchedule.workDays.includes(day)
      ? localSchedule.workDays.filter(d => d !== day)
      : [...localSchedule.workDays, day].sort();
    setLocalSchedule(prev => ({ ...prev, workDays: newDays }));
  };

  const handleSave = () => {
    onSave(localSchedule);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon-sm">
            <Settings2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings2 className="w-4 h-4 text-primary" />
            </div>
            Lịch làm việc
          </DialogTitle>
          <DialogDescription>Thiết lập thời gian chặn cho "{siteName}"</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Bắt đầu</Label>
              <Input
                id="startTime"
                type="time"
                value={localSchedule.startTime}
                onChange={e => setLocalSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                className="text-center"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Kết thúc</Label>
              <Input
                id="endTime"
                type="time"
                value={localSchedule.endTime}
                onChange={e => setLocalSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                className="text-center"
              />
            </div>
          </div>

          {/* Work Days */}
          <div className="space-y-3">
            <Label>Giờ tắt chặn</Label>
            <div className="flex gap-2">
              {DAYS.map(day => (
                <button
                  key={day.value}
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    'flex-1 py-2.5 px-1 rounded-lg text-sm font-medium transition-all duration-200',
                    localSchedule.workDays.includes(day.value)
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
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
            <div className="space-y-0.5">
              <Label htmlFor="allowOutside" className="cursor-pointer">
                Cho phép truy cập ngoài giờ
              </Label>
              <p className="text-xs text-muted-foreground">Không chặn trong ngày nghỉ và ngoài giờ làm</p>
            </div>
            <Switch
              id="allowOutside"
              checked={localSchedule.allowOutsideHours}
              onCheckedChange={checked => setLocalSchedule(prev => ({ ...prev, allowOutsideHours: checked }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>Lưu cài đặt</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

