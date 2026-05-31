import 'webextension-polyfill';
// Initialize Sentry/GlitchTip error monitoring as early as possible

// Import i18n messages
import { cleanupRegistry } from './cleanup-registry';
import enMessages from '../../../packages/i18n/locales/en/messages.json';
import jaMessages from '../../../packages/i18n/locales/ja/messages.json';
import koMessages from '../../../packages/i18n/locales/ko/messages.json';
import viMessages from '../../../packages/i18n/locales/vi/messages.json';
import zhMessages from '../../../packages/i18n/locales/zh_CN/messages.json';
import {
  initSentry,
  updateErrorReportingConsent,
  captureException,
  captureMessage,
  normalizeUrlPattern,
} from '@extension/shared';
import { syncQuotaGuard } from '@extension/storage';

// Initialize Sentry (will check for user consent before actually initializing)
initSentry({ context: 'background' });

const IS_DEV = process.env.NODE_ENV === 'development';
const devLog = (...args: unknown[]) => {
  if (IS_DEV) console.log(...args);
};

devLog('[ZFocus] Background script loaded');

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
    const settings = await syncQuotaGuard.safeGet<FocusSettings>(STORAGE_KEYS.settings);
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
      devLog('[ZFocus] Migrating data from local to sync storage...');
      await chrome.storage.sync.set(localData);
      devLog('[ZFocus] Migration completed successfully');

      // Optionally clear local storage after migration
      // await chrome.storage.local.clear();
    }
  } catch (error) {
    captureException(error, { operation: 'migrateFromLocalToSync' });
  }
};

// Types
interface BlockedSite {
  id: string;
  title: string;
  urls: string[];
  exceptions?: string[]; // URLs to allow (whitelist)
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
  weekStartsOn?: 'sunday' | 'monday';
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
  blockedSites: [],
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

// Storage helpers (quota-aware: auto-fallback to IndexedDB when sync > 100KB)
const getSettings = async (): Promise<FocusSettings> => {
  const result = await syncQuotaGuard.safeGet<FocusSettings>(STORAGE_KEYS.settings);
  return result ?? DEFAULT_SETTINGS;
};

const setSettings = async (settings: FocusSettings): Promise<void> => {
  await syncQuotaGuard.safeSet(STORAGE_KEYS.settings, settings);
};

const getStats = async (): Promise<DailyStats> => {
  const stats = (await syncQuotaGuard.safeGet<DailyStats>(STORAGE_KEYS.stats)) ?? getDefaultStats();

  // Reset if new day
  const today = new Date().toISOString().split('T')[0];
  if (stats.date !== today) {
    // Save old stats to historical data
    if (stats.blockedAttempts > 0 || stats.timePausedSeconds > 0 || Object.keys(stats.sitesAccessed).length > 0) {
      const historicalResult = await chrome.storage.local.get(['focus-historical-stats']);
      const historicalStats = historicalResult['focus-historical-stats'] || {};

      // Add old stats
      historicalStats[stats.date] = {
        blockedAttempts: stats.blockedAttempts,
        timePausedSeconds: stats.timePausedSeconds,
        sitesAccessed: stats.sitesAccessed,
      };

      // Keep only last 30 days
      const dates = Object.keys(historicalStats).sort();
      if (dates.length > 30) {
        const toRemove = dates.slice(0, dates.length - 30);
        toRemove.forEach(date => delete historicalStats[date]);
      }

      await chrome.storage.local.set({ 'focus-historical-stats': historicalStats });
    }

    const newStats = getDefaultStats();
    await syncQuotaGuard.safeSet(STORAGE_KEYS.stats, newStats);
    return newStats;
  }
  return stats;
};

const updateStats = async (updates: Partial<DailyStats>): Promise<void> => {
  const stats = await getStats();
  await syncQuotaGuard.safeSet(STORAGE_KEYS.stats, { ...stats, ...updates });
};

const getTimers = async (): Promise<Record<string, SiteTimer>> => {
  // Return cache if available
  if (Object.keys(timerCache).length > 0) {
    return timerCache;
  }
  const timers = (await syncQuotaGuard.safeGet<Record<string, SiteTimer>>(STORAGE_KEYS.timers)) ?? {};
  // Update cache
  Object.assign(timerCache, timers);
  return timers;
};

const setTimers = async (timers: Record<string, SiteTimer>): Promise<void> => {
  // Update cache immediately
  Object.assign(timerCache, timers);
  // Write to storage (quota-aware)
  await syncQuotaGuard.safeSet(STORAGE_KEYS.timers, timers);
};

// Batch timer updates to reduce storage writes
let pendingTimerUpdate: NodeJS.Timeout | null = null;
const TIMER_BATCH_INTERVAL = 10000; // Write to storage every 10 seconds instead of every second

const batchUpdateTimer = (siteId: string, updates: Partial<SiteTimer>) => {
  // Update in-memory cache immediately
  if (timerCache[siteId]) {
    const oldValue = timerCache[siteId].usedSeconds;
    timerCache[siteId] = { ...timerCache[siteId], ...updates };
    devLog(`[ZFocus] Batch update cache: ${siteId}, usedSeconds: ${oldValue} -> ${timerCache[siteId].usedSeconds}`);
  } else {
    captureMessage('Batch update called for missing cache entry', 'error', {
      siteId,
      cacheKeys: Object.keys(timerCache),
    });
  }

  // Enforce cache size limit
  enforceCacheLimit();

  // Debounce storage write
  if (pendingTimerUpdate) {
    clearTimeout(pendingTimerUpdate);
  }

  pendingTimerUpdate = setTimeout(async () => {
    try {
      devLog(`[ZFocus] Writing timer cache to storage after ${TIMER_BATCH_INTERVAL}ms`);
      await syncQuotaGuard.safeSet(STORAGE_KEYS.timers, timerCache);
      pendingTimerUpdate = null;
    } catch (error) {
      captureException(error, { operation: 'batchUpdateTimer', cacheSize: Object.keys(timerCache).length });
    }
  }, TIMER_BATCH_INTERVAL);
};

// Track active tabs and their timers
const activeTabTimers: Map<number, ReturnType<typeof setInterval>> = new Map();
const tabSiteMapping: Map<number, string> = new Map();
// CRITICAL: Prevent race condition when multiple startTabTimer calls happen simultaneously
const timerInitializationInProgress = new Set<number>();
// Track which tab is the "primary counter" for each site (prevents double-counting)
// Only the primary tab increments usedSeconds; other tabs just receive badge/overlay updates
const sitePrimaryTab: Map<string, number> = new Map();

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
    devLog(`[ZFocus] Cache limit reached, removed ${toRemove.length} old entries`);
  }
};

