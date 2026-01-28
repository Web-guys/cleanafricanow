import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const FeaturedCities = () => {
  const { t } = useTranslation();

  const { data: cities } = useQuery({
    queryKey: ["featured-cities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("is_featured", true)
        .order("name")
        .limit(8);

      if (error) throw error;
      return data;
    },
  });

  if (!cities?.length) return null;

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            {t('cities.featured', 'Cities We Cover')}
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('cities.featuredDesc', 'Report environmental issues in major Moroccan cities')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {cities.map((city) => (
            <Link key={city.id} to={`/map?city=${city.id}`}>
              <Card className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm md:text-base">{city.name}</p>
                    <p className="text-xs text-muted-foreground">{city.country}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 flex flex-wrap gap-4 justify-center">
          <Link 
            to="/map" 
            className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2"
          >
            {t('cities.viewAll', 'View all cities on map')}
            <span>→</span>
          </Link>
          <span className="text-muted-foreground">|</span>
          <Link 
            to="/cities-map" 
            className="text-primary hover:text-primary/80 font-medium inline-flex items-center gap-2"
          >
            Explore all {cities.length}+ Moroccan cities
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
