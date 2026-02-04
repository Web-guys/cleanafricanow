import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBinStats, useBins } from "@/hooks/useWasteBins";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { TrendingUp, MapPin, Clock, AlertTriangle } from "lucide-react";
import { getStatusColor } from "./BinStatusBadge";

interface BinAnalyticsProps {
  cityId?: string;
}

export const BinAnalytics = ({ cityId }: BinAnalyticsProps) => {
  const { data: stats, isLoading: statsLoading } = useBinStats(cityId);
  const { data: bins, isLoading: binsLoading } = useBins(cityId);

  // Get reports by district
  const { data: districtStats } = useQuery({
    queryKey: ['bin-district-stats', cityId],
    queryFn: async () => {
      const binData = bins || [];
      const districtMap = new Map<string, { total: number; needsAttention: number }>();
      
      binData.forEach(bin => {
        const district = bin.district || 'Unknown';
        const current = districtMap.get(district) || { total: 0, needsAttention: 0 };
        current.total++;
        if (['full', 'overflowing', 'damaged', 'missing'].includes(bin.current_status)) {
          current.needsAttention++;
        }
        districtMap.set(district, current);
      });

      return Array.from(districtMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.needsAttention - a.needsAttention)
        .slice(0, 10);
    },
    enabled: !!bins,
  });

  if (statsLoading || binsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Status distribution data
  const statusData = [
    { name: 'Empty', value: stats?.empty || 0, status: 'empty' },
    { name: 'Half Full', value: stats?.half_full || 0, status: 'half_full' },
    { name: 'Almost Full', value: stats?.almost_full || 0, status: 'almost_full' },
    { name: 'Full', value: stats?.full || 0, status: 'full' },
    { name: 'Overflowing', value: stats?.overflowing || 0, status: 'overflowing' },
    { name: 'Damaged/Missing', value: (stats?.damaged || 0) + (stats?.missing || 0), status: 'damaged' },
  ].filter(d => d.value > 0);

  // Calculate metrics
  const collectionRate = stats?.total ? ((stats.empty + stats.half_full) / stats.total * 100).toFixed(0) : 0;
  const attentionRate = stats?.total ? (stats.needsAttention / stats.total * 100).toFixed(0) : 0;

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{collectionRate}%</p>
                <p className="text-xs text-muted-foreground">OK Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attentionRate}%</p>
                <p className="text-xs text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.almost_full || 0}</p>
                <p className="text-xs text-muted-foreground">Almost Full</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <MapPin className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{districtStats?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Districts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bin Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getStatusColor(entry.status as any)}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Problem Areas Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Areas Needing Attention</CardTitle>
          </CardHeader>
          <CardContent>
            {districtStats && districtStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={districtStats.slice(0, 5)} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="needsAttention" fill="#ef4444" name="Needs Attention" />
                  <Bar dataKey="total" fill="#3b82f6" name="Total Bins" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No district data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
