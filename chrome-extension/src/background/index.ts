import 'webextension-polyfill';
// Import i18n messages
import { cleanupRegistry } from './cleanup-registry';
import enMessages from '../../../packages/i18n/locales/en/messages.json';
import jaMessages from '../../../packages/i18n/locales/ja/messages.json';
import koMessages from '../../../packages/i18n/locales/ko/messages.json';
import viMessages from '../../../packages/i18n/locales/vi/messages.json';
import zhMessages from '../../../packages/i18n/locales/zh_CN/messages.json';

console.log('[ZFocus] Background script loaded');

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
      console.log('[ZFocus] Migrating data from local to sync storage...');
      await chrome.storage.sync.set(localData);
      console.log('[ZFocus] Migration completed successfully');

      // Optionally clear local storage after migration
      // await chrome.storage.local.clear();
    }
  } catch (error) {
    console.error('[ZFocus] Migration error:', error);
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
  timePausedSeconds: number;
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
  timePausedSeconds: 0,
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
  // Return cache if available
  if (Object.keys(timerCache).length > 0) {
    return timerCache;
  }
  const result = await chrome.storage.sync.get([STORAGE_KEYS.timers]);
  const timers = result[STORAGE_KEYS.timers] ?? {};
  // Update cache
  Object.assign(timerCache, timers);
  return timers;
};

const setTimers = async (timers: Record<string, SiteTimer>): Promise<void> => {
  // Update cache immediately
  Object.assign(timerCache, timers);
  // Write to storage (this will be batched)
  await chrome.storage.sync.set({ [STORAGE_KEYS.timers]: timers });
};

// Batch timer updates to reduce storage writes
let pendingTimerUpdate: NodeJS.Timeout | null = null;
const TIMER_BATCH_INTERVAL = 10000; // Write to storage every 10 seconds instead of every second

const batchUpdateTimer = (siteId: string, updates: Partial<SiteTimer>) => {
  // Update in-memory cache immediately
  if (timerCache[siteId]) {
    const oldValue = timerCache[siteId].usedSeconds;
    timerCache[siteId] = { ...timerCache[siteId], ...updates };
    console.log(
      `[ZFocus DEBUG] Batch update cache: ${siteId}, usedSeconds: ${oldValue} -> ${timerCache[siteId].usedSeconds}`,
    );
  } else {
    console.error(`[ZFocus ERROR ${new Date().toISOString()}] Batch update called for missing cache entry: ${siteId}`);
  }

  // Enforce cache size limit
  enforceCacheLimit();

  // Debounce storage write
  if (pendingTimerUpdate) {
    clearTimeout(pendingTimerUpdate);
  }

  pendingTimerUpdate = setTimeout(async () => {
    try {
      console.log(
        `[ZFocus DEBUG ${new Date().toISOString()}] Writing timer cache to storage after ${TIMER_BATCH_INTERVAL}ms:`,
        timerCache,
      );
      await chrome.storage.sync.set({ [STORAGE_KEYS.timers]: timerCache });
      pendingTimerUpdate = null;
    } catch (error) {
      console.error(`[ZFocus ERROR ${new Date().toISOString()}] Batch timer update error:`, error);
    }
  }, TIMER_BATCH_INTERVAL);
};

// Track active tabs and their timers
const activeTabTimers: Map<number, ReturnType<typeof setInterval>> = new Map();
const tabSiteMapping: Map<number, string> = new Map();
// CRITICAL: Prevent race condition when multiple startTabTimer calls happen simultaneously
const timerInitializationInProgress = new Set<number>();

// Track referrers for each tab
const tabReferrers: Map<number, string> = new Map();

// In-memory timer cache to reduce storage writes
const timerCache: Record<string, SiteTimer> = {};
const MAX_CACHE_SIZE = 50;

// Helper to enforce cache size limit
const enforceCacheLimit = () => {
  const keys = Object.keys(timerCache);
  if (keys.length > MAX_CACHE_SIZE) {
    // Remove oldest entries (first 10)
    const toRemove = keys.slice(0, 10);
    toRemove.forEach(key => delete timerCache[key]);
    console.log(`[ZFocus] Cache limit reached, removed ${toRemove.length} old entries`);
  }
};

// Track pause start time for accurate pause duration tracking
let pauseStartTime: number | null = null;