// Track pause start time for accurate pause duration tracking
let pauseStartTime: number | null = null;

// Update badge with countdown timer
const updateBadge = async (tabId: number, remainingSeconds: number) => {
  try {
    // Check if tab still exists before updating badge
    try {
      await chrome.tabs.get(tabId);
    } catch {
      // Tab doesn't exist, silently ignore
      return;
    }

    const settings = await getSettings();

    devLog(
      `[ZFocus] updateBadge: tab ${tabId}, remaining: ${remainingSeconds}s, showBadge: ${settings.showBadgeCountdown}`,
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

    devLog(`[ZFocus] Badge updated: "${badgeText}"`);
  } catch (error) {
    if (error instanceof Error && !error.message.includes('No tab with id')) {
      captureException(error, { operation: 'updateBadge', tabId, remainingSeconds });
    }
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
      captureException(error, { operation: 'clearBadge', tabId });
    }
  }
};

// Check if URL matches a blocked site
const matchesUrl = (url: string, site: BlockedSite): boolean => {
  const isDev = process.env.NODE_ENV === 'development';

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    const fullPath = hostname + urlObj.pathname.toLowerCase();
    const fullUrl = url.toLowerCase();

    if (isDev) {
      console.log(`[ZFocus] Checking URL: ${url} for site: ${site.title}`);
    }

    // 1. Check exceptions FIRST - if URL matches any exception, skip this site entirely
    if (site.exceptions && site.exceptions.length > 0) {
      for (const exception of site.exceptions) {
        const cleanException = exception.trim().toLowerCase();
        if (cleanException && (fullPath.includes(cleanException) || fullUrl.includes(cleanException))) {
          devLog(`[ZFocus] Exception matched: "${cleanException}" for site "${site.title}" - skipping all checks`);
          return false;
        }
      }
    }

    // 2. Check keywords - applies to ALL URLs, not just those in URL list
    if (site.keywords && site.keywords.length > 0) {
      for (const keyword of site.keywords) {
        const cleanKeyword = keyword.trim().toLowerCase();
        if (cleanKeyword.length < 3) {
          devLog(`[ZFocus] Keyword "${cleanKeyword}" too short (min 3 chars) - skipping`);
          continue;
        }
        if (fullUrl.includes(cleanKeyword)) {
          devLog(`[ZFocus] Keyword matched: "${cleanKeyword}" for site "${site.title}" - blocking`);
          return true;
        }
      }
    }

    // 4. Check if URL matches main site patterns
    let matchesMainUrl = false;
    for (const pattern of site.urls) {
      const cleanPattern = normalizeUrlPattern(pattern);
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
      // Must match exactly or be a subdomain (ending with .pattern)
      const isExactMatch = hostname === cleanPattern;
      const isSubdomain = hostname.endsWith('.' + cleanPattern);
      const isPathMatch = fullPath.startsWith(cleanPattern + '/') || fullPath === cleanPattern;

      if (isExactMatch || isSubdomain || isPathMatch) {
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
    devLog(`[FocusGuard Schedule] Current time: ${now.toLocaleTimeString()}, Day: ${currentDay}`);
    devLog(`[FocusGuard Schedule] Work days: ${schedule.workDays}, Time: ${schedule.startTime} - ${schedule.endTime}`);
    devLog(`[FocusGuard Schedule] Allow outside hours: ${schedule.allowOutsideHours}`);
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
    devLog(`[FocusGuard Schedule] Current minutes: ${currentMinutes}, Range: ${startMinutes} - ${endMinutes}`);
    devLog(`[FocusGuard Schedule] Within time range: ${isWithinTime}`);
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
const findBlockedSite = async (url: string): Promise<BlockedSite | null> => {
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

  // Guard against undefined blockedSites
  const blockedSites = settings.blockedSites || [];

  // Sort by specificity: rules with longer URL patterns (more specific paths) are checked first.
  // This ensures "youtube.com/shorts" is matched before "youtube.com".
  const sortedSites = [...blockedSites].sort((a, b) => {
    const maxLenA = Math.max(...(a.urls || []).map(u => normalizeUrlPattern(u).length), 0);
    const maxLenB = Math.max(...(b.urls || []).map(u => normalizeUrlPattern(u).length), 0);
    return maxLenB - maxLenA;
  });

  devLog(`[ZFocus] findBlockedSite: checking ${sortedSites.length} sites for URL: ${url}`);

  // Collect ALL exceptions from ALL active sites so that an exception in any site
  // is respected globally (user should not have to duplicate exceptions across sites)
  const globalExceptions: string[] = [];
  for (const site of sortedSites) {
    if (!site.isActive) continue;
    if (site.exceptions) {
      globalExceptions.push(...site.exceptions);
    }
  }

  // Check if URL matches any global exception
  if (globalExceptions.length > 0) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
      const fullPath = hostname + urlObj.pathname.toLowerCase();
      const fullUrl = url.toLowerCase();

      for (const exception of globalExceptions) {
        const cleanException = exception.trim().toLowerCase();
        if (cleanException && (fullPath.includes(cleanException) || fullUrl.includes(cleanException))) {
          devLog(`[ZFocus] Global exception matched: "${cleanException}" - URL is whitelisted across all sites`);
          return null;
        }
      }
    } catch {
      // invalid URL
    }
  }

  for (const site of sortedSites) {
    if (!site.isActive) continue;
    if (!isWithinWorkHours(site.schedule)) continue;
    devLog(`[ZFocus] Checking site "${site.title}" (urls: ${site.urls.join(', ')})`);
    if (matchesUrl(url, site)) {
      devLog(`[ZFocus] >>> MATCHED site "${site.title}" (id: ${site.id})`);
      return site;
    }
  }
  devLog(`[ZFocus] No site matched for: ${url}`);
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
  devLog(`[ZFocus] Blocking ${site.title} - Action: ${site.action}`);

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
        devLog('[ZFocus] Last tab in window - redirecting to dashboard instead of closing');
        const dashboardUrl = chrome.runtime.getURL('options/index.html');
        await chrome.tabs.update(tabId, { url: dashboardUrl });
      } else {
        // Not the last tab - proceed with closing
        await chrome.tabs.remove(tabId);
      }
    } catch (e) {
      captureException(e, { operation: 'handleBlocking.closeTab', tabId, siteId: site.id });
    }
  } else if (site.action === 'redirect') {
    const redirectUrl = site.redirectUrl || chrome.runtime.getURL('options/index.html');
    try {
      await chrome.tabs.update(tabId, { url: redirectUrl });
    } catch (e) {
      captureException(e, { operation: 'handleBlocking.redirectTab', tabId, siteId: site.id });
    }
  }

  clearTabTimer(tabId);
};

