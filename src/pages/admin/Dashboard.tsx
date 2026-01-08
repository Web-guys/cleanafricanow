import { Shield, TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3, Menu } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { RecentReportsTable } from "@/components/dashboard/RecentReportsTable";
import { ReportAnalytics } from "@/components/admin/ReportAnalytics";
import { SystemHealthCard } from "@/components/admin/SystemHealthCard";
import { RecentActivityFeed } from "@/components/admin/RecentActivityFeed";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      const { data: allReports } = await supabase.from('reports').select('status, sla_due_date');
      const { count: citiesCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      const total = allReports?.length || 0;
      const pending = allReports?.filter(r => r.status === 'pending').length || 0;
      const inProgress = allReports?.filter(r => r.status === 'in_progress').length || 0;
      const resolved = allReports?.filter(r => r.status === 'resolved').length || 0;
      const overdue = allReports?.filter(r => 
        r.sla_due_date && new Date(r.sla_due_date) < new Date() && r.status !== 'resolved'
      ).length || 0;
      
      return { total, pending, inProgress, resolved, cities: citiesCount || 0, users: usersCount || 0, overdue };
    }
  });

  const statsData = [
    {
      title: t('admin.dashboard.totalReports'),
      value: stats?.total || 0,
      icon: TrendingUp,
      color: 'primary' as const,
      subtitle: `${stats?.users || 0} active users`,
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
        <div className="fixed w-64 h-screen overflow-y-auto">
          <AdminSidebar />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <AdminSidebar mobile onNavigate={() => setSidebarOpen(false)} />
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold">{t('admin.dashboard.title')}</h1>
                  <p className="text-sm text-muted-foreground hidden md:block">Welcome back, Administrator</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 space-y-6">
          {/* Stats Grid */}
          <StatsGrid stats={statsData} />

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Analytics */}
            <div className="lg:col-span-2 space-y-6">
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

            {/* Right Column - System Health & Activity */}
            <div className="space-y-6">
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
