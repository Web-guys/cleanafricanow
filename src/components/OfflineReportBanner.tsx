import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';
import { WifiOff, Cloud, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface OfflineReportBannerProps {
  className?: string;
}

export function OfflineReportBanner({ className }: OfflineReportBannerProps) {
  const { t } = useTranslation();
  const { isOnline, isSyncing, pendingCount, triggerSync } = useOfflineSync();

  // Don't show if online with no pending reports
  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={cn(
      'px-4 py-3 rounded-lg border transition-all',
      isOnline 
        ? 'bg-primary/10 border-primary/20' 
        : 'bg-warning/10 border-warning/20',
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-full',
          isOnline ? 'bg-primary/20' : 'bg-warning/20'
        )}>
          {isOnline ? (
            isSyncing ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <Cloud className="h-4 w-4 text-primary" />
            )
          ) : (
            <WifiOff className="h-4 w-4 text-warning" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium',
            isOnline ? 'text-primary' : 'text-warning'
          )}>
            {isOnline 
              ? isSyncing 
                ? t('offline.syncing', 'Syncing your reports...')
                : t('offline.pendingReports', '{{count}} report(s) ready to sync', { count: pendingCount })
              : t('offline.offlineMode', 'You\'re offline')
            }
          </p>
          <p className="text-xs text-muted-foreground">
            {isOnline 
              ? isSyncing 
                ? t('offline.pleaseWait', 'Please wait while we upload your reports')
                : t('offline.clickToSync', 'Click sync to upload your saved reports')
              : t('offline.reportsSaved', 'Your reports will be saved and synced when you\'re back online')
            }
          </p>
        </div>

        {isOnline && pendingCount > 0 && !isSyncing && (
          <Button size="sm" onClick={triggerSync}>
            {t('offline.syncNow', 'Sync Now')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default OfflineReportBanner;
