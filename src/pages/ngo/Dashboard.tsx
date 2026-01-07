import { Heart, TrendingUp, Clock, CheckCircle2, Building2, Map, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentReportsTable } from "@/components/dashboard/RecentReportsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface NgoRegion {
  id: string;
  ngo_user_id: string;
  city_id: string;
  created_at: string;
  cities: {
    id: string;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  } | null;
}

interface ReportWithCity {
  id: string;
  category: string;
  description: string;
  status: string | null;
  latitude: number;
  longitude: number;
  city_id: string | null;
  created_at: string | null;
  photos: string[] | null;
  cities: {
    name: string;
    country: string;
  } | null;
}

const NgoDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignedRegions } = useQuery({
    queryKey: ['ngo-regions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ngo_regions')
        .select('*, cities(*)')
        .eq('ngo_user_id', user.id);
      
      if (error) throw error;
      return (data || []) as NgoRegion[];
    },
    enabled: !!user
  });

  const cityIds = assignedRegions?.map(r => r.city_id) || [];

  const { data: reports, isLoading } = useQuery({
    queryKey: ['ngo-reports', cityIds],
    queryFn: async () => {
      if (cityIds.length === 0) return [];
      const { data, error } = await supabase
        .from('reports')
        .select('id, category, description, status, latitude, longitude, city_id, created_at, photos, cities(name, country)')
        .in('city_id', cityIds)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as ReportWithCity[];
    },
    enabled: cityIds.length > 0
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status: status as any })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ngo-reports'] });
      toast({
        title: t('ngo.dashboard.statusUpdated', 'Status Updated'),
        description: t('ngo.dashboard.statusUpdatedDesc', 'Report status has been updated successfully.'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error', 'Error'),
        description: t('ngo.dashboard.statusUpdateFailed', 'Failed to update report status.'),
        variant: "destructive",
      });
    }
  });

  const stats = {
    total: reports?.length || 0,
    pending: reports?.filter(r => r.status === 'pending').length || 0,
    inProgress: reports?.filter(r => r.status === 'in_progress').length || 0,
    resolved: reports?.filter(r => r.status === 'resolved').length || 0,
    regions: assignedRegions?.length || 0
  };

  const statsData = [
    {
      title: t('ngo.dashboard.regionsCount', 'Regions'),
      value: stats.regions,
      icon: Building2,
      color: 'secondary' as const,
      subtitle: t('ngo.dashboard.assignedRegions', 'Assigned regions'),
    },
    {
      title: t('admin.dashboard.totalReports'),
      value: stats.total,
      icon: TrendingUp,
      color: 'primary' as const,
      subtitle: t('dashboard.inYourRegions', 'In your regions'),
    },
    {
      title: t('admin.dashboard.pending'),
      value: stats.pending,
      icon: Clock,
      color: 'warning' as const,
      subtitle: t('dashboard.needsAttention', 'Needs attention'),
    },
    {
      title: t('admin.dashboard.resolved'),
      value: stats.resolved,
      icon: CheckCircle2,
      color: 'success' as const,
      subtitle: stats.total ? `${Math.round((stats.resolved / stats.total) * 100)}%` : undefined,
    },
  ];

  const quickActions = [
    { label: t('nav.map'), to: '/map', icon: Map },
  ];

  return (
    <DashboardLayout 
      title={t('ngo.dashboard.title', 'NGO Dashboard')} 
      icon={<Heart className="h-6 w-6 text-primary" />}
      role="ngo"
    >
      <div className="p-4 lg:p-8 space-y-8">
        {/* Assigned Regions Banner */}
        {assignedRegions && assignedRegions.length > 0 ? (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                {t('ngo.dashboard.assignedRegions', 'Your Assigned Regions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {assignedRegions.map((region) => (
                  <Badge key={region.id} variant="secondary" className="px-3 py-1.5 text-sm">
                    <MapPin className="w-3 h-3 mr-1" />
                    {region.cities?.name}, {region.cities?.country}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertTitle>{t('ngo.dashboard.noRegions', 'No regions assigned')}</AlertTitle>
            <AlertDescription>
              {t('ngo.dashboard.noRegionsDesc', 'Contact an administrator to be assigned to regions.')}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <StatsGrid stats={statsData} />

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Reports Table */}
        <RecentReportsTable 
          reports={reports} 
          isLoading={isLoading}
          showCity
          showStatusSelect
          onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
          title={t('ngo.dashboard.reportsInRegions', 'Reports in Your Regions')}
          emptyMessage={t('ngo.dashboard.noReports', 'No reports found in your assigned regions.')}
        />
      </div>
    </DashboardLayout>
  );
};

export default NgoDashboard;
