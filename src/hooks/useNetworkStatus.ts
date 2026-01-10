import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  downlink?: number;
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    wasOffline: false,
    effectiveType: undefined,
    downlink: undefined,
  }));

  const updateNetworkInfo = useCallback(() => {
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    setStatus(prev => ({
      ...prev,
      isOnline: navigator.onLine,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
    }));
  }, []);

  const handleOnline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: true,
      wasOffline: true, // Flag that we were offline (triggers sync)
    }));
    updateNetworkInfo();
  }, [updateNetworkInfo]);

  const handleOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: false,
    }));
  }, []);

  const clearWasOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      wasOffline: false,
    }));
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    // Initial update
    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, [handleOnline, handleOffline, updateNetworkInfo]);

  return { ...status, clearWasOffline };
}
