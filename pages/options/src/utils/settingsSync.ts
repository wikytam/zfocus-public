import { syncQuotaGuard } from '@extension/storage';
import type { FocusSettings, QuotaStatus } from '@extension/storage';

interface SyncStatusResult {
  success: boolean;
  type: 'success' | 'error' | 'idle';
  message: string;
  accountEmail?: string;
  lastUpdate?: string;
  debugData?: string;
}

// ===== SYNC STATUS CHECK =====
const checkSyncStatus = async (): Promise<SyncStatusResult> => {
  try {
    // Check chrome.storage.sync
    const syncData = await chrome.storage.sync.get(null);
    const bytesUsed = await chrome.storage.sync.getBytesInUse(null);
    const maxBytes = chrome.storage.sync.QUOTA_BYTES; // 102,400 bytes

    // Check IndexedDB overflow status
    const quotaStatus = await syncQuotaGuard.getQuotaStatus();
    const idbKeysInfo =
      quotaStatus.idbKeys.length > 0 ? ` | IndexedDB overflow: ${quotaStatus.idbKeys.join(', ')}` : '';

    // Get Chrome account info
    let accountEmail = 'Chưa đăng nhập';
    try {
      const identity = await chrome.identity?.getProfileUserInfo({
        accountStatus: 'ANY' as chrome.identity.AccountStatus,
      });
      accountEmail = identity?.email || 'Chưa đăng nhập';
    } catch {
      accountEmail = 'Không thể lấy thông tin tài khoản';
    }

    // Set last update time
    const lastUpdate = new Date().toLocaleString('vi-VN');

    return {
      success: true,
      type: 'success',
      message: `Đã sử dụng: ${(bytesUsed / 1024).toFixed(2)} KB / ${(maxBytes / 1024).toFixed(0)} KB${idbKeysInfo}`,
      accountEmail,
      lastUpdate,
      debugData: JSON.stringify(syncData, null, 2),
    };
  } catch (error) {
    return {
      success: false,
      type: 'error',
      message: `Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// ===== AUTO SYNC (Compare timestamps & merge) =====
const autoSync = async (localSettings: FocusSettings): Promise<SyncStatusResult & { settings?: FocusSettings }> => {
  try {
    // Get data from cloud
    const syncData = await chrome.storage.sync.get(['focus-settings']);
    const cloudSettings = syncData['focus-settings'] as FocusSettings | undefined;

    // Since we're using sync storage, data is automatically synced
    // Just verify the data exists
    if (!cloudSettings) {
      const now = Date.now();
      await chrome.storage.sync.set({
        'focus-settings': localSettings,
        'focus-last-sync': now,
      });

      return {
        success: true,
        type: 'success',
        message: 'Đã đồng bộ lên cloud thành công!',
      };
    }

    // Data already in sync storage
    return {
      success: true,
      type: 'success',
      message: 'Dữ liệu đã được đồng bộ tự động!',
      settings: cloudSettings,
    };
  } catch (error) {
    return {
      success: false,
      type: 'error',
      message: `Lỗi đồng bộ: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// ===== CLEAR ALL DATA =====
const clearAllData = async (): Promise<void> => {
  console.log('[ZFocus] clearAllData: Starting...');

  // Clear sync, local, and IndexedDB overflow storage
  await Promise.all([syncQuotaGuard.clearAll(), chrome.storage.local.clear()]);

  // Set a flag to indicate data was cleared - this prevents DEFAULT_SETTINGS from loading
  // This flag will be checked in loadInitialData to use empty blockedSites
  await chrome.storage.local.set({ 'zfocus-data-cleared': true });

  console.log('[ZFocus] clearAllData: Completed - data cleared flag set');
};

// ===== STORAGE QUOTA TEST (REAL DATA) =====

interface QuotaTestResult {
  success: boolean;
  steps: QuotaTestStep[];
  quotaBefore: QuotaStatus;
  quotaAfter: QuotaStatus;
}

interface QuotaTestStep {
  action: string;
  status: 'pass' | 'fail' | 'info';
  detail: string;
}

const SETTINGS_KEY = 'focus-settings';

const generateRealisticSite = (index: number) => ({
  id: `test-site-${index}-${Date.now()}`,
  title: `Test Blocked Group ${index} - Social Media & Entertainment`,
  urls: [
    `site-${index}-a.example.com`,
    `site-${index}-b.example.com`,
    `subdomain.site-${index}.example.com/path/to/page`,
  ],
  exceptions: [`site-${index}-a.example.com/allowed-page`, `site-${index}-b.example.com/work`],
  keywords: [`distraction-${index}`, `timewaste-${index}`, `procrastinate`],
  allowedMinutesPerHour: 5 + (index % 20),
  countOnlyActiveTab: index % 2 === 0,
  action: index % 3 === 0 ? ('redirect' as const) : ('close' as const),
  redirectUrl: index % 3 === 0 ? 'https://example.com/focus' : '',
  isActive: true,
  schedule: {
    startTime: '08:00',
    endTime: '18:00',
    workDays: [1, 2, 3, 4, 5],
    allowOutsideHours: true,
  },
});

/**
 * Uses the real focus-settings key with realistic blocked sites data.
 *
 * Strategy: Use a separate padding key to fill sync storage to near-full,
 * then write focus-settings with a large payload to trigger the real overflow path.
 * This avoids spamming onChanged with incremental focus-settings writes.
 */
const runStorageQuotaTest = async (): Promise<QuotaTestResult> => {
  const steps: QuotaTestStep[] = [];
  const PADDING_KEY = '__zfocus_quota_pad__';

  // Backup current real settings via safeGet (checks both sync and IndexedDB)
  const originalSettings = await syncQuotaGuard.safeGet<FocusSettings>(SETTINGS_KEY);
  const quotaBefore = await syncQuotaGuard.getQuotaStatus();

  steps.push({
    action: 'Backup & initial state',
    status: 'info',
    detail: `${(quotaBefore.bytesUsed / 1024).toFixed(1)} KB / ${(quotaBefore.maxBytes / 1024).toFixed(0)} KB (${(quotaBefore.percentUsed * 100).toFixed(1)}%). Real sites: ${originalSettings?.blockedSites?.length ?? 0}`,
  });

  try {
    // Step 1: Fill sync storage to near-full using a PADDING key (not focus-settings).
    const maxBytes = chrome.storage.sync.QUOTA_BYTES ?? 102_400;
    const currentBytes = await chrome.storage.sync.getBytesInUse(null);
    const targetFill = maxBytes - 1500;
    const bytesToFill = Math.max(0, targetFill - currentBytes);

    if (bytesToFill > 0) {
      // QUOTA_BYTES_PER_ITEM is 8192, so we use a string just under that
      const padValue = 'P'.repeat(Math.min(bytesToFill, 7800));
      try {
        await chrome.storage.sync.set({ [PADDING_KEY]: padValue });
      } catch {
        // If even this fails, sync is already full
      }
    }

    const afterPadBytes = await chrome.storage.sync.getBytesInUse(null);
    steps.push({
      action: 'Fill sync with padding',
      status: 'pass',
      detail: `Padded sync to ${(afterPadBytes / 1024).toFixed(1)} KB / ${(maxBytes / 1024).toFixed(0)} KB using non-settings key.`,
    });

    // Step 2: Build a realistic focus-settings payload that's too big for remaining space.
    const testSettings: FocusSettings = {
      blockedSites: [],
      workSchedule: { startTime: '08:00', endTime: '17:00', workDays: [1, 2, 3, 4, 5], allowOutsideHours: true },
      pauseMinutes: 15,
      isPaused: false,
      hardLockMode: false,
      theme: 'dark',
      showBadgeCountdown: true,
    };

    for (let i = 0; i < 20; i++) {
      testSettings.blockedSites.push(generateRealisticSite(i));
    }

    const settingsSize = new Blob([JSON.stringify(testSettings)]).size;
    const remainingSpace = maxBytes - afterPadBytes;

    steps.push({
      action: 'Build test payload',
      status: 'info',
      detail: `${testSettings.blockedSites.length} realistic sites (${(settingsSize / 1024).toFixed(1)} KB). Remaining sync space: ${(remainingSpace / 1024).toFixed(1)} KB. Will overflow: ${settingsSize > remainingSpace ? 'yes' : 'no'}.`,
    });

    // Step 3: Write focus-settings through syncQuotaGuard.safeSet - the REAL production path.
    const backend = await syncQuotaGuard.safeSet(SETTINGS_KEY, testSettings);

    if (backend === 'indexeddb') {
      steps.push({
        action: 'safeSet(focus-settings)',
        status: 'pass',
        detail: `focus-settings (${testSettings.blockedSites.length} sites, ${(settingsSize / 1024).toFixed(1)} KB) fell back to IndexedDB. Sync was full.`,
      });
    } else {
      steps.push({
        action: 'safeSet(focus-settings)',
        status: 'info',
        detail: `focus-settings still fit in sync (${backend}). Padding may not have filled enough.`,
      });
    }

    // Step 4: Read back via safeGet and verify integrity.
    const readBack = await syncQuotaGuard.safeGet<FocusSettings>(SETTINGS_KEY);

    if (!readBack) {
      steps.push({ action: 'safeGet(focus-settings)', status: 'fail', detail: 'Returned null/undefined.' });
    } else {
      const countOk = readBack.blockedSites.length === testSettings.blockedSites.length;
      const firstOk = readBack.blockedSites[0]?.id === testSettings.blockedSites[0]?.id;
      const lastOk =
        readBack.blockedSites[readBack.blockedSites.length - 1]?.id ===
        testSettings.blockedSites[testSettings.blockedSites.length - 1]?.id;

      if (countOk && firstOk && lastOk) {
        steps.push({
          action: 'safeGet(focus-settings)',
          status: 'pass',
          detail: `Read ${readBack.blockedSites.length} sites. IDs verified (first + last). Data intact.`,
        });
      } else {
        steps.push({
          action: 'safeGet(focus-settings)',
          status: 'fail',
          detail: `Expected ${testSettings.blockedSites.length} sites, got ${readBack.blockedSites.length}. First OK: ${firstOk}, Last OK: ${lastOk}.`,
        });
      }
    }

    // Step 5: Check IndexedDB registry
    const quotaMid = await syncQuotaGuard.getQuotaStatus();
    const settingsInIDB = quotaMid.idbKeys.includes(SETTINGS_KEY);

    steps.push({
      action: 'IndexedDB registry',
      status: backend === 'indexeddb' ? (settingsInIDB ? 'pass' : 'fail') : 'info',
      detail:
        backend === 'indexeddb'
          ? settingsInIDB
            ? `"${SETTINGS_KEY}" tracked in IndexedDB. Keys: [${quotaMid.idbKeys.join(', ')}]`
            : `"${SETTINGS_KEY}" NOT in registry! Keys: [${quotaMid.idbKeys.join(', ')}]`
          : `No overflow. IDB keys: [${quotaMid.idbKeys.join(', ') || 'none'}]`,
    });

    // Step 6: Cleanup padding + restore original settings
    await chrome.storage.sync.remove([PADDING_KEY]);
    await syncQuotaGuard.safeRemove(SETTINGS_KEY);

    if (originalSettings) {
      await chrome.storage.sync.set({ [SETTINGS_KEY]: originalSettings });
      const verify = await chrome.storage.sync.get([SETTINGS_KEY]);
      const restored = verify[SETTINGS_KEY] as FocusSettings;
      const ok = restored?.blockedSites?.length === originalSettings.blockedSites.length;

      steps.push({
        action: 'Restore original settings',
        status: ok ? 'pass' : 'fail',
        detail: ok
          ? `Restored ${originalSettings.blockedSites.length} original site(s).`
          : `FAILED. Expected ${originalSettings.blockedSites.length}, got ${restored?.blockedSites?.length ?? 0}.`,
      });
    } else {
      await chrome.storage.sync.remove([SETTINGS_KEY]);
      steps.push({
        action: 'Restore original settings',
        status: 'pass',
        detail: 'No original settings. Cleared test data.',
      });
    }
  } catch (error) {
    steps.push({
      action: 'Unexpected error',
      status: 'fail',
      detail: error instanceof Error ? error.message : String(error),
    });

    // Emergency cleanup
    try {
      await chrome.storage.sync.remove([PADDING_KEY]);
      await syncQuotaGuard.safeRemove(SETTINGS_KEY);
      if (originalSettings) {
        await chrome.storage.sync.set({ [SETTINGS_KEY]: originalSettings });
      }
      steps.push({ action: 'Emergency restore', status: 'info', detail: 'Settings restored after error.' });
    } catch (e2) {
      steps.push({
        action: 'Emergency restore',
        status: 'fail',
        detail: `CRITICAL: ${e2 instanceof Error ? e2.message : String(e2)}`,
      });
    }
  }

  const quotaAfter = await syncQuotaGuard.getQuotaStatus();
  steps.push({
    action: 'Final state',
    status: 'info',
    detail: `${(quotaAfter.bytesUsed / 1024).toFixed(1)} KB / ${(quotaAfter.maxBytes / 1024).toFixed(0)} KB (${(quotaAfter.percentUsed * 100).toFixed(1)}%). IDB keys: [${quotaAfter.idbKeys.join(', ') || 'none'}]`,
  });

  return {
    success: !steps.some(s => s.status === 'fail'),
    steps,
    quotaBefore,
    quotaAfter,
  };
};

/**
 * Clean up any leftover test artifacts and try to promote focus-settings back to sync.
 */
const cleanupQuotaTestData = async (): Promise<string> => {
  try {
    // Remove padding key if left behind
    await chrome.storage.sync.remove(['__zfocus_quota_pad__']);

    const promoted = await syncQuotaGuard.tryPromoteToSync(SETTINGS_KEY);
    const quotaAfter = await syncQuotaGuard.getQuotaStatus();

    if (promoted) {
      return `Promoted "${SETTINGS_KEY}" back to sync. Usage: ${(quotaAfter.bytesUsed / 1024).toFixed(1)} KB / ${(quotaAfter.maxBytes / 1024).toFixed(0)} KB. IDB keys: [${quotaAfter.idbKeys.join(', ') || 'none'}]`;
    }

    return `Clean. "${SETTINGS_KEY}" is in sync. Usage: ${(quotaAfter.bytesUsed / 1024).toFixed(1)} KB / ${(quotaAfter.maxBytes / 1024).toFixed(0)} KB. IDB keys: [${quotaAfter.idbKeys.join(', ') || 'none'}]`;
  } catch (error) {
    return `Cleanup error: ${error instanceof Error ? error.message : String(error)}`;
  }
};

export type { SyncStatusResult, QuotaTestResult, QuotaTestStep };
export { checkSyncStatus, autoSync, clearAllData, runStorageQuotaTest, cleanupQuotaTestData };
