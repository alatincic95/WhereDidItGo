import { Platform } from 'react-native';
import { File, Directory, Paths } from 'expo-file-system';

const AUTO_BACKUP_DIR = 'autobackups';

function getBackupDir(): Directory {
  return new Directory(Paths.document, AUTO_BACKUP_DIR);
}

/**
 * Perform an automatic backup of the app state.
 * Writes a JSON file to the app's document directory.
 */
export async function performAutoBackup(getBackupState: () => any): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const dir = getBackupDir();
    if (!dir.exists) {
      dir.create();
    }

    const state = getBackupState();
    const backupData = {
      app: 'WhereDidItGo',
      version: '1.0.0',
      type: 'auto-backup',
      exportDate: new Date().toISOString(),
      data: state,
    };

    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const fileName = `auto_backup_${timestamp}.json`;

    const file = new File(dir, fileName);
    await file.create();
    await file.write(JSON.stringify(backupData));

    return true;
  } catch (e) {
    console.warn('Auto backup failed:', e);
    return false;
  }
}

/**
 * Get list of existing auto-backups sorted by date (newest first).
 */
export async function getAutoBackups(): Promise<{ name: string; date: string; uri: string }[]> {
  if (Platform.OS === 'web') return [];

  try {
    const dir = getBackupDir();
    if (!dir.exists) return [];

    const files = [...dir.list()].filter(
      (f): f is File => f instanceof File && f.name?.endsWith('.json')
    );

    return files
      .map((f) => {
        // Extract date from filename: auto_backup_YYYY-MM-DD_HHMMSS.json
        const match = f.name?.match(/auto_backup_(\d{4}-\d{2}-\d{2}_\d{6})\.json/);
        const dateStr = match
          ? match[1].replace('_', 'T').replace(/(\d{2})(\d{2})(\d{2})$/, '$1:$2:$3')
          : '';
        return {
          name: f.name || '',
          date: dateStr,
          uri: f.uri,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

/**
 * Rotate auto-backups: keep only the most recent `maxCount` files.
 */
export async function rotateBackups(maxCount: number): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const backups = await getAutoBackups();
    if (backups.length <= maxCount) return;

    const toDelete = backups.slice(maxCount);
    for (const backup of toDelete) {
      const file = new File(getBackupDir(), backup.name);
      if (file.exists) {
        file.delete();
      }
    }
  } catch {
    // Silent
  }
}

/**
 * Read and parse an auto-backup file.
 */
export async function readAutoBackup(name: string): Promise<any | null> {
  if (Platform.OS === 'web') return null;

  try {
    const file = new File(getBackupDir(), name);
    if (!file.exists) return null;
    const content = await file.text();
    const parsed = JSON.parse(content);
    return parsed.data || parsed;
  } catch {
    return null;
  }
}

/**
 * Check if an auto-backup should be triggered.
 * Returns true if backup is needed based on frequency and last backup date.
 */
export function shouldAutoBackup(
  autoBackupEnabled: boolean,
  autoBackupFrequency: 'daily' | 'every5' | 'every10' | 'every20',
  lastAutoBackupDate: string | null,
  expensesSinceLastBackup: number,
): boolean {
  if (!autoBackupEnabled) return false;

  // Count-based frequencies
  const countThresholds: Record<string, number> = {
    every5: 5,
    every10: 10,
    every20: 20,
  };

  if (autoBackupFrequency !== 'daily') {
    return expensesSinceLastBackup >= (countThresholds[autoBackupFrequency] || 10);
  }

  // Daily: check if last backup was more than 24 hours ago
  if (!lastAutoBackupDate) return true;
  const lastDate = new Date(lastAutoBackupDate).getTime();
  const now = Date.now();
  return now - lastDate > 24 * 60 * 60 * 1000;
}
