import { Heart, TrendingUp, Clock, CheckCircle2, Building2, Map, MapPin, FileText, Calendar, Users, Route, Recycle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollectionEventsPanel } from "@/components/municipality/CollectionEventsPanel";
import { EventRegistrationsPanel } from "@/components/municipality/EventRegistrationsPanel";

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
  const primaryCityId = cityIds[0] || null;

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

      try {
        await supabase.functions.invoke('send-status-notification', {
          body: { report_id: id, new_status: status },
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
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
    { label: 'Organiser un événement', to: '#events', icon: Calendar },
    { label: 'Voir les inscriptions', to: '#registrations', icon: Users },
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

        {/* Management Tabs */}
        <Tabs defaultValue="reports" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-max min-w-full lg:grid lg:w-full lg:grid-cols-4 gap-1">
              <TabsTrigger value="reports" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">Signalements</span>
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">Événements</span>
              </TabsTrigger>
              <TabsTrigger value="registrations" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Users className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">Inscriptions</span>
              </TabsTrigger>
              <TabsTrigger value="impact" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">Impact</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="reports">
            <RecentReportsTable 
              reports={reports} 
              isLoading={isLoading}
              showCity
              showStatusSelect
              onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
              title={t('ngo.dashboard.reportsInRegions', 'Reports in Your Regions')}
              emptyMessage={t('ngo.dashboard.noReports', 'No reports found in your assigned regions.')}
            />
          </TabsContent>

          <TabsContent value="events">
            {primaryCityId ? (
              <CollectionEventsPanel cityId={primaryCityId} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Aucune région assignée pour gérer les événements.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="registrations">
            {primaryCityId ? (
              <EventRegistrationsPanel cityId={primaryCityId} />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Aucune région assignée pour voir les inscriptions.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="impact">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Impact Environnemental
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl bg-green-50 dark:bg-green-900/20 text-center">
                    <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
                    <p className="text-sm text-muted-foreground">Problèmes résolus</p>
                  </div>
                  <div className="p-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center">
                    <p className="text-3xl font-bold text-blue-600">{stats.regions}</p>
                    <p className="text-sm text-muted-foreground">Régions couvertes</p>
                  </div>
                  <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-center">
                    <p className="text-3xl font-bold text-purple-600">
                      {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Taux de résolution</p>
                  </div>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">
                    Votre ONG contribue activement à la protection de l'environnement dans {stats.regions} région(s).
                    Continuez votre excellent travail !
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default NgoDashboard;
