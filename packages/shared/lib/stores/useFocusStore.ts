import { validateBlockedSite, validateFocusSettings } from '../utils/validation.js';
import { syncQuotaGuard } from '@extension/storage';
import { create } from 'zustand';
import type { FocusSettings, DailyStats, HistoricalStats, BlockedSite, ActiveTimer } from '../utils/validation.js';

const STORAGE_KEYS = {
  settings: 'focus-settings',
  stats: 'focus-stats',
  timers: 'focus-timers',
  historicalStats: 'focus-historical-stats',
};

const DEFAULT_SCHEDULE = {
  startTime: '00:00',
  endTime: '23:59',
  workDays: [0, 1, 2, 3, 4, 5, 6],
  allowOutsideHours: true,
};

const DEFAULT_SETTINGS: FocusSettings = {
  blockedSites: [],
  workSchedule: { ...DEFAULT_SCHEDULE },
  pauseMinutes: 15,
  isPaused: false,
  hardLockMode: false,
  theme: 'dark',
  showBadgeCountdown: true,
  weekStartsOn: 'monday',
};

const getDefaultStats = (): DailyStats => ({
  date: new Date().toISOString().split('T')[0],
  blockedAttempts: 0,
  timePausedSeconds: 0,
  sitesAccessed: {},
});

const getFromStorage = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const result = await syncQuotaGuard.safeGet<T>(key);
    return result ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

const setToStorage = async <T>(key: string, value: T): Promise<void> => {
  try {
    const backend = await syncQuotaGuard.safeSet(key, value);
    if (backend === 'indexeddb') {
      console.warn(`[FocusGuard] Key "${key}" stored in IndexedDB (sync quota exceeded).`);
    }
    if (key === STORAGE_KEYS.settings) {
      try {
        localStorage.setItem('focus-settings-cache', JSON.stringify(value));
      } catch {
        // Ignore localStorage errors
      }
    }
  } catch (e) {
    console.error('[FocusGuard] Storage error:', e);
  }
};

interface FocusStoreState {
  settings: FocusSettings;
  stats: DailyStats;
  historicalStats: HistoricalStats;
  activeTimers: ActiveTimer[];
  loading: boolean;
  isPremium: boolean;
  setSettings: (settings: FocusSettings) => void;
  setStats: (stats: DailyStats) => void;
  setHistoricalStats: (stats: HistoricalStats) => void;
  setActiveTimers: (timers: ActiveTimer[]) => void;
  setLoading: (loading: boolean) => void;
  setIsPremium: (isPremium: boolean) => void;
  updateSettings: (updates: Partial<FocusSettings>) => Promise<void>;
  addBlockedSite: (site: Omit<BlockedSite, 'id'>) => Promise<void>;
  updateBlockedSite: (id: string, updates: Partial<BlockedSite>) => Promise<void>;
  removeBlockedSite: (id: string) => Promise<void>;
  clearAllBlockedSites: () => Promise<void>;
  pauseBlocking: (minutes: number) => Promise<void>;
  resumeBlocking: () => Promise<void>;
  incrementBlockedAttempts: () => Promise<void>;
  addTimePaused: (seconds: number) => Promise<void>;
  isWithinWorkHours: () => boolean;
  loadInitialData: () => Promise<void>;
  loadHistoricalStats: () => Promise<void>;
  loadPremiumStatus: () => Promise<void>;
  activatePremium: (code: string) => Promise<boolean>;
  setupListeners: () => () => void;
}

// Premium activation codes
const VALID_PREMIUM_CODES = ['ZFOCUS-PREMIUM-2025', 'ZFOCUS-PREMIUM-2026', 'EARLY-ADOPTER-001', 'ZFOCUS-BETA-TESTER'];

