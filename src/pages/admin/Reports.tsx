import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, ArrowLeft, Search, Download, CheckSquare, Square } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const AdminReports = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

  const { data: reports, isLoading } = useQuery({
    queryKey: ['admin-all-reports', categoryFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from('reports').select('*');
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter as any);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Filter reports by search query
  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (!searchQuery.trim()) return reports;
    
    const query = searchQuery.toLowerCase();
    return reports.filter(report => 
      report.description.toLowerCase().includes(query) ||
      report.id.toLowerCase().includes(query) ||
      report.category.toLowerCase().includes(query)
    );
  }, [reports, searchQuery]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedReports.size === filteredReports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(filteredReports.map(r => r.id)));
    }
  };

  const toggleSelectReport = (id: string) => {
    const newSelected = new Set(selectedReports);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedReports(newSelected);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, oldStatus }: { id: string; status: string; oldStatus: string }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status: status as any })
        .eq('id', id);
      
      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-status-notification', {
          body: {
            report_id: id,
            old_status: oldStatus,
            new_status: status,
          },
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the mutation if email fails
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast({
        title: t('admin.reports.updateSuccess'),
        description: t('admin.reports.updateMessage'),
      });
    },
    onError: () => {
      toast({
        title: t('admin.reports.updateFailed'),
        description: t('admin.reports.updateFailedMessage'),
        variant: "destructive",
      });
    }
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status: status as any })
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedReports(new Set());
      toast({
        title: t('admin.reports.bulkUpdateSuccess', 'Bulk Update Successful'),
        description: t('admin.reports.bulkUpdateMessage', 'Selected reports have been updated.'),
      });
    },
    onError: () => {
      toast({
        title: t('admin.reports.updateFailed'),
        description: t('admin.reports.updateFailedMessage'),
        variant: "destructive",
      });
    }
  });

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredReports.length) return;

    const headers = ['ID', 'Category', 'Description', 'Latitude', 'Longitude', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredReports.map(report => [
        report.id,
        report.category,
        `"${report.description.replace(/"/g, '""')}"`,
        report.latitude,
        report.longitude,
        report.status,
        new Date(report.created_at || '').toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reports_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: t('admin.reports.exportSuccess'),
      description: t('admin.reports.exportMessage'),
    });
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('nav.dashboard')}
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">{t('admin.reports.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Filters and Table */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <CardTitle>{t('admin.reports.manage')} ({filteredReports.length})</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReports.size > 0 && (
                      <>
                        <Select
                          onValueChange={(status) => 
                            bulkUpdateMutation.mutate({ 
                              ids: Array.from(selectedReports), 
                              status 
                            })
                          }
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('admin.reports.bulkUpdateStatus', `Update ${selectedReports.size} selected`)} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t('report.status.pending')}</SelectItem>
                            <SelectItem value="in_progress">{t('report.status.inProgress')}</SelectItem>
                            <SelectItem value="resolved">{t('report.status.resolved')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedReports(new Set())}
                        >
                          {t('common.clearSelection', 'Clear')}
                        </Button>
                      </>
                    )}
                    <Button onClick={exportToCSV} variant="outline" disabled={!filteredReports.length}>
                      <Download className="mr-2 h-4 w-4" />
                      {t('admin.reports.exportCSV')}
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={t('admin.reports.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('map.category')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('map.allCategories')}</SelectItem>
                      <SelectItem value="waste">{t('report.categories.waste')}</SelectItem>
                      <SelectItem value="pollution">{t('report.categories.pollution')}</SelectItem>
                      <SelectItem value="danger">{t('report.categories.danger')}</SelectItem>
                      <SelectItem value="noise">{t('report.categories.noise')}</SelectItem>
                      <SelectItem value="water">{t('report.categories.water')}</SelectItem>
                      <SelectItem value="air">{t('report.categories.air')}</SelectItem>
                      <SelectItem value="illegal_dumping">{t('report.categories.illegal_dumping')}</SelectItem>
                      <SelectItem value="deforestation">{t('report.categories.deforestation')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder={t('map.status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('map.allStatus')}</SelectItem>
                      <SelectItem value="pending">{t('report.status.pending')}</SelectItem>
                      <SelectItem value="in_progress">{t('report.status.inProgress')}</SelectItem>
                      <SelectItem value="resolved">{t('report.status.resolved')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">{t('common.loading')}</p>
              ) : filteredReports.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{t('admin.reports.noResults')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>{t('admin.reports.id')}</TableHead>
                        <TableHead>{t('admin.reports.category')}</TableHead>
                        <TableHead>{t('admin.reports.description')}</TableHead>
                        <TableHead>{t('admin.reports.location')}</TableHead>
                        <TableHead>{t('admin.reports.status')}</TableHead>
                        <TableHead>{t('admin.reports.date')}</TableHead>
                        <TableHead>{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id} className={selectedReports.has(report.id) ? "bg-muted/50" : ""}>
                          <TableCell>
                            <Checkbox
                              checked={selectedReports.has(report.id)}
                              onCheckedChange={() => toggleSelectReport(report.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {report.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoryColor(report.category)}>
                              {t(`report.categories.${report.category}`)}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {report.description}
                          </TableCell>
                          <TableCell className="text-xs">
                            {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={report.status || 'pending'}
                              onValueChange={(value) => 
                                updateStatusMutation.mutate({ 
                                  id: report.id, 
                                  status: value,
                                  oldStatus: report.status || 'pending'
                                })
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
                          <TableCell className="text-sm">
                            {new Date(report.created_at || '').toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/map`}>{t('map.viewOnMap')}</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AdminReports;