// Clear timer for a tab
const clearTabTimer = (tabId: number) => {
  const siteId = tabSiteMapping.get(tabId);
  const existingTimer = activeTabTimers.get(tabId);
  if (existingTimer) {
    devLog(`[ZFocus] Clearing timer for tab ${tabId}. Active timers: ${activeTabTimers.size}`);
    clearInterval(existingTimer);
    activeTabTimers.delete(tabId);
  }
  tabSiteMapping.delete(tabId);
  clearBadge(tabId);

  // If this tab was the primary counter for its site, release the slot
  // so another tab with the same site can become primary
  if (siteId && sitePrimaryTab.get(siteId) === tabId) {
    sitePrimaryTab.delete(siteId);
    devLog(`[ZFocus] Released primary counter for site ${siteId} (was tab ${tabId})`);
  }

  // Notify content script to hide the overlay
  try {
    chrome.tabs.sendMessage(tabId, { type: 'CLEAR_TIMER' }).catch(() => {
      // Content script might not be loaded
    });
  } catch {
    // Tab might not exist
  }
};

// Start tracking time for a tab
const startTabTimer = async (tabId: number, site: BlockedSite) => {
  // CRITICAL FIX: Set flag IMMEDIATELY before any other operations (even logging)
  // This MUST be the first synchronous operation to prevent race conditions
  if (timerInitializationInProgress.has(tabId)) {
    devLog(`[ZFocus] Timer init already in progress for tab ${tabId}, ignoring`);
    return;
  }
  timerInitializationInProgress.add(tabId);

  devLog(`[ZFocus] startTabTimer: tab ${tabId}, site: ${site.id}`);

  // CRITICAL FIX: If timer already exists for same site, DON'T restart it
  const existingTimer = activeTabTimers.get(tabId);
  const existingSiteId = tabSiteMapping.get(tabId);

  if (existingTimer && existingSiteId === site.id) {
    devLog(`[ZFocus] Tab ${tabId} already has timer for site ${site.id}, ignoring`);
    timerInitializationInProgress.delete(tabId);
    return;
  }

  if (existingTimer) {
    devLog(`[ZFocus] Tab ${tabId} switching from site ${existingSiteId} to ${site.id}`);
  }

  clearTabTimer(tabId);
  tabSiteMapping.set(tabId, site.id);

  // Assign this tab as primary counter if no other tab holds that role for this site
  if (!sitePrimaryTab.has(site.id)) {
    sitePrimaryTab.set(site.id, tabId);
    devLog(`[ZFocus] Tab ${tabId} is now primary counter for site ${site.id}`);
  } else {
    devLog(`[ZFocus] Tab ${tabId} is secondary for site ${site.id} (primary: ${sitePrimaryTab.get(site.id)})`);
  }

  const timer = await getOrCreateTimer(site);

  // CRITICAL FIX: Initialize timer cache immediately to prevent timer from being cleared
  timerCache[site.id] = timer;
  devLog(`[ZFocus] Timer cache initialized for ${site.id}`);

  // Check if already exceeded time
  if (timer.usedSeconds >= timer.allowedSeconds) {
    await handleBlocking(tabId, site);
    timerInitializationInProgress.delete(tabId); // Clean up flag on early exit
    return;
  }

  // Update badge immediately when starting timer
  const initialRemainingSeconds = Math.max(0, timer.allowedSeconds - timer.usedSeconds);
  await updateBadge(tabId, initialRemainingSeconds);
  devLog(`[ZFocus] Started timer for tab ${tabId}, site: ${site.title}, remaining: ${initialRemainingSeconds}s`);

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

      // Re-check if current URL still matches this blocked site (SPA may have navigated to an excepted URL)
      if (tab.url) {
        const currentSite = await findBlockedSite(tab.url);
        if (!currentSite || currentSite.id !== site.id) {
          devLog(`[ZFocus] Tab ${tabId} URL changed to excepted/different URL: ${tab.url} - clearing timer`);
          clearTabTimer(tabId);
          return;
        }
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
        captureMessage('Timer cache missing - this should never happen', 'error', {
          siteId: site.id,
          tabId,
          cacheKeys: Object.keys(timerCache),
          activeTimerCount: activeTabTimers.size,
        });
        clearTabTimer(tabId);
        return;
      }

      // Only the primary tab for this site increments the counter.
      // This prevents double-counting when multiple tabs share the same site.
      // Auto-promote: if no primary exists (was closed), claim the role.
      if (!sitePrimaryTab.has(site.id)) {
        sitePrimaryTab.set(site.id, tabId);
        devLog(`[ZFocus] Tab ${tabId} auto-promoted to primary for site ${site.id}`);
      }
      const isPrimary = sitePrimaryTab.get(site.id) === tabId;
      let newUsedSeconds = currentTimer.usedSeconds;

      if (isPrimary) {
        newUsedSeconds = currentTimer.usedSeconds + 1;

        // Use batched update instead of writing every second
        batchUpdateTimer(site.id, {
          usedSeconds: newUsedSeconds,
          lastUpdate: Date.now(),
        });
      }

      // Track stats every minute (only primary tab)
      if (isPrimary && newUsedSeconds % 60 === 0) {
        const stats = await getStats();
        await updateStats({
          sitesAccessed: {
            ...stats.sitesAccessed,
            [site.id]: (stats.sitesAccessed[site.id] || 0) + 60,
          },
        });
      }

      // Check if time exceeded (all tabs should enforce blocking)
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
      captureException(e, { operation: 'timerInterval', tabId, siteId: site.id });
      clearTabTimer(tabId);
    }
  }, 1000);

  activeTabTimers.set(tabId, interval);
  devLog(`[ZFocus] Timer interval created for tab ${tabId}. Total active: ${activeTabTimers.size}`);

  // CRITICAL: Clear initialization flag AFTER timer is fully set up
  timerInitializationInProgress.delete(tabId);
};

