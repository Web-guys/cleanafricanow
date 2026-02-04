import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Bell, BarChart3, Shield, Zap, Globe, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const features = [
  { icon: Smartphone, label: "Mobile-First" },
  { icon: Bell, label: "Real-time Alerts" },
  { icon: BarChart3, label: "Impact Analytics" },
  { icon: Shield, label: "Secure & Private" },
  { icon: Zap, label: "AI-Powered" },
  { icon: Globe, label: "Multi-language" },
];

const benefits = [
  "Free to use for all citizens",
  "Track your environmental impact",
  "Connect with your community",
  "Make a real difference",
];

export const CTASection = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="relative py-32 overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary" />
      
      {/* Animated Patterns */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '0.5s' }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className={cn(
              "text-primary-foreground text-center lg:text-left opacity-0",
              isVisible && "animate-slide-in-left"
            )}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-5 py-2 rounded-full mb-8 border border-white/20">
                <Zap className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-semibold">Join the Movement</span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {t('cta.title', 'Ready to Make an Impact?')}
              </h2>
              <p className="text-xl md:text-2xl text-primary-foreground/85 mb-8 max-w-xl">
                {t('cta.subtitle', 'Every report counts. Join thousands of citizens working towards cleaner communities across Africa.')}
              </p>

              {/* Benefits List */}
              <ul className="space-y-3 mb-10">
                {benefits.map((benefit, index) => (
                  <li 
                    key={benefit}
                    className={cn(
                      "flex items-center gap-3 text-primary-foreground/90 opacity-0",
                      isVisible && "animate-fade-in"
                    )}
                    style={{ animationDelay: `${300 + index * 100}ms` }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-white/80 flex-shrink-0" />
                    <span className="font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-white/25 hover:scale-105 transition-all text-lg h-14 px-10 font-semibold group"
                  asChild
                >
                  <Link to="/report">
                    {t('cta.button', 'Submit Your First Report')}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-transparent border-2 border-white/40 text-white hover:bg-white/10 backdrop-blur-sm text-lg h-14 px-10"
                  asChild
                >
                  <Link to="/leaderboard">
                    View Leaderboard
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Content - Feature Cards */}
            <div className={cn(
              "opacity-0",
              isVisible && "animate-slide-in-right"
            )}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                  <div 
                    key={feature.label}
                    className={cn(
                      "bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 group opacity-0",
                      isVisible && "animate-scale-in"
                    )}
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <feature.icon className="h-8 w-8 text-white mb-3 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-semibold text-white">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className={cn(
            "mt-20 pt-12 border-t border-white/20 text-center opacity-0",
            isVisible && "animate-fade-in"
          )} style={{ animationDelay: "800ms" }}>
            <p className="text-sm text-primary-foreground/60 mb-6">Trusted by communities across</p>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-primary-foreground/90">
              {["🇲🇦 Morocco", "🇳🇬 Nigeria", "🇰🇪 Kenya", "🇿🇦 South Africa", "🇪🇬 Egypt"].map((country) => (
                <span key={country} className="font-semibold text-lg hover:scale-110 transition-transform cursor-default">
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
