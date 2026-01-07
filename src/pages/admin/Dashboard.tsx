import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Clock, CheckCircle2, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { ReportAnalytics } from "@/components/admin/ReportAnalytics";

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { data: reports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
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
      
      const total = allReports?.length || 0;
      const pending = allReports?.filter(r => r.status === 'pending').length || 0;
      const inProgress = allReports?.filter(r => r.status === 'in_progress').length || 0;
      const resolved = allReports?.filter(r => r.status === 'resolved').length || 0;
      
      return { total, pending, inProgress, resolved };
    }
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'waste':
        return 'bg-success/20 text-success-foreground border-success';
      case 'pollution':
        return 'bg-warning/20 text-warning-foreground border-warning';
      case 'danger':
        return 'bg-destructive/20 text-destructive-foreground border-destructive';
      default:
        return 'bg-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning-foreground';
      case 'in_progress':
        return 'bg-info/20 text-info-foreground';
      case 'resolved':
        return 'bg-success/20 text-success-foreground';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{t('admin.dashboard.title')}</h1>
          </div>
          <nav className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/admin/reports">{t('nav.allReports')}</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/admin/cities">{t('nav.cities')}</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/admin/users">{t('admin.users.title')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">{t('nav.publicSite')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Stats */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="border-2 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.dashboard.totalReports')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{stats?.total || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-warning/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.dashboard.pending')}</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{stats?.pending || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-info/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.dashboard.inProgress')}</CardTitle>
                <Clock className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-info">{stats?.inProgress || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-success/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.dashboard.resolved')}</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats?.resolved || 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">{t('admin.analytics.title')}</h2>
          </div>
          <ReportAnalytics />
        </div>
      </section>

      {/* Recent Reports Table */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.dashboard.recentReports')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.reports.category')}</TableHead>
                    <TableHead>{t('admin.reports.description')}</TableHead>
                    <TableHead>{t('admin.reports.status')}</TableHead>
                    <TableHead>{t('admin.reports.date')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports?.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Badge className={getCategoryColor(report.category)}>
                          {t(`report.categories.${report.category}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {report.description}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {t(`report.status.${report.status.replace('_', '')}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/reports?id=${report.id}`}>{t('admin.dashboard.view')}</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