// Re-evaluate blocking for a tab based on its current URL
const evaluateTabUrl = async (tabId: number, url: string) => {
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    clearTabTimer(tabId);
    return;
  }

  devLog(`[ZFocus] Evaluating URL: ${url}`);
  const site = await findBlockedSite(url);
  if (site) {
    devLog(`[ZFocus] MATCHED blocked site: ${site.title} on ${url}`);
    await startTabTimer(tabId, site);
  } else {
    devLog(`[ZFocus] No match for: ${url}`);
    clearTabTimer(tabId);
  }
};

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  devLog(`[ZFocus] Tab ${tabId} updated:`, changeInfo.status, changeInfo.url, tab.url);

  // Re-evaluate on SPA navigation (URL changed without full page load)
  if (changeInfo.url && tab.url) {
    devLog(`[ZFocus] SPA navigation detected: ${changeInfo.url}`);
    await evaluateTabUrl(tabId, tab.url);
    return;
  }

  if (changeInfo.status !== 'complete' || !tab.url) return;

  await evaluateTabUrl(tabId, tab.url);

  performScheduleCheck();
});

// Handle SPA navigation via History API (pushState/replaceState)
// This catches URL changes that tabs.onUpdated might miss
chrome.webNavigation.onHistoryStateUpdated.addListener(async details => {
  if (details.frameId !== 0) return;
  devLog(`[ZFocus] History state updated: ${details.url} (tab ${details.tabId})`);
  await evaluateTabUrl(details.tabId, details.url);
});

