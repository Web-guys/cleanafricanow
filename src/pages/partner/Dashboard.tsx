import { Building2, TrendingUp, FileText, CheckCircle2, Clock, AlertTriangle, BarChart3, Calendar, Briefcase } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

interface AssignedReport {
  id: string;
  report_id: string;
  status: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string | null;
  reports: {
    id: string;
    description: string;
    category: string;
    status: string | null;
    priority: string | null;
    latitude: number;
    longitude: number;
    created_at: string | null;
    cities: {
      name: string;
      country: string;
    } | null;
  } | null;
}

interface PartnerCompanyInfo {
  id: string;
  name: string;
  company_type: string;
  status: string;
  services: string[] | null;
  contract_start: string | null;
  contract_end: string | null;
  cities: {
    name: string;
    country: string;
  } | null;
}

const PartnerDashboard = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get partner company associated with this user (via organization_members)
  const { data: companyInfo } = useQuery({
    queryKey: ['partner-company-info', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // First get the organization membership
      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      if (!membership) return null;

      // Then get company info linked to this org
      const { data: company } = await supabase
        .from('partner_companies')
        .select('*, cities(name, country)')
        .limit(1)
        .single();
      
      return company as PartnerCompanyInfo | null;
    },
    enabled: !!user
  });

  // Get assigned reports for this user
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['partner-assignments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('report_assignments')
        .select(`
          id,
          report_id,
          status,
          due_date,
          notes,
          created_at,
          reports(
            id,
            description,
            category,
            status,
            priority,
            latitude,
            longitude,
            created_at,
            cities(name, country)
          )
        `)
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as AssignedReport[];
    },
    enabled: !!user
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('report_assignments')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-assignments'] });
      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de la mission a été mis à jour.',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut.',
        variant: "destructive",
      });
    }
  });

  const pendingAssignments = assignments?.filter(a => a.status === 'pending') || [];
  const inProgressAssignments = assignments?.filter(a => a.status === 'in_progress') || [];
  const completedAssignments = assignments?.filter(a => a.status === 'completed') || [];
  const overdueAssignments = assignments?.filter(
    a => a.due_date && isPast(new Date(a.due_date)) && a.status !== 'completed'
  ) || [];

  const totalAssignments = assignments?.length || 0;
  const completionRate = totalAssignments > 0 
    ? Math.round((completedAssignments.length / totalAssignments) * 100) 
    : 0;

  // Contract status
  const contractDaysLeft = companyInfo?.contract_end 
    ? differenceInDays(new Date(companyInfo.contract_end), new Date())
    : null;
  const contractExpiringSoon = contractDaysLeft !== null && contractDaysLeft <= 30 && contractDaysLeft > 0;

  const statsData = [
    {
      title: 'Missions Assignées',
      value: totalAssignments,
      icon: FileText,
      color: 'primary' as const,
      subtitle: `${pendingAssignments.length} en attente`,
    },
    {
      title: 'En Cours',
      value: inProgressAssignments.length,
      icon: Clock,
      color: 'warning' as const,
      subtitle: overdueAssignments.length > 0 ? `${overdueAssignments.length} en retard` : 'Dans les temps',
    },
    {
      title: 'Complétées',
      value: completedAssignments.length,
      icon: CheckCircle2,
      color: 'success' as const,
      subtitle: `${completionRate}% taux de complétion`,
    },
    {
      title: 'Performance',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'secondary' as const,
      subtitle: 'Taux de réussite',
    },
  ];

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed': return <Badge variant="default" className="bg-green-600">Complété</Badge>;
      case 'in_progress': return <Badge variant="secondary">En cours</Badge>;
      case 'pending': return <Badge variant="outline">En attente</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout 
      title="Espace Partenaire" 
      icon={<Building2 className="h-6 w-6 text-primary" />}
      role="municipality" // Use municipality layout as base
    >
      <div className="p-4 lg:p-8 space-y-8">
        {/* Company Info Banner */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Entreprise Partenaire</p>
                  <h2 className="text-2xl font-bold">{companyInfo?.name || profile?.full_name || 'Partenaire'}</h2>
                  {companyInfo?.cities && (
                    <p className="text-sm text-muted-foreground">
                      {companyInfo.cities.name}, {companyInfo.cities.country}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Contract Status */}
              {companyInfo?.contract_end && (
                <div className={`p-4 rounded-lg ${contractExpiringSoon ? 'bg-warning/10 border border-warning' : 'bg-muted'}`}>
                  <div className="flex items-center gap-2">
                    {contractExpiringSoon && <AlertTriangle className="h-4 w-4 text-warning" />}
                    <span className="text-sm font-medium">
                      Contrat expire le {format(new Date(companyInfo.contract_end), 'PP', { locale: fr })}
                    </span>
                  </div>
                  {contractDaysLeft !== null && contractDaysLeft > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {contractDaysLeft} jours restants
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Services */}
            {companyInfo?.services && companyInfo.services.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Services fournis :</p>
                <div className="flex flex-wrap gap-2">
                  {companyInfo.services.map((service, idx) => (
                    <Badge key={idx} variant="secondary">{service}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <StatsGrid stats={statsData} />

        {/* Performance Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Taux de Complétion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Missions complétées</span>
                  <span className="font-semibold">{completedAssignments.length}/{totalAssignments}</span>
                </div>
                <Progress value={completionRate} className="h-3" />
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold text-yellow-600">{pendingAssignments.length}</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold text-blue-600">{inProgressAssignments.length}</p>
                    <p className="text-xs text-muted-foreground">En cours</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted">
                    <p className="text-2xl font-bold text-green-600">{completedAssignments.length}</p>
                    <p className="text-xs text-muted-foreground">Complétées</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Missions Urgentes
              </CardTitle>
              <CardDescription>
                Missions en retard ou à priorité élevée
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overdueAssignments.length === 0 && pendingAssignments.filter(a => a.reports?.priority === 'critical' || a.reports?.priority === 'high').length === 0 ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground">Aucune mission urgente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {overdueAssignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{assignment.reports?.description.slice(0, 50)}...</p>
                          <p className="text-xs text-red-600">
                            En retard depuis {Math.abs(differenceInDays(new Date(assignment.due_date!), new Date()))} jours
                          </p>
                        </div>
                        <Badge variant="destructive">Urgent</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Assignments Tabs */}
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actives ({pendingAssignments.length + inProgressAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Complétées ({completedAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Toutes ({totalAssignments})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <Card>
              <CardHeader>
                <CardTitle>Missions Actives</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingAssignments.length + inProgressAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
                    <p className="text-muted-foreground">Aucune mission active.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...pendingAssignments, ...inProgressAssignments].map((assignment) => (
                      <div key={assignment.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(assignment.reports?.priority || null)}`} />
                              <Badge variant="outline">{assignment.reports?.category}</Badge>
                              {getStatusBadge(assignment.status)}
                            </div>
                            <p className="font-medium">{assignment.reports?.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.reports?.cities?.name} • 
                              {assignment.due_date && ` Échéance: ${format(new Date(assignment.due_date), 'PP', { locale: fr })}`}
                            </p>
                          </div>
                          <Select
                            value={assignment.status || 'pending'}
                            onValueChange={(value) => updateAssignmentMutation.mutate({ id: assignment.id, status: value })}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">En attente</SelectItem>
                              <SelectItem value="in_progress">En cours</SelectItem>
                              <SelectItem value="completed">Complété</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Missions Complétées</CardTitle>
              </CardHeader>
              <CardContent>
                {completedAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucune mission complétée.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedAssignments.map((assignment) => (
                      <div key={assignment.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{assignment.reports?.category}</Badge>
                              <Badge className="bg-green-600">Complété</Badge>
                            </div>
                            <p className="font-medium">{assignment.reports?.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.reports?.cities?.name}
                            </p>
                          </div>
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Toutes les Missions</CardTitle>
              </CardHeader>
              <CardContent>
                {totalAssignments === 0 ? (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucune mission assignée.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments?.map((assignment) => (
                      <div key={assignment.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2 h-2 rounded-full ${getPriorityColor(assignment.reports?.priority || null)}`} />
                              <Badge variant="outline">{assignment.reports?.category}</Badge>
                              {getStatusBadge(assignment.status)}
                            </div>
                            <p className="font-medium">{assignment.reports?.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignment.reports?.cities?.name} • 
                              {assignment.created_at && ` Assigné le ${format(new Date(assignment.created_at), 'PP', { locale: fr })}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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

export default PartnerDashboard;
