import { indexedDBAdapter } from './indexeddb-adapter.js';

const chrome = globalThis.chrome;

const QUOTA_WARNING_THRESHOLD = 0.8;
const IDB_REGISTRY_KEY = '__zfocus_idb_keys__';

interface QuotaStatus {
  bytesUsed: number;
  maxBytes: number;
  percentUsed: number;
  isNearLimit: boolean;
  isOverLimit: boolean;
  idbKeys: string[];
}

/**
 * Keys currently stored in IndexedDB instead of chrome.storage.sync.
 * Loaded once at startup, kept in memory for fast lookups.
 */
let idbKeyRegistry: Set<string> | null = null;

const loadRegistry = async (): Promise<Set<string>> => {
  if (idbKeyRegistry) return idbKeyRegistry;

  try {
    const stored = await indexedDBAdapter.get<string[]>(IDB_REGISTRY_KEY);
    idbKeyRegistry = new Set(stored ?? []);
  } catch {
    idbKeyRegistry = new Set();
  }
  return idbKeyRegistry;
};

const persistRegistry = async (): Promise<void> => {
  if (!idbKeyRegistry) return;
  await indexedDBAdapter.set(IDB_REGISTRY_KEY, Array.from(idbKeyRegistry));
};

export const syncQuotaGuard = {
  /**
   * Check whether a key is currently stored in IndexedDB (overflow).
   */
  async isInIndexedDB(key: string): Promise<boolean> {
    const registry = await loadRegistry();
    return registry.has(key);
  },

  /**
   * Return current sync quota usage.
   */
  async getQuotaStatus(): Promise<QuotaStatus> {
    const registry = await loadRegistry();

    if (!chrome?.storage?.sync) {
      return {
        bytesUsed: 0,
        maxBytes: 102_400,
        percentUsed: 0,
        isNearLimit: false,
        isOverLimit: false,
        idbKeys: Array.from(registry),
      };
    }

    const bytesUsed = await chrome.storage.sync.getBytesInUse(null);
    const maxBytes = chrome.storage.sync.QUOTA_BYTES ?? 102_400;
    const percentUsed = bytesUsed / maxBytes;

    return {
      bytesUsed,
      maxBytes,
      percentUsed,
      isNearLimit: percentUsed >= QUOTA_WARNING_THRESHOLD,
      isOverLimit: percentUsed >= 1.0,
      idbKeys: Array.from(registry),
    };
  },

  /**
   * Attempt to write a key/value to chrome.storage.sync.
   * If the write would exceed quota, transparently fall back to IndexedDB.
   *
   * Returns 'sync' | 'indexeddb' indicating where data was stored.
   */
  async safeSet(key: string, value: unknown): Promise<'sync' | 'indexeddb'> {
    const registry = await loadRegistry();

    // If this key is already in IndexedDB, keep it there
    if (registry.has(key)) {
      await indexedDBAdapter.set(key, value);
      return 'indexeddb';
    }

    if (!chrome?.storage?.sync) {
      await indexedDBAdapter.set(key, value);
      registry.add(key);
      await persistRegistry();
      return 'indexeddb';
    }

    try {
      // Try sync first
      await chrome.storage.sync.set({ [key]: value });
      return 'sync';
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const isQuotaError = msg.includes('QUOTA_BYTES') || msg.includes('quota') || msg.includes('MAX_ITEMS');

      if (isQuotaError) {
        console.warn(`[ZFocus Storage] Sync quota exceeded for key "${key}". Falling back to IndexedDB.`);

        // Move this key to IndexedDB
        await indexedDBAdapter.set(key, value);
        registry.add(key);
        await persistRegistry();

        // Remove from sync to free space for other keys
        try {
          await chrome.storage.sync.remove(key);
        } catch {
          // Best-effort cleanup
        }

        return 'indexeddb';
      }

      // Non-quota error: re-throw
      throw error;
    }
  },

  /**
   * Read a key, checking IndexedDB first if the key was previously overflowed.
   */
  async safeGet<T>(key: string): Promise<T | undefined> {
    const registry = await loadRegistry();

    if (registry.has(key)) {
      return indexedDBAdapter.get<T>(key);
    }

    if (!chrome?.storage?.sync) {
      return indexedDBAdapter.get<T>(key);
    }

    const result = await chrome.storage.sync.get([key]);
    return result[key] as T | undefined;
  },

  /**
   * Try to migrate a key back from IndexedDB to sync storage
   * (e.g., after user deletes some blocked sites and frees space).
   */
  async tryPromoteToSync(key: string): Promise<boolean> {
    const registry = await loadRegistry();
    if (!registry.has(key)) return false;
    if (!chrome?.storage?.sync) return false;

    const value = await indexedDBAdapter.get(key);
    if (value === undefined) return false;

    try {
      await chrome.storage.sync.set({ [key]: value });
      // Success: remove from IndexedDB
      await indexedDBAdapter.remove(key);
      registry.delete(key);
      await persistRegistry();
      console.log(`[ZFocus Storage] Promoted key "${key}" back to sync storage.`);
      return true;
    } catch {
      // Still not enough space
      return false;
    }
  },

  /**
   * Remove a key from whichever backend it lives in.
   */
  async safeRemove(key: string): Promise<void> {
    const registry = await loadRegistry();

    if (registry.has(key)) {
      await indexedDBAdapter.remove(key);
      registry.delete(key);
      await persistRegistry();
    }

    if (chrome?.storage?.sync) {
      try {
        await chrome.storage.sync.remove(key);
      } catch {
        // Ignore
      }
    }
  },

  /**
   * Clear all data from both sync and IndexedDB overflow.
   */
  async clearAll(): Promise<void> {
    idbKeyRegistry = new Set();
    await indexedDBAdapter.clear();

    if (chrome?.storage?.sync) {
      await chrome.storage.sync.clear();
    }
  },
};

export type { QuotaStatus };
