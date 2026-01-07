import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { TrendingUp, CheckCircle2, Users, MapPin, Leaf, Clock } from "lucide-react";
import { subDays } from "date-fns";

export const CommunityImpact = () => {
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ["public-impact-stats"],
    queryFn: async () => {
      // Fetch all reports
      const { data: reports, error: reportsError } = await supabase
        .from("reports")
        .select("id, status, category, city_id, created_at");

      if (reportsError) throw reportsError;

      // Fetch cities count
      const { count: citiesCount, error: citiesError } = await supabase
        .from("cities")
        .select("*", { count: "exact", head: true });

      if (citiesError) throw citiesError;

      const total = reports?.length || 0;
      const resolved = reports?.filter((r) => r.status === "resolved").length || 0;
      const pending = reports?.filter((r) => r.status === "pending").length || 0;
      const inProgress = reports?.filter((r) => r.status === "in_progress").length || 0;
      
      // This week's reports
      const thisWeekReports = reports?.filter((r) => {
        const reportDate = new Date(r.created_at);
        return reportDate >= subDays(new Date(), 7);
      }).length || 0;

      // Category breakdown
      const wasteReports = reports?.filter((r) => r.category === "waste").length || 0;
      const pollutionReports = reports?.filter((r) => r.category === "pollution").length || 0;
      const dangerReports = reports?.filter((r) => r.category === "danger").length || 0;

      // Resolution rate
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return {
        total,
        resolved,
        pending,
        inProgress,
        thisWeekReports,
        citiesCount: citiesCount || 0,
        wasteReports,
        pollutionReports,
        dangerReports,
        resolutionRate,
      };
    },
  });

  const impactStats = [
    {
      icon: TrendingUp,
      value: stats?.total || 0,
      label: t("impact.totalReports"),
      sublabel: t("impact.issuesIdentified"),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: CheckCircle2,
      value: `${stats?.resolutionRate || 0}%`,
      label: t("impact.resolutionRate"),
      sublabel: t("impact.issuesResolved"),
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: MapPin,
      value: stats?.citiesCount || 0,
      label: t("impact.citiesCovered"),
      sublabel: t("impact.acrossAfrica"),
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: Clock,
      value: stats?.thisWeekReports || 0,
      label: t("impact.thisWeek"),
      sublabel: t("impact.newReports"),
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const categoryBreakdown = [
    {
      label: t("report.categories.waste"),
      value: stats?.wasteReports || 0,
      percentage: stats?.total ? Math.round((stats.wasteReports / stats.total) * 100) : 0,
      color: "bg-success",
    },
    {
      label: t("report.categories.pollution"),
      value: stats?.pollutionReports || 0,
      percentage: stats?.total ? Math.round((stats.pollutionReports / stats.total) * 100) : 0,
      color: "bg-warning",
    },
    {
      label: t("report.categories.danger"),
      value: stats?.dangerReports || 0,
      percentage: stats?.total ? Math.round((stats.dangerReports / stats.total) * 100) : 0,
      color: "bg-destructive",
    },
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="h-8 w-8 text-primary" />
            <h3 className="text-3xl md:text-4xl font-bold">{t("impact.title")}</h3>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("impact.subtitle")}
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto mb-12">
          {impactStats.map((stat, index) => (
            <Card
              key={index}
              className="border-2 border-border/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <CardContent className="pt-6 text-center">
                <div
                  className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className={`text-3xl md:text-4xl font-bold ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="font-medium mt-1">{stat.label}</p>
                <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="max-w-3xl mx-auto">
          <h4 className="text-lg font-semibold text-center mb-6">
            {t("impact.categoryBreakdown")}
          </h4>
          <div className="space-y-4">
            {categoryBreakdown.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{category.label}</span>
                  <span className="text-muted-foreground">
                    {category.value} ({category.percentage}%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${category.color} rounded-full transition-all duration-500`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap justify-center gap-6 mt-12">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-sm">
              <span className="font-semibold">{stats?.pending || 0}</span>{" "}
              {t("report.status.pending")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-info" />
            <span className="text-sm">
              <span className="font-semibold">{stats?.inProgress || 0}</span>{" "}
              {t("report.status.inProgress")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm">
              <span className="font-semibold">{stats?.resolved || 0}</span>{" "}
              {t("report.status.resolved")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
