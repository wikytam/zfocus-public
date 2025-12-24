import { exportSettings as exportSettingsFile, parseImportFile } from '../utils/settingsExportImport';
import { checkSyncStatus as checkSync, autoSync, clearAllData } from '../utils/settingsSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, Label, Button, cn } from '@extension/ui';
import {
  Moon,
  Sun,
  Monitor,
  Lock,
  Unlock,
  RefreshCw,
  Cloud,
  Bug,
  FileDown,
  FileUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useState, useRef } from 'react';
import type { FocusSettings } from '@extension/storage';

interface SettingsPanelProps {
  settings: FocusSettings;
  onUpdate: (updates: Partial<FocusSettings>) => void;
}

export const SettingsPanel = ({ settings, onUpdate }: SettingsPanelProps) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncInfo, setSyncInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<string>('');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string }>({
    type: null,
    message: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync handlers
  const handleCheckSync = async () => {
    setSyncStatus('syncing');
    const result = await checkSync();
    setSyncStatus(result.type);
    setSyncInfo(result.message);
    if (result.accountEmail) setAccountEmail(result.accountEmail);
    if (result.lastUpdate) setLastUpdate(result.lastUpdate);
    if (result.debugData) setDebugData(result.debugData);
  };

  const handleAutoSync = async () => {
    setSyncStatus('syncing');
    const result = await autoSync(settings);
    setSyncStatus(result.type);
    setSyncInfo(result.message);
    if (result.success && result.settings) {
      onUpdate(result.settings);
      setTimeout(() => window.location.reload(), 500);
    }
  };

  const handleClearData = async () => {
    if (confirm('Xóa tất cả dữ liệu? Hành động này không thể hoàn tác!')) {
      await clearAllData();
      window.location.reload();
    }
  };

  // Export/Import handlers
  const handleExport = () => {
    const result = exportSettingsFile(settings);
    setImportStatus({ type: result.type, message: result.message });
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const result = await parseImportFile(file);
    setImportStatus({ type: result.type, message: result.message });

    if (result.success && result.normalized) {
      if (confirm(`Nhập ${result.normalized.blockedSites.length} website? Dữ liệu hiện tại sẽ bị ghi đè.`)) {
        onUpdate(result.normalized);
        setTimeout(() => window.location.reload(), 1000);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

        {/* Sync Status */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Đồng bộ (Chrome)
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoSync} disabled={syncStatus === 'syncing'}>
              {syncStatus === 'syncing' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Đồng bộ
            </Button>
          </div>
          {syncInfo && (
            <p className={cn('text-xs', syncStatus === 'error' ? 'text-red-500' : 'text-muted-foreground')}>
              {syncInfo}
            </p>
          )}
        </div>

        {/* Export/Import for Firefox & other browsers */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Sao lưu & Khôi phục (Edge, Firefox, Brave, ...)
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Xuất file
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-2 h-4 w-4" />
              Nhập file
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </div>
          {importStatus.type && (
            <div
              className={cn(
                'flex items-start gap-2 rounded-lg p-2 text-xs',
                importStatus.type === 'success' && 'bg-green-500/10 text-green-500',
                importStatus.type === 'error' && 'bg-red-500/10 text-red-500',
                importStatus.type === 'warning' && 'bg-yellow-500/10 text-yellow-500',
              )}>
              {importStatus.type === 'success' && <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
              {importStatus.type === 'error' && <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
              {importStatus.type === 'warning' && <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
              <span className="whitespace-pre-wrap">{importStatus.message}</span>
            </div>
          )}
          <p className="text-muted-foreground text-xs">Dùng để chuyển cài đặt giữa các trình duyệt khác nhau</p>
        </div>

        {/* Extension Info with Debug */}
        <div className="border-border space-y-3 border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Phiên bản</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowDebug(!showDebug);
                if (!showDebug) handleCheckSync();
              }}
              className="h-8 gap-2">
              <span className="font-mono">1.0.0</span>
              <Bug className="text-muted-foreground h-3.5 w-3.5" />
            </Button>
          </div>

          {showDebug && (
            <div className="animate-fade-in space-y-3">
              {/* Account & Timestamp Info */}
              <div className="bg-secondary/50 space-y-2 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tài khoản:</span>
                  <span className="text-foreground font-mono">{accountEmail || 'Chưa kiểm tra'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Lần kiểm tra cuối:</span>
                  <span className="text-foreground font-mono">{lastUpdate || 'Chưa kiểm tra'}</span>
                </div>
              </div>

              {/* Storage Data */}
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-muted-foreground mb-2 font-mono text-xs">Storage Data:</p>
                <pre className="text-foreground max-h-40 overflow-auto font-mono text-xs">
                  {debugData || 'Click vào "Phiên bản 1.0.0" để tải dữ liệu'}
                </pre>
              </div>

              <Button variant="destructive" size="sm" onClick={handleClearData}>
                Xóa tất cả dữ liệu
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
