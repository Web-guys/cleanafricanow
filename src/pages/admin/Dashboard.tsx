import { Shield, TrendingUp, Clock, CheckCircle2, FileText, Building2, Users, Map, ScrollText, Gauge, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentReportsTable } from "@/components/dashboard/RecentReportsTable";
import { ReportAnalytics } from "@/components/admin/ReportAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminDashboard = () => {
  const { t } = useTranslation();

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*, cities(name, country)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data: allReports } = await supabase.from('reports').select('status');
      const { count: citiesCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      const total = allReports?.length || 0;
      const pending = allReports?.filter(r => r.status === 'pending').length || 0;
      const inProgress = allReports?.filter(r => r.status === 'in_progress').length || 0;
      const resolved = allReports?.filter(r => r.status === 'resolved').length || 0;
      
      return { total, pending, inProgress, resolved, cities: citiesCount || 0, users: usersCount || 0 };
    }
  });

  const statsData = [
    {
      title: t('admin.dashboard.totalReports'),
      value: stats?.total || 0,
      icon: TrendingUp,
      color: 'primary' as const,
      subtitle: `${stats?.cities || 0} ${t('impact.citiesCovered')}`,
    },
    {
      title: t('admin.dashboard.pending'),
      value: stats?.pending || 0,
      icon: Clock,
      color: 'warning' as const,
      subtitle: t('dashboard.needsAttention', 'Needs attention'),
    },
    {
      title: t('admin.dashboard.inProgress'),
      value: stats?.inProgress || 0,
      icon: TrendingUp,
      color: 'info' as const,
      subtitle: t('dashboard.beingProcessed', 'Being processed'),
    },
    {
      title: t('admin.dashboard.resolved'),
      value: stats?.resolved || 0,
      icon: CheckCircle2,
      color: 'success' as const,
      subtitle: stats?.total ? `${Math.round((stats.resolved / stats.total) * 100)}% ${t('dashboard.resolutionRate', 'resolution rate')}` : undefined,
    },
  ];

  const quickActions = [
    { label: t('nav.allReports'), to: '/admin/reports', icon: FileText },
    { label: t('nav.cities'), to: '/admin/cities', icon: Building2 },
    { label: t('admin.users.title'), to: '/admin/users', icon: Users },
    { label: 'Organizations', to: '/admin/organizations', icon: Building2 },
    { label: 'SLA Dashboard', to: '/admin/sla', icon: Gauge },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText },
    { label: t('nav.map'), to: '/map', icon: Map },
  ];

  return (
    <DashboardLayout 
      title={t('admin.dashboard.title')} 
      icon={<Shield className="h-6 w-6 text-primary" />}
      role="admin"
    >
      <div className="p-4 lg:p-8 space-y-8">
        {/* Stats Grid */}
        <StatsGrid stats={statsData} />

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />

        {/* Analytics Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('admin.analytics.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportAnalytics />
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <RecentReportsTable 
          reports={reports} 
          isLoading={reportsLoading}
          showCity 
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
