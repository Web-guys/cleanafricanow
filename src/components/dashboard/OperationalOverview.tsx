import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Route, 
  Trash, 
  Recycle, 
  Building2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface OperationalOverviewProps {
  cityId: string | null;
}

export const OperationalOverview = ({ cityId }: OperationalOverviewProps) => {
  const { t } = useTranslation();

  const { data: workers } = useQuery({
    queryKey: ['overview-workers', cityId],
    queryFn: async () => {
      if (!cityId) return { total: 0, active: 0 };
      const { data } = await supabase
        .from('team_workers')
        .select('id, status')
        .eq('city_id', cityId);
      return {
        total: data?.length || 0,
        active: data?.filter(w => w.status === 'active').length || 0,
      };
    },
    enabled: !!cityId
  });

  const { data: routes } = useQuery({
    queryKey: ['overview-routes', cityId],
    queryFn: async () => {
      if (!cityId) return { total: 0, active: 0 };
      const { data } = await supabase
        .from('collection_routes')
        .select('id, status')
        .eq('city_id', cityId);
      return {
        total: data?.length || 0,
        active: data?.filter(r => r.status === 'active').length || 0,
      };
    },
    enabled: !!cityId
  });

  const { data: dischargeSites } = useQuery({
    queryKey: ['overview-discharge', cityId],
    queryFn: async () => {
      if (!cityId) return { total: 0, operational: 0 };
      const { data } = await supabase
        .from('discharge_sites')
        .select('id, status')
        .eq('city_id', cityId);
      return {
        total: data?.length || 0,
        operational: data?.filter(d => d.status === 'operational').length || 0,
      };
    },
    enabled: !!cityId
  });

  const { data: sortingCenters } = useQuery({
    queryKey: ['overview-sorting', cityId],
    queryFn: async () => {
      if (!cityId) return { total: 0, operational: 0 };
      const { data } = await supabase
        .from('sorting_centers')
        .select('id, status')
        .eq('city_id', cityId);
      return {
        total: data?.length || 0,
        operational: data?.filter(s => s.status === 'operational').length || 0,
      };
    },
    enabled: !!cityId
  });

  const { data: partners } = useQuery({
    queryKey: ['overview-partners', cityId],
    queryFn: async () => {
      if (!cityId) return { total: 0, active: 0 };
      const { data } = await supabase
        .from('partner_companies')
        .select('id, status')
        .eq('city_id', cityId);
      return {
        total: data?.length || 0,
        active: data?.filter(p => p.status === 'active').length || 0,
      };
    },
    enabled: !!cityId
  });

  const overviewItems = [
    {
      label: t('dashboard.teamWorkers', 'Team Workers'),
      icon: Users,
      total: workers?.total || 0,
      active: workers?.active || 0,
      activeLabel: t('dashboard.active', 'active'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: t('dashboard.collectionRoutes', 'Routes'),
      icon: Route,
      total: routes?.total || 0,
      active: routes?.active || 0,
      activeLabel: t('dashboard.active', 'active'),
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: t('dashboard.dischargeSites', 'Discharge Sites'),
      icon: Trash,
      total: dischargeSites?.total || 0,
      active: dischargeSites?.operational || 0,
      activeLabel: t('dashboard.operational', 'operational'),
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: t('dashboard.sortingCenters', 'Sorting Centers'),
      icon: Recycle,
      total: sortingCenters?.total || 0,
      active: sortingCenters?.operational || 0,
      activeLabel: t('dashboard.operational', 'operational'),
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: t('dashboard.partners', 'Partners'),
      icon: Building2,
      total: partners?.total || 0,
      active: partners?.active || 0,
      activeLabel: t('dashboard.active', 'active'),
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          {t('dashboard.operationalOverview', 'Operational Overview')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {overviewItems.map((item, idx) => {
            const Icon = item.icon;
            const isFullyOperational = item.total > 0 && item.active === item.total;
            const hasIssues = item.total > 0 && item.active < item.total;
            
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.active} {item.activeLabel} / {item.total} {t('dashboard.total', 'total')}
                  </p>
                </div>
                {isFullyOperational && (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    OK
                  </Badge>
                )}
                {hasIssues && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {item.total - item.active}
                  </Badge>
                )}
                {item.total === 0 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    —
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
