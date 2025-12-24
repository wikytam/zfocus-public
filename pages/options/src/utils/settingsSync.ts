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

// ===== FORCE PUSH TO CLOUD =====
export const forcePushToCloud = async (settings: FocusSettings): Promise<SyncStatusResult> => {
  try {
    await chrome.storage.sync.set({ 'focus-settings': settings });
    return {
      success: true,
      type: 'success',
      message: 'Đã đẩy cài đặt lên cloud thành công!',
    };
  } catch (error) {
    return {
      success: false,
      type: 'error',
      message: `Lỗi đẩy lên cloud: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// ===== FORCE PULL FROM CLOUD =====
export const forcePullFromCloud = async (): Promise<SyncStatusResult & { settings?: FocusSettings }> => {
  try {
    const syncData = await chrome.storage.sync.get(['focus-settings']);
    if (syncData['focus-settings']) {
      return {
        success: true,
        type: 'success',
        message: 'Đã tải dữ liệu từ cloud! Đang reload...',
        settings: syncData['focus-settings'],
      };
    } else {
      return {
        success: false,
        type: 'idle',
        message: 'Không có dữ liệu trên cloud.',
      };
    }
  } catch (error) {
    return {
      success: false,
      type: 'error',
      message: `Lỗi tải: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

// ===== CLEAR ALL DATA =====
export const clearAllData = async (): Promise<void> => {
  await chrome.storage.sync.clear();
  await chrome.storage.local.clear();
};

