import { Heart, TrendingUp, Clock, CheckCircle2, Building2, Map, MapPin, FileText, Calendar, Users, Leaf, AlertTriangle, Sparkles, Target } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentReportsTable } from "@/components/dashboard/RecentReportsTable";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ImpactMetrics } from "@/components/dashboard/ImpactMetrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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

  // Fetch events count
  const { data: eventsData } = useQuery({
    queryKey: ['ngo-events-count', cityIds],
    queryFn: async () => {
      if (cityIds.length === 0) return { total: 0, upcoming: 0 };
      const { data } = await supabase
        .from('collection_events')
        .select('id, status, event_date')
        .in('city_id', cityIds);
      
      const now = new Date();
      return {
        total: data?.length || 0,
        upcoming: data?.filter(e => new Date(e.event_date) > now).length || 0,
      };
    },
    enabled: cityIds.length > 0
  });

  // Fetch volunteers count
  const { data: volunteersCount } = useQuery({
    queryKey: ['ngo-volunteers-count', cityIds],
    queryFn: async () => {
      if (cityIds.length === 0) return 0;
      const { data: events } = await supabase
        .from('collection_events')
        .select('id')
        .in('city_id', cityIds);
      
      if (!events?.length) return 0;
      
      const { data } = await supabase
        .from('event_registrations')
        .select('team_size')
        .in('event_id', events.map(e => e.id))
        .eq('status', 'approved');
      
      return data?.reduce((sum, r) => sum + (r.team_size || 1), 0) || 0;
    },
    enabled: cityIds.length > 0
  });

  // Fetch pending registrations
  const { data: pendingRegistrations } = useQuery({
    queryKey: ['ngo-pending-registrations', cityIds],
    queryFn: async () => {
      if (cityIds.length === 0) return 0;
      const { data: events } = await supabase
        .from('collection_events')
        .select('id')
        .in('city_id', cityIds);
      
      if (!events?.length) return 0;
      
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .in('event_id', events.map(e => e.id))
        .eq('status', 'pending');
      
      return count || 0;
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

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  const statsData = [
    {
      title: t('ngo.dashboard.regionsCount', 'Regions'),
      value: stats.regions,
      icon: Leaf,
      color: 'success' as const,
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
      subtitle: `${resolutionRate}% ${t('dashboard.resolved', 'resolved')}`,
    },
  ];

  const quickActions = [
    { label: t('municipality.dashboard.manageReports', 'Manage Reports'), to: '/admin/reports', icon: FileText, variant: 'default' as const },
    { label: t('nav.map'), to: '/map', icon: Map },
    { label: t('dashboard.organizeEvent', 'Organize Event'), to: '#events', icon: Calendar },
    { label: t('dashboard.viewRegistrations', 'View Registrations'), to: '#registrations', icon: Users },
  ];

  // Create badges for regions
  const regionBadges = assignedRegions?.slice(0, 4).map(r => ({
    label: `${r.cities?.name || 'Unknown'}`,
    variant: 'secondary' as const,
  })) || [];

  if ((assignedRegions?.length || 0) > 4) {
    regionBadges.push({
      label: `+${assignedRegions!.length - 4} more`,
      variant: 'secondary' as const,
    });
  }

  return (
    <DashboardLayout 
      title={t('ngo.dashboard.title', 'NGO Dashboard')} 
      icon={<Heart className="h-6 w-6 text-primary" />}
      role="ngo"
    >
      <div className="p-4 lg:p-8 space-y-6">
        {/* Welcome Banner with Regions */}
        {assignedRegions && assignedRegions.length > 0 ? (
          <WelcomeBanner
            icon={<Heart className="h-7 w-7 text-primary" />}
            title={t('ngo.dashboard.welcomeTitle', 'Welcome Back')}
            subtitle={t('ngo.dashboard.managingRegions', 'Managing environmental protection in')}
            badges={regionBadges}
            gradient="success"
          />
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('ngo.dashboard.noRegions', 'No regions assigned')}</AlertTitle>
            <AlertDescription>
              {t('ngo.dashboard.noRegionsDesc', 'Contact an administrator to be assigned to regions.')}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <StatsGrid stats={statsData} />

        {/* Performance & Impact Summary */}
        {stats.total > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">{t('dashboard.resolutionRate', 'Resolution Rate')}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-500">{resolutionRate}%</span>
                </div>
                <Progress value={resolutionRate} className="h-2" />
              </CardContent>
            </Card>
            
            <Card className="border-purple-500/20 bg-gradient-to-r from-purple-500/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{t('dashboard.volunteersEngaged', 'Volunteers Engaged')}</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-500">{volunteersCount || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {eventsData?.upcoming || 0} {t('dashboard.upcomingEvents', 'upcoming events')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ActivityFeed cityIds={cityIds} />
          <ImpactMetrics
            totalReports={stats.total}
            resolvedReports={stats.resolved}
            regionsCount={stats.regions}
            eventsCount={eventsData?.total || 0}
            volunteersCount={volunteersCount || 0}
          />
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="reports" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-max min-w-full lg:grid lg:w-full lg:grid-cols-4 gap-1">
              <TabsTrigger value="reports" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.reports', 'Reports')}</span>
                {stats.pending > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{stats.pending}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="events" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.events', 'Events')}</span>
                {(eventsData?.upcoming || 0) > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">{eventsData?.upcoming}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="registrations" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Users className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.registrations', 'Registrations')}</span>
                {(pendingRegistrations || 0) > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{pendingRegistrations}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="regions" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.regions', 'Regions')}</span>
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
                  <p className="text-muted-foreground">{t('ngo.dashboard.noRegionsForEvents', 'No region assigned to manage events.')}</p>
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
                  <p className="text-muted-foreground">{t('ngo.dashboard.noRegionsForRegistrations', 'No region assigned to view registrations.')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="regions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  {t('ngo.dashboard.assignedRegions', 'Your Assigned Regions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedRegions && assignedRegions.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {assignedRegions.map((region) => (
                      <Card key={region.id} className="border-primary/10 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <MapPin className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{region.cities?.name}</h4>
                              <p className="text-sm text-muted-foreground">{region.cities?.country}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {reports?.filter(r => r.city_id === region.city_id).length || 0} reports
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{t('ngo.dashboard.noRegions', 'No regions assigned')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default NgoDashboard;
