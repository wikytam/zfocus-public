import { createStorage, StorageEnum } from '../base/index.js';

// Types
interface BlockedSite {
  id: string;
  title: string;
  urls: string[];
  exceptions?: string[]; // URLs to allow (whitelist)
  referrers?: string[]; // Block when coming from these referrers
  keywords?: string[]; // Block URLs containing these keywords
  allowedMinutesPerHour: number;
  countOnlyActiveTab?: boolean;
  action: 'close' | 'redirect';
  redirectUrl?: string;
  isActive: boolean;
  schedule: {
    startTime: string;
    endTime: string;
    workDays: number[];
    allowOutsideHours: boolean;
  };
}

interface FocusSettings {
  blockedSites: BlockedSite[];
  workSchedule: {
    startTime: string;
    endTime: string;
    workDays: number[];
    allowOutsideHours: boolean;
  };
  pauseMinutes: number;
  isPaused: boolean;
  pauseEndTime?: number;
  hardLockMode: boolean;
  theme: 'light' | 'dark' | 'system';
  showBadgeCountdown: boolean; // Show countdown timer on extension icon badge
}

interface DailyStats {
  date: string;
  blockedAttempts: number;
  timeSavedMinutes: number;
  sitesAccessed: Record<string, number>;
}

interface SiteTimer {
  siteId: string;
  siteName: string;
  usedSeconds: number;
  allowedSeconds: number;
  lastUpdate: number;
}

interface ActiveTimer {
  siteId: string;
  siteName: string;
  remainingSeconds: number;
  totalSeconds: number;
}

// Default values
const DEFAULT_SCHEDULE = {
  startTime: '08:00',
  endTime: '17:00',
  workDays: [1, 2, 3, 4, 5],
  allowOutsideHours: true,
};

const DEFAULT_BLOCKED_SITES: BlockedSite[] = [
  {
    id: '1',
    title: 'Mạng xã hội',
    urls: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com'],
    allowedMinutesPerHour: 5, // 5 minutes per hour
    action: 'redirect',
    isActive: true,
    schedule: { ...DEFAULT_SCHEDULE },
  },
  {
    id: '2',
    title: 'Giải trí',
    urls: ['youtube.com', 'netflix.com', 'twitch.tv'],
    allowedMinutesPerHour: 10,
    action: 'close',
    isActive: true,
    schedule: { ...DEFAULT_SCHEDULE },
  },
  {
    id: '3',
    title: 'Diễn đàn',
    urls: ['reddit.com', 'quora.com'],
    allowedMinutesPerHour: 3,
    action: 'redirect',
    isActive: false,
    schedule: { ...DEFAULT_SCHEDULE },
  },
];

const DEFAULT_SETTINGS: FocusSettings = {
  blockedSites: DEFAULT_BLOCKED_SITES,
  workSchedule: { ...DEFAULT_SCHEDULE },
  pauseMinutes: 15,
  isPaused: false,
  hardLockMode: false,
  theme: 'dark',
  showBadgeCountdown: true, // Default: show countdown on badge
};

const getDefaultStats = (): DailyStats => ({
  date: new Date().toISOString().split('T')[0],
  blockedAttempts: 0,
  timeSavedMinutes: 0,
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
    await settingsStorage.set(prev => ({ ...prev, ...updates }));
    // Update last sync timestamp for auto-sync
    await chrome.storage.sync.set({ 'focus-last-sync': Date.now() });
  },

  addBlockedSite: async (site: Omit<BlockedSite, 'id'>) => {
    const newSite: BlockedSite = {
      ...site,
      id: Date.now().toString(),
    };
    await settingsStorage.set(prev => ({
      ...prev,
      blockedSites: [...prev.blockedSites, newSite],
    }));
    await chrome.storage.sync.set({ 'focus-last-sync': Date.now() });
    return newSite;
  },

  updateBlockedSite: async (id: string, updates: Partial<BlockedSite>) => {
    await settingsStorage.set(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.map(site => (site.id === id ? { ...site, ...updates } : site)),
    }));
    await chrome.storage.sync.set({ 'focus-last-sync': Date.now() });
  },

  removeBlockedSite: async (id: string) => {
    await settingsStorage.set(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.filter(site => site.id !== id),
    }));
    await chrome.storage.sync.set({ 'focus-last-sync': Date.now() });
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
      await statsStorage.set(getDefaultStats());
    }
  },

  incrementBlocked: async () => {
    await statsStorage.set(prev => ({
      ...prev,
      blockedAttempts: prev.blockedAttempts + 1,
    }));
  },

  addTimeSaved: async (minutes: number) => {
    await statsStorage.set(prev => ({
      ...prev,
      timeSavedMinutes: prev.timeSavedMinutes + minutes,
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
export type { BlockedSite, FocusSettings, DailyStats, SiteTimer, ActiveTimer };
