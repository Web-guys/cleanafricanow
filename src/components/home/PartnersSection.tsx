import { Building2, Globe, Leaf, Shield, Award, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const partners = [
  { name: "Ministry of Environment", icon: Building2, color: "group-hover:text-blue-500" },
  { name: "UNEP Africa", icon: Globe, color: "group-hover:text-green-500" },
  { name: "Green Morocco Initiative", icon: Leaf, color: "group-hover:text-emerald-500" },
  { name: "Smart Cities Morocco", icon: Shield, color: "group-hover:text-purple-500" },
  { name: "African Union", icon: Award, color: "group-hover:text-amber-500" },
  { name: "Community Leaders", icon: Users, color: "group-hover:text-cyan-500" },
];

export const PartnersSection = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-16 bg-muted/30 dark:bg-muted/10 border-b border-border" ref={ref}>
      <div className="container mx-auto px-4">
        <p className={cn(
          "text-center text-sm font-medium text-muted-foreground mb-10 uppercase tracking-wider opacity-0",
          isVisible && "animate-fade-in"
        )}>
          {t('partners.title', 'Trusted by Organizations Across Africa')}
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 lg:gap-16">
          {partners.map((partner, index) => (
            <div 
              key={partner.name}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group cursor-default opacity-0",
                "hover:bg-card hover:shadow-lg hover:-translate-y-1",
                isVisible && "animate-fade-in"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <partner.icon className={cn(
                "h-8 w-8 text-muted-foreground transition-colors duration-300",
                partner.color
              )} />
              <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors hidden sm:inline">
                {partner.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
