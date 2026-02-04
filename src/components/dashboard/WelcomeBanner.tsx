import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeBannerProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  location?: string;
  locationCountry?: string;
  badges?: Array<{ label: string; variant?: "default" | "secondary" | "outline" }>;
  gradient?: "primary" | "success" | "warning" | "info";
  showSparkle?: boolean;
}

export const WelcomeBanner = ({
  icon,
  title,
  subtitle,
  location,
  locationCountry,
  badges,
  gradient = "primary",
  showSparkle = true,
}: WelcomeBannerProps) => {
  const gradientClasses = {
    primary: "from-primary/10 via-primary/5 to-transparent border-primary/20",
    success: "from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/20",
    warning: "from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20",
    info: "from-blue-500/10 via-blue-500/5 to-transparent border-blue-500/20",
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 bg-gradient-to-r",
      gradientClasses[gradient]
    )}>
      {showSparkle && (
        <div className="absolute top-4 right-4 animate-pulse">
          <Sparkles className="h-5 w-5 text-primary/40" />
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            {subtitle && (
              <p className="text-sm text-muted-foreground mb-0.5">{subtitle}</p>
            )}
            <h2 className="text-2xl font-bold truncate">{title}</h2>
            {location && (
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  {location}{locationCountry && `, ${locationCountry}`}
                </span>
              </div>
            )}
            {badges && badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {badges.map((badge, idx) => (
                  <Badge 
                    key={idx} 
                    variant={badge.variant || "secondary"}
                    className="px-3 py-1"
                  >
                    {badge.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
