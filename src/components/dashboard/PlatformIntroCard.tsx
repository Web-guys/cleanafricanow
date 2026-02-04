import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

interface Benefit {
  text: string;
}

interface PlatformIntroCardProps {
  role: 'municipality' | 'ngo' | 'citizen' | 'tourist';
  title: string;
  subtitle: string;
  description: string;
  features: Feature[];
  benefits: Benefit[];
  className?: string;
}

const roleGradients = {
  municipality: "from-blue-500/10 via-primary/5 to-transparent",
  ngo: "from-emerald-500/10 via-green-500/5 to-transparent",
  citizen: "from-purple-500/10 via-violet-500/5 to-transparent",
  tourist: "from-amber-500/10 via-orange-500/5 to-transparent",
};

const roleBorderColors = {
  municipality: "border-blue-500/30",
  ngo: "border-emerald-500/30",
  citizen: "border-purple-500/30",
  tourist: "border-amber-500/30",
};

const PlatformIntroCard = ({
  role,
  title,
  subtitle,
  description,
  features,
  benefits,
  className,
}: PlatformIntroCardProps) => {
  const { t } = useTranslation();

  return (
    <Card className={cn(
      "relative overflow-hidden border-2",
      roleBorderColors[role],
      className
    )}>
      {/* Decorative gradient background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br pointer-events-none",
        roleGradients[role]
      )} />
      
      {/* Moroccan decorative pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" fill="currentColor" />
        </svg>
      </div>

      <CardHeader className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-moroccan-gold" />
          <Badge variant="secondary" className="text-xs">
            {subtitle}
          </Badge>
        </div>
        <CardTitle className="text-xl lg:text-2xl">{title}</CardTitle>
        <CardDescription className="text-base mt-2 leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-6">
        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="p-4 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                {feature.icon}
              </div>
              <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" />
            {t('dashboard.keyBenefits', 'Key Benefits')}
          </h4>
          <ul className="grid sm:grid-cols-2 gap-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{benefit.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlatformIntroCard;
