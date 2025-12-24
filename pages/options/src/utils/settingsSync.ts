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
      const identity = await chrome.identity?.getProfileUserInfo({ accountStatus: 'ANY' as chrome.identity.AccountStatus });
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
export const autoSync = async (localSettings: FocusSettings): Promise<SyncStatusResult & { settings?: FocusSettings }> => {
  try {
    // Get data from cloud
    const syncData = await chrome.storage.sync.get(['focus-settings', 'focus-last-sync']);
    const cloudSettings = syncData['focus-settings'] as FocusSettings | undefined;
    const cloudLastSync = syncData['focus-last-sync'] as number | undefined;

    // Get local last modified time from storage
    const localData = await chrome.storage.local.get(['focus-last-sync']);
    const localLastSync = localData['focus-last-sync'] as number | undefined;

    // If no cloud data, push local to cloud
    if (!cloudSettings || !cloudLastSync) {
      const now = Date.now();
      await chrome.storage.sync.set({ 
        'focus-settings': localSettings,
        'focus-last-sync': now,
      });
      await chrome.storage.local.set({ 'focus-last-sync': now });
      
      return {
        success: true,
        type: 'success',
        message: 'Đã đồng bộ lên cloud thành công!',
      };
    }

    // Compare timestamps - use newer data
    if (!localLastSync || cloudLastSync > localLastSync) {
      // Cloud is newer, use cloud data
      await chrome.storage.local.set({ 
        'focus-settings': cloudSettings,
        'focus-last-sync': cloudLastSync,
      });
      
      return {
        success: true,
        type: 'success',
        message: 'Đã đồng bộ dữ liệu mới từ cloud!',
        settings: cloudSettings,
      };
    } else if (localLastSync > cloudLastSync) {
      // Local is newer, push to cloud
      await chrome.storage.sync.set({ 
        'focus-settings': localSettings,
        'focus-last-sync': localLastSync,
      });
      
      return {
        success: true,
        type: 'success',
        message: 'Đã đồng bộ dữ liệu lên cloud!',
      };
    } else {
      // Same timestamp, already synced
      return {
        success: true,
        type: 'success',
        message: 'Dữ liệu đã được đồng bộ!',
      };
    }
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
  await chrome.storage.sync.clear();
  await chrome.storage.local.clear();
};

