import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, AlertTriangle, MapPin } from "lucide-react";
import { useBinAlerts, useResolveAlert } from "@/hooks/useWasteBins";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface BinAlertsListProps {
  cityId?: string;
  maxItems?: number;
}

const severityColors: Record<string, string> = {
  low: "bg-info/20 text-info border-info/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-moroccan-terracotta/20 text-moroccan-terracotta border-moroccan-terracotta/30",
  critical: "bg-destructive/20 text-destructive border-destructive/30",
};

export const BinAlertsList = ({ cityId, maxItems = 10 }: BinAlertsListProps) => {
  const { data: alerts, isLoading } = useBinAlerts(cityId, true);
  const resolveAlert = useResolveAlert();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedAlerts = alerts?.slice(0, maxItems) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-moroccan-terracotta" />
            Active Alerts
          </div>
          {alerts && alerts.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {alerts.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-success" />
            <p>No active alerts</p>
            <p className="text-sm">All bins are operating normally</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAlerts.map((alert) => (
              <div 
                key={alert.id}
                className="flex items-start justify-between p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={cn(
                    "h-5 w-5 mt-0.5",
                    alert.severity === 'critical' ? 'text-destructive' :
                    alert.severity === 'high' ? 'text-moroccan-terracotta' :
                    'text-warning'
                  )} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {alert.waste_bins?.bin_code || 'Unknown Bin'}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", severityColors[alert.severity])}
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {alert.waste_bins?.district && (
                        <>
                          <MapPin className="h-3 w-3" />
                          {alert.waste_bins.district}
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolveAlert.mutate(alert.id)}
                  disabled={resolveAlert.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