// Handle tab activation
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    // Safety net: check if pause expired (covers edge cases where alarm/idle missed it)
    await checkAndResumePause();

    const tab = await chrome.tabs.get(tabId);
    if (!tab.url) return;

    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }

    const site = await findBlockedSite(tab.url);
    if (site && !activeTabTimers.has(tabId)) {
      await startTabTimer(tabId, site);
    }

    // Also check ALL other tabs when switching tabs
    // This ensures timers start when entering work hours
    performScheduleCheck();
  } catch (e) {
    captureException(e, { operation: 'tabActivation', tabId });
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener(tabId => {
  clearTabTimer(tabId);
});

// Listen for storage changes to update badges and reset timers
chrome.storage.sync.onChanged.addListener(async changes => {
  if (changes['focus-settings']) {
    const oldSettings = changes['focus-settings'].oldValue as FocusSettings | undefined;
    const newSettings = changes['focus-settings'].newValue as FocusSettings | undefined;

    // When key is removed from sync (e.g. moved to IndexedDB overflow), newValue is undefined.
    // In that case, read the authoritative value via syncQuotaGuard which checks both backends.
    if (!newSettings) {
      devLog('[ZFocus] focus-settings removed from sync (possibly moved to IndexedDB). Skipping onChanged.');
      return;
    }

    devLog('[ZFocus] Settings changed, checking for website info updates...');

    // Check if error reporting consent changed
    const oldErrorReporting = (oldSettings as (FocusSettings & { errorReportingEnabled?: boolean }) | undefined)
      ?.errorReportingEnabled;
    const newErrorReporting = (newSettings as FocusSettings & { errorReportingEnabled?: boolean })
      ?.errorReportingEnabled;
    if (oldErrorReporting !== newErrorReporting) {
      devLog(`[ZFocus] Error reporting consent changed: ${oldErrorReporting} -> ${newErrorReporting}`);
      await updateErrorReportingConsent(newErrorReporting === true, 'background');
    }

    // Detect if blocked sites configuration changed
    const blockedSitesChanged =
      !oldSettings || JSON.stringify(oldSettings.blockedSites) !== JSON.stringify(newSettings.blockedSites);

    if (blockedSitesChanged) {
      devLog('[ZFocus] Blocked sites configuration changed - clearing all timers and badges');

      // Clear all active timers
      activeTabTimers.forEach((timer, tabId) => {
        clearInterval(timer);
        activeTabTimers.delete(tabId);
        clearBadge(tabId);
      });

      // Clear timer initialization flags
      timerInitializationInProgress.clear();

      // Clear tab-site mappings and primary tab assignments
      tabSiteMapping.clear();
      sitePrimaryTab.clear();

      // Clear timer cache
      Object.keys(timerCache).forEach(key => delete timerCache[key]);

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

      // Re-check all tabs with new settings (unless paused)
      if (!newSettings.isPaused) {
        devLog('[ZFocus] Re-checking all tabs with new blocked site settings...');
        for (const tab of tabs) {
          if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
            const site = await findBlockedSite(tab.url);
            if (site) {
              devLog(`[ZFocus] Starting timer for tab ${tab.id} with site: ${site.title}`);
              await startTabTimer(tab.id, site);
            }
          }
        }
      }
    }
    // Handle ANY settings change - also run schedule check to catch schedule changes
    else if (oldSettings) {
      devLog('[ZFocus] Settings changed - running schedule check...');
      performScheduleCheck();
    }

    // Handle badge countdown toggle
    if (oldSettings && oldSettings.showBadgeCountdown !== newSettings.showBadgeCountdown) {
      // If badge countdown was disabled, clear all badges
      if (!newSettings.showBadgeCountdown) {
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
          if (tab.id) clearBadge(tab.id);
        });
      } else {
        // If enabled, update badges for active timers
        const tabs = await chrome.tabs.query({});
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
      }
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

      if (settings.hardLockMode && isWithinWorkHours(settings.workSchedule)) {
        devLog('[ZFocus] PAUSE_BLOCKING rejected: Hard Lock Mode active during work hours');
        return;
      }

      const endTime = Date.now() + message.minutes * 60 * 1000;

      // Track pause start time
      pauseStartTime = Date.now();

      await setSettings({ ...settings, isPaused: true, pauseEndTime: endTime });

      // Schedule alarm for pause expiration (reliable across sleep/idle)
      await schedulePauseExpirationAlarm(endTime);

      // Clear all active timers
      activeTabTimers.forEach((timer, tabId) => {
        clearInterval(timer);
        activeTabTimers.delete(tabId);
        // Clear badge for this tab
        clearBadge(tabId);
      });
      tabSiteMapping.clear();
      sitePrimaryTab.clear();

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

      // Clear pause expiration alarm
      await chrome.alarms.clear(PAUSE_EXPIRATION_ALARM);

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

// Alarm names
const HOURLY_RESET_ALARM = 'hourly-timer-reset';
const PAUSE_EXPIRATION_ALARM = 'pause-expiration';

// Centralized pause expiration check - used by alarm, idle wakeup, and tab activation
const checkAndResumePause = async (): Promise<boolean> => {
  const settings = await getSettings();
  if (!settings.isPaused) return false;

  const now = Date.now();
  const shouldResume = (settings.pauseEndTime && now > settings.pauseEndTime) || !settings.pauseEndTime;

  if (!shouldResume) return false;

  // Calculate and record pause duration
  if (pauseStartTime !== null) {
    const pauseDurationSeconds = Math.floor((now - pauseStartTime) / 1000);
    const stats = await getStats();
    await updateStats({
      timePausedSeconds: stats.timePausedSeconds + pauseDurationSeconds,
    });
    pauseStartTime = null;
  }

  const reason = !settings.pauseEndTime ? 'missing_pauseEndTime' : 'expired';
  await setSettings({ ...settings, isPaused: false, pauseEndTime: undefined });
  devLog(`[ZFocus] Pause auto-resumed. Reason: ${reason}`);
  captureMessage('Pause auto-resumed', 'info', {
    reason,
    pauseEndTime: settings.pauseEndTime,
    trigger: 'checkAndResumePause',
  });

  // Clear the pause expiration alarm since we already resumed
  await chrome.alarms.clear(PAUSE_EXPIRATION_ALARM);

  // Re-check all tabs to restart blocking
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      const site = await findBlockedSite(tab.url);
      if (site) {
        await startTabTimer(tab.id, site);
      }
    }
  }

  return true;
};

