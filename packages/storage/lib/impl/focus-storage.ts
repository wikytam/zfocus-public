import { validateHistoricalStats, validateBlockedSite } from '../../../shared/lib/utils/validation.js';
import { createStorage, StorageEnum, syncQuotaGuard } from '../base/index.js';
import type {
  FocusSettings,
  DailyStats,
  HistoricalStats,
  ActiveTimer,
  BlockedSite,
} from '../../../shared/lib/utils/validation.js';

// Legacy types for backward compatibility
interface SiteTimer {
  siteId: string;
  siteName: string;
  usedSeconds: number;
  allowedSeconds: number;
  lastUpdate: number;
}

// Default values
const DEFAULT_SCHEDULE = {
  startTime: '08:00',
  endTime: '17:00',
  workDays: [1, 2, 3, 4, 5],
  allowOutsideHours: true,
};

const DEFAULT_SETTINGS: FocusSettings = {
  blockedSites: [],
  workSchedule: { ...DEFAULT_SCHEDULE },
  pauseMinutes: 15,
  isPaused: false,
  hardLockMode: false,
  theme: 'dark',
  showBadgeCountdown: true, // Default: show countdown on badge
  language: undefined, // Auto-detect by default
  errorReportingEnabled: false, // Default: off - user must opt-in during onboarding
};

const getDefaultStats = (): DailyStats => ({
  date: new Date().toISOString().split('T')[0],
  blockedAttempts: 0,
  timePausedSeconds: 0,
  sitesAccessed: {},
});

// Create storage instances
const settingsStorage = createStorage<FocusSettings>('focus-settings', DEFAULT_SETTINGS, {
  storageEnum: StorageEnum.Sync,
  liveUpdate: true,
});

const statsStorage = createStorage<DailyStats>('focus-stats', getDefaultStats(), {
  storageEnum: StorageEnum.Sync,
  liveUpdate: true,
});

const historicalStatsStorage = createStorage<HistoricalStats>(
  'focus-historical-stats',
  {},
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

const timersStorage = createStorage<Record<string, SiteTimer>>(
  'focus-timers',
  {},
  {
    storageEnum: StorageEnum.Sync,
    liveUpdate: true,
  },
);

// Export storage with helper methods
export const focusSettingsStorage = {
  ...settingsStorage,

  updateSettings: async (updates: Partial<FocusSettings>) => {
    // Validate updates before applying
    if (updates.blockedSites) {
      updates.blockedSites.forEach(site => validateBlockedSite(site));
    }
    await settingsStorage.set(prev => ({ ...prev, ...updates }));
    // Update last sync timestamp for auto-sync
    await syncQuotaGuard.safeSet('focus-last-sync', Date.now());
  },

  addBlockedSite: async (site: Omit<BlockedSite, 'id'>) => {
    const newSite: BlockedSite = {
      ...site,
      id: Date.now().toString(),
    };
    // Validate the new site before adding
    validateBlockedSite(newSite);
    await settingsStorage.set(prev => ({
      ...prev,
      blockedSites: [...prev.blockedSites, newSite],
    }));
    await syncQuotaGuard.safeSet('focus-last-sync', Date.now());
    return newSite;
  },

  updateBlockedSite: async (id: string, updates: Partial<BlockedSite>) => {
    await settingsStorage.set(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.map(site => {
        if (site.id === id) {
          const updatedSite = { ...site, ...updates };
          // Validate the updated site
          validateBlockedSite(updatedSite);
          return updatedSite;
        }
        return site;
      }),
    }));
    await syncQuotaGuard.safeSet('focus-last-sync', Date.now());
  },

  removeBlockedSite: async (id: string) => {
    await settingsStorage.set(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.filter(site => site.id !== id),
    }));
    await syncQuotaGuard.safeSet('focus-last-sync', Date.now());
  },

  pauseBlocking: async (minutes: number) => {
    const endTime = Date.now() + minutes * 60 * 1000;
    await settingsStorage.set(prev => ({
      ...prev,
      isPaused: true,
      pauseEndTime: endTime,
    }));
  },

  resumeBlocking: async () => {
    await settingsStorage.set(prev => ({
      ...prev,
      isPaused: false,
      pauseEndTime: undefined,
    }));
  },
};

export const focusStatsStorage = {
  ...statsStorage,

  ensureToday: async () => {
    const stats = await statsStorage.get();
    const today = new Date().toISOString().split('T')[0];
    if (stats.date !== today) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { date: _date, ...oldStats } = stats;

      if (
        oldStats.blockedAttempts > 0 ||
        oldStats.timePausedSeconds > 0 ||
        Object.keys(oldStats.sitesAccessed).length > 0
      ) {
        await historicalStatsStorage.set(prev => {
          const newHistory = { ...prev, [stats.date]: oldStats };
          const dates = Object.keys(newHistory).sort();
          if (dates.length > 30) {
            const toRemove = dates.slice(0, dates.length - 30);
            toRemove.forEach(date => delete newHistory[date]);
          }
          return newHistory;
        });
      }

      await statsStorage.set(getDefaultStats());
    }
  },

  incrementBlocked: async () => {
    await statsStorage.set(prev => ({
      ...prev,
      blockedAttempts: prev.blockedAttempts + 1,
    }));
  },

  addTimePaused: async (seconds: number) => {
    await statsStorage.set(prev => ({
      ...prev,
      timePausedSeconds: prev.timePausedSeconds + seconds,
    }));
  },

  trackSiteAccess: async (siteId: string, seconds: number) => {
    await statsStorage.set(prev => ({
      ...prev,
      sitesAccessed: {
        ...prev.sitesAccessed,
        [siteId]: (prev.sitesAccessed[siteId] || 0) + seconds,
      },
    }));
  },
};

export const focusHistoricalStatsStorage = {
  ...historicalStatsStorage,

  getLastNDays: async (days: number = 30): Promise<HistoricalStats> => {
    const allStats = await historicalStatsStorage.get();
    // Validate all stats data
    let validatedStats: HistoricalStats;
    try {
      validatedStats = validateHistoricalStats(allStats);
    } catch {
      validatedStats = {};
    }
    const dates = Object.keys(validatedStats).sort().slice(-days);
    const result: HistoricalStats = {};
    dates.forEach(date => {
      result[date] = validatedStats[date];
    });
    return result;
  },

  get: async (): Promise<HistoricalStats> => {
    const data = await historicalStatsStorage.get();
    return validateHistoricalStats(data);
  },

  cleanOldData: async () => {
    await historicalStatsStorage.set(prev => {
      const dates = Object.keys(prev).sort();
      if (dates.length > 30) {
        const newHistory: HistoricalStats = {};
        dates.slice(-30).forEach(date => {
          newHistory[date] = prev[date];
        });
        return newHistory;
      }
      return prev;
    });
  },
};

export const focusTimersStorage = {
  ...timersStorage,

  getTimer: async (siteId: string): Promise<SiteTimer | null> => {
    const timers = await timersStorage.get();
    return timers[siteId] || null;
  },

  updateTimer: async (siteId: string, timer: SiteTimer) => {
    await timersStorage.set(prev => ({
      ...prev,
      [siteId]: timer,
    }));
  },

  resetTimer: async (siteId: string) => {
    await timersStorage.set(prev => {
      const newTimers = { ...prev };
      delete newTimers[siteId];
      return newTimers;
    });
  },

  resetAllTimers: async () => {
    await timersStorage.set({});
  },
};

// Export types at the end
export type { BlockedSite, FocusSettings, DailyStats, HistoricalStats, SiteTimer, ActiveTimer };
