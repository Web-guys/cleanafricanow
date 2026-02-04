import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BinType = 'plastic' | 'organic' | 'mixed' | 'glass' | 'paper' | 'metal' | 'electronic';
export type BinStatus = 'empty' | 'half_full' | 'almost_full' | 'full' | 'overflowing' | 'damaged' | 'missing';
export type BinCapacity = 'small' | 'medium' | 'large' | 'extra_large';

export interface WasteBin {
  id: string;
  bin_code: string;
  city_id: string | null;
  bin_type: BinType;
  capacity: BinCapacity;
  latitude: number;
  longitude: number;
  address: string | null;
  district: string | null;
  street: string | null;
  current_status: BinStatus;
  last_collection_at: string | null;
  last_status_update_at: string | null;
  installed_at: string | null;
  created_at: string | null;
  is_active: boolean;
  notes: string | null;
  cities?: { name: string; country: string } | null;
}

export interface BinStatusReport {
  id: string;
  bin_id: string;
  reported_by: string | null;
  reported_status: BinStatus;
  photo_url: string | null;
  notes: string | null;
  is_verified: boolean;
  created_at: string;
  waste_bins?: { bin_code: string } | null;
}

export interface BinAlert {
  id: string;
  bin_id: string;
  alert_type: string;
  severity: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
  waste_bins?: { bin_code: string; district: string | null } | null;
}

export const useBins = (cityId?: string) => {
  return useQuery({
    queryKey: ['waste-bins', cityId],
    queryFn: async () => {
      let query = supabase
        .from('waste_bins')
        .select('*, cities(name, country)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WasteBin[];
    },
  });
};

export const useBinStats = (cityId?: string) => {
  return useQuery({
    queryKey: ['bin-stats', cityId],
    queryFn: async () => {
      let query = supabase
        .from('waste_bins')
        .select('current_status')
        .eq('is_active', true);

      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        empty: 0,
        half_full: 0,
        almost_full: 0,
        full: 0,
        overflowing: 0,
        damaged: 0,
        missing: 0,
        needsAttention: 0,
      };

      data?.forEach((bin: { current_status: BinStatus }) => {
        stats[bin.current_status]++;
        if (['full', 'overflowing', 'damaged', 'missing'].includes(bin.current_status)) {
          stats.needsAttention++;
        }
      });

      return stats;
    },
  });
};

export const useBinAlerts = (cityId?: string, unresolvedOnly = true) => {
  return useQuery({
    queryKey: ['bin-alerts', cityId, unresolvedOnly],
    queryFn: async () => {
      let query = supabase
        .from('bin_alerts')
        .select('*, waste_bins(bin_code, district)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (unresolvedOnly) {
        query = query.eq('is_resolved', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BinAlert[];
    },
  });
};

export const useBinReports = (binId?: string) => {
  return useQuery({
    queryKey: ['bin-reports', binId],
    queryFn: async () => {
      let query = supabase
        .from('bin_status_reports')
        .select('*, waste_bins(bin_code)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (binId) {
        query = query.eq('bin_id', binId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BinStatusReport[];
    },
  });
};

export const useCreateBin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bin: {
      bin_code: string;
      city_id: string;
      bin_type?: BinType;
      capacity?: BinCapacity;
      latitude: number;
      longitude: number;
      address?: string | null;
      district?: string | null;
      street?: string | null;
      notes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('waste_bins')
        .insert([bin])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-bins'] });
      queryClient.invalidateQueries({ queryKey: ['bin-stats'] });
      toast.success('Bin registered successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to register bin: ' + error.message);
    },
  });
};

export const useUpdateBin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WasteBin> & { id: string }) => {
      const { data, error } = await supabase
        .from('waste_bins')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-bins'] });
      queryClient.invalidateQueries({ queryKey: ['bin-stats'] });
      toast.success('Bin updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update bin: ' + error.message);
    },
  });
};

export const useReportBinStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (report: {
      bin_id: string;
      reported_status: BinStatus;
      photo_url?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('bin_status_reports')
        .insert({
          ...report,
          reported_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-bins'] });
      queryClient.invalidateQueries({ queryKey: ['bin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['bin-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['bin-reports'] });
      toast.success('Bin status reported successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to report status: ' + error.message);
    },
  });
};

export const useResolveAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('bin_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bin-alerts'] });
      toast.success('Alert resolved');
    },
    onError: (error: Error) => {
      toast.error('Failed to resolve alert: ' + error.message);
    },
  });
};

export const useLogCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      bin_id: string;
      status_before: BinStatus;
      collection_route_id?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('bin_collection_logs')
        .insert({
          ...log,
          collected_by: user?.id,
          status_after: 'empty',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-bins'] });
      queryClient.invalidateQueries({ queryKey: ['bin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['bin-alerts'] });
      toast.success('Collection logged successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to log collection: ' + error.message);
    },
  });
};
