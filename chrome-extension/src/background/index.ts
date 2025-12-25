import 'webextension-polyfill';
// Import i18n messages
import enMessages from '../../../packages/i18n/locales/en/messages.json';
import jaMessages from '../../../packages/i18n/locales/ja/messages.json';
import koMessages from '../../../packages/i18n/locales/ko/messages.json';
import viMessages from '../../../packages/i18n/locales/vi/messages.json';
import zhMessages from '../../../packages/i18n/locales/zh_CN/messages.json';

console.log('[FocusGuard] Background script loaded');

// i18n helper for background script
const MESSAGES: Record<string, Record<string, { message: string }>> = {
  en: enMessages,
  en_US: enMessages,
  en_GB: enMessages,
  ko: koMessages,
  ko_KR: koMessages,
  zh_CN: zhMessages,
  zh: zhMessages,
  ja: jaMessages,
  ja_JP: jaMessages,
  vi: viMessages,
  vi_VN: viMessages,
};

const translateTitle = async (title: string): Promise<string> => {
  // If title doesn't start with seedGroup, return as-is
  if (!title.startsWith('seedGroup')) {
    return title;
  }

  try {
    // Get user's language preference from settings
    const result = await chrome.storage.sync.get(['focus-settings']);
    const settings = result['focus-settings'];
    const userLang = settings?.language || chrome.i18n.getUILanguage();

    // Normalize locale
    const normalizedLocale = userLang.replace('-', '_');
    const messages = MESSAGES[normalizedLocale] || MESSAGES[userLang.split(/[-_]/)[0]] || MESSAGES.en;

    return messages[title]?.message || title;
  } catch {
    return title;
  }
};

// Migration helper for moving from local to sync storage
const migrateFromLocalToSync = async () => {
  try {
    // Check if data exists in local storage
    const localData = await chrome.storage.local.get(['focus-settings', 'focus-stats', 'focus-timers']);
    const hasLocalData = Object.keys(localData).length > 0;

    // Check if data exists in sync storage
    const syncData = await chrome.storage.sync.get(['focus-settings']);
    const hasSyncData = !!syncData['focus-settings'];

    // If local has data but sync doesn't, migrate
    if (hasLocalData && !hasSyncData) {
      console.log('[FocusGuard] Migrating data from local to sync storage...');
      await chrome.storage.sync.set(localData);
      console.log('[FocusGuard] Migration completed successfully');

      // Optionally clear local storage after migration
      // await chrome.storage.local.clear();
    }
  } catch (error) {
    console.error('[FocusGuard] Migration error:', error);
  }
};

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
  showBadgeCountdown: boolean;
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
  ],
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

// Track referrers for each tab
const tabReferrers: Map<number, string> = new Map();

// Update badge with countdown timer
const updateBadge = async (tabId: number, remainingSeconds: number) => {
  try {
    const settings = await getSettings();

    console.log(
      `[FocusGuard] updateBadge called for tab ${tabId}, remaining: ${remainingSeconds}s, showBadge: ${settings.showBadgeCountdown}`,
    );

    if (!settings.showBadgeCountdown) {
      // Clear badge if countdown is disabled
      await chrome.action.setBadgeText({ text: '', tabId });
      return;
    }

    // Convert to hours and minutes
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);

    let badgeText = '';
    if (hours > 0) {
      badgeText = `${hours}h`;
    } else if (minutes > 0) {
      badgeText = `${minutes}m`;
    } else if (remainingSeconds > 0) {
      badgeText = '<1m';
    } else {
      badgeText = '0';
    }

    // Set badge color based on remaining time
    let color: [number, number, number, number] = [34, 197, 94, 255]; // Green
    if (remainingSeconds < 300) {
      // Less than 5 minutes - Red
      color = [239, 68, 68, 255];
    } else if (remainingSeconds < 600) {
      // Less than 10 minutes - Orange
      color = [249, 115, 22, 255];
    }

    await chrome.action.setBadgeBackgroundColor({ color, tabId });
    await chrome.action.setBadgeText({ text: badgeText, tabId });

    console.log(`[FocusGuard] Badge updated: "${badgeText}" with color`, color);
  } catch (error) {
    console.error('[FocusGuard] Badge update error:', error);
  }
};

// Clear badge for a tab
const clearBadge = async (tabId: number) => {
  try {
    await chrome.action.setBadgeText({ text: '', tabId });
  } catch (error) {
    console.error('[FocusGuard] Clear badge error:', error);
  }
};

