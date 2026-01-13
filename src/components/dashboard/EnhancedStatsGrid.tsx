import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  progress?: {
    current: number;
    max: number;
  };
}

interface EnhancedStatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

const colorClasses = {
  primary: {
    icon: 'text-primary',
    bg: 'bg-primary/10',
    progress: 'bg-primary',
  },
  success: {
    icon: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    progress: 'bg-green-500',
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    progress: 'bg-amber-500',
  },
  destructive: {
    icon: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    progress: 'bg-red-500',
  },
  info: {
    icon: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    progress: 'bg-blue-500',
  },
};

export const EnhancedStatsGrid = ({ stats, columns = 4 }: EnhancedStatsGridProps) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns])}>
      {stats.map((stat, index) => {
        const colors = colorClasses[stat.color];
        const Icon = stat.icon;
        const TrendIcon = stat.trend 
          ? stat.trend.value > 0 
            ? TrendingUp 
            : stat.trend.value < 0 
              ? TrendingDown 
              : Minus
          : null;

        return (
          <Card 
            key={index} 
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50"
          >
            {/* Background Gradient */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              colors.bg
            )} />
            
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight">
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </span>
                    {stat.trend && TrendIcon && (
                      <span className={cn(
                        "flex items-center gap-0.5 text-xs font-medium",
                        stat.trend.value > 0 ? "text-red-500" : stat.trend.value < 0 ? "text-green-500" : "text-muted-foreground"
                      )}>
                        <TrendIcon className="h-3 w-3" />
                        {Math.abs(stat.trend.value)}%
                      </span>
                    )}
                  </div>
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">
                      {stat.subtitle}
                    </p>
                  )}
                  {stat.progress && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {Math.round((stat.progress.current / stat.progress.max) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", colors.progress)}
                          style={{ width: `${(stat.progress.current / stat.progress.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  colors.bg
                )}>
                  <Icon className={cn("h-6 w-6", colors.icon)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};