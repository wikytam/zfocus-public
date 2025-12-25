import { EditSiteDialog } from './EditSiteDialog';
import { cn } from '../../utils';
import { Card } from '../ui/card';
import { Switch } from '../ui/switch';
import { useI18n } from '@extension/i18n';
import { Globe, Clock } from 'lucide-react';
import type { BlockedSite } from '@extension/storage';

interface BlockedSiteItemProps {
  site: BlockedSite;
  onUpdate: (id: string, updates: Partial<BlockedSite>) => void;
  onRemove: (id: string) => void;
  delay?: number;
}

export const BlockedSiteItem = ({ site, onUpdate, onRemove, delay = 0 }: BlockedSiteItemProps) => {
  const { t } = useI18n();

  const handleEditSave = (updates: Partial<BlockedSite>) => {
    onUpdate(site.id, updates);
  };

  const handleDelete = () => {
    onRemove(site.id);
  };

  // Helper function to translate title if it's an i18n key
  const getDisplayTitle = (title: string) => {
    // Check if title is an i18n key (starts with seedGroup)
    if (title.startsWith('seedGroup')) {
      // Type assertion for i18n keys
      return t(title as 'seedGroupSocialMedia' | 'seedGroupEntertainment' | 'seedGroupForums');
    }
    return title;
  };

  return (
    <Card
      variant="glass"
      className={cn('animate-fade-in p-4 opacity-0 transition-all duration-300', !site.isActive && 'opacity-60')}
      style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-4">
        <div className="bg-secondary/50 rounded-lg p-2.5">
          <Globe className="text-muted-foreground h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="truncate font-semibold">{getDisplayTitle(site.title)}</h4>
            {site.isActive && (
              <span className="bg-success/10 text-success rounded-full px-2 py-0.5 text-xs font-medium">
                {t('blocking')}
              </span>
            )}
          </div>

          <p className="text-muted-foreground mb-2 truncate text-sm">
            {site.urls.slice(0, 3).join(', ')}
            {site.urls.length > 3 && ` +${site.urls.length - 3} ${t('more')}`}
          </p>

          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {site.allowedMinutesPerHour} {t('minutesPerHour')}
            </span>
            <span>{site.action === 'close' ? t('closeTab') : t('redirect')}</span>
            <span>
              {site.schedule.startTime} - {site.schedule.endTime}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={site.isActive} onCheckedChange={checked => onUpdate(site.id, { isActive: checked })} />
          <EditSiteDialog site={site} onSave={handleEditSave} onDelete={handleDelete} />
        </div>
      </div>
    </Card>
  );
};
