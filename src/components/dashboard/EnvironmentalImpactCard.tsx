import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf, Droplets, Wind, TreePine, Trash2, Factory } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImpactMetric {
  label: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

interface EnvironmentalImpactCardProps {
  resolvedReports: number;
  wasteCollected?: number; // in kg
  co2Prevented?: number; // in kg
  waterProtected?: number; // in liters
}

export const EnvironmentalImpactCard = ({
  resolvedReports,
  wasteCollected = resolvedReports * 15, // Estimate 15kg avg per report
  co2Prevented = resolvedReports * 8, // Estimate 8kg CO2 prevented per cleanup
  waterProtected = resolvedReports * 500, // Estimate 500L water protected
}: EnvironmentalImpactCardProps) => {
  const metrics: ImpactMetric[] = [
    {
      label: "Waste Collected",
      value: wasteCollected,
      unit: "kg",
      icon: Trash2,
      color: "text-green-500",
      description: "Estimated waste cleaned up",
    },
    {
      label: "CO₂ Prevented",
      value: co2Prevented,
      unit: "kg",
      icon: Factory,
      color: "text-blue-500",
      description: "Greenhouse gases avoided",
    },
    {
      label: "Water Protected",
      value: waterProtected,
      unit: "L",
      icon: Droplets,
      color: "text-cyan-500",
      description: "Clean water preserved",
    },
    {
      label: "Trees Equivalent",
      value: Math.round(co2Prevented / 21), // 1 tree absorbs ~21kg CO2/year
      unit: "trees",
      icon: TreePine,
      color: "text-emerald-500",
      description: "Annual carbon absorption",
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-green-500/10 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Leaf className="h-5 w-5 text-primary" />
          Environmental Impact Score
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Impact Score Circle */}
        <div className="flex justify-center mb-8">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeDasharray={`${Math.min(resolvedReports * 2.64, 264)} 264`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-primary">{Math.min(resolvedReports, 100)}</span>
              <span className="text-xs text-muted-foreground">Impact Score</span>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div 
                key={index}
                className="bg-muted/50 rounded-xl p-4 text-center hover:bg-muted/80 transition-colors"
              >
                <Icon className={cn("h-6 w-6 mx-auto mb-2", metric.color)} />
                <div className="text-2xl font-bold">
                  {metric.value >= 1000 
                    ? `${(metric.value / 1000).toFixed(1)}k` 
                    : metric.value.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {metric.unit}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {metric.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sustainability Message */}
        <div className="mt-6 p-4 bg-primary/5 rounded-xl text-center">
          <p className="text-sm text-muted-foreground">
            🌍 Your actions have helped make <strong className="text-primary">Africa cleaner</strong>!
            <br />
            <span className="text-xs">Based on {resolvedReports} resolved environmental reports</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};