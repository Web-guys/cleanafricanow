import { MapPin, Camera, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const steps = [
  {
    number: "01",
    icon: MapPin,
    titleKey: "howItWorks.step1Title",
    descKey: "howItWorks.step1Desc",
    color: "from-primary to-primary-glow",
    bgColor: "bg-primary/10",
    detail: "GPS auto-detection or manual pin drop",
  },
  {
    number: "02",
    icon: Camera,
    titleKey: "howItWorks.step2Title",
    descKey: "howItWorks.step2Desc",
    color: "from-orange-500 to-amber-500",
    bgColor: "bg-orange-500/10",
    detail: "AI automatically categorizes your report",
  },
  {
    number: "03",
    icon: TrendingUp,
    titleKey: "howItWorks.step3Title",
    descKey: "howItWorks.step3Desc",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-500/10",
    detail: "Authorities are notified instantly",
  },
  {
    number: "04",
    icon: CheckCircle2,
    titleKey: "howItWorks.step4Title",
    descKey: "howItWorks.step4Desc",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-500/10",
    detail: "Get notified when issue is resolved",
  },
];

export const HowItWorksSection = () => {
  const { t } = useTranslation();
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section className="py-24 bg-gradient-to-b from-background via-muted/30 to-background dark:from-background dark:via-muted/10 dark:to-background overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <span className="text-sm font-semibold text-primary">Simple Process</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">{t('howItWorks.title', 'How It Works')}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('howItWorks.subtitle', 'Report environmental issues in just a few steps and track their resolution')}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative max-w-6xl mx-auto">
          {/* Connection Line - Desktop */}
          <div className="hidden lg:block absolute top-32 left-[12%] right-[12%] h-1 bg-gradient-to-r from-primary via-orange-500 via-blue-500 to-green-500 rounded-full opacity-20" />
          <div className="hidden lg:block absolute top-32 left-[12%] h-1 bg-gradient-to-r from-primary via-orange-500 via-blue-500 to-green-500 rounded-full transition-all duration-500" 
            style={{ width: hoveredStep !== null ? `${(hoveredStep + 1) * 25}%` : '0%' }} 
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="relative group"
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Card */}
                <div className={`relative bg-card rounded-3xl p-8 border-2 transition-all duration-500 h-full
                  ${hoveredStep === index ? 'border-primary shadow-2xl shadow-primary/10 -translate-y-2' : 'border-border/50 hover:border-primary/30'}
                `}>
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 left-8">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`w-20 h-20 ${step.bgColor} rounded-2xl flex items-center justify-center mb-6 mt-4 group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className={`w-10 h-10 bg-gradient-to-br ${step.color} bg-clip-text text-transparent`} 
                      style={{ 
                        stroke: 'url(#gradient-' + index + ')',
                        strokeWidth: 2,
                        fill: 'none'
                      }} 
                    />
                    <svg width="0" height="0">
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={index === 0 ? 'hsl(var(--primary))' : index === 1 ? '#f97316' : index === 2 ? '#3b82f6' : '#22c55e'} />
                          <stop offset="100%" stopColor={index === 0 ? 'hsl(var(--primary-glow))' : index === 1 ? '#f59e0b' : index === 2 ? '#06b6d4' : '#10b981'} />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3">{t(step.titleKey, `Step ${index + 1}`)}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {t(step.descKey, 'Description')}
                  </p>

                  {/* Detail Tag */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${step.bgColor}`}>
                    <span>{step.detail}</span>
                  </div>

                  {/* Arrow for Desktop */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <div className={`w-6 h-6 rounded-full bg-card border-2 border-border flex items-center justify-center transition-all duration-300 ${hoveredStep === index ? 'border-primary bg-primary text-white' : ''}`}>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">Ready to make a difference?</p>
          <a 
            href="/report" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-semibold hover:shadow-xl hover:shadow-primary/20 hover:scale-105 transition-all"
          >
            Start Your First Report
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    </section>
  );
};