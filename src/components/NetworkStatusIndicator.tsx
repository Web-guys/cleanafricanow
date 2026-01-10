import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface NetworkStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function NetworkStatusIndicator({ 
  className, 
  showDetails = false 
}: NetworkStatusIndicatorProps) {
  const { t } = useTranslation();
  const { 
    isOnline, 
    isSyncing, 
    pendingCount, 
    triggerSync 
  } = useOfflineSync();

  const hasOfflineData = pendingCount > 0;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Status Indicator */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
            isOnline 
              ? 'bg-success/10 text-success' 
              : 'bg-destructive/10 text-destructive'
          )}>
            {isOnline ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {showDetails && (
              <span>{isOnline ? t('common.online', 'Online') : t('common.offline', 'Offline')}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isOnline 
            ? t('network.connectedToInternet', 'Connected to the internet') 
            : t('network.noConnection', 'No internet connection. Reports will be saved locally.')
          }</p>
        </TooltipContent>
      </Tooltip>

      {/* Pending Reports Badge */}
      {hasOfflineData && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className={cn(
                'gap-1 cursor-pointer',
                isSyncing && 'animate-pulse'
              )}
              onClick={() => isOnline && triggerSync()}
            >
              {isSyncing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isOnline ? (
                <Cloud className="h-3 w-3" />
              ) : (
                <CloudOff className="h-3 w-3" />
              )}
              <span>{pendingCount}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isSyncing 
                ? t('network.syncing', 'Syncing reports...') 
                : isOnline 
                  ? t('network.pendingSync', '{{count}} report(s) waiting to sync. Click to sync now.', { count: pendingCount })
                  : t('network.savedOffline', '{{count}} report(s) saved offline. Will sync when online.', { count: pendingCount })
              }
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Manual Sync Button (only when online with pending data) */}
      {isOnline && hasOfflineData && !isSyncing && showDetails && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={triggerSync}
          className="h-7 px-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export default NetworkStatusIndicator;
