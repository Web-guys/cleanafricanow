import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  icon: ReactNode;
  title: string;
  description: string;
}

interface HowItWorksSectionProps {
  steps: Step[];
  title?: string;
  className?: string;
}

const HowItWorksSection = ({ steps, title, className }: HowItWorksSectionProps) => {
  const { t } = useTranslation();

  return (
    <Card className={cn("border-primary/10", className)}>
      <CardHeader>
        <CardTitle className="text-lg">
          {title || t('dashboard.howItWorks', 'How It Works')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 hidden sm:block" />
          
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 relative">
                {/* Step number */}
                <div className="relative z-10 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-lg">
                  <span className="font-bold">{step.number}</span>
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-primary">
                      {step.icon}
                    </div>
                    <h4 className="font-semibold">{step.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorksSection;
