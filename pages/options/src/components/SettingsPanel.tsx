import { useState, useRef } from 'react';
import { Moon, Sun, Monitor, Lock, Unlock, RefreshCw, Cloud, CloudOff, Bug, Download, Upload, FileDown, FileUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, Label, Button, cn } from '@extension/ui';
import type { FocusSettings } from '@extension/storage';
import { checkSyncStatus as checkSync, forcePushToCloud, forcePullFromCloud, clearAllData } from '../utils/settingsSync';
import { exportSettings as exportSettingsFile, parseImportFile } from '../utils/settingsExportImport';

interface SettingsPanelProps {
  settings: FocusSettings;
  onUpdate: (updates: Partial<FocusSettings>) => void;
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncInfo, setSyncInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState<string>('');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string }>({ type: null, message: '' });
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

  const handlePushToCloud = async () => {
    setSyncStatus('syncing');
    const result = await forcePushToCloud(settings);
    setSyncStatus(result.type);
    setSyncInfo(result.message);
  };

  const handlePullFromCloud = async () => {
    setSyncStatus('syncing');
    const result = await forcePullFromCloud();
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
            Đồng bộ dữ liệu (Chrome)
          </Label>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckSync}
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
              onClick={handlePushToCloud}
              disabled={syncStatus === 'syncing'}
            >
              <Upload className="w-4 h-4 mr-2" />
              Đẩy lên cloud
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePullFromCloud}
              disabled={syncStatus === 'syncing'}
            >
              <Download className="w-4 h-4 mr-2" />
              Tải từ cloud
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

        {/* Export/Import for Firefox & other browsers */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <FileDown className="w-4 h-4" />
            Sao lưu & Khôi phục (Firefox, Brave, ...)
          </Label>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Xuất file
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="w-4 h-4 mr-2" />
              Nhập file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
          {importStatus.type && (
            <div className={cn(
              'flex items-start gap-2 text-xs p-2 rounded-lg',
              importStatus.type === 'success' && 'bg-green-500/10 text-green-500',
              importStatus.type === 'error' && 'bg-red-500/10 text-red-500',
              importStatus.type === 'warning' && 'bg-yellow-500/10 text-yellow-500',
            )}>
              {importStatus.type === 'success' && <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {importStatus.type === 'error' && <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              {importStatus.type === 'warning' && <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span className="whitespace-pre-wrap">{importStatus.message}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Dùng để chuyển cài đặt giữa các trình duyệt khác nhau
          </p>
        </div>

        {/* Debug Section */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowDebug(!showDebug);
              if (!showDebug) handleCheckSync();
            }}
            className="text-muted-foreground"
          >
            <Bug className="w-4 h-4 mr-2" />
            {showDebug ? 'Ẩn Debug' : 'Hiện Debug'}
          </Button>
          
          {showDebug && (
            <div className="space-y-3">
              {/* Account & Timestamp Info */}
              <div className="p-3 bg-secondary/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tài khoản:</span>
                  <span className="font-mono text-foreground">{accountEmail || 'Chưa kiểm tra'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Lần kiểm tra cuối:</span>
                  <span className="font-mono text-foreground">{lastUpdate || 'Chưa kiểm tra'}</span>
                </div>
              </div>
              
              {/* Storage Data */}
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs font-mono text-muted-foreground mb-2">Storage Data:</p>
                <pre className="text-xs font-mono overflow-auto max-h-40 text-foreground">
                  {debugData || 'Click "Kiểm tra" để xem dữ liệu'}
                </pre>
              </div>
              
                <Button
                variant="destructive"
                size="sm"
                onClick={handleClearData}
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

