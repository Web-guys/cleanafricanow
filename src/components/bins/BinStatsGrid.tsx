import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, AlertTriangle, CheckCircle, Clock, Wrench, MapPin } from "lucide-react";
import { useBinStats } from "@/hooks/useWasteBins";
import { Skeleton } from "@/components/ui/skeleton";

interface BinStatsGridProps {
  cityId?: string;
}

export const BinStatsGrid = ({ cityId }: BinStatsGridProps) => {
  const { data: stats, isLoading } = useBinStats(cityId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const statCards = [
    { 
      label: "Total Bins", 
      value: stats?.total || 0, 
      icon: Trash2, 
      color: "text-primary",
      bgColor: "bg-primary/10" 
    },
    { 
      label: "OK (Empty/Half)", 
      value: (stats?.empty || 0) + (stats?.half_full || 0), 
      icon: CheckCircle, 
      color: "text-success",
      bgColor: "bg-success/10" 
    },
    { 
      label: "Almost Full", 
      value: stats?.almost_full || 0, 
      icon: Clock, 
      color: "text-warning",
      bgColor: "bg-warning/10" 
    },
    { 
      label: "Full", 
      value: stats?.full || 0, 
      icon: AlertTriangle, 
      color: "text-moroccan-terracotta",
      bgColor: "bg-moroccan-terracotta/10" 
    },
    { 
      label: "Overflowing", 
      value: stats?.overflowing || 0, 
      icon: AlertTriangle, 
      color: "text-destructive",
      bgColor: "bg-destructive/10" 
    },
    { 
      label: "Damaged/Missing", 
      value: (stats?.damaged || 0) + (stats?.missing || 0), 
      icon: Wrench, 
      color: "text-muted-foreground",
      bgColor: "bg-muted" 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
