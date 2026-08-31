import fs from 'fs';
import path from 'path';

export interface AppSettings {
  hideOldData: boolean; // Master toggle to hide old records
  cutoffMode: 'slNo' | 'date'; // Primary cutoff rule
  cutoffSlNo: number; // Hide rows with Sl No. < cutoffSlNo
  cutoffDate?: string; // Hide rows with date < cutoffDate (YYYY-MM-DD)
  respectArchivedColumn: boolean; // Also hide rows where 'Archived' is 'TRUE' or 'Yes'
  allowAdminViewAll: boolean; // Allow toggling "Show All / Show New Only" directly on dashboard table
}

const DEFAULT_SETTINGS: AppSettings = {
  hideOldData: false,
  cutoffMode: 'slNo',
  cutoffSlNo: 0,
  cutoffDate: '',
  respectArchivedColumn: true,
  allowAdminViewAll: true,
};

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'config', 'settings.json');

// In-memory cache for fast reads
let cachedSettings: AppSettings | null = null;

export function getDefaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS };
}

export function getSettings(): AppSettings {
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const fileData = fs.readFileSync(SETTINGS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(fileData);
      cachedSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
      return cachedSettings!;
    }
  } catch (error) {
    console.error('[Settings] Failed to read settings file:', error);
  }

  cachedSettings = { ...DEFAULT_SETTINGS };
  return cachedSettings;
}

export function saveSettings(newSettings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated: AppSettings = {
    ...current,
    ...newSettings,
  };

  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), 'utf-8');
    cachedSettings = updated;
  } catch (error) {
    console.error('[Settings] Failed to write settings file:', error);
    throw new Error('Failed to save settings to disk');
  }

  return updated;
}
