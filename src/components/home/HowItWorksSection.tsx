import { MapPin, Camera, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const steps = [
  {
    number: "01",
    icon: MapPin,
    titleKey: "howItWorks.step1Title",
    descKey: "howItWorks.step1Desc",
    color: "from-primary to-primary-glow",
    bgColor: "bg-primary/10",
    iconColor: "text-primary",
    detail: "GPS auto-detection or manual pin drop",
  },
  {
    number: "02",
    icon: Camera,
    titleKey: "howItWorks.step2Title",
    descKey: "howItWorks.step2Desc",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
    iconColor: "text-orange-500",
    detail: "AI automatically categorizes your report",
  },
  {
    number: "03",
    icon: TrendingUp,
    titleKey: "howItWorks.step3Title",
    descKey: "howItWorks.step3Desc",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
    detail: "Authorities are notified instantly",
  },
  {
    number: "04",
    icon: CheckCircle2,
    titleKey: "howItWorks.step4Title",
    descKey: "howItWorks.step4Desc",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    iconColor: "text-green-500",
    detail: "Get notified when issue is resolved",
  },
];

export const HowItWorksSection = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-background via-muted/30 to-background dark:from-background dark:via-muted/10 dark:to-background overflow-hidden relative">
      {/* Background decorations */}
      <div className="absolute top-1/3 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        {/* Header */}
        <div className={cn(
          "text-center mb-20 opacity-0",
          isVisible && "animate-fade-in"
        )}>
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm font-semibold text-primary">{t('howItWorks.badge', 'Simple Process')}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">{t('howItWorks.title', 'How It Works')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('howItWorks.subtitle', 'Report environmental issues in just a few steps and track their resolution')}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative max-w-6xl mx-auto">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-32 left-[12%] right-[12%] h-1 bg-gradient-to-r from-primary via-orange-500 via-60% via-blue-500 to-green-500 rounded-full opacity-20" />
          <div 
            className="hidden lg:block absolute top-32 left-[12%] h-1 bg-gradient-to-r from-primary via-orange-500 via-blue-500 to-green-500 rounded-full transition-all duration-700 ease-out" 
            style={{ width: hoveredStep !== null ? `${((hoveredStep + 1) / 4) * 76}%` : '0%' }} 
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className={cn(
                  "relative group opacity-0",
                  isVisible && "animate-slide-up"
                )}
                style={{ animationDelay: `${200 + index * 150}ms` }}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Card */}
                <div className={cn(
                  "relative bg-card rounded-3xl p-8 border-2 transition-all duration-500 h-full",
                  hoveredStep === index 
                    ? "border-primary shadow-2xl shadow-primary/10 -translate-y-3" 
                    : "border-border/50 hover:border-primary/30"
                )}>
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 left-8">
                    <div className={cn(
                      "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold shadow-lg transition-transform group-hover:scale-110",
                      step.color
                    )}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mt-4 transition-all duration-300 group-hover:scale-110",
                    step.bgColor
                  )}>
                    <step.icon className={cn("w-10 h-10", step.iconColor)} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-foreground">{t(step.titleKey, `Step ${index + 1}`)}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {t(step.descKey, 'Description')}
                  </p>

                  {/* Detail Tag */}
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                    step.bgColor, step.iconColor
                  )}>
                    <span>{step.detail}</span>
                  </div>

                  {/* Arrow for Desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <div className={cn(
                        "w-7 h-7 rounded-full bg-card border-2 flex items-center justify-center transition-all duration-300",
                        hoveredStep === index ? "border-primary bg-primary text-white scale-110" : "border-border text-muted-foreground"
                      )}>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className={cn(
          "text-center mt-16 opacity-0",
          isVisible && "animate-fade-in"
        )} style={{ animationDelay: "800ms" }}>
          <p className="text-muted-foreground mb-4">{t('howItWorks.readyCta', 'Ready to make a difference?')}</p>
          <Link 
            to="/report" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-primary/20 hover:scale-105 transition-all group"
          >
            {t('howItWorks.startReport', 'Start Your First Report')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
};
