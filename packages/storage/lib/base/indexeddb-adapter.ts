const DB_NAME = 'zfocus-storage';
const DB_VERSION = 1;
const STORE_NAME = 'sync-overflow';

type ChangeListener = (key: string, newValue: unknown) => void;

let dbInstance: IDBDatabase | null = null;
const changeListeners: ChangeListener[] = [];

const isAvailable = (): boolean => typeof globalThis !== 'undefined' && typeof globalThis.indexedDB !== 'undefined';

const openDB = (): Promise<IDBDatabase | null> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (!isAvailable()) return Promise.resolve(null);

  return new Promise(resolve => {
    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      dbInstance.onclose = () => {
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = () => {
      console.warn('[ZFocus IndexedDB] Failed to open database:', request.error);
      resolve(null);
    };
  });
};

const notifyListeners = (key: string, newValue: unknown) => {
  for (const listener of changeListeners) {
    try {
      listener(key, newValue);
    } catch {
      // Prevent one listener from breaking others
    }
  }
};

export const indexedDBAdapter = {
  async get<T>(key: string): Promise<T | undefined> {
    const db = await openDB();
    if (!db) return undefined;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  },

  async set<T>(key: string, value: T): Promise<void> {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => {
        notifyListeners(key, value);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  },

  async remove(key: string): Promise<void> {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => {
        notifyListeners(key, undefined);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(): Promise<Record<string, unknown>> {
    const db = await openDB();
    if (!db) return {};

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const result: Record<string, unknown> = {};

      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          result[cursor.key as string] = cursor.value;
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      cursorRequest.onerror = () => reject(cursorRequest.error);
    });
  },

  async clear(): Promise<void> {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  onChanged(listener: ChangeListener): () => void {
    changeListeners.push(listener);
    return () => {
      const idx = changeListeners.indexOf(listener);
      if (idx >= 0) changeListeners.splice(idx, 1);
    };
  },
};