// Check if URL matches a blocked site
const matchesUrl = (url: string, site: BlockedSite, referrer?: string): boolean => {
  const isDev = process.env.NODE_ENV === 'development';

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    const fullPath = hostname + urlObj.pathname.toLowerCase();
    const fullUrl = url.toLowerCase();

    if (isDev) {
      console.log(`[FocusGuard] Checking URL: ${url} for site: ${site.title}`);
      console.log(`[FocusGuard] Referrer: ${referrer || 'none'}`);
    }

    // 1. Check exceptions - if URL matches any exception, allow access immediately
    if (site.exceptions && site.exceptions.length > 0) {
      for (const exception of site.exceptions) {
        const cleanException = exception.trim().toLowerCase();
        if (cleanException && (fullPath.includes(cleanException) || fullUrl.includes(cleanException))) {
          if (isDev) console.log(`[FocusGuard] Exception matched: ${cleanException} - allowing access`);
          return false; // Don't block
        }
      }
    }

    // 2. Check referrers FIRST - if coming from blocked referrer, block ANY external URL
    if (site.referrers && site.referrers.length > 0 && referrer) {
      try {
        const refHost = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
        for (const referrerDomain of site.referrers) {
          const cleanReferrer = referrerDomain.trim().toLowerCase();
          if (cleanReferrer && refHost.includes(cleanReferrer)) {
            if (isDev) console.log(`[FocusGuard] Referrer matched: ${cleanReferrer} - blocking ANY external link`);
            return true; // Block ANY link from this referrer
          }
        }
      } catch {
        if (isDev) console.log(`[FocusGuard] Invalid referrer URL`);
      }
    }

    // 3. Check keywords FIRST - applies to ALL URLs, not just those in URL list
    if (site.keywords && site.keywords.length > 0) {
      for (const keyword of site.keywords) {
        const cleanKeyword = keyword.trim().toLowerCase();
        if (cleanKeyword && fullUrl.includes(cleanKeyword)) {
          if (isDev) console.log(`[FocusGuard] Keyword matched: ${cleanKeyword} - blocking (applies to all URLs)`);
          return true; // Block
        }
      }
    }

    // 4. Check if URL matches main site patterns
    let matchesMainUrl = false;
    for (const pattern of site.urls) {
      const cleanPattern = pattern.trim().toLowerCase();
      if (!cleanPattern) continue;

      // Handle wildcard patterns (* and **)
      if (cleanPattern.includes('*')) {
        // ** = any path (greedy)
        // * = subdomain only (non-greedy, no dots)
        const regexPattern = cleanPattern
          .replace(/\./g, '\\.') // Escape dots
          .replace(/\*\*/g, '<<<DOUBLE>>>') // Temp placeholder
          .replace(/\*/g, '[^./]*') // Single * = any chars except . and /
          .replace(/<<<DOUBLE>>>/g, '.*'); // ** = any chars including . and /

        const regex = new RegExp(regexPattern, 'i');
        if (regex.test(hostname) || regex.test(fullPath)) {
          if (isDev) console.log(`[FocusGuard] Wildcard matched: ${pattern} -> ${fullPath}`);
          matchesMainUrl = true;
          break;
        }
        continue;
      }

      // Simple domain match (default - matches all subdomains and paths)
      if (hostname.includes(cleanPattern) || fullPath.startsWith(cleanPattern)) {
        if (isDev) console.log(`[FocusGuard] Domain matched: ${cleanPattern}`);
        matchesMainUrl = true;
        break;
      }
    }

    // 5. If URL matches main patterns, block
    if (matchesMainUrl) {
      if (isDev) console.log(`[FocusGuard] Main URL matched - blocking`);
      return true;
    }

    // If URL doesn't match main patterns and no keywords matched, don't block
    if (isDev) console.log(`[FocusGuard] URL doesn't match any blocking rules - not blocking`);
    return false;
  } catch (e) {
    if (isDev) console.error('[FocusGuard] Error matching URL:', e);
    return false;
  }
};

