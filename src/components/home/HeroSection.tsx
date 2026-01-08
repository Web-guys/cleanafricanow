import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Map, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

export const HeroSection = () => {
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ['hero-stats'],
    queryFn: async () => {
      const { count: reportsCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });
      
      const { count: resolvedCount } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved');
      
      const { count: citiesCount } = await supabase
        .from('cities')
        .select('*', { count: 'exact', head: true });

      return {
        reports: reportsCount || 0,
        resolved: resolvedCount || 0,
        cities: citiesCount || 0,
      };
    },
  });

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-secondary py-24 md:py-36">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_40%)]" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse delay-700" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-primary-foreground">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Environmental Reporting</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in leading-tight">
            {t('hero.title')}
          </h2>
          <p className="text-lg md:text-xl lg:text-2xl mb-10 opacity-95 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Button size="lg" variant="secondary" asChild className="shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg px-8">
              <Link to="/report?category=waste">
                <Trash2 className="mr-2 h-5 w-5" />
                {t('hero.reportWaste')}
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="shadow-lg hover:shadow-xl hover:scale-105 transition-all text-lg px-8">
              <Link to="/report?category=pollution">
                <AlertTriangle className="mr-2 h-5 w-5" />
                {t('hero.reportPollution')}
              </Link>
            </Button>
            <Button size="lg" className="bg-white/20 hover:bg-white/30 border-white/30 text-lg px-8" asChild>
              <Link to="/map">
                <Map className="mr-2 h-5 w-5" />
                {t('hero.viewMap')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">
                <AnimatedCounter end={stats?.reports || 0} suffix="+" />
              </p>
              <p className="text-sm opacity-80">Reports Filed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">
                <AnimatedCounter end={stats?.resolved || 0} suffix="+" />
              </p>
              <p className="text-sm opacity-80">Issues Resolved</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">
                <AnimatedCounter end={stats?.cities || 0} suffix="+" />
              </p>
              <p className="text-sm opacity-80">Cities Covered</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
