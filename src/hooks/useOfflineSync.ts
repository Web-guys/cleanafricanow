import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { 
  getPendingReports, 
  updateReportSyncStatus, 
  deleteOfflineReport,
  getPendingCount,
  type OfflineReport 
} from '@/lib/offlineDb';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function useOfflineSync() {
  const { isOnline, wasOffline, clearWasOffline } = useNetworkStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncInProgress = useRef(false);

  // Update pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  // Convert base64 photo to File and upload
  const uploadPhoto = async (base64: string, userId: string): Promise<string | null> => {
    try {
      // Extract MIME type and data from base64
      const matches = base64.match(/^data:(.+);base64,(.+)$/);
      if (!matches) return null;

      const mimeType = matches[1];
      const data = matches[2];
      const extension = mimeType.split('/')[1] || 'jpg';
      
      // Convert base64 to Blob
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      // Generate unique filename
      const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

      // Upload to Supabase Storage
      const { data: uploadData, error } = await supabase.storage
        .from('report-photos')
        .upload(filename, blob, { contentType: mimeType });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('report-photos')
        .getPublicUrl(uploadData.path);

      return publicUrl;
    } catch (error) {
      console.error('Failed to upload photo:', error);
      return null;
    }
  };

  // Sync a single report
  const syncReport = async (report: OfflineReport): Promise<boolean> => {
    try {
      await updateReportSyncStatus(report.id, 'syncing');

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload photos first
      const uploadedPhotos: string[] = [];
      for (const photo of report.photos) {
        if (photo.startsWith('data:')) {
          const url = await uploadPhoto(photo, user.id);
          if (url) uploadedPhotos.push(url);
        } else {
          uploadedPhotos.push(photo);
        }
      }

      // Insert report
      const { error } = await supabase
        .from('reports')
        .insert([{
          category: report.category as any,
          description: report.description,
          latitude: report.latitude,
          longitude: report.longitude,
          city_id: report.cityId || null,
          user_id: user.id,
          photos: uploadedPhotos,
        }]);

      if (error) throw error;

      // Mark as synced and delete from offline storage
      await updateReportSyncStatus(report.id, 'synced');
      await deleteOfflineReport(report.id);
      
      return true;
    } catch (error: any) {
      console.error('Sync failed for report:', report.id, error);
      await updateReportSyncStatus(report.id, 'failed', error.message);
      return false;
    }
  };

  // Sync all pending reports
  const syncAllPending = useCallback(async () => {
    if (syncInProgress.current || !isOnline) return;
    
    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const pendingReports = await getPendingReports();
      
      if (pendingReports.length === 0) {
        setIsSyncing(false);
        syncInProgress.current = false;
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const report of pendingReports) {
        // Skip reports that have failed too many times
        if (report.retryCount >= 3) {
          failCount++;
          continue;
        }

        const success = await syncReport(report);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      // Refresh data after sync
      await queryClient.invalidateQueries({ queryKey: ['reports'] });
      await queryClient.invalidateQueries({ queryKey: ['report-stats'] });
      await refreshPendingCount();
      setLastSyncTime(new Date());

      // Show toast summary
      if (successCount > 0) {
        toast({
          title: '✅ Sync Complete',
          description: `${successCount} report${successCount > 1 ? 's' : ''} synced successfully.`,
        });
      }
      
      if (failCount > 0) {
        toast({
          title: '⚠️ Some Reports Failed',
          description: `${failCount} report${failCount > 1 ? 's' : ''} couldn't be synced. Will retry later.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
      syncInProgress.current = false;
    }
  }, [isOnline, queryClient, refreshPendingCount, toast]);

  // Manual sync trigger
  const triggerSync = useCallback(() => {
    if (isOnline) {
      syncAllPending();
    }
  }, [isOnline, syncAllPending]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (wasOffline && isOnline) {
      toast({
        title: '🌐 Back Online',
        description: 'Syncing your offline reports...',
      });
      syncAllPending();
      clearWasOffline();
    }
  }, [wasOffline, isOnline, syncAllPending, clearWasOffline, toast]);

  // Initial pending count
  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  // Periodic sync check (every 30 seconds when online)
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(() => {
      refreshPendingCount().then(async () => {
        const count = await getPendingCount();
        if (count > 0 && !syncInProgress.current) {
          syncAllPending();
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [isOnline, refreshPendingCount, syncAllPending]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    triggerSync,
    refreshPendingCount,
  };
}
