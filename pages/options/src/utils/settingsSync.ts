import type { FocusSettings } from '@extension/storage';

export interface SyncStatusResult {
  success: boolean;
  type: 'success' | 'error' | 'idle';
  message: string;
  accountEmail?: string;
  lastUpdate?: string;
  debugData?: string;
}

// ===== SYNC STATUS CHECK =====
export const checkSyncStatus = async (): Promise<SyncStatusResult> => {
  try {
    // Check chrome.storage.sync
    const syncData = await chrome.storage.sync.get(null);
    const bytesUsed = await chrome.storage.sync.getBytesInUse(null);
    const maxBytes = chrome.storage.sync.QUOTA_BYTES; // 102,400 bytes

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
      message: `Đã sử dụng: ${(bytesUsed / 1024).toFixed(2)} KB / ${(maxBytes / 1024).toFixed(0)} KB`,
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
export const autoSync = async (
  localSettings: FocusSettings,
): Promise<SyncStatusResult & { settings?: FocusSettings }> => {
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
export const clearAllData = async (): Promise<void> => {
  console.log('[ZFocus] clearAllData: Starting...');

  // Clear both sync and local storage to reset everything including onboarding
  await Promise.all([chrome.storage.sync.clear(), chrome.storage.local.clear()]);

  // Set a flag to indicate data was cleared - this prevents DEFAULT_SETTINGS from loading
  // This flag will be checked in loadInitialData to use empty blockedSites
  await chrome.storage.local.set({ 'zfocus-data-cleared': true });

  console.log('[ZFocus] clearAllData: Completed - data cleared flag set');
};
