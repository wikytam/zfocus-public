export interface SiteSchedule {
  startTime: string;
  endTime: string;
  workDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  allowOutsideHours: boolean;
}

export interface BlockedSite {
  id: string;
  title: string;
  urls: string[];
  allowedMinutesPerHour: number;
  action: 'close' | 'redirect';
  redirectUrl?: string;
  isActive: boolean;
  schedule: SiteSchedule;
}

export interface WorkSchedule {
  startTime: string;
  endTime: string;
  workDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  allowOutsideHours: boolean;
}

export interface DailyStats {
  date: string;
  blockedAttempts: number;
  timeSavedMinutes: number;
  sitesAccessed: { [siteId: string]: number };
}

export interface FocusSettings {
  blockedSites: BlockedSite[];
  workSchedule: WorkSchedule;
  pauseMinutes: number;
  isPaused: boolean;
  pauseEndTime?: number;
  hardLockMode: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface ActiveTimer {
  siteId: string;
  siteName: string;
  remainingSeconds: number;
  totalSeconds: number;
}

