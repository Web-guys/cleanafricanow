import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, TrendingUp, Clock, CheckCircle2, Building } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

  // Fetch municipality worker's assigned city from profile
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

  // Fetch reports from assigned city
  const { data: reports } = useQuery({
    queryKey: ['municipality-reports', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const { data, error } = await supabase
        .from('reports')
        .select('id, category, description, status, latitude, longitude, city_id, created_at, cities(name, country)')
        .eq('city_id', cityId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as ReportWithCity[];
    },
    enabled: !!cityId
  });

  // Mutation for updating report status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status: status as any })
        .eq('id', id);
      
      if (error) throw error;

      // Send email notification
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

  // Calculate stats
  const stats = {
    total: reports?.length || 0,
    pending: reports?.filter(r => r.status === 'pending').length || 0,
    inProgress: reports?.filter(r => r.status === 'in_progress').length || 0,
    resolved: reports?.filter(r => r.status === 'resolved').length || 0
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'waste':
        return 'bg-success/20 text-success-foreground border-success';
      case 'pollution':
        return 'bg-warning/20 text-warning-foreground border-warning';
      case 'danger':
        return 'bg-destructive/20 text-destructive-foreground border-destructive';
      case 'water':
        return 'bg-info/20 text-info-foreground border-info';
      case 'air':
        return 'bg-primary/20 text-primary-foreground border-primary';
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
              <Building className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{t('municipality.dashboard.title', 'Municipality Dashboard')}</h1>
          </div>
          <nav className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/reports">{t('municipality.dashboard.manageReports', 'Manage Reports')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">{t('nav.publicSite')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Assigned City */}
      <section className="py-6 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-semibold mb-3">{t('municipality.dashboard.assignedCity', 'Your Assigned City')}</h2>
          <div className="flex flex-wrap gap-2">
            {!profile?.city_id ? (
              <p className="text-muted-foreground">{t('municipality.dashboard.noCity', 'No city assigned yet. Contact an administrator.')}</p>
            ) : (
              <Badge variant="outline" className="px-3 py-1 text-sm">
                <MapPin className="w-3 h-3 mr-1" />
                {profile.cities?.name}, {profile.cities?.country}
              </Badge>
            )}
          </div>
        </div>
      </section>

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
                <div className="text-3xl font-bold text-primary">{stats.total}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-warning/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.dashboard.pending')}</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-info/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.dashboard.inProgress')}</CardTitle>
                <Clock className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-info">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-success/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('admin.dashboard.resolved')}</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{stats.resolved}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reports Table */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('municipality.dashboard.reportsInCity', 'Reports in Your City')}</CardTitle>
            </CardHeader>
            <CardContent>
              {!cityId ? (
                <p className="text-muted-foreground text-center py-8">
                  {t('municipality.dashboard.noCityAssigned', 'No city assigned. Contact an administrator to get access to reports.')}
                </p>
              ) : reports?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t('municipality.dashboard.noReports', 'No reports found in your assigned city.')}
                </p>
              ) : (
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
                          <Select
                            value={report.status || 'pending'}
                            onValueChange={(value) => 
                              updateStatusMutation.mutate({ id: report.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">{t('report.status.pending')}</SelectItem>
                              <SelectItem value="in_progress">{t('report.status.inProgress')}</SelectItem>
                              <SelectItem value="resolved">{t('report.status.resolved')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {new Date(report.created_at!).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/map?lat=${report.latitude}&lng=${report.longitude}`}>
                              {t('admin.dashboard.view')}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default MunicipalityDashboard;
