import { Shield, TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3, Menu, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentReportsTable } from "@/components/dashboard/RecentReportsTable";
import { ReportAnalytics } from "@/components/admin/ReportAnalytics";
import { SystemHealthCard } from "@/components/admin/SystemHealthCard";
import { RecentActivityFeed } from "@/components/admin/RecentActivityFeed";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { QuickActionsCard } from "@/components/admin/QuickActionsCard";
import { PerformanceMetricsCard } from "@/components/admin/PerformanceMetricsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useState } from "react";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      const { data: allReports } = await supabase.from('reports').select('status, sla_due_date, created_at');
      const { count: citiesCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: orgsCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
      
      const total = allReports?.length || 0;
      const pending = allReports?.filter(r => r.status === 'pending').length || 0;
      const inProgress = allReports?.filter(r => r.status === 'in_progress').length || 0;
      const resolved = allReports?.filter(r => r.status === 'resolved').length || 0;
      const overdue = allReports?.filter(r => 
        r.sla_due_date && new Date(r.sla_due_date) < new Date() && r.status !== 'resolved'
      ).length || 0;

      // Calculate today's reports
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayReports = allReports?.filter(r => new Date(r.created_at!) >= today).length || 0;
      
      return { 
        total, 
        pending, 
        inProgress, 
        resolved, 
        cities: citiesCount || 0, 
        users: usersCount || 0, 
        organizations: orgsCount || 0,
        overdue,
        todayReports
      };
    }
  });

  const statsData = [
    {
      title: t('admin.dashboard.totalReports'),
      value: stats?.total || 0,
      icon: TrendingUp,
      color: 'primary' as const,
      subtitle: `+${stats?.todayReports || 0} today`,
    },
    {
      title: t('admin.dashboard.pending'),
      value: stats?.pending || 0,
      icon: Clock,
      color: 'warning' as const,
      subtitle: t('dashboard.needsAttention', 'Needs attention'),
    },
    {
      title: 'SLA Overdue',
      value: stats?.overdue || 0,
      icon: AlertTriangle,
      color: 'destructive' as const,
      subtitle: 'Requires immediate action',
    },
    {
      title: t('admin.dashboard.resolved'),
      value: stats?.resolved || 0,
      icon: CheckCircle2,
      color: 'success' as const,
      subtitle: stats?.total ? `${Math.round((stats.resolved / stats.total) * 100)}% resolution rate` : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="fixed w-64 h-screen overflow-y-auto scrollbar-thin">
          <AdminSidebar />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 py-3 sm:py-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Mobile Menu */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-64 p-0">
                  <AdminSidebar mobile onNavigate={() => setSidebarOpen(false)} />
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{t('admin.dashboard.title')}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate">Welcome back, Administrator</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Live indicator */}
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                <span>Live</span>
              </div>
              <NotificationBell />
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden overflow-y-auto pb-24 lg:pb-8">
          {/* Stats Grid */}
          <StatsGrid stats={statsData} />

          {/* Quick Actions */}
          <QuickActionsCard />

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Analytics */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <Card className="overflow-hidden">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    {t('admin.analytics.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 overflow-x-auto">
                  <ReportAnalytics />
                </CardContent>
              </Card>

              {/* Recent Reports */}
              <div className="overflow-x-auto">
                <RecentReportsTable 
                  reports={reports} 
                  isLoading={reportsLoading}
                  showCity 
                />
              </div>
            </div>

            {/* Right Column - Metrics, System Health & Activity */}
            <div className="space-y-4 sm:space-y-6">
              <PerformanceMetricsCard />
              <SystemHealthCard />
              <RecentActivityFeed />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
