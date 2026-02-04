import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Leaf, 
  Users, 
  CheckCircle2, 
  Target,
  Sparkles 
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImpactMetricsProps {
  totalReports: number;
  resolvedReports: number;
  regionsCount: number;
  eventsCount?: number;
  volunteersCount?: number;
}

export const ImpactMetrics = ({
  totalReports,
  resolvedReports,
  regionsCount,
  eventsCount = 0,
  volunteersCount = 0,
}: ImpactMetricsProps) => {
  const { t } = useTranslation();
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  const metrics = [
    {
      label: t('dashboard.issuesResolved', 'Issues Resolved'),
      value: resolvedReports,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: t('dashboard.regionsServed', 'Regions Served'),
      value: regionsCount,
      icon: Leaf,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      label: t('dashboard.eventsOrganized', 'Events Organized'),
      value: eventsCount,
      icon: Target,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: t('dashboard.volunteersEngaged', 'Volunteers Engaged'),
      value: volunteersCount,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          {t('dashboard.environmentalImpact', 'Environmental Impact')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resolution Rate Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('dashboard.resolutionRate', 'Resolution Rate')}</span>
            <span className="font-bold text-emerald-500">{resolutionRate}%</span>
          </div>
          <Progress value={resolutionRate} className="h-3" />
          <p className="text-xs text-muted-foreground">
            {resolvedReports} {t('dashboard.outOf', 'out of')} {totalReports} {t('dashboard.reportsResolved', 'reports resolved')}
          </p>
        </div>

        {/* Impact Grid */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${metric.border} ${metric.bg} transition-all hover:scale-[1.02]`}
              >
                <Icon className={`h-5 w-5 ${metric.color} mb-2`} />
                <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
              </div>
            );
          })}
        </div>

        {/* Impact Message */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">
                {t('dashboard.impactTitle', 'Making a Difference')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('dashboard.impactMessage', 'Your organization is actively contributing to environmental protection. Keep up the excellent work!')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
