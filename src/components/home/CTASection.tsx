import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Smartphone, Bell, BarChart3, Shield, Zap, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const features = [
  { icon: Smartphone, label: "Mobile-First", color: "text-blue-500" },
  { icon: Bell, label: "Real-time Alerts", color: "text-orange-500" },
  { icon: BarChart3, label: "Impact Analytics", color: "text-green-500" },
  { icon: Shield, label: "Secure & Private", color: "text-purple-500" },
  { icon: Zap, label: "AI-Powered", color: "text-yellow-500" },
  { icon: Globe, label: "Multi-language", color: "text-cyan-500" },
];

export const CTASection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary" />
      
      {/* Animated Patterns */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
      </div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto text-primary-foreground">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-5 py-2 rounded-full mb-8 border border-white/20">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-semibold">Join the Movement</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {t('cta.title', 'Ready to Make an Impact?')}
          </h2>
          <p className="text-xl md:text-2xl text-primary-foreground/85 mb-12 max-w-2xl mx-auto">
            {t('cta.subtitle', 'Every report counts. Join thousands of citizens working towards cleaner communities across Africa.')}
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((feature) => (
              <div 
                key={feature.label}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-full border border-white/20 hover:bg-white/20 transition-colors"
              >
                <feature.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-white/25 hover:scale-105 transition-all text-lg h-14 px-10 font-semibold"
              asChild
            >
              <Link to="/report">
                {t('cta.button', 'Submit Your First Report')}
                <ArrowRight className="ml-2 h-5 w-5" />
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

          {/* Trust Indicators */}
          <div className="mt-16 pt-12 border-t border-white/20">
            <p className="text-sm text-primary-foreground/60 mb-6">Trusted by communities across</p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-primary-foreground/80">
              <span className="font-semibold">🇲🇦 Morocco</span>
              <span className="font-semibold">🇳🇬 Nigeria</span>
              <span className="font-semibold">🇰🇪 Kenya</span>
              <span className="font-semibold">🇿🇦 South Africa</span>
              <span className="font-semibold">🇪🇬 Egypt</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};