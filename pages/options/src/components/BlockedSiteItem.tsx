import { Globe, Clock, Trash2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { SiteScheduleDialog } from './SiteScheduleDialog';
import { EditSiteDialog } from './EditSiteDialog';
import { cn } from '../lib/utils';
import type { BlockedSite, SiteSchedule } from '../types/focus';

interface BlockedSiteItemProps {
  site: BlockedSite;
  onUpdate: (id: string, updates: Partial<BlockedSite>) => void;
  onRemove: (id: string) => void;
  delay?: number;
}

export function BlockedSiteItem({ site, onUpdate, onRemove, delay = 0 }: BlockedSiteItemProps) {
  const handleScheduleSave = (schedule: SiteSchedule) => {
    onUpdate(site.id, { schedule });
  };

  const handleEditSave = (updates: Partial<BlockedSite>) => {
    onUpdate(site.id, updates);
  };

  return (
    <Card
      variant="glass"
      className={cn('p-4 opacity-0 animate-fade-in transition-all duration-300', !site.isActive && 'opacity-60')}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-secondary/50">
          <Globe className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{site.title}</h4>
            {site.isActive && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-success/10 text-success">Đang chặn</span>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2 truncate">
            {site.urls.slice(0, 3).join(', ')}
            {site.urls.length > 3 && ` +${site.urls.length - 3} khác`}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {site.allowedMinutesPerHour} phút/giờ
            </span>
            <span>{site.action === 'close' ? 'Đóng tab' : 'Chuyển hướng'}</span>
            <span>
              {site.schedule.startTime} - {site.schedule.endTime}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={site.isActive} onCheckedChange={checked => onUpdate(site.id, { isActive: checked })} />
          <SiteScheduleDialog
            schedule={site.schedule}
            onSave={handleScheduleSave}
            siteName={site.title}
            trigger={
              <Button variant="ghost" size="icon-sm">
                <Clock className="w-4 h-4" />
              </Button>
            }
          />
          <EditSiteDialog site={site} onSave={handleEditSave} />
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onRemove(site.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

