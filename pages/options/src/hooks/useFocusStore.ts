import { useState, useEffect, useCallback } from 'react';
import type { FocusSettings, DailyStats, BlockedSite, ActiveTimer } from '@extension/storage';

// Storage keys
const STORAGE_KEYS = {
  settings: 'focus-settings',
  stats: 'focus-stats',
  timers: 'focus-timers',
};

// Default values
const DEFAULT_SCHEDULE = {
  startTime: '00:00',
  endTime: '23:59',
  workDays: [0, 1, 2, 3, 4, 5, 6], // All days
  allowOutsideHours: true,
};

const DEFAULT_BLOCKED_SITES: BlockedSite[] = [
  {
    id: '1',
    title: 'seedGroupSocialMedia',
    urls: ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com'],
    allowedMinutesPerHour: 5, // 5 minutes per hour
    action: 'redirect',
    isActive: true,
    schedule: { ...DEFAULT_SCHEDULE },
  },
  {
    id: '2',
    title: 'seedGroupEntertainment',
    urls: ['youtube.com', 'netflix.com', 'twitch.tv'],
    allowedMinutesPerHour: 10,
    action: 'close',
    isActive: true,
    schedule: { ...DEFAULT_SCHEDULE },
  },
  {
    id: '3',
    title: 'seedGroupForums',
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
  showBadgeCountdown: true,
};

const getDefaultStats = (): DailyStats => ({
  date: new Date().toISOString().split('T')[0],
  blockedAttempts: 0,
  timePausedSeconds: 0,
  sitesAccessed: {},
});

// Chrome storage helpers
const getFromStorage = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const result = await chrome.storage.sync.get([key]);
    return result[key] ?? defaultValue;
  } catch {
    return defaultValue;
  }
};

const setToStorage = async <T>(key: string, value: T): Promise<void> => {
  try {
    await chrome.storage.sync.set({ [key]: value });
    // Cache settings to localStorage for instant theme loading (prevents flash)
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

export const useFocusStore = () => {
  const [settings, setSettings] = useState<FocusSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<DailyStats>(getDefaultStats());
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, statsData] = await Promise.all([
          getFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
          getFromStorage(STORAGE_KEYS.stats, getDefaultStats()),
        ]);

        // Ensure today's stats
        const today = new Date().toISOString().split('T')[0];
        if (statsData.date !== today) {
          const newStats = getDefaultStats();
          await setToStorage(STORAGE_KEYS.stats, newStats);
          setStats(newStats);
        } else {
          setStats(statsData);
        }

        setSettings(settingsData);

        // Cache to localStorage for instant theme loading on next visit
        try {
          localStorage.setItem('focus-settings-cache', JSON.stringify(settingsData));
        } catch {
          // Ignore localStorage errors
        }

        // Get active timers from background
        try {
          chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TIMERS' }, response => {
            if (response?.timers) {
              setActiveTimers(response.timers);
            }
          });
        } catch {
          // Background might not be ready
        }
      } catch (e) {
        console.error('[FocusGuard] Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[STORAGE_KEYS.settings]?.newValue) {
        setSettings(changes[STORAGE_KEYS.settings].newValue);
      }
      if (changes[STORAGE_KEYS.stats]?.newValue) {
        setStats(changes[STORAGE_KEYS.stats].newValue);
      }
    };

    chrome.storage.sync.onChanged.addListener(handleStorageChange);

    // Poll for active timers
    const timerInterval = setInterval(() => {
      try {
        chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TIMERS' }, response => {
          if (response?.timers) {
            setActiveTimers(response.timers);
          }
        });
      } catch {
        // Ignore
      }
    }, 1000);

    return () => {
      chrome.storage.sync.onChanged.removeListener(handleStorageChange);
      clearInterval(timerInterval);
    };
  }, []);

  // Apply theme (only after loading to prevent flash)
  useEffect(() => {
    if (loading) return; // Don't change theme while loading

    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme, loading]);

  const updateSettings = useCallback(
    async (updates: Partial<FocusSettings>) => {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await setToStorage(STORAGE_KEYS.settings, newSettings);
    },
    [settings],
  );

  const addBlockedSite = useCallback(
    async (site: Omit<BlockedSite, 'id'>) => {
      const newSite: BlockedSite = {
        ...site,
        id: Date.now().toString(),
      };
      const newSettings = {
        ...settings,
        blockedSites: [...settings.blockedSites, newSite],
      };
      setSettings(newSettings);
      await setToStorage(STORAGE_KEYS.settings, newSettings);
    },
    [settings],
  );

  const updateBlockedSite = useCallback(
    async (id: string, updates: Partial<BlockedSite>) => {
      const newSettings = {
        ...settings,
        blockedSites: settings.blockedSites.map(site => (site.id === id ? { ...site, ...updates } : site)),
      };
      setSettings(newSettings);
      await setToStorage(STORAGE_KEYS.settings, newSettings);
    },
    [settings],
  );

  const removeBlockedSite = useCallback(
    async (id: string) => {
      const newSettings = {
        ...settings,
        blockedSites: settings.blockedSites.filter(site => site.id !== id),
      };
      setSettings(newSettings);
      await setToStorage(STORAGE_KEYS.settings, newSettings);
    },
    [settings],
  );

  const pauseBlocking = useCallback(
    async (minutes: number) => {
      if (settings.hardLockMode) return;

      const endTime = Date.now() + minutes * 60 * 1000;
      const newSettings = {
        ...settings,
        isPaused: true,
        pauseEndTime: endTime,
      };
      setSettings(newSettings);
      await setToStorage(STORAGE_KEYS.settings, newSettings);

      try {
        chrome.runtime.sendMessage({ type: 'PAUSE_BLOCKING', minutes });
      } catch {
        // Ignore
      }
    },
    [settings],
  );

  const resumeBlocking = useCallback(async () => {
    const newSettings = {
      ...settings,
      isPaused: false,
      pauseEndTime: undefined,
    };
    setSettings(newSettings);
    await setToStorage(STORAGE_KEYS.settings, newSettings);

    try {
      chrome.runtime.sendMessage({ type: 'RESUME_BLOCKING' });
    } catch {
      // Ignore
    }
  }, [settings]);

  const incrementBlockedAttempts = useCallback(async () => {
    const newStats = {
      ...stats,
      blockedAttempts: stats.blockedAttempts + 1,
    };
    setStats(newStats);
    await setToStorage(STORAGE_KEYS.stats, newStats);
  }, [stats]);

  const addTimePaused = useCallback(
    async (seconds: number) => {
      const newStats = {
        ...stats,
        timePausedSeconds: stats.timePausedSeconds + seconds,
      };
      setStats(newStats);
      await setToStorage(STORAGE_KEYS.stats, newStats);
    },
    [stats],
  );

  const isWithinWorkHours = useCallback(() => {
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
  }, [settings]);

  return {
    settings,
    stats,
    activeTimers,
    loading,
    updateSettings,
    addBlockedSite,
    updateBlockedSite,
    removeBlockedSite,
    pauseBlocking,
    resumeBlocking,
    incrementBlockedAttempts,
    addTimePaused,
    isWithinWorkHours,
    setActiveTimers,
  };
};

export type { FocusSettings, DailyStats, BlockedSite, ActiveTimer };
