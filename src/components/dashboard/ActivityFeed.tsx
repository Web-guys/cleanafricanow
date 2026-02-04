import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

interface ActivityFeedProps {
  cityIds: string[];
  limit?: number;
}

interface ActivityItem {
  id: string;
  type: "report" | "event" | "registration";
  title: string;
  description: string;
  status?: string;
  timestamp: string;
  icon: React.ElementType;
  color: string;
}

export const ActivityFeed = ({ cityIds, limit = 10 }: ActivityFeedProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? fr : undefined;

  const { data: recentReports } = useQuery({
    queryKey: ['activity-reports', cityIds],
    queryFn: async () => {
      if (cityIds.length === 0) return [];
      const { data } = await supabase
        .from('reports')
        .select('id, description, status, created_at, category')
        .in('city_id', cityIds)
        .order('created_at', { ascending: false })
        .limit(limit);
      return data || [];
    },
    enabled: cityIds.length > 0
  });

  const { data: recentEvents } = useQuery({
    queryKey: ['activity-events', cityIds],
    queryFn: async () => {
      if (cityIds.length === 0) return [];
      const { data } = await supabase
        .from('collection_events')
        .select('id, title, status, created_at')
        .in('city_id', cityIds)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: cityIds.length > 0
  });

  const { data: recentRegistrations } = useQuery({
    queryKey: ['activity-registrations', cityIds],
    queryFn: async () => {
      if (cityIds.length === 0) return [];
      const { data: events } = await supabase
        .from('collection_events')
        .select('id')
        .in('city_id', cityIds);
      
      if (!events?.length) return [];
      
      const { data } = await supabase
        .from('event_registrations')
        .select('id, participant_name, status, created_at')
        .in('event_id', events.map(e => e.id))
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: cityIds.length > 0
  });

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      case 'in_progress':
        return { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' };
      case 'resolved':
        return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'approved':
        return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'rejected':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' };
      default:
        return { icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  // Combine and sort activities
  const activities: ActivityItem[] = [
    ...(recentReports?.map(r => ({
      id: r.id,
      type: 'report' as const,
      title: t(`report.categories.${r.category}`, r.category),
      description: r.description?.substring(0, 60) + (r.description?.length > 60 ? '...' : ''),
      status: r.status,
      timestamp: r.created_at,
      icon: FileText,
      color: getStatusConfig(r.status).color,
    })) || []),
    ...(recentEvents?.map(e => ({
      id: e.id,
      type: 'event' as const,
      title: e.title,
      description: t('dashboard.newEventCreated', 'New event created'),
      status: e.status,
      timestamp: e.created_at,
      icon: Calendar,
      color: 'text-purple-500',
    })) || []),
    ...(recentRegistrations?.map(r => ({
      id: r.id,
      type: 'registration' as const,
      title: r.participant_name,
      description: t('dashboard.registeredForEvent', 'Registered for event'),
      status: r.status,
      timestamp: r.created_at,
      icon: Users,
      color: 'text-indigo-500',
    })) || []),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   .slice(0, limit);

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            {t('dashboard.recentActivity', 'Recent Activity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>{t('dashboard.noRecentActivity', 'No recent activity')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          {t('dashboard.recentActivity', 'Recent Activity')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="px-6 pb-6 space-y-1">
            {activities.map((activity, idx) => {
              const StatusIcon = activity.icon;
              const config = getStatusConfig(activity.status || null);
              
              return (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-start gap-3 py-3 border-b last:border-0 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{activity.title}</p>
                      {activity.status && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                          {activity.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
