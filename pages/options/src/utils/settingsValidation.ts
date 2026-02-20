import { focusSettingsSchema, isValidUrlOrDomain, normalizeUrlPattern } from '@extension/shared';
import type { FocusSettings } from '@extension/storage';
import type { z } from 'zod';

const isValidUrl = (url: string): boolean => isValidUrlOrDomain(url.trim());

const isValidTime = (time: string): boolean => /^([01]?\d|2[0-3]):[0-5]\d$/.test(time);

const isValidBlockedSite = (site: unknown): boolean => {
  const result = focusSettingsSchema.shape.blockedSites.element.safeParse(site);
  return result.success;
};

const normalizeForImport = (data: z.infer<typeof focusSettingsSchema>): FocusSettings => ({
  ...data,
  blockedSites: data.blockedSites.map((site, index) => ({
    ...site,
    id: site.id || `imported-${index}-${Date.now()}`,
    title: site.title.trim().substring(0, 200),
    urls: site.urls.map(url => normalizeUrlPattern(url).substring(0, 500)),
    redirectUrl: site.redirectUrl?.trim().substring(0, 500),
    schedule: {
      ...site.schedule,
      workDays: [...new Set(site.schedule.workDays)].sort(),
    },
  })),
  isPaused: false,
  pauseEndTime: undefined,
});

const isValidSettings = (data: unknown): { valid: boolean; errors: string[]; normalized: FocusSettings | null } => {
  const result = focusSettingsSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(issue => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });
    return { valid: false, errors, normalized: null };
  }

  return { valid: true, errors: [], normalized: normalizeForImport(result.data) };
};

export { isValidUrl, isValidTime, isValidBlockedSite, isValidSettings };
