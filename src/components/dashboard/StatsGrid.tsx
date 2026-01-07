import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: 'primary' | 'warning' | 'info' | 'success' | 'destructive' | 'secondary';
  subtitle?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

const colorClasses = {
  primary: {
    border: 'border-primary/30',
    bg: 'bg-primary/10',
    text: 'text-primary',
    icon: 'text-primary',
  },
  warning: {
    border: 'border-warning/30',
    bg: 'bg-warning/10',
    text: 'text-warning',
    icon: 'text-warning',
  },
  info: {
    border: 'border-info/30',
    bg: 'bg-info/10',
    text: 'text-info',
    icon: 'text-info',
  },
  success: {
    border: 'border-success/30',
    bg: 'bg-success/10',
    text: 'text-success',
    icon: 'text-success',
  },
  destructive: {
    border: 'border-destructive/30',
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    icon: 'text-destructive',
  },
  secondary: {
    border: 'border-secondary/30',
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    icon: 'text-secondary',
  },
};

export const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: StatCardProps) => {
  const colors = colorClasses[color];
  
  return (
    <Card className={cn("border-2 hover:shadow-lg transition-all duration-300", colors.border)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-3xl lg:text-4xl font-bold", colors.text)}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs font-medium",
                trend.positive ? "text-success" : "text-destructive"
              )}>
                {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}% from last week
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", colors.bg)}>
            <Icon className={cn("h-6 w-6", colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface StatsGridProps {
  stats: StatCardProps[];
}

export const StatsGrid = ({ stats }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};