// Schedule a chrome.alarms alarm for pause expiration
const schedulePauseExpirationAlarm = async (pauseEndTime: number) => {
  await chrome.alarms.clear(PAUSE_EXPIRATION_ALARM);
  const delayMs = pauseEndTime - Date.now();
  if (delayMs <= 0) {
    // Already expired, check immediately
    await checkAndResumePause();
    return;
  }
  const delayInMinutes = Math.max(delayMs / 60000, 0.1); // minimum 0.1 min (~6s)
  await chrome.alarms.create(PAUSE_EXPIRATION_ALARM, { delayInMinutes });
  devLog(`[ZFocus] Pause expiration alarm scheduled in ${Math.round(delayMs / 1000)}s`);
};

const performHourlyReset = async () => {
  devLog('[ZFocus] Hourly reset - resetting all timers');

  // CRITICAL FIX: Don't clear cache for sites with active timers
  // Instead, reset their usedSeconds to 0 and update allowedSeconds
  const settings = await getSettings();
  const activeSiteIds = new Set(Array.from(tabSiteMapping.values()));

  // Reset all timers in storage
  const timers = await getTimers();
  const resetTimers: Record<string, SiteTimer> = {};

  // For each timer, reset usedSeconds to 0
  const blockedSites = settings.blockedSites || [];
  Object.keys(timers).forEach(siteId => {
    const site = blockedSites.find(s => s.id === siteId);
    if (site) {
      resetTimers[siteId] = {
        siteId: site.id,
        siteName: site.title,
        usedSeconds: 0,
        allowedSeconds: site.allowedMinutesPerHour * 60,
        lastUpdate: Date.now(),
      };
    }
  });

  // Update cache with reset values
  Object.assign(timerCache, resetTimers);
  await setTimers(resetTimers);

  devLog(
    `[ZFocus] Hourly reset complete. Active timers: ${activeSiteIds.size}, Reset: ${Object.keys(resetTimers).length}`,
  );
};

