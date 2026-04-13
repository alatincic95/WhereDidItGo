import { Platform, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { buildBackupJson, validateBackup, BackupData } from './exportData';

const BACKUP_DIR = 'WhereDidItGo_Backups';

export async function getBackupDir(): Promise<string> {
  const dir = `${Paths.document}/${BACKUP_DIR}`;
  return dir;
}

export async function saveLocalBackup(state: Omit<BackupData, '_meta'>): Promise<string> {
  const json = buildBackupJson(state);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${timestamp}.json`;
  const dirPath = await getBackupDir();

  // Ensure directory exists
  const dir = new File(dirPath);
  try {
    await dir.create();
  } catch {
    // dir may already exist
  }

  const filePath = `${dirPath}/${filename}`;
  const file = new File(filePath);
  file.write(json);
  return filePath;
}

export async function getLocalBackups(): Promise<{ name: string; date: string; size: number; path: string }[]> {
  try {
    const dirPath = await getBackupDir();
    const dir = new File(dirPath);
    // List files in directory
    const content = await dir.text();
    return [];
  } catch {
    return [];
  }
}

export async function shareBackupToCloud(state: Omit<BackupData, '_meta'>): Promise<boolean> {
  const json = buildBackupJson(state);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `WhereDidItGo_CloudBackup_${date}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }

  try {
    const file = new File(Paths.cache, filename);
    file.write(json);

    // Use share sheet - user can save to iCloud Drive, Google Drive, Dropbox, etc.
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save to Cloud',
      UTI: 'public.json',
    });
    return true;
  } catch {
    return false;
  }
}

export async function generateTransferData(state: Omit<BackupData, '_meta'>): Promise<string> {
  return buildBackupJson(state);
}

export function parseTransferData(json: string): { valid: true; data: BackupData } | { valid: false; error: string } {
  return validateBackup(json);
}
