import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, TrendingUp, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface HotspotData {
  city_name: string;
  count: number;
  critical: number;
}

export const ReportHeatmapMini = () => {
  const { data: hotspots = [], isLoading } = useQuery({
    queryKey: ['report-hotspots'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('city_id, priority, cities(name)')
        .not('city_id', 'is', null);
      
      if (error) throw error;

      // Aggregate by city
      const cityMap = new Map<string, HotspotData>();
      data?.forEach((report: any) => {
        const cityName = report.cities?.name || 'Unknown';
        const existing = cityMap.get(cityName) || { city_name: cityName, count: 0, critical: 0 };
        existing.count++;
        if (report.priority === 'critical' || report.priority === 'high') {
          existing.critical++;
        }
        cityMap.set(cityName, existing);
      });

      return Array.from(cityMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    }
  });

  const maxCount = Math.max(...hotspots.map(h => h.count), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Report Hotspots
          </span>
          <span className="text-xs text-muted-foreground font-normal">Top 5 cities</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-2 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : hotspots.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No location data available</p>
          </div>
        ) : (
          hotspots.map((hotspot, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate max-w-[60%]">{hotspot.city_name}</span>
                <div className="flex items-center gap-2">
                  {hotspot.critical > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-red-500">
                      <AlertTriangle className="h-3 w-3" />
                      {hotspot.critical}
                    </span>
                  )}
                  <span className="text-muted-foreground">{hotspot.count}</span>
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    hotspot.critical > 0 ? "bg-gradient-to-r from-amber-500 to-red-500" : "bg-primary"
                  )}
                  style={{ width: `${(hotspot.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};