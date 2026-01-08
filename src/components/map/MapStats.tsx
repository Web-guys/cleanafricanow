import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import type { Report } from "@/hooks/useReports";

interface MapStatsProps {
  reports: Report[] | undefined;
  className?: string;
}

const MapStats = ({ reports, className }: MapStatsProps) => {
  const stats = useMemo(() => {
    if (!reports?.length) {
      return { total: 0, pending: 0, inProgress: 0, resolved: 0 };
    }

    return reports.reduce(
      (acc, report) => {
        acc.total++;
        if (report.status === 'pending') acc.pending++;
        else if (report.status === 'in_progress') acc.inProgress++;
        else if (report.status === 'resolved') acc.resolved++;
        return acc;
      },
      { total: 0, pending: 0, inProgress: 0, resolved: 0 }
    );
  }, [reports]);

  const resolvedPercent = stats.total > 0 
    ? Math.round((stats.resolved / stats.total) * 100) 
    : 0;

  return (
    <div className={cn(
      "bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-3",
      className
    )}>
      <div className="flex items-center gap-4">
        {/* Total */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold leading-none">{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Reports</p>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Pending */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-sm font-medium">{stats.pending}</span>
        </div>

        {/* In Progress */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span className="text-sm font-medium">{stats.inProgress}</span>
        </div>

        {/* Resolved */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium">{stats.resolved}</span>
        </div>

        <div className="h-8 w-px bg-border" />

        {/* Resolution Rate */}
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">{resolvedPercent}%</span>
        </div>
      </div>
    </div>
  );
};

export default MapStats;
