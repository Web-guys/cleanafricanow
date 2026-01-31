import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, Target } from "lucide-react";

export const PerformanceMetricsCard = () => {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["performance-metrics"],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Get reports from last 30 days
      const { data: recentReports } = await supabase
        .from("reports")
        .select("status, sla_due_date, created_at, resolved_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Get reports from 30-60 days ago for comparison
      const { data: previousReports } = await supabase
        .from("reports")
        .select("status, created_at, resolved_at")
        .gte("created_at", sixtyDaysAgo.toISOString())
        .lt("created_at", thirtyDaysAgo.toISOString());

      const recent = recentReports || [];
      const previous = previousReports || [];

      // Calculate metrics
      const recentTotal = recent.length;
      const previousTotal = previous.length;
      const reportsTrend = previousTotal > 0 ? ((recentTotal - previousTotal) / previousTotal) * 100 : 0;

      const recentResolved = recent.filter((r) => r.status === "resolved").length;
      const previousResolved = previous.filter((r) => r.status === "resolved").length;
      const resolutionRate = recentTotal > 0 ? (recentResolved / recentTotal) * 100 : 0;
      const previousResolutionRate = previousTotal > 0 ? (previousResolved / previousTotal) * 100 : 0;
      const resolutionTrend = resolutionRate - previousResolutionRate;

      // SLA compliance
      const slaCompliant = recent.filter((r) => {
        if (r.status !== "resolved" || !r.sla_due_date || !r.resolved_at) return false;
        return new Date(r.resolved_at) <= new Date(r.sla_due_date);
      }).length;
      const slaRate = recentResolved > 0 ? (slaCompliant / recentResolved) * 100 : 0;

      // Average resolution time (for resolved reports with dates)
      const resolvedWithDates = recent.filter(
        (r) => r.status === "resolved" && r.created_at && r.resolved_at
      );
      const avgResolutionTime = resolvedWithDates.length > 0
        ? resolvedWithDates.reduce((acc, r) => {
            const created = new Date(r.created_at!);
            const resolved = new Date(r.resolved_at!);
            return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / resolvedWithDates.length
        : 0;

      // Pending count
      const pending = recent.filter((r) => r.status === "pending").length;
      const overdue = recent.filter((r) => {
        if (r.status === "resolved" || !r.sla_due_date) return false;
        return new Date(r.sla_due_date) < now;
      }).length;

      return {
        reportsTrend,
        resolutionRate,
        resolutionTrend,
        slaRate,
        avgResolutionTime,
        pending,
        overdue,
        recentTotal,
        recentResolved,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const metricItems = [
    {
      label: "Resolution Rate",
      value: `${metrics?.resolutionRate.toFixed(1)}%`,
      trend: metrics?.resolutionTrend || 0,
      icon: CheckCircle2,
      progress: metrics?.resolutionRate || 0,
      color: "text-green-500",
      progressColor: "bg-green-500",
    },
    {
      label: "SLA Compliance",
      value: `${metrics?.slaRate.toFixed(1)}%`,
      target: "95%",
      icon: Target,
      progress: metrics?.slaRate || 0,
      color: (metrics?.slaRate || 0) >= 95 ? "text-green-500" : "text-amber-500",
      progressColor: (metrics?.slaRate || 0) >= 95 ? "bg-green-500" : "bg-amber-500",
    },
    {
      label: "Avg. Resolution Time",
      value: `${metrics?.avgResolutionTime.toFixed(1)} days`,
      icon: Clock,
      color: "text-blue-500",
    },
    {
      label: "Pending Reports",
      value: metrics?.pending || 0,
      subValue: `${metrics?.overdue || 0} overdue`,
      icon: AlertTriangle,
      color: (metrics?.overdue || 0) > 0 ? "text-destructive" : "text-muted-foreground",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          Performance Metrics
          <span className="text-xs font-normal text-muted-foreground">Last 30 days</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {metricItems.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-sm font-medium">{metric.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{metric.value}</span>
                {metric.trend !== undefined && metric.trend !== 0 && (
                  <span className={`text-xs flex items-center gap-0.5 ${metric.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(metric.trend).toFixed(1)}%
                  </span>
                )}
                {metric.subValue && (
                  <span className="text-xs text-muted-foreground">({metric.subValue})</span>
                )}
                {metric.target && (
                  <span className="text-xs text-muted-foreground">Target: {metric.target}</span>
                )}
              </div>
            </div>
            {metric.progress !== undefined && (
              <Progress value={metric.progress} className="h-2" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