// Update badge with countdown timer
const updateBadge = async (tabId: number, remainingSeconds: number) => {
  try {
    const settings = await getSettings();

    console.log(
      `[ZFocus] updateBadge called for tab ${tabId}, remaining: ${remainingSeconds}s, showBadge: ${settings.showBadgeCountdown}`,
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

    console.log(`[ZFocus] Badge updated: "${badgeText}" with color`, color);
  } catch (error) {
    console.error('[ZFocus] Badge update error:', error);
  }
};

// Clear badge for a tab
const clearBadge = async (tabId: number) => {
  try {
    // Check if tab still exists before clearing badge
    await chrome.tabs.get(tabId);
    await chrome.action.setBadgeText({ text: '', tabId });
  } catch (error) {
    // Silently ignore if tab doesn't exist anymore
    if (error instanceof Error && !error.message.includes('No tab with id')) {
      console.error('[ZFocus] Clear badge error:', error);
    }
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
      console.log(`[ZFocus] Checking URL: ${url} for site: ${site.title}`);
      console.log(`[ZFocus] Referrer: ${referrer || 'none'}`);
    }

    // 1. Check exceptions - if URL matches any exception, allow access immediately
    if (site.exceptions && site.exceptions.length > 0) {
      for (const exception of site.exceptions) {
        const cleanException = exception.trim().toLowerCase();
        if (cleanException && (fullPath.includes(cleanException) || fullUrl.includes(cleanException))) {
          if (isDev) console.log(`[ZFocus] Exception matched: ${cleanException} - allowing access`);
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
            if (isDev) console.log(`[ZFocus] Referrer matched: ${cleanReferrer} - blocking ANY external link`);
            return true; // Block ANY link from this referrer
          }
        }
      } catch {
        if (isDev) console.log(`[ZFocus] Invalid referrer URL`);
      }
    }

    // 3. Check keywords FIRST - applies to ALL URLs, not just those in URL list
    if (site.keywords && site.keywords.length > 0) {
      for (const keyword of site.keywords) {
        const cleanKeyword = keyword.trim().toLowerCase();
        if (cleanKeyword && fullUrl.includes(cleanKeyword)) {
          if (isDev) console.log(`[ZFocus] Keyword matched: ${cleanKeyword} - blocking (applies to all URLs)`);
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
          if (isDev) console.log(`[ZFocus] Wildcard matched: ${pattern} -> ${fullPath}`);
          matchesMainUrl = true;
          break;
        }
        continue;
      }

      // Simple domain match (default - matches all subdomains and paths)
      if (hostname.includes(cleanPattern) || fullPath.startsWith(cleanPattern)) {
        if (isDev) console.log(`[ZFocus] Domain matched: ${cleanPattern}`);
        matchesMainUrl = true;
        break;
      }
    }

    // 5. If URL matches main patterns, block
    if (matchesMainUrl) {
      if (isDev) console.log(`[ZFocus] Main URL matched - blocking`);
      return true;
    }

    // If URL doesn't match main patterns and no keywords matched, don't block
    if (isDev) console.log(`[ZFocus] URL doesn't match any blocking rules - not blocking`);
    return false;
  } catch (e) {
    if (isDev) console.error('[ZFocus] Error matching URL:', e);
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
  console.log(`[ZFocus] Blocking ${site.title} - Action: ${site.action}`);

  // Increment blocked attempts
  const stats = await getStats();
  await updateStats({ blockedAttempts: stats.blockedAttempts + 1 });

  if (site.action === 'close') {
    try {
      // Check if this is the last tab in the window
      const tab = await chrome.tabs.get(tabId);
      const windowId = tab.windowId;
      const tabsInWindow = await chrome.tabs.query({ windowId });

      if (tabsInWindow.length === 1) {
        // Last tab in window - navigate to dashboard instead of closing
        console.log('[ZFocus] Last tab in window - redirecting to dashboard instead of closing');
        const dashboardUrl = chrome.runtime.getURL('options/index.html');
        await chrome.tabs.update(tabId, { url: dashboardUrl });
      } else {
        // Not the last tab - proceed with closing
        await chrome.tabs.remove(tabId);
      }
    } catch (e) {
      console.error('[ZFocus] Failed to close tab:', e);
    }
  } else if (site.action === 'redirect') {
    const redirectUrl = site.redirectUrl || chrome.runtime.getURL('options/index.html');
    try {
      await chrome.tabs.update(tabId, { url: redirectUrl });
    } catch (e) {
      console.error('[ZFocus] Failed to redirect tab:', e);
    }
  }

  clearTabTimer(tabId);
};

// Clear timer for a tab
const clearTabTimer = (tabId: number) => {
  const existingTimer = activeTabTimers.get(tabId);
  if (existingTimer) {
    console.log(
      `[ZFocus DEBUG ${new Date().toISOString()}] Clearing timer for tab ${tabId}. Active timers before: ${activeTabTimers.size}`,
    );
    clearInterval(existingTimer);
    activeTabTimers.delete(tabId);
    console.log(
      `[ZFocus DEBUG ${new Date().toISOString()}] Timer cleared for tab ${tabId}. Active timers after: ${activeTabTimers.size}`,
    );
  }
  tabSiteMapping.delete(tabId);
  clearBadge(tabId);
};

