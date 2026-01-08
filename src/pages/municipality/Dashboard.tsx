import { Building, TrendingUp, Clock, CheckCircle2, FileText, Map, MapPin, Calendar, Users, Route, Recycle, Trash, Building2 } from "lucide-react";
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
import { CollectionRoutesPanel } from "@/components/municipality/CollectionRoutesPanel";
import { EventRegistrationsPanel } from "@/components/municipality/EventRegistrationsPanel";
import { TeamWorkersPanel } from "@/components/municipality/TeamWorkersPanel";
import { PartnerCompaniesPanel } from "@/components/municipality/PartnerCompaniesPanel";
import { DischargeSitesPanel } from "@/components/municipality/DischargeSitesPanel";
import { SortingCentersPanel } from "@/components/municipality/SortingCentersPanel";

interface ProfileWithCity {
  city_id: string | null;
  cities: {
    id: string;
    name: string;
    country: string;
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

const MunicipalityDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['municipality-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('city_id, cities(*)')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as ProfileWithCity;
    },
    enabled: !!user
  });

  const cityId = profile?.city_id;

  const { data: reports, isLoading } = useQuery({
    queryKey: ['municipality-reports', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const { data, error } = await supabase
        .from('reports')
        .select('id, category, description, status, latitude, longitude, city_id, created_at, photos, cities(name, country)')
        .eq('city_id', cityId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as ReportWithCity[];
    },
    enabled: !!cityId
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
      queryClient.invalidateQueries({ queryKey: ['municipality-reports'] });
      toast({
        title: t('municipality.dashboard.statusUpdated', 'Status Updated'),
        description: t('municipality.dashboard.statusUpdatedDesc', 'Report status has been updated successfully.'),
      });
    },
    onError: () => {
      toast({
        title: t('common.error', 'Error'),
        description: t('municipality.dashboard.statusUpdateFailed', 'Failed to update report status.'),
        variant: "destructive",
      });
    }
  });

  const stats = {
    total: reports?.length || 0,
    pending: reports?.filter(r => r.status === 'pending').length || 0,
    inProgress: reports?.filter(r => r.status === 'in_progress').length || 0,
    resolved: reports?.filter(r => r.status === 'resolved').length || 0
  };

  const statsData = [
    {
      title: t('admin.dashboard.totalReports'),
      value: stats.total,
      icon: TrendingUp,
      color: 'primary' as const,
      subtitle: profile?.cities?.name || t('dashboard.inYourCity', 'In your city'),
    },
    {
      title: t('admin.dashboard.pending'),
      value: stats.pending,
      icon: Clock,
      color: 'warning' as const,
      subtitle: t('dashboard.needsAttention', 'Needs attention'),
    },
    {
      title: t('admin.dashboard.inProgress'),
      value: stats.inProgress,
      icon: TrendingUp,
      color: 'info' as const,
      subtitle: t('dashboard.beingProcessed', 'Being processed'),
    },
    {
      title: t('admin.dashboard.resolved'),
      value: stats.resolved,
      icon: CheckCircle2,
      color: 'success' as const,
      subtitle: stats.total ? `${Math.round((stats.resolved / stats.total) * 100)}% ${t('dashboard.resolutionRate', 'resolution rate')}` : undefined,
    },
  ];

  const quickActions = [
    { label: t('municipality.dashboard.manageReports', 'Manage Reports'), to: '/admin/reports', icon: FileText },
    { label: t('nav.map'), to: '/map', icon: Map },
    { label: 'Schedule Event', to: '#collection', icon: Calendar },
    { label: 'Manage Routes', to: '#routes', icon: Route },
  ];

  return (
    <DashboardLayout 
      title={t('municipality.dashboard.title', 'Municipality Dashboard')} 
      icon={<Building className="h-6 w-6 text-primary" />}
      role="municipality"
    >
      <div className="p-4 lg:p-8 space-y-8">
        {/* Assigned City Banner */}
        {profile?.cities ? (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('municipality.dashboard.assignedCity', 'Your Assigned City')}</p>
                  <h2 className="text-2xl font-bold">{profile.cities.name}</h2>
                  <p className="text-sm text-muted-foreground">{profile.cities.country}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertTitle>{t('municipality.dashboard.noCity', 'No city assigned')}</AlertTitle>
            <AlertDescription>
              {t('municipality.dashboard.noCityDesc', 'Contact an administrator to be assigned to a city.')}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <StatsGrid stats={statsData} />

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Collection Management Tabs */}
        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <TabsTrigger value="reports" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden lg:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden lg:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="routes" className="flex items-center gap-1">
              <Route className="h-4 w-4" />
              <span className="hidden lg:inline">Routes</span>
            </TabsTrigger>
            <TabsTrigger value="registrations" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Registrations</span>
            </TabsTrigger>
            <TabsTrigger value="workers" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Workers</span>
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Companies</span>
            </TabsTrigger>
            <TabsTrigger value="discharge" className="flex items-center gap-1">
              <Trash className="h-4 w-4" />
              <span className="hidden lg:inline">Décharges</span>
            </TabsTrigger>
            <TabsTrigger value="sorting" className="flex items-center gap-1">
              <Recycle className="h-4 w-4" />
              <span className="hidden lg:inline">Centres tri</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <RecentReportsTable 
              reports={reports} 
              isLoading={isLoading}
              showStatusSelect
              onStatusChange={(id, status) => updateStatusMutation.mutate({ id, status })}
              title={t('municipality.dashboard.reportsInCity', 'Reports in Your City')}
              emptyMessage={t('municipality.dashboard.noReports', 'No reports found in your assigned city.')}
            />
          </TabsContent>

          <TabsContent value="events">
            <CollectionEventsPanel cityId={cityId} />
          </TabsContent>

          <TabsContent value="routes">
            <CollectionRoutesPanel cityId={cityId} />
          </TabsContent>

          <TabsContent value="registrations">
            <EventRegistrationsPanel cityId={cityId} />
          </TabsContent>

          <TabsContent value="workers">
            <TeamWorkersPanel cityId={cityId} />
          </TabsContent>

          <TabsContent value="companies">
            <PartnerCompaniesPanel cityId={cityId} />
          </TabsContent>

          <TabsContent value="discharge">
            <DischargeSitesPanel cityId={cityId} />
          </TabsContent>

          <TabsContent value="sorting">
            <SortingCentersPanel cityId={cityId} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MunicipalityDashboard;