// Check all tabs for schedule changes (entering/exiting work hours)
const performScheduleCheck = async () => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  devLog(`[ZFocus Schedule Check ${timeStr}] Starting schedule check`);

  const settings = await getSettings();

  if (settings.isPaused) {
    devLog(`[ZFocus Schedule Check ${timeStr}] Extension is paused, skipping`);
    return;
  }

  const tabs = await chrome.tabs.query({});

  let checkedCount = 0;
  let startedCount = 0;
  let clearedCount = 0;

  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;

    checkedCount++;

    const site = await findBlockedSite(tab.url);
    const hasActiveTimer = activeTabTimers.has(tab.id);

    if (site && !hasActiveTimer) {
      await startTabTimer(tab.id, site);
      startedCount++;
    } else if (!site && hasActiveTimer) {
      clearTabTimer(tab.id);
      clearedCount++;
    }
  }

  if (startedCount > 0 || clearedCount > 0) {
    devLog(`[ZFocus Schedule Check] ${checkedCount} tabs, ${startedCount} started, ${clearedCount} cleared`);
  }
};

// Setup hourly reset alarm (persists across service worker restarts)
const setupHourlyResetAlarm = async () => {
  // Clear any existing alarm first to prevent duplicates
  await chrome.alarms.clear(HOURLY_RESET_ALARM);

  // Create alarm that fires at the start of each hour
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0);
  const delayInMinutes = (nextHour.getTime() - now.getTime()) / (60 * 1000);

  await chrome.alarms.create(HOURLY_RESET_ALARM, {
    delayInMinutes,
    periodInMinutes: 60, // Repeat every hour
  });

  devLog(`[ZFocus] Hourly reset alarm scheduled. Next reset in ${Math.round(delayInMinutes)} minutes`);
};

// Setup schedule check using setInterval (more reliable than alarms for service workers)
const setupScheduleCheckInterval = () => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  devLog(`[ZFocus ${timeStr}] Setting up schedule check interval (every 60 seconds)`);

  performScheduleCheck();

  // Setup interval to check every minute
  const scheduleCheckInterval = setInterval(() => {
    performScheduleCheck();
  }, 60000); // 60 seconds

  // Register with cleanup registry to prevent memory leaks
  cleanupRegistry.registerInterval(scheduleCheckInterval);

  devLog(`[ZFocus ${timeStr}] Schedule check interval registered`);
};

// Listen for alarm events
chrome.alarms.onAlarm.addListener(alarm => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  devLog(`[ZFocus ${timeStr}] Alarm fired: ${alarm.name}`);

  if (alarm.name === HOURLY_RESET_ALARM) {
    performHourlyReset();
  }

  if (alarm.name === PAUSE_EXPIRATION_ALARM) {
    checkAndResumePause();
  }
});

setupHourlyResetAlarm();
setupScheduleCheckInterval();

// Idle state detection - resume pause when user returns from idle/locked screen
chrome.idle.setDetectionInterval(30); // 30 seconds threshold for idle detection

chrome.idle.onStateChanged.addListener(async newState => {
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  devLog(`[ZFocus ${timeStr}] Idle state changed: ${newState}`);

  if (newState === 'active') {
    // User returned from idle/locked - immediately check pause expiration
    const resumed = await checkAndResumePause();
    if (resumed) {
      devLog(`[ZFocus ${timeStr}] Pause was expired during idle - blocking resumed on wake`);
    }

    // Also run schedule check to catch any missed schedule transitions
    performScheduleCheck();
  }
});