// Start tracking time for a tab
const startTabTimer = async (tabId: number, site: BlockedSite) => {
  // CRITICAL FIX: Set flag IMMEDIATELY before any other operations (even logging)
  // This MUST be the first synchronous operation to prevent race conditions
  if (timerInitializationInProgress.has(tabId)) {
    console.log(
      `[ZFocus DEBUG ${new Date().toISOString()}] BLOCKED: Timer initialization ALREADY IN PROGRESS for tab ${tabId}. Ignoring duplicate call.`,
    );
    return;
  }
  timerInitializationInProgress.add(tabId);

  const caller = new Error().stack?.split('\n')[2]?.trim() || 'unknown';
  console.log(
    `[ZFocus DEBUG ${new Date().toISOString()}] startTabTimer called for tab ${tabId}, site: ${site.id} FROM: ${caller}`,
  );

  // CRITICAL FIX: If timer already exists for same site, DON'T restart it
  const existingTimer = activeTabTimers.get(tabId);
  const existingSiteId = tabSiteMapping.get(tabId);

  if (existingTimer && existingSiteId === site.id) {
    console.log(
      `[ZFocus DEBUG ${new Date().toISOString()}] Tab ${tabId} already has timer for site ${site.id}. Ignoring duplicate call.`,
    );
    timerInitializationInProgress.delete(tabId); // Clean up flag
    return;
  }

  if (existingTimer) {
    console.warn(
      `[ZFocus WARN ${new Date().toISOString()}] Tab ${tabId} switching from site ${existingSiteId} to ${site.id}. Clearing old timer.`,
    );
  }

  clearTabTimer(tabId);
  tabSiteMapping.set(tabId, site.id);

  const timer = await getOrCreateTimer(site);

  // CRITICAL FIX: Initialize timer cache immediately to prevent timer from being cleared
  timerCache[site.id] = timer;
  console.log(`[ZFocus DEBUG ${new Date().toISOString()}] Timer cache initialized for ${site.id}:`, timer);

  // Check if already exceeded time
  if (timer.usedSeconds >= timer.allowedSeconds) {
    await handleBlocking(tabId, site);
    timerInitializationInProgress.delete(tabId); // Clean up flag on early exit
    return;
  }

  // Update badge immediately when starting timer
  const initialRemainingSeconds = Math.max(0, timer.allowedSeconds - timer.usedSeconds);
  await updateBadge(tabId, initialRemainingSeconds);
  console.log(`[ZFocus] Started timer for tab ${tabId}, site: ${site.title}, remaining: ${initialRemainingSeconds}s`);

  // Start interval to track time
  const interval = setInterval(async () => {
    try {
      // Check if blocking is paused
      const settings = await getSettings();
      if (settings.isPaused) {
        // Don't count time while paused, but keep the interval running
        return;
      }

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

      // Get current timer from cache (no storage read needed)
      const currentTimer = timerCache[site.id];
      if (!currentTimer) {
        console.error(
          `[ZFocus ERROR ${new Date().toISOString()}] Timer cache missing for ${site.id}! This should never happen!`,
        );
        clearTabTimer(tabId);
        return;
      }

      // Increment used time by 1 second
      const newUsedSeconds = currentTimer.usedSeconds + 1;
      console.log(
        `[ZFocus DEBUG ${new Date().toISOString()}] Timer tick: ${site.id}, used: ${currentTimer.usedSeconds} -> ${newUsedSeconds}, allowed: ${currentTimer.allowedSeconds}`,
      );

      // Use batched update instead of writing every second
      batchUpdateTimer(site.id, {
        usedSeconds: newUsedSeconds,
        lastUpdate: Date.now(),
      });

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
        await handleBlocking(tabId, site);
        return;
      }

      // Calculate remaining time
      const remainingSeconds = Math.max(0, currentTimer.allowedSeconds - newUsedSeconds);

      // Update badge with countdown
      await updateBadge(tabId, remainingSeconds);

      // Send message to content script with remaining time
      // Only send every 5 seconds OR when time is critical (< 60s)
      const shouldSendMessage = newUsedSeconds % 5 === 0 || remainingSeconds < 60;

      if (shouldSendMessage) {
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
      }
    } catch (e) {
      console.error(`[ZFocus ERROR ${new Date().toISOString()}] Timer error:`, e);
      clearTabTimer(tabId);
    }
  }, 1000);

  activeTabTimers.set(tabId, interval);
  console.log(
    `[ZFocus DEBUG ${new Date().toISOString()}] Interval created and stored for tab ${tabId}. Total active timers: ${activeTabTimers.size}`,
  );

  // CRITICAL: Clear initialization flag AFTER timer is fully set up
  timerInitializationInProgress.delete(tabId);
};

