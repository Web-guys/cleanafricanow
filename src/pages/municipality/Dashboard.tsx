import { Building, TrendingUp, Clock, CheckCircle2, FileText, Map, MapPin, Calendar, Users, Route, Recycle, Trash, Building2, AlertTriangle, ClipboardList, BarChart3, Shield, Eye, Zap, Target } from "lucide-react";
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
import { OperationalOverview } from "@/components/dashboard/OperationalOverview";
import PlatformIntroCard from "@/components/dashboard/PlatformIntroCard";
import HowItWorksSection from "@/components/dashboard/HowItWorksSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CollectionEventsPanel } from "@/components/municipality/CollectionEventsPanel";
import { CollectionRoutesPanel } from "@/components/municipality/CollectionRoutesPanel";
import { EventRegistrationsPanel } from "@/components/municipality/EventRegistrationsPanel";
import { TeamWorkersPanel } from "@/components/municipality/TeamWorkersPanel";
import { PartnerCompaniesPanel } from "@/components/municipality/PartnerCompaniesPanel";
import { DischargeSitesPanel } from "@/components/municipality/DischargeSitesPanel";
import { SortingCentersPanel } from "@/components/municipality/SortingCentersPanel";
import { useState } from "react";

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
  const [showIntro, setShowIntro] = useState(() => {
    return localStorage.getItem('municipality-intro-dismissed') !== 'true';
  });

  const dismissIntro = () => {
    setShowIntro(false);
    localStorage.setItem('municipality-intro-dismissed', 'true');
  };

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

  // Fetch pending registrations count for badge
  const { data: pendingRegistrations } = useQuery({
    queryKey: ['pending-registrations', cityId],
    queryFn: async () => {
      if (!cityId) return 0;
      const { data: events } = await supabase
        .from('collection_events')
        .select('id')
        .eq('city_id', cityId);
      
      if (!events?.length) return 0;
      
      const { count } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact', head: true })
        .in('event_id', events.map(e => e.id))
        .eq('status', 'pending');
      
      return count || 0;
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

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

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
      subtitle: `${resolutionRate}% ${t('dashboard.resolutionRate', 'resolution rate')}`,
    },
  ];

  const quickActions = [
    { label: t('municipality.dashboard.manageReports', 'Manage Reports'), to: '/admin/reports', icon: FileText, variant: 'default' as const },
    { label: t('nav.map'), to: '/map', icon: Map },
    { label: t('dashboard.scheduleEvent', 'Schedule Event'), to: '#collection', icon: Calendar },
    { label: t('dashboard.manageRoutes', 'Manage Routes'), to: '#routes', icon: Route },
  ];

  const introFeatures = [
    {
      icon: <ClipboardList className="h-5 w-5 text-primary" />,
      title: t('municipality.intro.feature1Title', 'Report Management'),
      description: t('municipality.intro.feature1Desc', 'Receive, track, and resolve environmental reports submitted by citizens in your city.')
    },
    {
      icon: <Route className="h-5 w-5 text-primary" />,
      title: t('municipality.intro.feature2Title', 'Collection Routes'),
      description: t('municipality.intro.feature2Desc', 'Plan and optimize waste collection routes for maximum efficiency.')
    },
    {
      icon: <Users className="h-5 w-5 text-primary" />,
      title: t('municipality.intro.feature3Title', 'Team Management'),
      description: t('municipality.intro.feature3Desc', 'Manage field workers, assign tasks, and track team performance.')
    },
    {
      icon: <Calendar className="h-5 w-5 text-primary" />,
      title: t('municipality.intro.feature4Title', 'Cleanup Events'),
      description: t('municipality.intro.feature4Desc', 'Organize community cleanup events and manage volunteer registrations.')
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-primary" />,
      title: t('municipality.intro.feature5Title', 'Analytics & SLA'),
      description: t('municipality.intro.feature5Desc', 'Monitor resolution rates, SLA compliance, and environmental impact metrics.')
    },
    {
      icon: <Building2 className="h-5 w-5 text-primary" />,
      title: t('municipality.intro.feature6Title', 'Partner Companies'),
      description: t('municipality.intro.feature6Desc', 'Coordinate with waste management companies and service providers.')
    }
  ];

  const introBenefits = [
    { text: t('municipality.intro.benefit1', 'Faster response to citizen reports') },
    { text: t('municipality.intro.benefit2', 'Improved transparency and accountability') },
    { text: t('municipality.intro.benefit3', 'Optimized resource allocation') },
    { text: t('municipality.intro.benefit4', 'Real-time monitoring and alerts') },
    { text: t('municipality.intro.benefit5', 'Enhanced citizen satisfaction') },
    { text: t('municipality.intro.benefit6', 'Data-driven decision making') }
  ];

  const howItWorksSteps = [
    {
      number: 1,
      icon: <Eye className="h-4 w-4" />,
      title: t('municipality.intro.step1Title', 'Receive Reports'),
      description: t('municipality.intro.step1Desc', 'Citizens report environmental issues through the mobile app or website. You receive them instantly in your dashboard.')
    },
    {
      number: 2,
      icon: <Target className="h-4 w-4" />,
      title: t('municipality.intro.step2Title', 'Prioritize & Assign'),
      description: t('municipality.intro.step2Desc', 'Review reports, set priorities based on urgency, and assign them to field teams or partner companies.')
    },
    {
      number: 3,
      icon: <Zap className="h-4 w-4" />,
      title: t('municipality.intro.step3Title', 'Take Action'),
      description: t('municipality.intro.step3Desc', 'Teams resolve issues on the ground. Update status in real-time and citizens are automatically notified.')
    },
    {
      number: 4,
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: t('municipality.intro.step4Title', 'Track & Improve'),
      description: t('municipality.intro.step4Desc', 'Monitor performance metrics, identify patterns, and continuously improve your city\'s cleanliness.')
    }
  ];

  return (
    <DashboardLayout 
      title={t('municipality.dashboard.title', 'Municipality Dashboard')} 
      icon={<Building className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
      role="municipality"
    >
      <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* Platform Introduction */}
        {showIntro && (
          <div className="relative">
            <button 
              onClick={dismissIntro}
              className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground text-sm underline"
            >
              {t('common.dismiss', 'Dismiss')}
            </button>
            <PlatformIntroCard
              role="municipality"
              title={t('municipality.intro.title', 'Your City Management Hub')}
              subtitle={t('municipality.intro.subtitle', 'For Municipalities')}
              description={t('municipality.intro.description', 'CleanAfricaNow empowers municipalities to efficiently manage environmental reports, coordinate cleanup operations, and engage with citizens. Track issues from report to resolution, manage waste collection routes, and demonstrate measurable impact to your community.')}
              features={introFeatures}
              benefits={introBenefits}
            />
            <div className="mt-4">
              <HowItWorksSection steps={howItWorksSteps} />
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        {profile?.cities ? (
          <WelcomeBanner
            icon={<MapPin className="h-7 w-7 text-primary" />}
            title={profile.cities.name}
            subtitle={t('municipality.dashboard.assignedCity', 'Your Assigned City')}
            locationCountry={profile.cities.country}
            gradient="primary"
          />
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('municipality.dashboard.noCity', 'No city assigned')}</AlertTitle>
            <AlertDescription>
              {t('municipality.dashboard.noCityDesc', 'Contact an administrator to be assigned to a city.')}
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Grid */}
        <StatsGrid stats={statsData} />

        {/* Performance Bar */}
        {stats.total > 0 && (
          <Card className="border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{t('dashboard.overallPerformance', 'Overall Performance')}</span>
                </div>
                <span className="text-sm font-bold text-primary">{resolutionRate}%</span>
              </div>
              <Progress value={resolutionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats.resolved} {t('dashboard.outOf', 'out of')} {stats.total} {t('dashboard.issuesResolved', 'issues resolved')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Two Column Layout for Activity Feed and Operational Overview */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ActivityFeed cityIds={cityId ? [cityId] : []} />
          <OperationalOverview cityId={cityId} />
        </div>

        {/* Collection Management Tabs */}
        <Tabs defaultValue="reports" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex w-max min-w-full lg:grid lg:w-full lg:grid-cols-8 gap-1">
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
              </TabsTrigger>
              <TabsTrigger value="routes" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Route className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.routes', 'Routes')}</span>
              </TabsTrigger>
              <TabsTrigger value="registrations" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Users className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.registrations', 'Registrations')}</span>
                {(pendingRegistrations || 0) > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{pendingRegistrations}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="workers" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Users className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.teams', 'Teams')}</span>
              </TabsTrigger>
              <TabsTrigger value="companies" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.partners', 'Partners')}</span>
              </TabsTrigger>
              <TabsTrigger value="discharge" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Trash className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.dischargeSites', 'Discharge')}</span>
              </TabsTrigger>
              <TabsTrigger value="sorting" className="flex items-center gap-1.5 px-3 py-2 whitespace-nowrap">
                <Recycle className="h-4 w-4 shrink-0" />
                <span className="text-xs lg:text-sm">{t('dashboard.sortingCenters', 'Sorting')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
