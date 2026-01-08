import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Map, ArrowRight, Sparkles, Zap, TrendingUp } from "lucide-react";
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
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
};

const FloatingCard = ({ children, className = "", delay = "0s" }: { children: React.ReactNode; className?: string; delay?: string }) => (
  <div 
    className={`absolute bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-border p-4 animate-fade-in ${className}`}
    style={{ animationDelay: delay }}
  >
    {children}
  </div>
);

export const HeroSection = () => {
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ['hero-stats'],
    queryFn: async () => {
      const { count: reportsCount } = await supabase
        .from('reports_public')
        .select('*', { count: 'exact', head: true });
      
      const { count: resolvedCount } = await supabase
        .from('reports_public')
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
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/30 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-glow/20 rounded-full blur-[200px]" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-primary-foreground">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full mb-8 border border-white/20 animate-fade-in">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold">AI-Powered Environmental Platform</span>
              <Sparkles className="h-4 w-4 text-yellow-300" />
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] animate-fade-in" style={{ animationDelay: '100ms' }}>
              {t('hero.title', 'Report. Track. Impact.')}
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 text-primary-foreground/85 max-w-xl animate-fade-in" style={{ animationDelay: '200ms' }}>
              {t('hero.subtitle', 'Join thousands making Africa cleaner, one report at a time. Your voice matters.')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-2xl hover:shadow-white/25 hover:scale-105 transition-all text-lg h-14 px-8 font-semibold"
                asChild
              >
                <Link to="/report">
                  <Zap className="mr-2 h-5 w-5" />
                  Start Reporting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm text-lg h-14 px-8"
                asChild
              >
                <Link to="/map">
                  <Map className="mr-2 h-5 w-5" />
                  Explore Map
                </Link>
              </Button>
            </div>

            {/* Quick Report Buttons */}
            <div className="flex flex-wrap gap-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <span className="text-sm text-primary-foreground/60 self-center mr-2">Quick report:</span>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                asChild
              >
                <Link to="/report?category=waste">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Waste
                </Link>
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                asChild
              >
                <Link to="/report?category=pollution">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Pollution
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Content - Floating Stats Cards */}
          <div className="relative h-[500px] hidden lg:block">
            {/* Main Stats Card */}
            <FloatingCard className="top-8 right-0 w-72" delay="200ms">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-3xl font-bold text-foreground">
                    <AnimatedCounter end={stats?.reports || 0} suffix="+" />
                  </p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full animate-pulse" style={{ width: '75%' }} />
              </div>
            </FloatingCard>

            {/* Resolved Card */}
            <FloatingCard className="top-40 left-0 w-64" delay="400ms">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issues Resolved</p>
                  <p className="text-2xl font-bold text-foreground">
                    <AnimatedCounter end={stats?.resolved || 0} />
                  </p>
                </div>
              </div>
            </FloatingCard>

            {/* Cities Card */}
            <FloatingCard className="bottom-32 right-12 w-56" delay="600ms">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Map className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cities Covered</p>
                  <p className="text-2xl font-bold text-foreground">
                    <AnimatedCounter end={stats?.cities || 0} suffix="+" />
                  </p>
                </div>
              </div>
            </FloatingCard>

            {/* Live Activity Indicator */}
            <FloatingCard className="bottom-8 left-8" delay="800ms">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                </div>
                <span className="text-sm font-medium text-foreground">Live updates enabled</span>
              </div>
            </FloatingCard>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/10 rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-white/5 rounded-full" />
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-auto fill-background">
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,64C960,75,1056,85,1152,80C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" />
        </svg>
      </div>
    </section>
  );
};