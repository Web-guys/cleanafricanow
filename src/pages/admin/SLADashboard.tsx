import { useState } from "react";
import { Clock, AlertTriangle, CheckCircle2, TrendingUp, MapPin, RefreshCw, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useSLADashboard, useSLAOverdue, useSLADueSoon, useSLAStats, useSLAByTerritory } from "@/hooks/useAdminApi";
import {
  SLAComplianceGauge,
  SLAPriorityChart,
  SLAStatusDistribution,
  SLAResolutionMetrics,
  SLAPriorityBreakdown,
  SLATerritoryHeatmap,
} from "@/components/admin/SLACharts";

const AdminSLADashboard = () => {
  const { t } = useTranslation();
  const [overduePageNum, setOverduePageNum] = useState(1);

  const { data: dashboard, isLoading: dashboardLoading, refetch } = useSLADashboard();
  const { data: overdueData, isLoading: overdueLoading } = useSLAOverdue(overduePageNum);
  const { data: dueSoonData } = useSLADueSoon();
  const { data: statsData } = useSLAStats();
  const { data: territoryData } = useSLAByTerritory();

  const stats = dashboard?.stats;

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout
      title="SLA Dashboard"
      icon={<Clock className="h-6 w-6 text-primary" />}
      role="admin"
    >
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              Monitor service level agreements and response times
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overview Stats */}
        {dashboardLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-red-600">{stats?.overdue || 0}</p>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-yellow-600">{stats?.due_today || 0}</p>
                    <p className="text-sm text-muted-foreground">Due Today</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-blue-600">{stats?.due_this_week || 0}</p>
                    <p className="text-sm text-muted-foreground">This Week</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-green-600">{stats?.on_track || 0}</p>
                    <p className="text-sm text-muted-foreground">On Track</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SLAComplianceGauge complianceRate={statsData?.sla_compliance_rate || 0} />
          <SLAStatusDistribution stats={stats} />
          <SLAResolutionMetrics statsData={statsData} />
        </div>

        {/* Priority & Territory Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SLAPriorityChart byPriority={statsData?.by_priority || []} />
          <SLAPriorityBreakdown byPriority={statsData?.by_priority || []} />
        </div>

        {/* Territory Heatmap */}
        <SLATerritoryHeatmap territories={territoryData?.territories || []} />

        {/* Tabs for Overdue and Due Soon */}
        <Tabs defaultValue="overdue">
          <TabsList>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue ({stats?.overdue || 0})
            </TabsTrigger>
            <TabsTrigger value="due-soon" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Due Soon ({dueSoonData?.pagination?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="territory" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              By Territory
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overdue">
            <Card>
              <CardHeader>
                <CardTitle>Overdue Reports</CardTitle>
                <CardDescription>Reports that have exceeded their SLA deadline</CardDescription>
              </CardHeader>
              <CardContent>
                {overdueLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Overdue By</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overdueData?.reports?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No overdue reports! 🎉
                          </TableCell>
                        </TableRow>
                      ) : (
                        overdueData?.reports?.map((report: any) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium capitalize">{report.category?.replace(/_/g, " ")}</p>
                                <p className="text-sm text-muted-foreground truncate max-w-xs">
                                  {report.description?.substring(0, 50)}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(report.priority || "medium")}>
                                {report.priority || "medium"}
                              </Badge>
                            </TableCell>
                            <TableCell>{report.cities?.name || "—"}</TableCell>
                            <TableCell>
                              <span className="text-red-600 font-medium">
                                {report.overdue_hours}h overdue
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{report.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="due-soon">
            <Card>
              <CardHeader>
                <CardTitle>Due Within 24 Hours</CardTitle>
                <CardDescription>Reports approaching their SLA deadline</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Time Remaining</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dueSoonData?.reports?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No reports due soon
                        </TableCell>
                      </TableRow>
                    ) : (
                      dueSoonData?.reports?.map((report: any) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium capitalize">{report.category?.replace(/_/g, " ")}</p>
                              <p className="text-sm text-muted-foreground">
                                {report.cities?.name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(report.priority || "medium")}>
                              {report.priority || "medium"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-yellow-600 font-medium">
                              {report.hours_remaining}h remaining
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{report.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="territory">
            <Card>
              <CardHeader>
                <CardTitle>SLA by Territory</CardTitle>
                <CardDescription>Report distribution and SLA status by city</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead>Total Active</TableHead>
                      <TableHead>Overdue</TableHead>
                      <TableHead>Due Soon</TableHead>
                      <TableHead>On Track</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {territoryData?.territories?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No territory data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      territoryData?.territories?.map((territory: any) => (
                        <TableRow key={territory.city_id}>
                          <TableCell className="font-medium">{territory.city_name}</TableCell>
                          <TableCell>{territory.total}</TableCell>
                          <TableCell>
                            <span className={territory.overdue > 0 ? "text-red-600 font-medium" : ""}>
                              {territory.overdue}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={territory.due_soon > 0 ? "text-yellow-600 font-medium" : ""}>
                              {territory.due_soon}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600">{territory.on_track}</span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSLADashboard;
