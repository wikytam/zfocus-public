import { z } from 'zod';

// URL/domain validation function (reusable)
const isValidUrlOrDomain = (val: string): boolean => {
  if (!val || val.trim() === '') return false;

  const trimmed = val.trim();

  // Accept full URLs with protocol
  try {
    new URL(trimmed);
    return true;
  } catch {
    // Accept domain patterns like: example.com, sub.example.com, *.example.com
    // Also accept path patterns like: youtube.com/learn, facebook.com/help
    const domainPattern = /^(\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
    return domainPattern.test(trimmed) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/[^\s]*)?$/.test(trimmed);
  }
};

// Custom URL/domain validator that accepts both full URLs and domain names
const urlOrDomainSchema = z.string().refine(isValidUrlOrDomain, {
  message: 'Invalid URL or domain format',
});

// URL/domain schema that also accepts empty strings (for optional arrays)
const optionalUrlOrDomainSchema = z
  .string()
  .refine(val => !val || val.trim() === '' || isValidUrlOrDomain(val), { message: 'Invalid URL or domain format' });

// Validate multiple URLs and return errors for each invalid one
interface UrlValidationError {
  index: number;
  url: string;
  message: string;
}

const validateUrls = (urls: string[]): UrlValidationError[] => {
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
const scheduleSchema = z.object({
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  workDays: z.array(z.number().min(0).max(6)).min(1, 'At least one work day required'),
  allowOutsideHours: z.boolean(),
});

// Blocked site schema
const blockedSiteSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  urls: z.array(urlOrDomainSchema).min(1, 'At least one URL required'),
  exceptions: z.array(optionalUrlOrDomainSchema).optional(),
  referrers: z.array(optionalUrlOrDomainSchema).optional(),
  keywords: z.array(z.string().max(50)).optional(),
  allowedMinutesPerHour: z.number().min(1, 'Must be at least 1 minute').max(1440, 'Cannot exceed 24 hours'),
  countOnlyActiveTab: z.boolean().optional(),
  action: z.enum(['close', 'redirect']),
  redirectUrl: z.string().url('Invalid redirect URL').optional().or(z.literal('')),
  isActive: z.boolean(),
  schedule: scheduleSchema,
});

// Focus settings schema
const focusSettingsSchema = z.object({
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
const dailyStatsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  blockedAttempts: z.number().min(0),
  timePausedSeconds: z.number().min(0),
  sitesAccessed: z.record(z.string(), z.number().min(0)),
});

// Historical stats schema
const historicalStatsSchema = z.record(
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  z.object({
    blockedAttempts: z.number().min(0),
    timePausedSeconds: z.number().min(0),
    sitesAccessed: z.record(z.string(), z.number().min(0)),
  }),
);

// Active timer schema
const activeTimerSchema = z.object({
  siteId: z.string().min(1),
  siteName: z.string().min(1),
  remainingSeconds: z.number().min(0),
  totalSeconds: z.number().min(0),
});

// Form validation schemas for UI components
const addSiteFormSchema = z.object({
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

const editSiteFormSchema = addSiteFormSchema.extend({
  allowedMinutes: z.number().min(1, 'Must be at least 1 minute').max(1440, 'Cannot exceed 24 hours').optional(),
});

// Type definitions
type BlockedSite = z.infer<typeof blockedSiteSchema>;
type FocusSettings = z.infer<typeof focusSettingsSchema>;
type DailyStats = z.infer<typeof dailyStatsSchema>;
type HistoricalStats = z.infer<typeof historicalStatsSchema>;
type ActiveTimer = z.infer<typeof activeTimerSchema>;
type AddSiteFormData = z.infer<typeof addSiteFormSchema>;
type EditSiteFormData = z.infer<typeof editSiteFormSchema>;

// Validation helpers
const validateBlockedSite = (data: unknown): BlockedSite => blockedSiteSchema.parse(data);
const validateFocusSettings = (data: unknown): FocusSettings => focusSettingsSchema.parse(data);
const validateDailyStats = (data: unknown): DailyStats => dailyStatsSchema.parse(data);
const validateHistoricalStats = (data: unknown): HistoricalStats => historicalStatsSchema.parse(data);
const validateActiveTimer = (data: unknown): ActiveTimer => activeTimerSchema.parse(data);
const validateAddSiteForm = (data: unknown): AddSiteFormData => addSiteFormSchema.parse(data);
const validateEditSiteForm = (data: unknown): EditSiteFormData => editSiteFormSchema.parse(data);

// Safe validation helpers (return null on error instead of throwing)
const safeValidateBlockedSite = (data: unknown): BlockedSite | null => {
  try {
    return blockedSiteSchema.parse(data);
  } catch {
    return null;
  }
};

const safeValidateFocusSettings = (data: unknown): FocusSettings | null => {
  try {
    return focusSettingsSchema.parse(data);
  } catch {
    return null;
  }
};

// Exports
export type { BlockedSite, FocusSettings, DailyStats, HistoricalStats, ActiveTimer, AddSiteFormData, EditSiteFormData };
export type { UrlValidationError };

export { isValidUrlOrDomain, validateUrls, scheduleSchema };
export { blockedSiteSchema, focusSettingsSchema, dailyStatsSchema, historicalStatsSchema, activeTimerSchema };
export { addSiteFormSchema, editSiteFormSchema };
export {
  validateBlockedSite,
  validateFocusSettings,
  validateDailyStats,
  validateHistoricalStats,
  validateActiveTimer,
  validateAddSiteForm,
  validateEditSiteForm,
};
export { safeValidateBlockedSite, safeValidateFocusSettings };
