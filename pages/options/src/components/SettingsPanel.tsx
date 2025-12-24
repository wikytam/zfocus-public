import { useState, useRef } from 'react';
import { Moon, Sun, Monitor, Lock, Unlock, RefreshCw, Cloud, CloudOff, Bug, Download, Upload, FileDown, FileUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, Label, Button, cn } from '@extension/ui';
import type { FocusSettings, BlockedSite } from '@extension/storage';

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

  const checkSyncStatus = async () => {
    setSyncStatus('syncing');
    try {
      // Check chrome.storage.sync
      const syncData = await chrome.storage.sync.get(null);
      const bytesUsed = await chrome.storage.sync.getBytesInUse(null);
      const maxBytes = chrome.storage.sync.QUOTA_BYTES; // 102,400 bytes
      
      // Get Chrome account info
      try {
        const identity = await chrome.identity?.getProfileUserInfo({ accountStatus: 'ANY' as chrome.identity.AccountStatus });
        setAccountEmail(identity?.email || 'Chưa đăng nhập');
      } catch {
        setAccountEmail('Không thể lấy thông tin tài khoản');
      }
      
      // Set last update time
      setLastUpdate(new Date().toLocaleString('vi-VN'));
      
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

  const pullFromCloud = async () => {
    setSyncStatus('syncing');
    try {
      // Force reload data from sync storage
      const syncData = await chrome.storage.sync.get(['focus-settings']);
      if (syncData['focus-settings']) {
        // Update local state with cloud data
        onUpdate(syncData['focus-settings']);
        setSyncStatus('success');
        setSyncInfo('Đã tải dữ liệu từ cloud! Đang reload...');
        // Reload page to apply
        setTimeout(() => window.location.reload(), 500);
      } else {
        setSyncInfo('Không có dữ liệu trên cloud.');
        setSyncStatus('idle');
      }
    } catch (error) {
      setSyncStatus('error');
      setSyncInfo(`Lỗi tải: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearAllData = async () => {
    if (confirm('Xóa tất cả dữ liệu? Hành động này không thể hoàn tác!')) {
      await chrome.storage.sync.clear();
      await chrome.storage.local.clear();
      window.location.reload();
    }
  };

  // ===== VALIDATION FUNCTIONS =====
  const isValidUrl = (url: string): boolean => {
    // Basic URL pattern validation
    const urlPattern = /^[a-zA-Z0-9*+>~][a-zA-Z0-9.*+>~\-/_]*$/;
    return urlPattern.test(url.trim()) && url.trim().length > 0 && url.trim().length < 500;
  };

  const isValidTime = (time: string): boolean => {
    const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(time);
  };

  const isValidBlockedSite = (site: unknown): site is BlockedSite => {
    if (!site || typeof site !== 'object') return false;
    const s = site as Record<string, unknown>;
    
    // Required fields
    if (typeof s.id !== 'string' || s.id.length === 0 || s.id.length > 100) return false;
    if (typeof s.title !== 'string' || s.title.length === 0 || s.title.length > 200) return false;
    if (!Array.isArray(s.urls) || s.urls.length === 0 || s.urls.length > 100) return false;
    if (!s.urls.every((url: unknown) => typeof url === 'string' && isValidUrl(url))) return false;
    if (typeof s.allowedMinutesPerHour !== 'number' || s.allowedMinutesPerHour < 1 || s.allowedMinutesPerHour > 60) return false;
    if (s.action !== 'close' && s.action !== 'redirect') return false;
    if (typeof s.isActive !== 'boolean') return false;
    
    // Optional fields
    if (s.redirectUrl !== undefined && typeof s.redirectUrl !== 'string') return false;
    
    // Schedule validation
    if (!s.schedule || typeof s.schedule !== 'object') return false;
    const schedule = s.schedule as Record<string, unknown>;
    if (typeof schedule.startTime !== 'string' || !isValidTime(schedule.startTime)) return false;
    if (typeof schedule.endTime !== 'string' || !isValidTime(schedule.endTime)) return false;
    if (!Array.isArray(schedule.workDays) || !schedule.workDays.every((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6)) return false;
    if (typeof schedule.allowOutsideHours !== 'boolean') return false;
    
    return true;
  };

  const isValidSettings = (data: unknown): { valid: boolean; errors: string[]; normalized: FocusSettings | null } => {
    const errors: string[] = [];
    
    if (!data || typeof data !== 'object') {
      return { valid: false, errors: ['Dữ liệu không hợp lệ'], normalized: null };
    }
    
    const d = data as Record<string, unknown>;
    
    // Check blockedSites
    if (!Array.isArray(d.blockedSites)) {
      errors.push('Thiếu danh sách website (blockedSites)');
    } else if (d.blockedSites.length > 50) {
      errors.push('Quá nhiều website (tối đa 50)');
    } else {
      d.blockedSites.forEach((site: unknown, index: number) => {
        if (!isValidBlockedSite(site)) {
          errors.push(`Website #${index + 1} không hợp lệ`);
        }
      });
    }
    
    // Check workSchedule
    if (d.workSchedule && typeof d.workSchedule === 'object') {
      const ws = d.workSchedule as Record<string, unknown>;
      if (ws.startTime && !isValidTime(ws.startTime as string)) {
        errors.push('Thời gian bắt đầu không hợp lệ');
      }
      if (ws.endTime && !isValidTime(ws.endTime as string)) {
        errors.push('Thời gian kết thúc không hợp lệ');
      }
    }
    
    // Check pauseMinutes
    if (d.pauseMinutes !== undefined) {
      if (typeof d.pauseMinutes !== 'number' || d.pauseMinutes < 1 || d.pauseMinutes > 120) {
        errors.push('Thời gian tạm dừng phải từ 1-120 phút');
      }
    }
    
    // Check theme
    if (d.theme !== undefined && d.theme !== 'light' && d.theme !== 'dark' && d.theme !== 'system') {
      errors.push('Theme không hợp lệ (phải là light, dark, hoặc system)');
    }
    
    if (errors.length > 0) {
      return { valid: false, errors, normalized: null };
    }
    
    // Normalize data - fill in defaults for missing optional fields
    const normalized: FocusSettings = {
      blockedSites: (d.blockedSites as BlockedSite[]).map((site, index) => ({
        id: site.id || `imported-${index}-${Date.now()}`,
        title: site.title.trim().substring(0, 200),
        urls: site.urls.map((url: string) => url.trim().toLowerCase().substring(0, 500)),
        allowedMinutesPerHour: Math.min(60, Math.max(1, Math.round(site.allowedMinutesPerHour))),
        action: site.action,
        redirectUrl: site.redirectUrl?.trim().substring(0, 500),
        isActive: site.isActive,
        schedule: {
          startTime: site.schedule.startTime,
          endTime: site.schedule.endTime,
          workDays: [...new Set(site.schedule.workDays)].sort(),
          allowOutsideHours: site.schedule.allowOutsideHours,
        },
      })),
      workSchedule: d.workSchedule as FocusSettings['workSchedule'] || {
        startTime: '08:00',
        endTime: '17:00',
        workDays: [1, 2, 3, 4, 5],
        allowOutsideHours: true,
      },
      pauseMinutes: typeof d.pauseMinutes === 'number' ? Math.min(120, Math.max(1, d.pauseMinutes)) : 15,
      isPaused: false, // Always reset pause state on import
      pauseEndTime: undefined,
      hardLockMode: typeof d.hardLockMode === 'boolean' ? d.hardLockMode : false,
      theme: (d.theme as 'light' | 'dark' | 'system') || 'dark',
    };
    
    return { valid: true, errors: [], normalized };
  };

  // ===== EXPORT FUNCTION =====
  const exportSettings = () => {
    try {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        settings: settings,
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusguard-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setImportStatus({ type: 'success', message: 'Đã xuất file thành công!' });
    } catch (error) {
      setImportStatus({ type: 'error', message: `Lỗi xuất file: ${error instanceof Error ? error.message : 'Unknown'}` });
    }
  };

  // ===== IMPORT FUNCTION =====
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setImportStatus({ type: 'error', message: 'File quá lớn (tối đa 1MB)' });
      return;
    }
    
    // Validate file type
    if (!file.name.endsWith('.json')) {
      setImportStatus({ type: 'error', message: 'Chỉ hỗ trợ file .json' });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        
        // Parse JSON
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          setImportStatus({ type: 'error', message: 'File JSON không hợp lệ' });
          return;
        }
        
        // Extract settings (support both old and new format)
        let settingsData: unknown;
        if (parsed && typeof parsed === 'object') {
          const p = parsed as Record<string, unknown>;
          if (p.settings && typeof p.settings === 'object') {
            // New format with metadata
            settingsData = p.settings;
          } else if (p.blockedSites) {
            // Direct settings format
            settingsData = parsed;
          } else {
            setImportStatus({ type: 'error', message: 'Không tìm thấy dữ liệu settings trong file' });
            return;
          }
        } else {
          setImportStatus({ type: 'error', message: 'Định dạng file không hợp lệ' });
          return;
        }
        
        // Validate and normalize
        const validation = isValidSettings(settingsData);
        
        if (!validation.valid) {
          setImportStatus({ 
            type: 'error', 
            message: `Dữ liệu không hợp lệ:\n${validation.errors.join('\n')}` 
          });
          return;
        }
        
        // Confirm import
        if (confirm(`Nhập ${validation.normalized!.blockedSites.length} website? Dữ liệu hiện tại sẽ bị ghi đè.`)) {
          onUpdate(validation.normalized!);
          setImportStatus({ type: 'success', message: `Đã nhập ${validation.normalized!.blockedSites.length} website thành công!` });
          
          // Reload after short delay
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (error) {
        setImportStatus({ type: 'error', message: `Lỗi đọc file: ${error instanceof Error ? error.message : 'Unknown'}` });
      }
    };
    
    reader.onerror = () => {
      setImportStatus({ type: 'error', message: 'Không thể đọc file' });
    };
    
    reader.readAsText(file);
    
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
            Đồng bộ dữ liệu (Chrome/Edge)
          </Label>
          <div className="flex items-center gap-2 flex-wrap">
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
              <Upload className="w-4 h-4 mr-2" />
              Đẩy lên cloud
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={pullFromCloud}
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
              onClick={exportSettings}
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
              if (!showDebug) checkSyncStatus();
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

