import { validateBlockedSite, validateFocusSettings } from '../utils/validation.js';
import { captureException, captureMessage } from '../utils/sentry.js';
import { syncQuotaGuard } from '@extension/storage';
import { create } from 'zustand';
import type { FocusSettings, DailyStats, HistoricalStats, BlockedSite, ActiveTimer } from '../utils/validation.js';

const IS_DEV = process.env['CLI_CEB_DEV'] === 'true';

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
    if (backend === 'indexeddb' && IS_DEV) {
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
    captureException(e, { operation: 'setToStorage', key });
  }
};

type PremiumPlanType = 'yearly' | 'lifetime' | null;

interface PremiumInfo {
  planType: PremiumPlanType;
  expiresAt: string | null;
  code: string | null;
}

interface FocusStoreState {
  settings: FocusSettings;
  stats: DailyStats;
  historicalStats: HistoricalStats;
  activeTimers: ActiveTimer[];
  loading: boolean;
  isPremium: boolean;
  premiumInfo: PremiumInfo;
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

const API_URL = process.env['CEB_API_URL'] || 'https://z-focus-web.tamk-hoa.workers.dev';

const DEFAULT_PREMIUM_INFO: PremiumInfo = {
  planType: null,
  expiresAt: null,
  code: null,
};

const isPremiumExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

const getBrowserId = async (): Promise<string> => {
  try {
    const result = await syncQuotaGuard.safeGet<string>('zfocus-browser-id');
    if (result) return result;
    const id = crypto.randomUUID();
    await syncQuotaGuard.safeSet('zfocus-browser-id', id);
    return id;
  } catch {
    return 'unknown';
  }
};

export const useFocusStore = create<FocusStoreState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  stats: getDefaultStats(),
  historicalStats: {},
  activeTimers: [],
  loading: true,
  isPremium: false,
  premiumInfo: { ...DEFAULT_PREMIUM_INFO },

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
      captureException(e, { operation: 'loadInitialData' });
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
      captureException(e, { operation: 'loadHistoricalStats' });
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
      const [storedPremium, storedInfo, storedCode] = await Promise.all([
        syncQuotaGuard.safeGet<boolean>('zfocus-premium'),
        syncQuotaGuard.safeGet<PremiumInfo>('zfocus-premium-info'),
        syncQuotaGuard.safeGet<string>('zfocus-premium-code'),
      ]);

      if (!storedPremium) {
        set({ isPremium: false, premiumInfo: storedInfo ?? { ...DEFAULT_PREMIUM_INFO } });
        return;
      }

      // Fully resolved: lifetime
      if (storedInfo?.planType === 'lifetime') {
        if (IS_DEV) console.log('[ZFocus] Lifetime premium active');
        set({ isPremium: true, premiumInfo: storedInfo });
        return;
      }

      // Fully resolved: yearly WITH expiresAt
      if (storedInfo?.planType === 'yearly' && storedInfo.expiresAt) {
        if (isPremiumExpired(storedInfo.expiresAt)) {
          if (IS_DEV) console.log('[ZFocus] Yearly premium expired:', storedInfo.expiresAt);
          await syncQuotaGuard.safeSet('zfocus-premium', false);
          set({ isPremium: false, premiumInfo: storedInfo });
          return;
        }
        if (IS_DEV) console.log('[ZFocus] Yearly premium active, expires:', storedInfo.expiresAt);
        set({ isPremium: true, premiumInfo: storedInfo });
        return;
      }

      // Needs resolution: missing premiumInfo, missing planType, or yearly without expiresAt
      const code = storedInfo?.code ?? storedCode;
      if (!code) {
        if (IS_DEV) console.log('[ZFocus] Premium without code, deactivating');
        await syncQuotaGuard.safeSet('zfocus-premium', false);
        set({ isPremium: false, premiumInfo: { ...DEFAULT_PREMIUM_INFO } });
        return;
      }

      if (IS_DEV) console.log('[ZFocus] Resolving premium info via API for code:', code);
      try {
        const res = await fetch(`${API_URL}/api/promo/validate?code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (!data.valid) {
          if (IS_DEV) console.log('[ZFocus] Code invalid on server, deactivating');
          await syncQuotaGuard.safeSet('zfocus-premium', false);
          const info: PremiumInfo = { planType: null, expiresAt: null, code };
          await syncQuotaGuard.safeSet('zfocus-premium-info', info);
          set({ isPremium: false, premiumInfo: info });
          return;
        }

        const planType = (data.data.plan_type as PremiumPlanType) ?? 'yearly';
        let expiresAt: string | null = null;
        if (planType !== 'lifetime') {
          const days = data.data.duration_days ?? 365;
          const expDate = new Date();
          expDate.setDate(expDate.getDate() + days);
          expiresAt = expDate.toISOString();
        }

        const resolvedInfo: PremiumInfo = { planType, expiresAt, code };
        await syncQuotaGuard.safeSet('zfocus-premium-info', resolvedInfo);
        if (IS_DEV) console.log('[ZFocus] Premium info resolved:', resolvedInfo);
        set({ isPremium: true, premiumInfo: resolvedInfo });
      } catch (apiError) {
        if (IS_DEV)
          console.log('[ZFocus] API unreachable during premium resolution, keeping active temporarily', apiError);
        captureMessage('API unreachable during premium resolution, keeping active temporarily', 'warning', {
          code,
          storedPlanType: storedInfo?.planType ?? null,
        });
        const tempInfo: PremiumInfo = {
          planType: storedInfo?.planType ?? null,
          expiresAt: storedInfo?.expiresAt ?? null,
          code,
        };
        set({ isPremium: true, premiumInfo: tempInfo });
      }
    } catch (e) {
      captureException(e, { operation: 'loadPremiumStatus' });
      set({ isPremium: false, premiumInfo: { ...DEFAULT_PREMIUM_INFO } });
    }
  },

  activatePremium: async (code: string) => {
    const normalizedCode = code.trim().toUpperCase();

    try {
      const browserId = await getBrowserId();
      const response = await fetch(`${API_URL}/api/promo/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: normalizedCode,
          browser_id: browserId,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        captureMessage('Premium activation failed', 'warning', {
          error: result.error,
          code: normalizedCode,
        });
        return false;
      }

      const planType = result.data.plan_type as PremiumPlanType;
      const premiumInfo: PremiumInfo = {
        planType,
        expiresAt: planType === 'lifetime' ? null : result.data.premium_expires_at,
        code: normalizedCode,
      };

      await syncQuotaGuard.safeSet('zfocus-premium', true);
      await syncQuotaGuard.safeSet('zfocus-premium-info', premiumInfo);
      await syncQuotaGuard.safeSet('zfocus-premium-code', normalizedCode);
      set({ isPremium: true, premiumInfo });
      if (IS_DEV) console.log('[ZFocus] Premium activated:', premiumInfo);
      return true;
    } catch (e) {
      captureException(e, { operation: 'activatePremium', code: normalizedCode });
      return false;
    }
  },
}));
