import { isValidSettings } from './settingsValidation';
import type { FocusSettings } from '@extension/storage';

export interface ExportData {
  version: string;
  exportedAt: string;
  settings: FocusSettings;
}

export interface ImportResult {
  success: boolean;
  type: 'success' | 'error' | 'warning';
  message: string;
  normalized?: FocusSettings;
}

// ===== EXPORT FUNCTION =====
export const exportSettings = (settings: FocusSettings): ImportResult => {
  try {
    const exportData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      settings: settings,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusguard-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, type: 'success', message: 'Đã xuất file thành công!' };
  } catch (error) {
    return {
      success: false,
      type: 'error',
      message: `Lỗi xuất file: ${error instanceof Error ? error.message : 'Unknown'}`,
    };
  }
};

// ===== IMPORT FUNCTION =====
export const parseImportFile = (file: File): Promise<ImportResult> =>
  new Promise(resolve => {
    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      resolve({ success: false, type: 'error', message: 'File quá lớn (tối đa 1MB)' });
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      resolve({ success: false, type: 'error', message: 'Chỉ hỗ trợ file .json' });
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      try {
        const content = e.target?.result as string;

        // Parse JSON
        let parsed: unknown;
        try {
          parsed = JSON.parse(content);
        } catch {
          resolve({ success: false, type: 'error', message: 'File JSON không hợp lệ' });
          return;
        }

        // Extract settings (support both old and new format)
        let settingsData: unknown;
        if (parsed && typeof parsed === 'object') {
          const p = parsed as Record<string, unknown>;
          if (p.settings && typeof p.settings === 'object') {
            // New format with metadata
            settingsData = p.settings;
          } else if (p.blockedSites) {
            // Direct settings format
            settingsData = parsed;
          } else {
            resolve({ success: false, type: 'error', message: 'Không tìm thấy dữ liệu settings trong file' });
            return;
          }
        } else {
          resolve({ success: false, type: 'error', message: 'Định dạng file không hợp lệ' });
          return;
        }

        // Validate and normalize
        const validation = isValidSettings(settingsData);

        if (!validation.valid) {
          resolve({
            success: false,
            type: 'error',
            message: `Dữ liệu không hợp lệ:\n${validation.errors.join('\n')}`,
          });
          return;
        }

        resolve({
          success: true,
          type: 'success',
          message: `Sẵn sàng nhập ${validation.normalized!.blockedSites.length} website`,
          normalized: validation.normalized!,
        });
      } catch (error) {
        resolve({
          success: false,
          type: 'error',
          message: `Lỗi đọc file: ${error instanceof Error ? error.message : 'Unknown'}`,
        });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, type: 'error', message: 'Không thể đọc file' });
    };

    reader.readAsText(file);
  });
