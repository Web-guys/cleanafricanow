import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, TrendingUp, Clock, CheckCircle2, Building2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

  // Fetch NGO's assigned regions (cities)
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

  // Get city IDs for filtering reports
  const cityIds = assignedRegions?.map(r => r.city_id) || [];

  // Fetch reports from assigned regions
  const { data: reports } = useQuery({
    queryKey: ['ngo-reports', cityIds],
    queryFn: async () => {
      if (cityIds.length === 0) return [];
      const { data, error } = await supabase
        .from('reports')
        .select('id, category, description, status, latitude, longitude, city_id, created_at, cities(name, country)')
        .in('city_id', cityIds)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return (data || []) as ReportWithCity[];
    },
    enabled: cityIds.length > 0
  });

  // Mutation for updating report status
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

  // Calculate stats for assigned regions
  const stats = {
    total: reports?.length || 0,
    pending: reports?.filter(r => r.status === 'pending').length || 0,
    inProgress: reports?.filter(r => r.status === 'in_progress').length || 0,
    resolved: reports?.filter(r => r.status === 'resolved').length || 0,
    regions: assignedRegions?.length || 0
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
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{t('ngo.dashboard.title', 'NGO Dashboard')}</h1>
          </div>
          <nav className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/">{t('nav.publicSite')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Assigned Regions */}
      <section className="py-6 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-semibold mb-3">{t('ngo.dashboard.assignedRegions', 'Your Assigned Regions')}</h2>
          <div className="flex flex-wrap gap-2">
            {assignedRegions?.length === 0 ? (
              <p className="text-muted-foreground">{t('ngo.dashboard.noRegions', 'No regions assigned yet. Contact an administrator.')}</p>
            ) : (
              assignedRegions?.map((region) => (
                <Badge key={region.id} variant="outline" className="px-3 py-1 text-sm">
                  <MapPin className="w-3 h-3 mr-1" />
                  {region.cities?.name}, {region.cities?.country}
                </Badge>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-5 gap-6">
            <Card className="border-2 border-secondary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('ngo.dashboard.regionsCount', 'Regions')}</CardTitle>
                <Building2 className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stats.regions}</div>
              </CardContent>
            </Card>
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
              <CardTitle>{t('ngo.dashboard.reportsInRegions', 'Reports in Your Regions')}</CardTitle>
            </CardHeader>
            <CardContent>
              {cityIds.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t('ngo.dashboard.noRegionsAssigned', 'No regions assigned. Contact an administrator to get access to reports.')}
                </p>
              ) : reports?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {t('ngo.dashboard.noReports', 'No reports found in your assigned regions.')}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.reports.category')}</TableHead>
                      <TableHead>{t('ngo.dashboard.city', 'City')}</TableHead>
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
                        <TableCell>
                          {report.cities?.name || 'N/A'}
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

export default NgoDashboard;
