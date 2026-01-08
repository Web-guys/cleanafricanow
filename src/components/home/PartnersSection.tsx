import { Building2, Globe, Leaf, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

const partners = [
  { name: "Ministry of Environment", icon: Building2 },
  { name: "UNEP Africa", icon: Globe },
  { name: "Green Morocco Initiative", icon: Leaf },
  { name: "Smart Cities Morocco", icon: Shield },
];

export const PartnersSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-background border-y border-border">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm font-medium text-muted-foreground mb-8 uppercase tracking-wider">
          {t('partners.title', 'Trusted by Organizations Across Africa')}
        </p>
        
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {partners.map((partner) => (
            <div 
              key={partner.name}
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <partner.icon className="h-8 w-8 group-hover:text-primary transition-colors" />
              <span className="font-semibold text-lg hidden sm:inline">{partner.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
