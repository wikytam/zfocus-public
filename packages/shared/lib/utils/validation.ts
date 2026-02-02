import { z } from 'zod';

// URL/domain validation function (reusable)
const isValidUrlOrDomain = (val: string): boolean => {
  if (!val || val.trim() === '') return false;

  // Accept full URLs with protocol
  try {
    new URL(val);
    return true;
  } catch {
    // Accept domain patterns like: example.com, sub.example.com, *.example.com
    const domainPattern = /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainPattern.test(val) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(val);
  }
};

// Custom URL/domain validator that accepts both full URLs and domain names
const urlOrDomainSchema = z.string().refine(isValidUrlOrDomain, {
  message: 'Invalid URL or domain format',
});

// Validate multiple URLs and return errors for each invalid one
export interface UrlValidationError {
  index: number;
  url: string;
  message: string;
}

export const validateUrls = (urls: string[]): UrlValidationError[] => {
  const errors: UrlValidationError[] = [];
  urls.forEach((url, index) => {
    const trimmed = url.trim();
    if (!trimmed) {
      errors.push({ index, url, message: 'URL cannot be empty' });
    } else if (!isValidUrlOrDomain(trimmed)) {
      errors.push({ index, url: trimmed, message: 'Invalid URL or domain format' });
    }
  });
  return errors;
};

// Schedule schema
export const scheduleSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  workDays: z.array(z.number().min(0).max(6)).min(1, 'At least one work day required'),
  allowOutsideHours: z.boolean(),
});

// Blocked site schema
export const blockedSiteSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  urls: z.array(urlOrDomainSchema).min(1, 'At least one URL required'),
  exceptions: z.array(urlOrDomainSchema).optional(),
  referrers: z.array(urlOrDomainSchema).optional(),
  keywords: z.array(z.string().min(1).max(50)).optional(),
  allowedMinutesPerHour: z.number().min(1, 'Must be at least 1 minute').max(1440, 'Cannot exceed 24 hours'),
  countOnlyActiveTab: z.boolean().optional(),
  action: z.enum(['close', 'redirect']),
  redirectUrl: z.string().url('Invalid redirect URL').optional(),
  isActive: z.boolean(),
  schedule: scheduleSchema,
});

// Focus settings schema
export const focusSettingsSchema = z.object({
  blockedSites: z.array(blockedSiteSchema),
  workSchedule: scheduleSchema,
  pauseMinutes: z.number().min(1, 'Must be at least 1 minute').max(1440, 'Cannot exceed 24 hours'),
  isPaused: z.boolean(),
  pauseEndTime: z.number().optional(),
  hardLockMode: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  showBadgeCountdown: z.boolean(),
  language: z.string().optional(),
  weekStartsOn: z.enum(['sunday', 'monday']).optional(),
  errorReportingEnabled: z.boolean().optional(),
});

// Daily stats schema
export const dailyStatsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  blockedAttempts: z.number().min(0),
  timePausedSeconds: z.number().min(0),
  sitesAccessed: z.record(z.string(), z.number().min(0)),
});

// Historical stats schema
export const historicalStatsSchema = z.record(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  z.object({
    blockedAttempts: z.number().min(0),
    timePausedSeconds: z.number().min(0),
    sitesAccessed: z.record(z.string(), z.number().min(0)),
  }),
);

// Active timer schema
export const activeTimerSchema = z.object({
  siteId: z.string().min(1),
  siteName: z.string().min(1),
  remainingSeconds: z.number().min(0),
  totalSeconds: z.number().min(0),
});

// Form validation schemas for UI components
export const addSiteFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  urls: z.string().min(1, 'At least one URL required'),
  exceptions: z.string().optional(),
  referrers: z.string().optional(),
  keywords: z.string().optional(),
  allowedMinutes: z.number().min(1, 'Must be at least 1 minute').max(1440, 'Cannot exceed 24 hours'),
  countOnlyActiveTab: z.boolean(),
  action: z.enum(['close', 'redirect']),
  redirectUrl: z.string().url('Invalid redirect URL').optional().or(z.literal('')),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  workDays: z.array(z.number().min(0).max(6)).min(1, 'At least one work day required'),
  allowOutsideHours: z.boolean(),
});

export const editSiteFormSchema = addSiteFormSchema.extend({
  allowedMinutes: z.number().min(1, 'Must be at least 1 minute').max(1440, 'Cannot exceed 24 hours').optional(),
});

// Type exports
export type BlockedSite = z.infer<typeof blockedSiteSchema>;
export type FocusSettings = z.infer<typeof focusSettingsSchema>;
export type DailyStats = z.infer<typeof dailyStatsSchema>;
export type HistoricalStats = z.infer<typeof historicalStatsSchema>;
export type ActiveTimer = z.infer<typeof activeTimerSchema>;
export type AddSiteFormData = z.infer<typeof addSiteFormSchema>;
export type EditSiteFormData = z.infer<typeof editSiteFormSchema>;

// Validation helpers
export const validateBlockedSite = (data: unknown): BlockedSite => blockedSiteSchema.parse(data);

export const validateFocusSettings = (data: unknown): FocusSettings => focusSettingsSchema.parse(data);

export const validateDailyStats = (data: unknown): DailyStats => dailyStatsSchema.parse(data);

export const validateHistoricalStats = (data: unknown): HistoricalStats => historicalStatsSchema.parse(data);

export const validateActiveTimer = (data: unknown): ActiveTimer => activeTimerSchema.parse(data);

export const validateAddSiteForm = (data: unknown): AddSiteFormData => addSiteFormSchema.parse(data);

export const validateEditSiteForm = (data: unknown): EditSiteFormData => editSiteFormSchema.parse(data);

// Safe validation helpers (return null on error instead of throwing)
export const safeValidateBlockedSite = (data: unknown): BlockedSite | null => {
  try {
    return blockedSiteSchema.parse(data);
  } catch {
    return null;
  }
};

export const safeValidateFocusSettings = (data: unknown): FocusSettings | null => {
  try {
    return focusSettingsSchema.parse(data);
  } catch {
    return null;
  }
};

// Re-export isValidUrlOrDomain at the end
export { isValidUrlOrDomain };
