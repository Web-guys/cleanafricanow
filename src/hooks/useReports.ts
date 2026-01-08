import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Report {
  id: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  created_at: string;
  photos: string[] | null;
  city_id: string | null;
  priority?: string;
  sla_due_date?: string;
  verified_at?: string;
  resolved_at?: string;
  updated_at?: string;
  is_deleted?: boolean;
}

interface UseReportsOptions {
  categoryFilter?: string;
  statusFilter?: string;
}

export const useReports = (options: UseReportsOptions = {}) => {
  const { categoryFilter = 'all', statusFilter = 'all' } = options;

  return useQuery({
    queryKey: ['reports', categoryFilter, statusFilter],
    queryFn: async () => {
      // Use reports_public view which excludes sensitive user_id field
      let query = supabase.from('reports_public').select('*');
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Report[];
    }
  });
};

export const useReportStats = () => {
  return useQuery({
    queryKey: ['report-stats'],
    queryFn: async () => {
      // Use reports_public view which excludes sensitive user_id field
      const { data, error } = await supabase.from('reports_public').select('status');
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        pending: data?.filter(r => r.status === 'pending').length || 0,
        inProgress: data?.filter(r => r.status === 'in_progress').length || 0,
        resolved: data?.filter(r => r.status === 'resolved').length || 0
      };
      
      return stats;
    }
  });
};
