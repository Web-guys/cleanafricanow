import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, TrendingDown, Users, FileText, Clock, Target, Activity, Zap } from "lucide-react";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--info))", "hsl(var(--secondary))"];

export const AdvancedAnalyticsPanel = () => {
  const { data: reports } = useQuery({
    queryKey: ["analytics-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, status, category, priority, created_at, resolved_at, sla_due_date, city_id")
        .eq("is_deleted", false);

      if (error) throw error;
      return data;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["analytics-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, created_at, reports_count, impact_score");

      if (error) throw error;
      return data;
    },
  });

  const { data: cities } = useQuery({
    queryKey: ["analytics-cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, country");

      if (error) throw error;
      return data;
    },
  });

  // Calculate analytics data
  const totalReports = reports?.length || 0;
  const resolvedReports = reports?.filter((r) => r.status === "resolved").length || 0;
  const pendingReports = reports?.filter((r) => r.status === "pending").length || 0;
  const overdueReports = reports?.filter((r) => 
    r.sla_due_date && new Date(r.sla_due_date) < new Date() && r.status !== "resolved"
  ).length || 0;

  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  // Category breakdown
  const categoryData = reports?.reduce((acc, report) => {
    const category = report.category || "other";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData || {}).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }));

  // Priority breakdown
  const priorityData = reports?.reduce((acc, report) => {
    const priority = report.priority || "medium";
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityChartData = [
    { name: "Critical", value: priorityData?.critical || 0, color: "hsl(var(--destructive))" },
    { name: "High", value: priorityData?.high || 0, color: "hsl(var(--warning))" },
    { name: "Medium", value: priorityData?.medium || 0, color: "hsl(var(--primary))" },
    { name: "Low", value: priorityData?.low || 0, color: "hsl(var(--success))" },
  ];

  // Daily trend (last 30 days)
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const dailyTrendData = last30Days.map((date) => {
    const dayStart = startOfDay(date);
    const count = reports?.filter((r) => {
      const reportDate = startOfDay(new Date(r.created_at));
      return reportDate.getTime() === dayStart.getTime();
    }).length || 0;

    return {
      date: format(date, "MMM dd"),
      reports: count,
    };
  });

  // City breakdown (top 5)
  const cityReportCounts = reports?.reduce((acc, report) => {
    if (report.city_id) {
      acc[report.city_id] = (acc[report.city_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const cityChartData = Object.entries(cityReportCounts || {})
    .map(([cityId, count]) => ({
      name: cities?.find((c) => c.id === cityId)?.name || "Unknown",
      reports: count,
    }))
    .sort((a, b) => b.reports - a.reports)
    .slice(0, 5);

  // Average resolution time
  const resolvedWithTime = reports?.filter((r) => r.resolved_at && r.created_at);
  const avgResolutionHours = resolvedWithTime && resolvedWithTime.length > 0
    ? Math.round(
        resolvedWithTime.reduce((sum, r) => {
          const created = new Date(r.created_at).getTime();
          const resolved = new Date(r.resolved_at!).getTime();
          return sum + (resolved - created) / (1000 * 60 * 60);
        }, 0) / resolvedWithTime.length
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-2xl font-bold">{totalReports.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success/10 rounded-xl">
                <Target className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <p className="text-2xl font-bold">{resolutionRate}%</p>
              </div>
            </div>
            <Progress value={resolutionRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning/10 rounded-xl">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                <p className="text-2xl font-bold">{avgResolutionHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-xl">
                <Activity className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SLA Overdue</p>
                <p className="text-2xl font-bold">{overdueReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Report Volume (Last 30 Days)</CardTitle>
              <CardDescription>Daily report submission trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrendData}>
                    <defs>
                      <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reports"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReports)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Reports by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reports by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={60} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cities">
          <Card>
            <CardHeader>
              <CardTitle>Top Cities by Report Volume</CardTitle>
              <CardDescription>Cities with the most environmental reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cityChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="reports" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Pending</span>
                    <span className="font-medium">{pendingReports}</span>
                  </div>
                  <Progress value={(pendingReports / totalReports) * 100} className="h-2 bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>In Progress</span>
                    <span className="font-medium">
                      {reports?.filter((r) => r.status === "in_progress").length || 0}
                    </span>
                  </div>
                  <Progress
                    value={
                      ((reports?.filter((r) => r.status === "in_progress").length || 0) / totalReports) *
                      100
                    }
                    className="h-2 bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Resolved</span>
                    <span className="font-medium">{resolvedReports}</span>
                  </div>
                  <Progress value={resolutionRate} className="h-2 bg-muted" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Total Users</span>
                  </div>
                  <span className="text-xl font-bold">{users?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-warning" />
                    <span>Active Contributors</span>
                  </div>
                  <span className="text-xl font-bold">
                    {users?.filter((u) => (u.reports_count || 0) > 0).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-success" />
                    <span>Total Impact Score</span>
                  </div>
                  <span className="text-xl font-bold">
                    {users?.reduce((sum, u) => sum + (u.impact_score || 0), 0).toLocaleString() || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
