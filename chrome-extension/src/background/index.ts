import 'webextension-polyfill';

console.log('[FocusGuard] Background script loaded');

// Types
interface BlockedSite {
  id: string;
  title: string;
  urls: string[];
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

const DEFAULT_SETTINGS: FocusSettings = {
  blockedSites: [
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
  ],
  workSchedule: { ...DEFAULT_SCHEDULE },
  pauseMinutes: 15,
  isPaused: false,
  hardLockMode: false,
  theme: 'dark',
};

const getDefaultStats = (): DailyStats => ({
  date: new Date().toISOString().split('T')[0],
  blockedAttempts: 0,
  timeSavedMinutes: 0,
  sitesAccessed: {},
});

// Storage helpers
const getSettings = async (): Promise<FocusSettings> => {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.settings]);
  return result[STORAGE_KEYS.settings] ?? DEFAULT_SETTINGS;
};

const setSettings = async (settings: FocusSettings): Promise<void> => {
  await chrome.storage.sync.set({ [STORAGE_KEYS.settings]: settings });
};

const getStats = async (): Promise<DailyStats> => {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.stats]);
  const stats = result[STORAGE_KEYS.stats] ?? getDefaultStats();
  
  // Reset if new day
  const today = new Date().toISOString().split('T')[0];
  if (stats.date !== today) {
    const newStats = getDefaultStats();
    await chrome.storage.sync.set({ [STORAGE_KEYS.stats]: newStats });
    return newStats;
  }
  return stats;
};

const updateStats = async (updates: Partial<DailyStats>): Promise<void> => {
  const stats = await getStats();
  await chrome.storage.sync.set({ [STORAGE_KEYS.stats]: { ...stats, ...updates } });
};

const getTimers = async (): Promise<Record<string, SiteTimer>> => {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.timers]);
  return result[STORAGE_KEYS.timers] ?? {};
};

const setTimers = async (timers: Record<string, SiteTimer>): Promise<void> => {
  await chrome.storage.sync.set({ [STORAGE_KEYS.timers]: timers });
};

// Track active tabs and their timers
const activeTabTimers: Map<number, ReturnType<typeof setInterval>> = new Map();
const tabSiteMapping: Map<number, string> = new Map();

// Check if URL matches a blocked site pattern
const matchesUrl = (url: string, patterns: string[], referrer?: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    const fullPath = hostname + urlObj.pathname.toLowerCase();
    const fullUrl = url.toLowerCase();

    // First check exceptions (+) - if URL matches any exception, return false
    for (const pattern of patterns) {
      const cleanPattern = pattern.trim().toLowerCase();
      if (cleanPattern.startsWith('+')) {
        const exceptionPath = cleanPattern.substring(1);
        if (fullPath.includes(exceptionPath) || fullUrl.includes(exceptionPath)) {
          console.log(`[FocusGuard] Exception matched: ${exceptionPath} - allowing access`);
          return false; // Exception matched, don't block
        }
      }
    }

    // Check if any blocking pattern matches
    for (const pattern of patterns) {
      const cleanPattern = pattern.trim().toLowerCase();
      
      // Skip exception patterns (already handled above)
      if (cleanPattern.startsWith('+')) {
        continue;
      }

      // Handle referrer pattern (>)
      if (cleanPattern.startsWith('>')) {
        const referrerDomain = cleanPattern.substring(1);
        if (referrer) {
          try {
            const refHost = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
            if (refHost.includes(referrerDomain)) {
              console.log(`[FocusGuard] Referrer matched: ${referrerDomain}`);
              return true;
            }
          } catch {
            // Invalid referrer URL
          }
        }
        continue;
      }

      // Handle keyword pattern (~)
      if (cleanPattern.startsWith('~')) {
        const keyword = cleanPattern.substring(1);
        if (fullUrl.includes(keyword)) {
          console.log(`[FocusGuard] Keyword matched: ${keyword}`);
          return true;
        }
        continue;
      }

      // Handle wildcard patterns (* and **)
      if (cleanPattern.includes('*')) {
        // ** = any path (greedy)
        // * = subdomain only (non-greedy, no dots)
        const regexPattern = cleanPattern
          .replace(/\./g, '\\.')           // Escape dots
          .replace(/\*\*/g, '<<<DOUBLE>>>') // Temp placeholder
          .replace(/\*/g, '[^./]*')         // Single * = any chars except . and /
          .replace(/<<<DOUBLE>>>/g, '.*');  // ** = any chars including . and /
        
        const regex = new RegExp(regexPattern, 'i');
        if (regex.test(hostname) || regex.test(fullPath)) {
          console.log(`[FocusGuard] Wildcard matched: ${pattern} -> ${fullPath}`);
          return true;
        }
        continue;
      }

      // Simple domain match
      if (hostname.includes(cleanPattern) || fullPath.startsWith(cleanPattern)) {
        console.log(`[FocusGuard] Domain matched: ${cleanPattern}`);
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('[FocusGuard] Error matching URL:', e);
    return false;
  }
};

// Check if current time is within work hours
const isWithinWorkHours = (schedule: BlockedSite['schedule']): boolean => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (!schedule.workDays.includes(currentDay)) {
    return false;
  }

  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
};

