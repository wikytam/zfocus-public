import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, Label, cn } from '@extension/ui';
import { Moon, Sun, Monitor, Lock, Unlock } from 'lucide-react';
import type { FocusSettings } from '@extension/storage';

interface SettingsPanelProps {
  settings: FocusSettings;
  onUpdate: (updates: Partial<FocusSettings>) => void;
}

export const SettingsPanel = ({ settings, onUpdate }: SettingsPanelProps) => {
  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Sáng' },
    { value: 'dark' as const, icon: Moon, label: 'Tối' },
    { value: 'system' as const, icon: Monitor, label: 'Hệ thống' },
  ];

  return (
    <Card variant="glass" className="animate-fade-in opacity-0" style={{ animationDelay: '300ms' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-secondary flex h-8 w-8 items-center justify-center rounded-lg">
            <svg className="text-secondary-foreground h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          Cài đặt nâng cao
        </CardTitle>
        <CardDescription>Tùy chỉnh giao diện và chế độ bảo vệ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label>Giao diện</Label>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(theme => (
              <button
                key={theme.value}
                onClick={() => onUpdate({ theme: theme.value })}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg p-4 transition-all duration-200',
                  settings.theme === theme.value
                    ? 'gradient-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                )}>
                <theme.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hard Lock Mode */}
        <div
          className={cn(
            'flex items-center justify-between rounded-lg p-4 transition-all duration-200',
            settings.hardLockMode ? 'bg-destructive/10 border-destructive/20 border' : 'bg-secondary/50',
          )}>
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg p-2', settings.hardLockMode ? 'bg-destructive/20' : 'bg-secondary')}>
              {settings.hardLockMode ? (
                <Lock className="text-destructive h-5 w-5" />
              ) : (
                <Unlock className="text-muted-foreground h-5 w-5" />
              )}
            </div>
            <div>
              <Label htmlFor="hardLock" className="cursor-pointer">
                Chế độ khóa cứng
              </Label>
              <p className="text-muted-foreground text-xs">Không thể tạm dừng trong giờ làm</p>
            </div>
          </div>
          <Switch
            id="hardLock"
            checked={settings.hardLockMode}
            onCheckedChange={checked => onUpdate({ hardLockMode: checked })}
          />
        </div>

        {/* Extension Info */}
        <div className="border-border border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Phiên bản</span>
            <span className="font-mono">1.0.0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