// Check if current time is within work hours
const isWithinWorkHours = (schedule: BlockedSite['schedule']): boolean => {
  const now = new Date();
  const currentDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    console.log(`[FocusGuard Schedule] Current time: ${now.toLocaleTimeString()}, Day: ${currentDay}`);
    console.log(
      `[FocusGuard Schedule] Work days: ${schedule.workDays}, Time: ${schedule.startTime} - ${schedule.endTime}`,
    );
    console.log(`[FocusGuard Schedule] Allow outside hours: ${schedule.allowOutsideHours}`);
  }

  // Check if current day is a work day
  if (!schedule.workDays.includes(currentDay)) {
    if (isDev) console.log(`[FocusGuard Schedule] ❌ Not a work day`);
    // If allowOutsideHours is true, allow access outside work days
    return !schedule.allowOutsideHours;
  }

  // Check if current time is within work hours
  const [startHour, startMin] = schedule.startTime.split(':').map(Number);
  const [endHour, endMin] = schedule.endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  const isWithinTime = currentMinutes >= startMinutes && currentMinutes <= endMinutes;

  if (isDev) {
    console.log(`[FocusGuard Schedule] Current minutes: ${currentMinutes}, Range: ${startMinutes} - ${endMinutes}`);
    console.log(`[FocusGuard Schedule] Within time range: ${isWithinTime}`);
  }

  // If within work hours, block. If outside work hours, check allowOutsideHours
  if (isWithinTime) {
    if (isDev) console.log(`[FocusGuard Schedule] ✅ Within work hours - BLOCK`);
    return true;
  } else {
    // Outside work hours
    if (isDev) console.log(`[FocusGuard Schedule] Outside work hours - Allow: ${!schedule.allowOutsideHours}`);
    return !schedule.allowOutsideHours;
  }
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
    if (matchesUrl(url, site, referrer)) {
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
  clearBadge(tabId);
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

  // Update badge immediately when starting timer
  const initialRemainingSeconds = Math.max(0, timer.allowedSeconds - timer.usedSeconds);
  await updateBadge(tabId, initialRemainingSeconds);
  console.log(
    `[FocusGuard] Started timer for tab ${tabId}, site: ${site.title}, remaining: ${initialRemainingSeconds}s`,
  );

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
      if (site.countOnlyActiveTab !== false) {
        // Default to true if not set
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

      // Calculate remaining time
      const remainingSeconds = Math.max(0, currentTimer.allowedSeconds - newUsedSeconds);

      // Update badge with countdown
      await updateBadge(tabId, remainingSeconds);

      // Send message to content script with remaining time
      try {
        const translatedTitle = await translateTitle(site.title);
        await chrome.tabs.sendMessage(tabId, {
          type: 'TIMER_UPDATE',
          data: {
            siteId: site.id,
            siteName: translatedTitle,
            usedSeconds: newUsedSeconds,
            allowedSeconds: currentTimer.allowedSeconds,
            remainingSeconds,
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

// Listen for referrer messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REFERRER_CAPTURED' && sender.tab?.id) {
    console.log(`[FocusGuard] Received referrer from content script for tab ${sender.tab.id}: ${message.referrer}`);
    tabReferrers.set(sender.tab.id, message.referrer);
    sendResponse({ received: true });
  }
  return true; // Keep message channel open for async response
});

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) console.log(`[FocusGuard] Tab ${tabId} updated:`, changeInfo.status, tab.url);

  if (changeInfo.status !== 'complete' || !tab.url) return;

  // Skip chrome:// and extension pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    clearTabTimer(tabId);
    return;
  }

  if (isDev) console.log(`[FocusGuard] Checking URL: ${tab.url}`);
  const referrer = tabReferrers.get(tabId);
  const site = await findBlockedSite(tab.url, referrer);
  if (site) {
    if (isDev) console.log(`[FocusGuard] ✅ MATCHED! Detected blocked site: ${site.title} on ${tab.url}`);
    await startTabTimer(tabId, site);
  } else {
    if (isDev) console.log(`[FocusGuard] ❌ No match for: ${tab.url}`);
    clearTabTimer(tabId);
  }

  // Clean up referrer after use
  tabReferrers.delete(tabId);
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
chrome.tabs.onRemoved.addListener(tabId => {
  clearTabTimer(tabId);
});

// Listen for storage changes to update badges
chrome.storage.sync.onChanged.addListener(changes => {
  if (changes['focus-settings']) {
    const newSettings = changes['focus-settings'].newValue as FocusSettings;

    // If badge countdown was disabled, clear all badges
    if (!newSettings.showBadgeCountdown) {
      chrome.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
          if (tab.id) clearBadge(tab.id);
        });
      });
    } else {
      // If enabled, update badges for active timers
      chrome.tabs.query({}).then(async tabs => {
        const timers = await getTimers();
        tabs.forEach(tab => {
          if (tab.id && tabSiteMapping.has(tab.id)) {
            const siteId = tabSiteMapping.get(tab.id);
            const timer = timers[siteId!];
            if (timer) {
              const remainingSeconds = Math.max(0, timer.allowedSeconds - timer.usedSeconds);
              updateBadge(tab.id, remainingSeconds);
            }
          }
        });
      });
    }
  }
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
  // First, try to migrate from local storage if needed
  await migrateFromLocalToSync();

  const result = await chrome.storage.sync.get([STORAGE_KEYS.settings]);
  if (!result[STORAGE_KEYS.settings]) {
    await setSettings(DEFAULT_SETTINGS);
    console.log('[FocusGuard] Initialized default settings');
  } else {
    const settings = result[STORAGE_KEYS.settings];
    console.log('[FocusGuard] Loaded settings with', settings.blockedSites?.length || 0, 'blocked sites');
    settings.blockedSites?.forEach((site: BlockedSite) => {
      console.log(`[FocusGuard] Site: ${site.title}, URLs: ${site.urls.join(', ')}, Active: ${site.isActive}`);
    });
  }
})();

console.log('[FocusGuard] Background script initialized');