// Listen for referrer messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'REFERRER_CAPTURED' && sender.tab?.id) {
    console.log(`[ZFocus] Received referrer from content script for tab ${sender.tab.id}: ${message.referrer}`);
    tabReferrers.set(sender.tab.id, message.referrer);
    sendResponse({ received: true });
  }
  return true; // Keep message channel open for async response
});

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) console.log(`[ZFocus] Tab ${tabId} updated:`, changeInfo.status, tab.url);

  if (changeInfo.status !== 'complete' || !tab.url) return;

  // Skip chrome:// and extension pages
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    clearTabTimer(tabId);
    return;
  }

  if (isDev) console.log(`[ZFocus] Checking URL: ${tab.url}`);
  const referrer = tabReferrers.get(tabId);
  const site = await findBlockedSite(tab.url, referrer);
  if (site) {
    if (isDev) console.log(`[ZFocus] ✅ MATCHED! Detected blocked site: ${site.title} on ${tab.url}`);
    await startTabTimer(tabId, site);
  } else {
    if (isDev) console.log(`[ZFocus] ❌ No match for: ${tab.url}`);
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
    console.error('[ZFocus] Tab activation error:', e);
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

      // Track pause start time
      pauseStartTime = Date.now();

      await setSettings({ ...settings, isPaused: true, pauseEndTime: endTime });

      // Clear all active timers
      activeTabTimers.forEach((timer, tabId) => {
        clearInterval(timer);
        activeTabTimers.delete(tabId);
        // Clear badge for this tab
        clearBadge(tabId);
      });
      tabSiteMapping.clear();

      // Send CLEAR_TIMER message to all tabs to hide overlays
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          try {
            await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_TIMER' });
          } catch {
            // Content script might not be loaded
          }
        }
      }

      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.type === 'RESUME_BLOCKING') {
    (async () => {
      const settings = await getSettings();

      // Calculate and record pause duration
      if (pauseStartTime !== null) {
        const pauseDurationSeconds = Math.floor((Date.now() - pauseStartTime) / 1000);
        const stats = await getStats();
        await updateStats({
          timePausedSeconds: stats.timePausedSeconds + pauseDurationSeconds,
        });
        pauseStartTime = null;
      }

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
      // Clear cache
      Object.keys(timerCache).forEach(key => delete timerCache[key]);
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

  cleanupRegistry.registerTimeout(
    setTimeout(async () => {
      console.log('[ZFocus] Hourly reset');
      // Clear cache
      Object.keys(timerCache).forEach(key => delete timerCache[key]);
      await setTimers({});
      scheduleHourlyReset();
    }, msUntilNextHour),
  );
};

scheduleHourlyReset();

// Check pause expiration periodically
cleanupRegistry.registerInterval(
  setInterval(async () => {
    const settings = await getSettings();
    if (settings.isPaused && settings.pauseEndTime && Date.now() > settings.pauseEndTime) {
      // Calculate and record pause duration
      if (pauseStartTime !== null) {
        const pauseDurationSeconds = Math.floor((Date.now() - pauseStartTime) / 1000);
        const stats = await getStats();
        await updateStats({
          timePausedSeconds: stats.timePausedSeconds + pauseDurationSeconds,
        });
        pauseStartTime = null;
      }

      await setSettings({ ...settings, isPaused: false, pauseEndTime: undefined });
      console.log('[ZFocus] Pause expired, resuming blocking');

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
  }, 10000),
);

// Initialize default settings if not present
(async () => {
  // First, try to migrate from local storage if needed
  await migrateFromLocalToSync();

  const result = await chrome.storage.sync.get([STORAGE_KEYS.settings]);
  if (!result[STORAGE_KEYS.settings]) {
    await setSettings(DEFAULT_SETTINGS);
    console.log('[ZFocus] Initialized default settings');
  } else {
    const settings = result[STORAGE_KEYS.settings];
    console.log('[ZFocus] Loaded settings with', settings.blockedSites?.length || 0, 'blocked sites');
    settings.blockedSites?.forEach((site: BlockedSite) => {
      console.log(`[ZFocus] Site: ${site.title}, URLs: ${site.urls.join(', ')}, Active: ${site.isActive}`);
    });
  }
})();

// Cleanup on extension suspend/unload
chrome.runtime.onSuspend?.addListener(() => {
  console.log('[ZFocus] Extension suspending, cleaning up...');
  cleanupRegistry.cleanup();
});

// Log stats periodically in development
if (process.env.NODE_ENV === 'development') {
  cleanupRegistry.registerInterval(
    setInterval(() => {
      const stats = cleanupRegistry.getStats();
      console.log('[ZFocus Stats]', {
        ...stats,
        activeTabTimers: activeTabTimers.size,
        cachedTimers: Object.keys(timerCache).length,
      });
    }, 60000),
  );
}

console.log('[ZFocus] Background script initialized');
