import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface OfflineReport {
  id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  cityId: string | null;
  photos: string[]; // Base64 encoded for offline storage
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  syncError?: string;
  retryCount: number;
}

interface CleanAfricaDB extends DBSchema {
  'offline-reports': {
    key: string;
    value: OfflineReport;
    indexes: { 'by-sync-status': string; 'by-created': string };
  };
  'report-photos': {
    key: string;
    value: {
      id: string;
      reportId: string;
      base64: string;
      mimeType: string;
    };
  };
}

const DB_NAME = 'cleanafricanow-offline';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<CleanAfricaDB> | null = null;

export async function getDb(): Promise<IDBPDatabase<CleanAfricaDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<CleanAfricaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Offline reports store
      if (!db.objectStoreNames.contains('offline-reports')) {
        const reportStore = db.createObjectStore('offline-reports', { keyPath: 'id' });
        reportStore.createIndex('by-sync-status', 'syncStatus');
        reportStore.createIndex('by-created', 'createdAt');
      }

      // Photos store (for offline photo storage)
      if (!db.objectStoreNames.contains('report-photos')) {
        db.createObjectStore('report-photos', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// Generate unique ID for offline reports
export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Save a report draft offline
export async function saveOfflineReport(report: Omit<OfflineReport, 'id' | 'createdAt' | 'syncStatus' | 'retryCount'>): Promise<OfflineReport> {
  const db = await getDb();
  
  const offlineReport: OfflineReport = {
    ...report,
    id: generateOfflineId(),
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
    retryCount: 0,
  };

  await db.put('offline-reports', offlineReport);
  return offlineReport;
}

// Get all offline reports
export async function getOfflineReports(): Promise<OfflineReport[]> {
  const db = await getDb();
  return db.getAllFromIndex('offline-reports', 'by-created');
}

// Get pending reports that need syncing
export async function getPendingReports(): Promise<OfflineReport[]> {
  const db = await getDb();
  const allReports = await db.getAll('offline-reports');
  return allReports.filter(r => r.syncStatus === 'pending' || r.syncStatus === 'failed');
}

// Update report sync status
export async function updateReportSyncStatus(
  id: string, 
  status: OfflineReport['syncStatus'], 
  error?: string
): Promise<void> {
  const db = await getDb();
  const report = await db.get('offline-reports', id);
  
  if (report) {
    report.syncStatus = status;
    if (error) {
      report.syncError = error;
      report.retryCount += 1;
    }
    await db.put('offline-reports', report);
  }
}

// Delete a synced report from offline storage
export async function deleteOfflineReport(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('offline-reports', id);
  
  // Also delete associated photos
  const tx = db.transaction('report-photos', 'readwrite');
  const photos = await tx.store.getAll();
  for (const photo of photos) {
    if (photo.reportId === id) {
      await tx.store.delete(photo.id);
    }
  }
}

// Save photo as base64 for offline storage
export async function saveOfflinePhoto(
  reportId: string, 
  file: File
): Promise<string> {
  const db = await getDb();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.put('report-photos', {
        id: photoId,
        reportId,
        base64,
        mimeType: file.type,
      });
      
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Get count of pending reports
export async function getPendingCount(): Promise<number> {
  const pending = await getPendingReports();
  return pending.length;
}

// Clear all synced reports (cleanup)
export async function clearSyncedReports(): Promise<void> {
  const db = await getDb();
  const allReports = await db.getAll('offline-reports');
  
  for (const report of allReports) {
    if (report.syncStatus === 'synced') {
      await deleteOfflineReport(report.id);
    }
  }
}
