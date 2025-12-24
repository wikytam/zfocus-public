/**
 * Migration utility to move data from chrome.storage.local to chrome.storage.sync
 * This should be run once when updating from local to sync storage
 */

export const migrateLocalToSync = async (): Promise<{
  success: boolean;
  message: string;
  migratedKeys?: string[];
}> => {
  try {
    console.log('[Migration] Starting migration from local to sync storage...');

    // Get all data from local storage
    const localData = await chrome.storage.local.get(null);
    const localKeys = Object.keys(localData);

    if (localKeys.length === 0) {
      return {
        success: true,
        message: 'No data to migrate',
        migratedKeys: [],
      };
    }

    console.log(`[Migration] Found ${localKeys.length} keys in local storage:`, localKeys);

    // Filter keys related to FocusGuard
    const focusKeys = localKeys.filter(
      key =>
        key.startsWith('focus-') ||
        key === '__EXTENSION_STORAGE_FOCUS_SETTINGS__' ||
        key === '__EXTENSION_STORAGE_FOCUS_STATS__' ||
        key === '__EXTENSION_STORAGE_FOCUS_TIMERS__',
    );

    if (focusKeys.length === 0) {
      return {
        success: true,
        message: 'No FocusGuard data to migrate',
        migratedKeys: [],
      };
    }

    console.log(`[Migration] Migrating ${focusKeys.length} FocusGuard keys:`, focusKeys);

    // Check sync storage quota
    const syncData = await chrome.storage.sync.get(null);
    const currentBytesUsed = await chrome.storage.sync.getBytesInUse(null);
    const maxBytes = chrome.storage.sync.QUOTA_BYTES; // 102,400 bytes

    console.log(`[Migration] Current sync storage usage: ${currentBytesUsed} / ${maxBytes} bytes`);

    // Prepare data to migrate
    const dataToMigrate: Record<string, unknown> = {};
    for (const key of focusKeys) {
      dataToMigrate[key] = localData[key];
    }

    // Estimate size of data to migrate
    const dataSize = new Blob([JSON.stringify(dataToMigrate)]).size;
    console.log(`[Migration] Data to migrate size: ${dataSize} bytes`);

    if (currentBytesUsed + dataSize > maxBytes) {
      return {
        success: false,
        message: `Not enough space in sync storage. Need ${dataSize} bytes, but only ${maxBytes - currentBytesUsed} bytes available.`,
      };
    }

    // Check if data already exists in sync storage
    const existingKeys = focusKeys.filter(key => key in syncData);
    if (existingKeys.length > 0) {
      console.log(`[Migration] Warning: ${existingKeys.length} keys already exist in sync storage:`, existingKeys);
      // Don't overwrite existing data, just inform user
      return {
        success: true,
        message: `Data already exists in sync storage. Skipping migration to prevent data loss.`,
        migratedKeys: existingKeys,
      };
    }

    // Migrate data to sync storage
    await chrome.storage.sync.set(dataToMigrate);
    console.log(`[Migration] Successfully migrated ${focusKeys.length} keys to sync storage`);

    // Optionally clear local storage after successful migration
    // Uncomment if you want to clean up local storage
    // await chrome.storage.local.remove(focusKeys);
    // console.log(`[Migration] Cleared ${focusKeys.length} keys from local storage`);

    return {
      success: true,
      message: `Successfully migrated ${focusKeys.length} keys to sync storage`,
      migratedKeys: focusKeys,
    };
  } catch (error) {
    console.error('[Migration] Error during migration:', error);
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

/**
 * Check if migration is needed
 */
export const checkMigrationNeeded = async (): Promise<boolean> => {
  try {
    // Check if data exists in local storage
    const localData = await chrome.storage.local.get([
      'focus-settings',
      'focus-stats',
      'focus-timers',
      'focus-last-sync',
    ]);

    const hasLocalData = Object.keys(localData).length > 0;

    // Check if data exists in sync storage
    const syncData = await chrome.storage.sync.get([
      'focus-settings',
      'focus-stats',
      'focus-timers',
      'focus-last-sync',
    ]);

    const hasSyncData = Object.keys(syncData).length > 0;

    // Migration needed if local has data but sync doesn't
    return hasLocalData && !hasSyncData;
  } catch (error) {
    console.error('[Migration] Error checking migration status:', error);
    return false;
  }
};