// Find matching blocked site for URL
const findBlockedSite = async (url: string, referrer?: string): Promise<BlockedSite | null> => {
  const settings = await getSettings();
  
  // Check if paused
  if (settings.isPaused) {
    if (settings.pauseEndTime && Date.now() > settings.pauseEndTime) {
      // Pause expired, resume blocking
      await setSettings({ ...settings, isPaused: false, pauseEndTime: undefined });
    } else {
      return null;
    }
  }

  for (const site of settings.blockedSites) {
    if (!site.isActive) continue;
    if (!isWithinWorkHours(site.schedule)) continue;
    if (matchesUrl(url, site.urls, referrer)) {
      return site;
    }
  }
  return null;
};

// Get or create timer for a site
const getOrCreateTimer = async (site: BlockedSite): Promise<SiteTimer> => {
  const timers = await getTimers();
  let timer = timers[site.id];
  const now = Date.now();
  const hourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000);

  if (!timer || timer.lastUpdate < hourStart) {
    timer = {
      siteId: site.id,
      siteName: site.title,
      usedSeconds: 0,
      allowedSeconds: site.allowedMinutesPerHour * 60, // Convert minutes to seconds
      lastUpdate: now,
    };
    timers[site.id] = timer;
    await setTimers(timers);
  }

  return timer;
};

// Handle blocking action
const handleBlocking = async (tabId: number, site: BlockedSite) => {
  console.log(`[FocusGuard] Blocking ${site.title} - Action: ${site.action}`);
  
  // Increment blocked attempts
  const stats = await getStats();
  await updateStats({ blockedAttempts: stats.blockedAttempts + 1 });

  if (site.action === 'close') {
    try {
      await chrome.tabs.remove(tabId);
    } catch (e) {
      console.error('[FocusGuard] Failed to close tab:', e);
    }
  } else if (site.action === 'redirect') {
    const redirectUrl = site.redirectUrl || chrome.runtime.getURL('options/index.html');
    try {
      await chrome.tabs.update(tabId, { url: redirectUrl });
    } catch (e) {
      console.error('[FocusGuard] Failed to redirect tab:', e);
    }
  }

  clearTabTimer(tabId);
};

// Clear timer for a tab
const clearTabTimer = (tabId: number) => {
  const existingTimer = activeTabTimers.get(tabId);
  if (existingTimer) {
    clearInterval(existingTimer);
    activeTabTimers.delete(tabId);
  }
  tabSiteMapping.delete(tabId);
};

// Start tracking time for a tab
const startTabTimer = async (tabId: number, site: BlockedSite) => {
  clearTabTimer(tabId);
  tabSiteMapping.set(tabId, site.id);

  const timer = await getOrCreateTimer(site);
  
  // Check if already exceeded time
  if (timer.usedSeconds >= timer.allowedSeconds) {
    await handleBlocking(tabId, site);
    return;
  }

  // Start interval to track time
  const interval = setInterval(async () => {
    try {
      // Check if tab still exists
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      if (!tab) {
        clearTabTimer(tabId);
        return;
      }

      // If site has countOnlyActiveTab enabled, check if tab is active
      if (site.countOnlyActiveTab !== false) { // Default to true if not set
        const activeTab = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!activeTab[0] || activeTab[0].id !== tabId) {
          // Tab is not active, skip counting this second
          return;
        }
      }

      // Get current timers
      const timers = await getTimers();
      const currentTimer = timers[site.id];
      if (!currentTimer) {
        clearTabTimer(tabId);
        return;
      }

      // Increment used time
      const newUsedSeconds = currentTimer.usedSeconds + 1;
      timers[site.id] = {
        ...currentTimer,
        usedSeconds: newUsedSeconds,
        lastUpdate: Date.now(),
      };
      await setTimers(timers);

      // Track stats every minute
      if (newUsedSeconds % 60 === 0) {
        const stats = await getStats();
        await updateStats({
          sitesAccessed: {
            ...stats.sitesAccessed,
            [site.id]: (stats.sitesAccessed[site.id] || 0) + 60,
          },
        });
      }

      // Check if time exceeded
      if (newUsedSeconds >= currentTimer.allowedSeconds) {
        // Add saved time to stats
        const savedMinutes = Math.ceil(currentTimer.allowedSeconds / 60);
        const stats = await getStats();
        await updateStats({ timeSavedMinutes: stats.timeSavedMinutes + savedMinutes });
        
        await handleBlocking(tabId, site);
        return;
      }

      // Send message to content script with remaining time
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'TIMER_UPDATE',
          data: {
            siteId: site.id,
            siteName: site.title,
            usedSeconds: newUsedSeconds,
            allowedSeconds: currentTimer.allowedSeconds,
            remainingSeconds: Math.max(0, currentTimer.allowedSeconds - newUsedSeconds),
          },
        });
      } catch {
        // Content script might not be ready
      }
    } catch (e) {
      console.error('[FocusGuard] Timer error:', e);
      clearTabTimer(tabId);
    }
  }, 1000);

  activeTabTimers.set(tabId, interval);
};

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  
  // Skip chrome:// and extension pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    clearTabTimer(tabId);
    return;
  }

  const site = await findBlockedSite(tab.url);
  if (site) {
    console.log(`[FocusGuard] Detected blocked site: ${site.title} on ${tab.url}`);
    await startTabTimer(tabId, site);
  } else {
    clearTabTimer(tabId);
  }
});

