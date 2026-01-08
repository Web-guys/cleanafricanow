import { MapPin, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const steps = [
  {
    number: "01",
    icon: MapPin,
    titleKey: "howItWorks.step1Title",
    descKey: "howItWorks.step1Desc",
    color: "bg-primary",
  },
  {
    number: "02",
    icon: AlertTriangle,
    titleKey: "howItWorks.step2Title",
    descKey: "howItWorks.step2Desc",
    color: "bg-warning",
  },
  {
    number: "03",
    icon: TrendingUp,
    titleKey: "howItWorks.step3Title",
    descKey: "howItWorks.step3Desc",
    color: "bg-info",
  },
  {
    number: "04",
    icon: CheckCircle2,
    titleKey: "howItWorks.step4Title",
    descKey: "howItWorks.step4Desc",
    color: "bg-success",
  },
];

export const HowItWorksSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">{t('howItWorks.title')}</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('howItWorks.subtitle', 'Report environmental issues in just a few steps and track their resolution')}
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="hidden md:block absolute top-24 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary via-warning via-info to-success" />

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number} 
                className="relative text-center group"
              >
                {/* Step Number */}
                <div className={`w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform relative z-10`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>

                {/* Step Label */}
                <span className="inline-block text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full mb-3">
                  STEP {step.number}
                </span>

                <h4 className="text-xl font-semibold mb-2">{t(step.titleKey)}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t(step.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
