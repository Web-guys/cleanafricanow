import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Bell, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";

const features = [
  { icon: Smartphone, label: "Mobile-First Design" },
  { icon: Bell, label: "Real-time Notifications" },
  { icon: BarChart3, label: "Impact Analytics" },
];

export const CTASection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(var(--primary),0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl md:text-5xl font-bold mb-6">{t('cta.title')}</h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {features.map((feature) => (
              <div 
                key={feature.label}
                className="flex items-center gap-2 bg-card px-4 py-2 rounded-full border shadow-sm"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg px-8">
              <Link to="/report">
                {t('cta.button')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8">
              <Link to="/leaderboard">
                View Leaderboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
