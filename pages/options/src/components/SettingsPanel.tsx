import { exportSettings as exportSettingsFile, parseImportFile } from '../utils/settingsExportImport';
import {
  checkSyncStatus as checkSync,
  autoSync,
  clearAllData,
  runStorageQuotaTest,
  cleanupQuotaTestData,
} from '../utils/settingsSync';
import { getLanguageCode, useI18n } from '@extension/i18n';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
  Label,
  Button,
  cn,
  LanguageSelector,
  ActivationCodeDialog,
} from '@extension/ui';
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
  Timer,
  Sparkles,
  Crown,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useState, useRef } from 'react';
import type { QuotaTestStep } from '../utils/settingsSync';
import type { MessageKeyType } from '@extension/i18n';
import type { FocusSettings } from '@extension/storage';

interface PremiumInfo {
  planType: 'yearly' | 'lifetime' | null;
  expiresAt: string | null;
  code: string | null;
}

interface SettingsPanelProps {
  settings: FocusSettings;
  onUpdate: (updates: Partial<FocusSettings>) => void;
  isPremium?: boolean;
  premiumInfo?: PremiumInfo;
  onActivatePremium?: (code: string) => Promise<boolean>;
}

const formatExpirationDate = (expiresAt: string | null): string => {
  if (!expiresAt) return '';
  const date = new Date(expiresAt);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const getDaysRemaining = (expiresAt: string | null): number | null => {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export const SettingsPanel = ({
  settings,
  onUpdate,
  isPremium = false,
  premiumInfo,
  onActivatePremium,
}: SettingsPanelProps) => {
  const { t } = useI18n();
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
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [quotaTestRunning, setQuotaTestRunning] = useState(false);
  const [quotaTestSteps, setQuotaTestSteps] = useState<QuotaTestStep[]>([]);
  const [quotaTestSuccess, setQuotaTestSuccess] = useState<boolean | null>(null);
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
    if (confirm(t('confirmDeleteAll'))) {
      await clearAllData();
      window.location.reload();
    }
  };

  // Storage quota test handlers
  const handleQuotaTest = async () => {
    setQuotaTestRunning(true);
    setQuotaTestSteps([]);
    setQuotaTestSuccess(null);
    try {
      const result = await runStorageQuotaTest();
      setQuotaTestSteps(result.steps);
      setQuotaTestSuccess(result.success);
    } catch (e) {
      setQuotaTestSteps([
        { action: 'Fatal error', status: 'fail', detail: e instanceof Error ? e.message : String(e) },
      ]);
      setQuotaTestSuccess(false);
    } finally {
      setQuotaTestRunning(false);
    }
  };

  const handleQuotaCleanup = async () => {
    const msg = await cleanupQuotaTestData();
    setQuotaTestSteps([{ action: 'Cleanup', status: 'pass', detail: msg }]);
    setQuotaTestSuccess(null);
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
      if (confirm(t('confirmImport', String(result.normalized.blockedSites.length)))) {
        onUpdate(result.normalized);
        setTimeout(() => window.location.reload(), 1000);
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const themes: { value: 'light' | 'dark' | 'system'; icon: typeof Sun; labelKey: MessageKeyType }[] = [
    { value: 'light', icon: Sun, labelKey: 'light' },
    { value: 'dark', icon: Moon, labelKey: 'dark' },
    { value: 'system', icon: Monitor, labelKey: 'system' },
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
          {t('advancedSettings')}
        </CardTitle>
        <CardDescription>{t('advancedSettingsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Premium Status */}
        <div
          className={cn(
            'flex items-center justify-between rounded-lg p-4 transition-all duration-200',
            isPremium ? 'bg-primary/10 border-primary/20 border' : 'bg-secondary/50',
          )}>
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg p-2', isPremium ? 'bg-primary/20' : 'bg-secondary')}>
              {isPremium ? (
                <Crown className="text-primary h-5 w-5" />
              ) : (
                <Sparkles className="text-muted-foreground h-5 w-5" />
              )}
            </div>
            <div>
              <Label className="font-medium">
                {isPremium
                  ? premiumInfo?.planType === 'lifetime'
                    ? `${t('premiumActive')} - ${t('premiumLifetime')}`
                    : `${t('premiumActive')} - ${t('premiumYearly')}`
                  : t('premiumInactive')}
              </Label>
              <p className="text-muted-foreground text-xs">
                {isPremium ? (
                  premiumInfo?.planType === 'lifetime' ? (
                    t('premiumActiveDesc')
                  ) : premiumInfo?.expiresAt ? (
                    <>
                      {t('premiumActiveDesc')} &middot; {t('expires', formatExpirationDate(premiumInfo.expiresAt))}
                      {(() => {
                        const days = getDaysRemaining(premiumInfo.expiresAt);
                        if (days !== null && days <= 30) {
                          return <span className="ml-1 text-amber-500">({t('daysLeft', String(days))})</span>;
                        }
                        return null;
                      })()}
                    </>
                  ) : (
                    t('premiumActiveDesc')
                  )
                ) : (
                  t('premiumInactiveDesc')
                )}
              </p>
            </div>
          </div>
          {!isPremium && onActivatePremium && (
            <Button variant="outline" size="sm" onClick={() => setShowActivationDialog(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('enterCode')}
            </Button>
          )}
        </div>

        {/* Activation Code Dialog */}
        {onActivatePremium && (
          <ActivationCodeDialog
            open={showActivationDialog}
            onOpenChange={setShowActivationDialog}
            onActivate={onActivatePremium}
          />
        )}

        {/* Language Selection */}
        <LanguageSelector
          value={settings.language || getLanguageCode()}
          onChange={language => onUpdate({ language })}
        />

        {/* Week Starts On - Inline */}
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t('weekStartsOn')}</Label>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate({ weekStartsOn: 'monday' })}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                (settings.weekStartsOn || 'monday') === 'monday'
                  ? 'gradient-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              )}>
              {t('mondayFull')}
            </button>
            <button
              onClick={() => onUpdate({ weekStartsOn: 'sunday' })}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200',
                settings.weekStartsOn === 'sunday'
                  ? 'gradient-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
              )}>
              {t('sundayFull')}
            </button>
          </div>
        </div>

        {/* Theme Selection */}
        <div className="space-y-3">
          <Label>{t('appearance')}</Label>
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
                <span className="text-xs font-medium">{t(theme.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Badge Countdown */}
        <div className="bg-secondary/50 flex items-center justify-between rounded-lg p-4 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className="bg-secondary rounded-lg p-2">
              <Timer className="text-muted-foreground h-5 w-5" />
            </div>
            <div>
              <Label htmlFor="badgeCountdown" className="cursor-pointer">
                {t('showBadgeCountdown')}
              </Label>
              <p className="text-muted-foreground text-xs">{t('showBadgeCountdownDesc')}</p>
            </div>
          </div>
          <Switch
            id="badgeCountdown"
            checked={settings.showBadgeCountdown}
            onCheckedChange={checked => onUpdate({ showBadgeCountdown: checked })}
          />
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
                {t('hardLockMode')}
              </Label>
              <p className="text-muted-foreground text-xs">{t('hardLockModeDesc')}</p>
            </div>
          </div>
          <Switch
            id="hardLock"
            checked={settings.hardLockMode}
            onCheckedChange={checked => onUpdate({ hardLockMode: checked })}
          />
        </div>

        {/* Error Reporting */}
        <div
          className={cn(
            'flex items-center justify-between rounded-lg p-4 transition-all duration-200',
            settings.errorReportingEnabled ? 'bg-primary/10 border-primary/20 border' : 'bg-secondary/50',
          )}>
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg p-2', settings.errorReportingEnabled ? 'bg-primary/20' : 'bg-secondary')}>
              {settings.errorReportingEnabled ? (
                <ShieldCheck className="text-primary h-5 w-5" />
              ) : (
                <ShieldAlert className="text-muted-foreground h-5 w-5" />
              )}
            </div>
            <div>
              <Label htmlFor="errorReporting" className="cursor-pointer">
                {t('errorReportingLabel')}
              </Label>
              <p className="text-muted-foreground text-xs">{t('errorReportingSettingsDesc')}</p>
            </div>
          </div>
          <Switch
            id="errorReporting"
            checked={settings.errorReportingEnabled || false}
            onCheckedChange={checked => onUpdate({ errorReportingEnabled: checked })}
          />
        </div>

        {/* Sync Status */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            {t('syncChrome')}
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAutoSync} disabled={syncStatus === 'syncing'}>
              {syncStatus === 'syncing' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {t('sync')}
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
            {t('backupRestore')}
          </Label>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              {t('exportFile')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-2 h-4 w-4" />
              {t('importFile')}
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
          <p className="text-muted-foreground text-xs">{t('backupRestoreDesc')}</p>
        </div>

        {/* Extension Info with Debug */}
        <div className="border-border space-y-3 border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('version')}</span>
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
                  <span className="text-muted-foreground">{t('account')}:</span>
                  <span className="text-foreground font-mono">{accountEmail || t('notChecked')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t('lastCheck')}:</span>
                  <span className="text-foreground font-mono">{lastUpdate || t('notChecked')}</span>
                </div>
              </div>

              {/* Storage Data */}
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-muted-foreground mb-2 font-mono text-xs">{t('storageData')}:</p>
                <pre className="text-foreground max-h-40 overflow-auto font-mono text-xs">
                  {debugData || t('clickToLoadData')}
                </pre>
              </div>

              <Button variant="destructive" size="sm" onClick={handleClearData}>
                {t('deleteAllData')}
              </Button>

              {/* Storage Quota Test */}
              <div className="border-border space-y-3 border-t pt-3">
                <div>
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t('testStorageQuota')}
                  </Label>
                  <p className="text-muted-foreground mt-1 text-xs">{t('testStorageQuotaDesc')}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleQuotaTest}
                    disabled={quotaTestRunning}
                    className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10">
                    {quotaTestRunning ? (
                      <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <AlertTriangle className="mr-2 h-3.5 w-3.5" />
                    )}
                    {quotaTestRunning ? t('testStorageQuotaRunning') : t('testStorageQuota')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleQuotaCleanup} disabled={quotaTestRunning}>
                    {t('testStorageQuotaCleanup')}
                  </Button>
                </div>

                {quotaTestSteps.length > 0 && (
                  <div className="bg-secondary/50 space-y-1.5 rounded-lg p-3">
                    {quotaTestSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 font-mono text-xs">
                        <span
                          className={cn(
                            'mt-0.5 flex-shrink-0',
                            step.status === 'pass' && 'text-green-500',
                            step.status === 'fail' && 'text-red-500',
                            step.status === 'info' && 'text-blue-400',
                          )}>
                          {step.status === 'pass' ? '[PASS]' : step.status === 'fail' ? '[FAIL]' : '[INFO]'}
                        </span>
                        <span className="text-muted-foreground">{step.action}:</span>
                        <span className="text-foreground break-all">{step.detail}</span>
                      </div>
                    ))}
                    {quotaTestSuccess !== null && (
                      <div
                        className={cn(
                          'mt-2 rounded px-2 py-1 text-xs font-medium',
                          quotaTestSuccess ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500',
                        )}>
                        {quotaTestSuccess ? t('quotaTestAllPassed') : t('quotaTestSomeFailed')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
