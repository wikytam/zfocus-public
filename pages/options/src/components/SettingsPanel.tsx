import { useState } from 'react';
import { Moon, Sun, Monitor, Lock, Unlock, RefreshCw, Cloud, CloudOff, Bug } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, Label, Button, cn } from '@extension/ui';
import type { FocusSettings } from '@extension/storage';

interface SettingsPanelProps {
  settings: FocusSettings;
  onUpdate: (updates: Partial<FocusSettings>) => void;
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncInfo, setSyncInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<string>('');

  const checkSyncStatus = async () => {
    setSyncStatus('syncing');
    try {
      // Check chrome.storage.sync
      const syncData = await chrome.storage.sync.get(null);
      const bytesUsed = await chrome.storage.sync.getBytesInUse(null);
      const maxBytes = chrome.storage.sync.QUOTA_BYTES; // 102,400 bytes
      
      setSyncInfo(`Đã sử dụng: ${(bytesUsed / 1024).toFixed(2)} KB / ${(maxBytes / 1024).toFixed(0)} KB`);
      setDebugData(JSON.stringify(syncData, null, 2));
      setSyncStatus('success');
    } catch (error) {
      setSyncStatus('error');
      setSyncInfo(`Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const forceSyncNow = async () => {
    setSyncStatus('syncing');
    try {
      // Re-save current settings to trigger sync
      await chrome.storage.sync.set({ 'focus-settings': settings });
      setSyncStatus('success');
      setSyncInfo('Đã đồng bộ thành công!');
    } catch (error) {
      setSyncStatus('error');
      setSyncInfo(`Lỗi đồng bộ: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearAllData = async () => {
    if (confirm('Xóa tất cả dữ liệu? Hành động này không thể hoàn tác!')) {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      window.location.reload();
    }
  };
  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Sáng' },
    { value: 'dark' as const, icon: Moon, label: 'Tối' },
    { value: 'system' as const, icon: Monitor, label: 'Hệ thống' },
  ];

  return (
    <Card variant="glass" className="opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <svg
              className="w-4 h-4 text-secondary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
                  'flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-200',
                  settings.theme === theme.value
                    ? 'gradient-primary text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                )}
              >
                <theme.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hard Lock Mode */}
        <div
          className={cn(
            'flex items-center justify-between p-4 rounded-lg transition-all duration-200',
            settings.hardLockMode ? 'bg-destructive/10 border border-destructive/20' : 'bg-secondary/50',
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', settings.hardLockMode ? 'bg-destructive/20' : 'bg-secondary')}>
              {settings.hardLockMode ? (
                <Lock className="w-5 h-5 text-destructive" />
              ) : (
                <Unlock className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <Label htmlFor="hardLock" className="cursor-pointer">
                Chế độ khóa cứng
              </Label>
              <p className="text-xs text-muted-foreground">Không thể tạm dừng trong giờ làm</p>
            </div>
          </div>
          <Switch
            id="hardLock"
            checked={settings.hardLockMode}
            onCheckedChange={checked => onUpdate({ hardLockMode: checked })}
          />
        </div>

        {/* Sync Status */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Cloud className="w-4 h-4" />
            Đồng bộ dữ liệu
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkSyncStatus}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : syncStatus === 'success' ? (
                <Cloud className="w-4 h-4 mr-2 text-green-500" />
              ) : syncStatus === 'error' ? (
                <CloudOff className="w-4 h-4 mr-2 text-red-500" />
              ) : (
                <Cloud className="w-4 h-4 mr-2" />
              )}
              Kiểm tra
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={forceSyncNow}
              disabled={syncStatus === 'syncing'}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Đồng bộ ngay
            </Button>
          </div>
          {syncInfo && (
            <p className={cn(
              'text-xs',
              syncStatus === 'error' ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {syncInfo}
            </p>
          )}
        </div>

        {/* Debug Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowDebug(!showDebug);
              if (!showDebug) checkSyncStatus();
            }}
            className="text-muted-foreground"
          >
            <Bug className="w-4 h-4 mr-2" />
            {showDebug ? 'Ẩn Debug' : 'Hiện Debug'}
          </Button>
          
          {showDebug && (
            <div className="space-y-2">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs font-mono text-muted-foreground mb-2">Storage Data:</p>
                <pre className="text-xs font-mono overflow-auto max-h-40 text-foreground">
                  {debugData || 'Click "Kiểm tra" để xem dữ liệu'}
                </pre>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearAllData}
              >
                Xóa tất cả dữ liệu
              </Button>
            </div>
          )}
        </div>

        {/* Extension Info */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Phiên bản</span>
            <span className="font-mono">1.0.0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