// Handle tab activation
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return;

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }

    const site = await findBlockedSite(tab.url);
    if (site && !activeTabTimers.has(tabId)) {
      await startTabTimer(tabId, site);
    }
  } catch (e) {
    console.error('[FocusGuard] Tab activation error:', e);
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  clearTabTimer(tabId);
});

// Handle messages from popup/options
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_ACTIVE_TIMERS') {
    (async () => {
      const timers = await getTimers();
      const activeTimers = Object.values(timers).map(timer => ({
        siteId: timer.siteId,
        siteName: timer.siteName,
        remainingSeconds: Math.max(0, timer.allowedSeconds - timer.usedSeconds),
        totalSeconds: timer.allowedSeconds,
      }));
      sendResponse({ timers: activeTimers });
    })();
    return true;
  }

  if (message.type === 'GET_STATS') {
    (async () => {
      const stats = await getStats();
      sendResponse({ stats });
    })();
    return true;
  }

  if (message.type === 'PAUSE_BLOCKING') {
    (async () => {
      const settings = await getSettings();
      const endTime = Date.now() + message.minutes * 60 * 1000;
      await setSettings({ ...settings, isPaused: true, pauseEndTime: endTime });
      
      // Clear all active timers
      activeTabTimers.forEach((timer, tabId) => {
        clearInterval(timer);
        activeTabTimers.delete(tabId);
      });
      tabSiteMapping.clear();
      
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.type === 'RESUME_BLOCKING') {
    (async () => {
      const settings = await getSettings();
      await setSettings({ ...settings, isPaused: false, pauseEndTime: undefined });
      
      // Re-check all tabs
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          const site = await findBlockedSite(tab.url);
          if (site) {
            await startTabTimer(tab.id, site);
          }
        }
      }
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.type === 'RESET_TIMERS') {
    (async () => {
      await setTimers({});
      sendResponse({ success: true });
    })();
    return true;
  }

  return false;
});

// Reset timers at the start of each hour
const scheduleHourlyReset = () => {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  const msUntilNextHour = nextHour.getTime() - now.getTime();

  setTimeout(async () => {
    console.log('[FocusGuard] Hourly reset');
    await setTimers({});
    scheduleHourlyReset();
  }, msUntilNextHour);
};

scheduleHourlyReset();

// Check pause expiration periodically
setInterval(async () => {
  const settings = await getSettings();
  if (settings.isPaused && settings.pauseEndTime && Date.now() > settings.pauseEndTime) {
    await setSettings({ ...settings, isPaused: false, pauseEndTime: undefined });
    console.log('[FocusGuard] Pause expired, resuming blocking');
    
    // Re-check all tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        const site = await findBlockedSite(tab.url);
        if (site) {
          await startTabTimer(tab.id, site);
        }
      }
    }
  }
}, 10000);

// Initialize default settings if not present
(async () => {
  const result = await chrome.storage.sync.get([STORAGE_KEYS.settings]);
  if (!result[STORAGE_KEYS.settings]) {
    await setSettings(DEFAULT_SETTINGS);
    console.log('[FocusGuard] Initialized default settings');
  }
})();

console.log('[FocusGuard] Background script initialized');
