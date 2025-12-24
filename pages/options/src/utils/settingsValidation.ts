import type { FocusSettings, BlockedSite } from '@extension/storage';

// ===== VALIDATION HELPERS =====
export const isValidUrl = (url: string): boolean => {
  // Basic URL pattern validation
  const urlPattern = /^[a-zA-Z0-9*+>~][a-zA-Z0-9.*+>~\-/_]*$/;
  return urlPattern.test(url.trim()) && url.trim().length > 0 && url.trim().length < 500;
};

export const isValidTime = (time: string): boolean => {
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timePattern.test(time);
};

export const isValidBlockedSite = (site: unknown): site is BlockedSite => {
  if (!site || typeof site !== 'object') return false;
  const s = site as Record<string, unknown>;
  
  // Required fields
  if (typeof s.id !== 'string' || s.id.length === 0 || s.id.length > 100) return false;
  if (typeof s.title !== 'string' || s.title.length === 0 || s.title.length > 200) return false;
  if (!Array.isArray(s.urls) || s.urls.length === 0 || s.urls.length > 100) return false;
  if (!s.urls.every((url: unknown) => typeof url === 'string' && isValidUrl(url))) return false;
  if (typeof s.allowedMinutesPerHour !== 'number' || s.allowedMinutesPerHour < 1 || s.allowedMinutesPerHour > 60) return false;
  if (s.action !== 'close' && s.action !== 'redirect') return false;
  if (typeof s.isActive !== 'boolean') return false;
  
  // Optional fields
  if (s.redirectUrl !== undefined && typeof s.redirectUrl !== 'string') return false;
  
  // Schedule validation
  if (!s.schedule || typeof s.schedule !== 'object') return false;
  const schedule = s.schedule as Record<string, unknown>;
  if (typeof schedule.startTime !== 'string' || !isValidTime(schedule.startTime)) return false;
  if (typeof schedule.endTime !== 'string' || !isValidTime(schedule.endTime)) return false;
  if (!Array.isArray(schedule.workDays) || !schedule.workDays.every((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6)) return false;
  if (typeof schedule.allowOutsideHours !== 'boolean') return false;
  
  return true;
};

export const isValidSettings = (data: unknown): { valid: boolean; errors: string[]; normalized: FocusSettings | null } => {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Dữ liệu không hợp lệ'], normalized: null };
  }
  
  const d = data as Record<string, unknown>;
  
  // Check blockedSites
  if (!Array.isArray(d.blockedSites)) {
    errors.push('Thiếu danh sách website (blockedSites)');
  } else if (d.blockedSites.length > 50) {
    errors.push('Quá nhiều website (tối đa 50)');
  } else {
    d.blockedSites.forEach((site: unknown, index: number) => {
      if (!isValidBlockedSite(site)) {
        errors.push(`Website #${index + 1} không hợp lệ`);
      }
    });
  }
  
  // Check workSchedule
  if (d.workSchedule && typeof d.workSchedule === 'object') {
    const ws = d.workSchedule as Record<string, unknown>;
    if (ws.startTime && !isValidTime(ws.startTime as string)) {
      errors.push('Thời gian bắt đầu không hợp lệ');
    }
    if (ws.endTime && !isValidTime(ws.endTime as string)) {
      errors.push('Thời gian kết thúc không hợp lệ');
    }
  }
  
  // Check pauseMinutes
  if (d.pauseMinutes !== undefined) {
    if (typeof d.pauseMinutes !== 'number' || d.pauseMinutes < 1 || d.pauseMinutes > 120) {
      errors.push('Thời gian tạm dừng phải từ 1-120 phút');
    }
  }
  
  // Check theme
  if (d.theme !== undefined && d.theme !== 'light' && d.theme !== 'dark' && d.theme !== 'system') {
    errors.push('Theme không hợp lệ (phải là light, dark, hoặc system)');
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, normalized: null };
  }
  
  // Normalize data - fill in defaults for missing optional fields
  const normalized: FocusSettings = {
    blockedSites: (d.blockedSites as BlockedSite[]).map((site, index) => ({
      id: site.id || `imported-${index}-${Date.now()}`,
      title: site.title.trim().substring(0, 200),
      urls: site.urls.map((url: string) => url.trim().toLowerCase().substring(0, 500)),
      allowedMinutesPerHour: Math.min(60, Math.max(1, Math.round(site.allowedMinutesPerHour))),
      action: site.action,
      redirectUrl: site.redirectUrl?.trim().substring(0, 500),
      isActive: site.isActive,
      schedule: {
        startTime: site.schedule.startTime,
        endTime: site.schedule.endTime,
        workDays: [...new Set(site.schedule.workDays)].sort(),
        allowOutsideHours: site.schedule.allowOutsideHours,
      },
    })),
    workSchedule: d.workSchedule as FocusSettings['workSchedule'] || {
      startTime: '08:00',
      endTime: '17:00',
      workDays: [1, 2, 3, 4, 5],
      allowOutsideHours: true,
    },
    pauseMinutes: typeof d.pauseMinutes === 'number' ? Math.min(120, Math.max(1, d.pauseMinutes)) : 15,
    isPaused: false, // Always reset pause state on import
    pauseEndTime: undefined,
    hardLockMode: typeof d.hardLockMode === 'boolean' ? d.hardLockMode : false,
    theme: (d.theme as 'light' | 'dark' | 'system') || 'dark',
  };
  
  return { valid: true, errors: [], normalized };
};