// Clear stale pause state on startup
// This fixes the bug where isPaused persists across days/browser restarts
const clearStalePauseState = async () => {
  const settings = await getSettings();
  if (!settings.isPaused) return;

  const now = Date.now();

  // Case 1: pauseEndTime exists and has expired - auto-resume
  if (settings.pauseEndTime && now > settings.pauseEndTime) {
    const expiredAgo = Math.round((now - settings.pauseEndTime) / 60000);
    devLog('[ZFocus] Startup: Pause expired while browser was closed. Auto-resuming.');
    captureMessage('Stale pause state detected on startup: pauseEndTime expired', 'warning', {
      pauseEndTime: settings.pauseEndTime,
      expiredMinutesAgo: expiredAgo,
      reason: 'pauseEndTime_expired',
    });
    await setSettings({ ...settings, isPaused: false, pauseEndTime: undefined });
    return;
  }

  // Case 2: pauseEndTime is undefined/missing - invalid state, auto-resume
  if (!settings.pauseEndTime) {
    devLog('[ZFocus] Startup: isPaused=true but no pauseEndTime. Clearing stale pause state.');
    captureMessage('Stale pause state detected on startup: missing pauseEndTime', 'warning', {
      reason: 'missing_pauseEndTime',
      isPaused: settings.isPaused,
    });
    await setSettings({ ...settings, isPaused: false, pauseEndTime: undefined });
    return;
  }

  // Case 3: pauseEndTime is in the future but unreasonably far (> 24 hours)
  // This catches corrupted data or timezone issues
  const maxPauseDuration = 24 * 60 * 60 * 1000; // 24 hours
  if (settings.pauseEndTime - now > maxPauseDuration) {
    devLog('[ZFocus] Startup: pauseEndTime is unreasonably far in the future. Clearing stale pause state.');
    captureMessage('Stale pause state detected on startup: unreasonable pauseEndTime', 'warning', {
      pauseEndTime: settings.pauseEndTime,
      hoursInFuture: Math.round((settings.pauseEndTime - now) / 3600000),
      reason: 'unreasonable_pauseEndTime',
    });
    await setSettings({ ...settings, isPaused: false, pauseEndTime: undefined });
    return;
  }

  // Case 4: Pause is still valid - schedule alarm for expiration and log remaining time
  const remainingMinutes = Math.round((settings.pauseEndTime - now) / 60000);
  devLog(`[ZFocus] Startup: Pause is still active. ${remainingMinutes} minutes remaining.`);
  await schedulePauseExpirationAlarm(settings.pauseEndTime);
};

// Migrate existing URL patterns: strip protocol and www prefix from stored data
const migrateUrlPatterns = async (): Promise<void> => {
  try {
    const settings = await syncQuotaGuard.safeGet<FocusSettings>(STORAGE_KEYS.settings);
    if (!settings?.blockedSites?.length) return;

    let changed = false;
    const migrated = settings.blockedSites.map(site => {
      const normalizedUrls = site.urls.map(u => normalizeUrlPattern(u));
      const urlsChanged = site.urls.some((u, i) => u !== normalizedUrls[i]);

      const normalizedExceptions = site.exceptions?.map(e => normalizeUrlPattern(e));
      const exceptionsChanged = site.exceptions?.some((e, i) => e !== normalizedExceptions?.[i]);

      if (urlsChanged || exceptionsChanged) {
        changed = true;
        devLog(`[ZFocus] Migrating URL patterns for "${site.title}"`);
        return {
          ...site,
          urls: normalizedUrls.filter(Boolean),
          exceptions: normalizedExceptions?.filter(Boolean),
        };
      }
      return site;
    });

    if (changed) {
      await setSettings({ ...settings, blockedSites: migrated });
      devLog('[ZFocus] URL pattern migration completed');
    }
  } catch (error) {
    captureException(error, { operation: 'migrateUrlPatterns' });
  }
};

// Initialize default settings if not present
(async () => {
  // First, try to migrate from local storage if needed
  await migrateFromLocalToSync();

  const existingSettings = await syncQuotaGuard.safeGet<FocusSettings>(STORAGE_KEYS.settings);
  if (!existingSettings) {
    await setSettings(DEFAULT_SETTINGS);
    devLog('[ZFocus] Initialized default settings');
  } else {
    // Migrate legacy URL patterns (strip protocol/www)
    await migrateUrlPatterns();

    devLog('[ZFocus] Loaded settings with', existingSettings.blockedSites?.length || 0, 'blocked sites');
  }

  // Clear stale pause state after settings are loaded
  await clearStalePauseState();
})();

// Cleanup on extension suspend/unload
chrome.runtime.onSuspend?.addListener(() => {
  devLog('[ZFocus] Extension suspending, cleaning up...');
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

devLog('[ZFocus] Background script initialized');
