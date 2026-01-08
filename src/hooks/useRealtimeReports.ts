import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useRealtimeReports = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    const channel = supabase
      .channel('reports-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports',
        },
        (payload) => {
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['reports'] });
          queryClient.invalidateQueries({ queryKey: ['report-stats'] });
          queryClient.invalidateQueries({ queryKey: ['admin-all-reports'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
          
          // Show toast for new reports
          if (payload.eventType === 'INSERT') {
            const newReport = payload.new as any;
            toast({
              title: "New Report Created",
              description: `A new ${newReport.category?.replace('_', ' ')} report has been submitted.`,
            });
          }
          
          // Show toast for status changes
          if (payload.eventType === 'UPDATE') {
            const updatedReport = payload.new as any;
            const oldReport = payload.old as any;
            
            if (oldReport?.status !== updatedReport?.status) {
              toast({
                title: "Report Status Updated",
                description: `Report status changed to ${updatedReport.status?.replace('_', ' ')}.`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, toast]);
};
