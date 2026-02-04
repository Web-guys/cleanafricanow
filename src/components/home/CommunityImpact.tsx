import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { TrendingUp, CheckCircle2, MapPin, Leaf, Clock, Users, Award, ArrowUp } from "lucide-react";
import { subDays } from "date-fns";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollAnimation();

  useEffect(() => {
    if (!isVisible) return;
    
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isVisible]);

  return <span ref={ref as any}>{count.toLocaleString()}{suffix}</span>;
};

export const CommunityImpact = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();

  const { data: stats } = useQuery({
    queryKey: ["public-impact-stats"],
    queryFn: async () => {
      const { data: reports, error: reportsError } = await supabase
        .from("reports_public")
        .select("id, status, category, city_id, created_at");

      if (reportsError) throw reportsError;

      const { count: citiesCount, error: citiesError } = await supabase
        .from("cities")
        .select("*", { count: "exact", head: true });

      if (citiesError) throw citiesError;

      const { count: usersCount } = await supabase
        .from("profiles_public")
        .select("*", { count: "exact", head: true });

      const total = reports?.length || 0;
      const resolved = reports?.filter((r) => r.status === "resolved").length || 0;
      const pending = reports?.filter((r) => r.status === "pending").length || 0;
      const inProgress = reports?.filter((r) => r.status === "in_progress").length || 0;
      
      const thisWeekReports = reports?.filter((r) => {
        const reportDate = new Date(r.created_at);
        return reportDate >= subDays(new Date(), 7);
      }).length || 0;

      const wasteReports = reports?.filter((r) => r.category === "waste").length || 0;
      const pollutionReports = reports?.filter((r) => r.category === "pollution").length || 0;
      const dangerReports = reports?.filter((r) => r.category === "danger").length || 0;

      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      return {
        total,
        resolved,
        pending,
        inProgress,
        thisWeekReports,
        citiesCount: citiesCount || 0,
        usersCount: usersCount || 0,
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
      borderColor: "border-primary/20",
      trend: "+12%",
    },
    {
      icon: CheckCircle2,
      value: stats?.resolutionRate || 0,
      suffix: "%",
      label: t("impact.resolutionRate"),
      sublabel: t("impact.issuesResolved"),
      color: "text-success",
      bgColor: "bg-success/10",
      borderColor: "border-success/20",
      trend: "+5%",
    },
    {
      icon: MapPin,
      value: stats?.citiesCount || 0,
      label: t("impact.citiesCovered"),
      sublabel: t("impact.acrossAfrica"),
      color: "text-info",
      bgColor: "bg-info/10",
      borderColor: "border-info/20",
      trend: "+3",
    },
    {
      icon: Users,
      value: stats?.usersCount || 0,
      label: t("impact.activeUsers", "Active Users"),
      sublabel: t("impact.contributors", "Contributors"),
      color: "text-warning",
      bgColor: "bg-warning/10",
      borderColor: "border-warning/20",
      trend: "+24%",
    },
  ];

  const categoryBreakdown = [
    {
      label: t("report.categories.waste"),
      value: stats?.wasteReports || 0,
      percentage: stats?.total ? Math.round((stats.wasteReports / stats.total) * 100) : 0,
      color: "bg-success",
      icon: "🗑️",
    },
    {
      label: t("report.categories.pollution"),
      value: stats?.pollutionReports || 0,
      percentage: stats?.total ? Math.round((stats.pollutionReports / stats.total) * 100) : 0,
      color: "bg-warning",
      icon: "🏭",
    },
    {
      label: t("report.categories.danger"),
      value: stats?.dangerReports || 0,
      percentage: stats?.total ? Math.round((stats.dangerReports / stats.total) * 100) : 0,
      color: "bg-destructive",
      icon: "⚠️",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-muted/50 to-background dark:from-muted/20 dark:to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className={cn(
          "text-center mb-16 opacity-0",
          isVisible && "animate-fade-in"
        )}>
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Real Impact</span>
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Leaf className="h-10 w-10 text-primary" />
            <h3 className="text-3xl md:text-5xl font-bold text-foreground">{t("impact.title")}</h3>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("impact.subtitle")}
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto mb-16">
          {impactStats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                "opacity-0",
                isVisible && "animate-slide-up"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Card className={cn(
                "h-full border-2 bg-card shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group",
                stat.borderColor
              )}>
                <CardContent className="pt-6 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      stat.bgColor
                    )}>
                      <stat.icon className={cn("w-7 h-7", stat.color)} />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                      stat.bgColor, stat.color
                    )}>
                      <ArrowUp className="h-3 w-3" />
                      {stat.trend}
                    </div>
                  </div>
                  <p className={cn("text-4xl md:text-5xl font-bold mb-1", stat.color)}>
                    <AnimatedCounter end={typeof stat.value === 'string' ? parseInt(stat.value) : stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="font-semibold text-foreground">{stat.label}</p>
                  <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className={cn(
          "max-w-3xl mx-auto opacity-0",
          isVisible && "animate-fade-in"
        )} style={{ animationDelay: "500ms" }}>
          <h4 className="text-xl font-bold text-center mb-8">
            {t("impact.categoryBreakdown")}
          </h4>
          <div className="space-y-5">
            {categoryBreakdown.map((category, index) => (
              <div key={index} className="group">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-semibold">{category.label}</span>
                  </div>
                  <span className="text-muted-foreground font-medium">
                    {category.value} ({category.percentage}%)
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000 ease-out",
                      category.color
                    )}
                    style={{ 
                      width: isVisible ? `${category.percentage}%` : '0%',
                      transitionDelay: `${600 + index * 150}ms`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Summary */}
        <div className={cn(
          "flex flex-wrap justify-center gap-8 mt-12 opacity-0",
          isVisible && "animate-fade-in"
        )} style={{ animationDelay: "900ms" }}>
          <div className="flex items-center gap-3 bg-warning/10 px-4 py-2 rounded-full">
            <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
            <span className="text-sm font-medium">
              <span className="font-bold">{stats?.pending || 0}</span>{" "}
              {t("report.status.pending")}
            </span>
          </div>
          <div className="flex items-center gap-3 bg-info/10 px-4 py-2 rounded-full">
            <div className="w-3 h-3 rounded-full bg-info animate-pulse" />
            <span className="text-sm font-medium">
              <span className="font-bold">{stats?.inProgress || 0}</span>{" "}
              {t("report.status.inProgress")}
            </span>
          </div>
          <div className="flex items-center gap-3 bg-success/10 px-4 py-2 rounded-full">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium">
              <span className="font-bold">{stats?.resolved || 0}</span>{" "}
              {t("report.status.resolved")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