export const useFocusStore = create<FocusStoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  stats: getDefaultStats(),
  historicalStats: {},
  activeTimers: [],
  loading: true,
  isPremium: false,

  setSettings: (settings: FocusSettings) => set({ settings }),
  setStats: (stats: DailyStats) => set({ stats }),
  setHistoricalStats: (historicalStats: HistoricalStats) => set({ historicalStats }),
  setActiveTimers: (activeTimers: ActiveTimer[]) => set({ activeTimers }),
  setLoading: (loading: boolean) => set({ loading }),
  setIsPremium: (isPremium: boolean) => set({ isPremium }),

  loadInitialData: async () => {
    try {
      const [settingsData, statsData] = await Promise.all([
        getFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
        getFromStorage(STORAGE_KEYS.stats, getDefaultStats()),
      ]);

      const today = new Date().toISOString().split('T')[0];
      if (statsData.date !== today) {
        const newStats = getDefaultStats();
        await setToStorage(STORAGE_KEYS.stats, newStats);
        set({ stats: newStats });
      } else {
        set({ stats: statsData });
      }

      set({ settings: settingsData });

      try {
        localStorage.setItem('focus-settings-cache', JSON.stringify(settingsData));
      } catch {
        // Ignore localStorage errors
      }

      try {
        chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TIMERS' }, response => {
          if (response?.timers) {
            set({ activeTimers: response.timers });
          }
        });
      } catch {
        // Background might not be ready
      }
    } catch (e) {
      console.error('[FocusGuard] Failed to load data:', e);
    } finally {
      set({ loading: false });
    }
  },

  loadHistoricalStats: async () => {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEYS.historicalStats]);
      const historicalStats = result[STORAGE_KEYS.historicalStats] || {};
      set({ historicalStats });
    } catch (e) {
      console.error('[FocusGuard] Failed to load historical stats:', e);
    }
  },

  setupListeners: () => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.settings]?.newValue) {
        set({ settings: changes[STORAGE_KEYS.settings].newValue });
      }
      if (changes[STORAGE_KEYS.stats]?.newValue) {
        set({ stats: changes[STORAGE_KEYS.stats].newValue });
      }
    };

    const handleLocalStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.historicalStats]?.newValue) {
        set({ historicalStats: changes[STORAGE_KEYS.historicalStats].newValue });
      }
    };

    chrome.storage.sync.onChanged.addListener(handleStorageChange);
    chrome.storage.local.onChanged.addListener(handleLocalStorageChange);

    const timerInterval = setInterval(() => {
      try {
        chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TIMERS' }, response => {
          if (response?.timers) {
            set({ activeTimers: response.timers });
          }
        });
      } catch {
        // Ignore
      }
    }, 1000);

    return () => {
      chrome.storage.sync.onChanged.removeListener(handleStorageChange);
      chrome.storage.local.onChanged.removeListener(handleLocalStorageChange);
      clearInterval(timerInterval);
    };
  },

  updateSettings: async (updates: Partial<FocusSettings>) => {
    const { settings } = get();
    const newSettings = { ...settings, ...updates };
    set({ settings: newSettings });
    await setToStorage(STORAGE_KEYS.settings, newSettings);
  },

  addBlockedSite: async (site: Omit<BlockedSite, 'id'>) => {
    const { settings } = get();
    const newSite: BlockedSite = {
      ...site,
      id: Date.now().toString(),
    };
    // Validate the new site
    validateBlockedSite(newSite);
    const newSettings = {
      ...settings,
      blockedSites: [...settings.blockedSites, newSite],
    };
    // Validate the complete settings
    validateFocusSettings(newSettings);
    set({ settings: newSettings });
    await setToStorage(STORAGE_KEYS.settings, newSettings);
  },

  updateBlockedSite: async (id: string, updates: Partial<BlockedSite>) => {
    const { settings } = get();
    const newSettings = {
      ...settings,
      blockedSites: settings.blockedSites.map((site: BlockedSite) => {
        if (site.id === id) {
          const updatedSite = { ...site, ...updates };
          // Validate the updated site
          validateBlockedSite(updatedSite);
          return updatedSite;
        }
        return site;
      }),
    };
    // Validate the complete settings
    validateFocusSettings(newSettings);
    set({ settings: newSettings });
    await setToStorage(STORAGE_KEYS.settings, newSettings);
  },

  removeBlockedSite: async (id: string) => {
    const { settings } = get();
    const newSettings = {
      ...settings,
      blockedSites: settings.blockedSites.filter(site => site.id !== id),
    };
    set({ settings: newSettings });
    await setToStorage(STORAGE_KEYS.settings, newSettings);
  },

  clearAllBlockedSites: async () => {
    const { settings } = get();
    const newSettings = {
      ...settings,
      blockedSites: [],
    };
    set({ settings: newSettings });
    await setToStorage(STORAGE_KEYS.settings, newSettings);

    // Also reset timers
    try {
      await syncQuotaGuard.safeSet(STORAGE_KEYS.timers, {});
      chrome.runtime.sendMessage({ type: 'RESET_TIMERS' });
    } catch {
      // Ignore errors
    }
  },

  pauseBlocking: async (minutes: number) => {
    const { settings } = get();
    if (settings.hardLockMode) return;

    const endTime = Date.now() + minutes * 60 * 1000;
    const newSettings = {
      ...settings,
      isPaused: true,
      pauseEndTime: endTime,
    };
    set({ settings: newSettings });
    await setToStorage(STORAGE_KEYS.settings, newSettings);

    try {
      chrome.runtime.sendMessage({ type: 'PAUSE_BLOCKING', minutes });
    } catch {
      // Ignore
    }
  },

  resumeBlocking: async () => {
    const { settings } = get();
    const newSettings = {
      ...settings,
      isPaused: false,
      pauseEndTime: undefined,
    };
    set({ settings: newSettings });
    await setToStorage(STORAGE_KEYS.settings, newSettings);

    try {
      chrome.runtime.sendMessage({ type: 'RESUME_BLOCKING' });
    } catch {
      // Ignore
    }
  },

  incrementBlockedAttempts: async () => {
    const { stats } = get();
    const newStats = {
      ...stats,
      blockedAttempts: stats.blockedAttempts + 1,
    };
    set({ stats: newStats });
    await setToStorage(STORAGE_KEYS.stats, newStats);
  },

  addTimePaused: async (seconds: number) => {
    const { stats } = get();
    const newStats = {
      ...stats,
      timePausedSeconds: stats.timePausedSeconds + seconds,
    };
    set({ stats: newStats });
    await setToStorage(STORAGE_KEYS.stats, newStats);
  },

  isWithinWorkHours: () => {
    const { settings } = get();
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const { workSchedule } = settings;

    if (!workSchedule.workDays.includes(currentDay)) {
      return false;
    }

    const [startHour, startMin] = workSchedule.startTime.split(':').map(Number);
    const [endHour, endMin] = workSchedule.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return currentTime >= startMinutes && currentTime <= endMinutes;
  },

  loadPremiumStatus: async () => {
    try {
      const isPremium = !!(await syncQuotaGuard.safeGet<boolean>('zfocus-premium'));
      console.log('[ZFocus] loadPremiumStatus: isPremium =', isPremium);
      set({ isPremium });
    } catch (e) {
      console.error('[ZFocus] loadPremiumStatus error:', e);
      set({ isPremium: false });
    }
  },

  activatePremium: async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();
    const isValid = VALID_PREMIUM_CODES.includes(normalizedCode);

    if (isValid) {
      try {
        await syncQuotaGuard.safeSet('zfocus-premium', true);
        await syncQuotaGuard.safeSet('zfocus-premium-code', normalizedCode);
        set({ isPremium: true });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  },
}));
