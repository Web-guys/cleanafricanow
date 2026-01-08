import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, FileText, UserPlus, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'report_created' | 'report_resolved' | 'user_joined' | 'status_changed';
  message: string;
  timestamp: string;
  category?: string;
}

export const RecentActivityFeed = () => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Fetch recent reports
      const { data: reports } = await supabase
        .from('reports')
        .select('id, category, status, created_at, resolved_at')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch recent users
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: ActivityItem[] = [];

      // Add report activities
      reports?.forEach(report => {
        activities.push({
          id: `report-${report.id}`,
          type: report.status === 'resolved' ? 'report_resolved' : 'report_created',
          message: report.status === 'resolved' 
            ? `${report.category} report resolved`
            : `New ${report.category} report submitted`,
          timestamp: report.status === 'resolved' ? report.resolved_at! : report.created_at!,
          category: report.category,
        });
      });

      // Add user activities
      users?.forEach(user => {
        activities.push({
          id: `user-${user.id}`,
          type: 'user_joined',
          message: `${user.full_name} joined the platform`,
          timestamp: user.created_at!,
        });
      });

      // Sort by timestamp
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);
    },
    refetchInterval: 30000,
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'report_created': return FileText;
      case 'report_resolved': return CheckCircle2;
      case 'user_joined': return UserPlus;
      case 'status_changed': return Clock;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'report_created': return 'bg-info/10 text-info';
      case 'report_resolved': return 'bg-success/10 text-success';
      case 'user_joined': return 'bg-primary/10 text-primary';
      case 'status_changed': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="p-4 pt-0 space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : activities?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No recent activity</div>
            ) : (
              activities?.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${getActivityColor(activity.type)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {activity.category && (
                      <Badge variant="outline" className="shrink-0 text-xs capitalize">
                        {activity.category}
                      </Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
