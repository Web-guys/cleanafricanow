import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
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
  Legend,
} from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

const CATEGORY_COLORS = {
  waste: "hsl(var(--success))",
  pollution: "hsl(var(--warning))",
  danger: "hsl(var(--destructive))",
};

const STATUS_COLORS = {
  pending: "hsl(var(--warning))",
  in_progress: "hsl(var(--info))",
  resolved: "hsl(var(--success))",
};

interface Report {
  id: string;
  category: string;
  status: string;
  created_at: string;
  city_id: string | null;
}

export const ReportAnalytics = () => {
  const { t } = useTranslation();

  const { data: reports = [] } = useQuery({
    queryKey: ["analytics-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, category, status, created_at, city_id")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Report[];
    },
  });

  // Reports over last 30 days
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const reportsOverTime = last30Days.map((day) => {
    const dayStart = startOfDay(day);
    const dayReports = reports.filter((r) => {
      const reportDate = startOfDay(new Date(r.created_at));
      return reportDate.getTime() === dayStart.getTime();
    });

    return {
      date: format(day, "MMM dd"),
      count: dayReports.length,
      waste: dayReports.filter((r) => r.category === "waste").length,
      pollution: dayReports.filter((r) => r.category === "pollution").length,
      danger: dayReports.filter((r) => r.category === "danger").length,
    };
  });

  // Category breakdown
  const categoryData = [
    {
      name: t("report.categories.waste"),
      value: reports.filter((r) => r.category === "waste").length,
      color: CATEGORY_COLORS.waste,
    },
    {
      name: t("report.categories.pollution"),
      value: reports.filter((r) => r.category === "pollution").length,
      color: CATEGORY_COLORS.pollution,
    },
    {
      name: t("report.categories.danger"),
      value: reports.filter((r) => r.category === "danger").length,
      color: CATEGORY_COLORS.danger,
    },
  ].filter((d) => d.value > 0);

  // Status breakdown
  const statusData = [
    {
      name: t("report.status.pending"),
      value: reports.filter((r) => r.status === "pending").length,
      color: STATUS_COLORS.pending,
    },
    {
      name: t("report.status.inprogress"),
      value: reports.filter((r) => r.status === "in_progress").length,
      color: STATUS_COLORS.in_progress,
    },
    {
      name: t("report.status.resolved"),
      value: reports.filter((r) => r.status === "resolved").length,
      color: STATUS_COLORS.resolved,
    },
  ].filter((d) => d.value > 0);

  // Resolution rate
  const totalReports = reports.length;
  const resolvedReports = reports.filter((r) => r.status === "resolved").length;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  // Weekly comparison
  const thisWeekReports = reports.filter((r) => {
    const reportDate = new Date(r.created_at);
    return reportDate >= subDays(new Date(), 7);
  }).length;

  const lastWeekReports = reports.filter((r) => {
    const reportDate = new Date(r.created_at);
    return reportDate >= subDays(new Date(), 14) && reportDate < subDays(new Date(), 7);
  }).length;

  const weeklyChange = lastWeekReports > 0 
    ? Math.round(((thisWeekReports - lastWeekReports) / lastWeekReports) * 100) 
    : thisWeekReports > 0 ? 100 : 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.analytics.resolutionRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{resolutionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {resolvedReports} {t("admin.analytics.of")} {totalReports} {t("admin.analytics.resolved")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.analytics.thisWeek")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{thisWeekReports}</div>
            <p className={`text-xs mt-1 ${weeklyChange >= 0 ? "text-warning" : "text-success"}`}>
              {weeklyChange >= 0 ? "+" : ""}{weeklyChange}% {t("admin.analytics.vsLastWeek")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("admin.analytics.avgPerDay")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(thisWeekReports / 7).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("admin.analytics.last7Days")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reports Over Time */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>{t("admin.analytics.reportsOverTime")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="waste" 
                    name={t("report.categories.waste")}
                    stroke={CATEGORY_COLORS.waste} 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pollution" 
                    name={t("report.categories.pollution")}
                    stroke={CATEGORY_COLORS.pollution} 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="danger" 
                    name={t("report.categories.danger")}
                    stroke={CATEGORY_COLORS.danger} 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.analytics.byCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {t("admin.analytics.noData")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.analytics.byStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  {t("admin.analytics.noData")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
