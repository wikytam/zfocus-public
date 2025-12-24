import { useState, useEffect, useCallback } from 'react';
import type { FocusSettings, DailyStats, BlockedSite, ActiveTimer } from '../types/focus';

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
    allowedMinutesPerHour: 5,
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
  workSchedule: {
    startTime: '08:00',
    endTime: '17:00',
    workDays: [1, 2, 3, 4, 5], // Monday to Friday
    allowOutsideHours: true,
  },
  pauseMinutes: 15,
  isPaused: false,
  hardLockMode: false,
  theme: 'dark',
};

const DEFAULT_STATS: DailyStats = {
  date: new Date().toISOString().split('T')[0],
  blockedAttempts: 24,
  timeSavedMinutes: 127,
  sitesAccessed: {},
};

export function useFocusStore() {
  const [settings, setSettings] = useState<FocusSettings>(() => {
    const saved = localStorage.getItem('focusSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [stats, setStats] = useState<DailyStats>(() => {
    const saved = localStorage.getItem('focusStats');
    const parsed = saved ? JSON.parse(saved) : DEFAULT_STATS;
    // Reset stats if it's a new day
    const today = new Date().toISOString().split('T')[0];
    if (parsed.date !== today) {
      return { ...DEFAULT_STATS, date: today };
    }
    return parsed;
  });

  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);

  useEffect(() => {
    localStorage.setItem('focusSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('focusStats', JSON.stringify(stats));
  }, [stats]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const updateSettings = useCallback((updates: Partial<FocusSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const addBlockedSite = useCallback((site: Omit<BlockedSite, 'id'>) => {
    const newSite: BlockedSite = {
      ...site,
      id: Date.now().toString(),
    };
    setSettings(prev => ({
      ...prev,
      blockedSites: [...prev.blockedSites, newSite],
    }));
  }, []);

  const updateBlockedSite = useCallback((id: string, updates: Partial<BlockedSite>) => {
    setSettings(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.map(site => (site.id === id ? { ...site, ...updates } : site)),
    }));
  }, []);

  const removeBlockedSite = useCallback((id: string) => {
    setSettings(prev => ({
      ...prev,
      blockedSites: prev.blockedSites.filter(site => site.id !== id),
    }));
  }, []);

  const pauseBlocking = useCallback(
    (minutes: number) => {
      if (settings.hardLockMode) return;
      const endTime = Date.now() + minutes * 60 * 1000;
      updateSettings({ isPaused: true, pauseEndTime: endTime });
    },
    [settings.hardLockMode, updateSettings],
  );

  const resumeBlocking = useCallback(() => {
    updateSettings({ isPaused: false, pauseEndTime: undefined });
  }, [updateSettings]);

  const incrementBlockedAttempts = useCallback(() => {
    setStats(prev => ({
      ...prev,
      blockedAttempts: prev.blockedAttempts + 1,
    }));
  }, []);

  const addTimeSaved = useCallback((minutes: number) => {
    setStats(prev => ({
      ...prev,
      timeSavedMinutes: prev.timeSavedMinutes + minutes,
    }));
  }, []);

  const isWithinWorkHours = useCallback(() => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const { workSchedule } = settings;

    // Check if it's a work day
    if (!workSchedule.workDays.includes(currentDay)) {
      return false;
    }

    // Parse work hours
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
    updateSettings,
    addBlockedSite,
    updateBlockedSite,
    removeBlockedSite,
    pauseBlocking,
    resumeBlocking,
    incrementBlockedAttempts,
    addTimeSaved,
    isWithinWorkHours,
    setActiveTimers,
  };
}

