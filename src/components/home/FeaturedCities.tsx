import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const LoadingSkeleton = () => (
  <section className="py-20 bg-gradient-to-b from-background via-muted/20 to-background">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <Skeleton className="h-8 w-40 mx-auto mb-4" />
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-px w-full mb-2" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export const FeaturedCities = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();

  const { data: cities, isLoading } = useQuery({
    queryKey: ["featured-cities-optimized"],
    queryFn: async () => {
      // Fetch featured cities
      const { data: citiesData, error } = await supabase
        .from("cities")
        .select("*")
        .eq("is_featured", true)
        .order("name")
        .limit(8);

      if (error) throw error;
      if (!citiesData?.length) return [];

      // Get all city IDs for a single batch query
      const cityIds = citiesData.map(c => c.id);
      
      // Fetch all report counts in a single query using group by
      const { data: reportCounts } = await supabase
        .from("reports_public")
        .select("city_id")
        .in("city_id", cityIds);

      // Count reports per city from the result
      const countMap = (reportCounts || []).reduce((acc, r) => {
        acc[r.city_id] = (acc[r.city_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return citiesData.map(city => ({
        ...city,
        reportCount: countMap[city.id] || 0
      }));
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) return <LoadingSkeleton />;
  if (!cities?.length) return null;

  // Sort by report count for visual hierarchy
  const sortedCities = [...cities].sort((a, b) => (b.reportCount || 0) - (a.reportCount || 0));
  const topCity = sortedCities[0];

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className={cn(
          "text-center mb-12 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">{t('cities.activeCoverage', 'Active Coverage')}</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cities.featured', 'Cities We Cover')}
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('cities.featuredDesc', 'Report environmental issues in major Moroccan cities')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {sortedCities.map((city, index) => {
            const isTop = city.id === topCity?.id;
            
            return (
              <Link 
                key={city.id} 
                to={`/map?city=${city.id}`}
                className={cn(
                  "transition-all duration-500",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: isVisible ? `${index * 75}ms` : '0ms' }}
              >
                <Card className={cn(
                  "group relative overflow-hidden transition-all duration-300 cursor-pointer h-full",
                  "hover:shadow-xl hover:-translate-y-2",
                  "border-2",
                  isTop 
                    ? "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent" 
                    : "border-transparent hover:border-primary/20"
                )}>
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  
                  {isTop && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-primary/90 text-primary-foreground text-[10px] px-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        {t('cities.mostActive', 'Most Active')}
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4 flex flex-col gap-3 relative">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                        "group-hover:scale-110",
                        isTop ? "bg-primary text-primary-foreground" : "bg-primary/10"
                      )}>
                        <MapPin className={cn("w-6 h-6", !isTop && "text-primary")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm md:text-base truncate group-hover:text-primary transition-colors">
                          {city.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{city.country}</p>
                      </div>
                    </div>
                    
                    {/* Report count */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{city.reportCount} {t('cities.reports', 'reports')}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className={cn(
          "text-center mt-10 transition-all duration-700 delay-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <Link 
              to="/map" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
            >
              {t('cities.viewAll', 'View all cities on map')}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <span className="text-muted-foreground hidden sm:inline">|</span>
            <Link 
              to="/cities-map" 
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
            >
              {t('cities.exploreAll', 'Explore all {{count}}+ cities', { count: cities.length })}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
