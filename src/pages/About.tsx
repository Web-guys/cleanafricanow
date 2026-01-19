import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead, pageSEO } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Target, Heart, Leaf, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { MobileNav } from "@/components/home/MobileNav";
import logo from "@/assets/cleanafricanow-logo.png";

const About = () => {
  const { t } = useTranslation();

const teamMembers = [
  {
    name: "Nabil Laaziri",
    role: t("about.team.roleFounder"),
    image: "https://api.dicebear.com/9.x/personas/svg?seed=Nabil&backgroundColor=b6e3f4,c0aede,d1d4f9"
  },
  {
    name: "El Idrissi S.",
    role: t("about.team.roleTech"),
    image: "https://api.dicebear.com/9.x/personas/svg?seed=Idrissi&backgroundColor=b6e3f4,c0aede,d1d4f9"
  }
];
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead {...pageSEO.about} />
      <StructuredData type="Organization" />
      
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.back')}
              </Link>
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="CleanAfricaNow" className="w-10 h-10 object-contain" />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CleanAfricaNow
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('about.hero.title')}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('about.hero.subtitle')}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.mission.title')}</h3>
                <p className="text-muted-foreground">{t('about.mission.description')}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Leaf className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.vision.title')}</h3>
                <p className="text-muted-foreground">{t('about.vision.description')}</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t('about.values.title')}</h3>
                <p className="text-muted-foreground">{t('about.values.description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">{t('about.impact.title')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">500+</p>
              <p className="text-muted-foreground mt-2">{t('about.impact.reports')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">10+</p>
              <p className="text-muted-foreground mt-2">{t('about.impact.cities')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">1000+</p>
              <p className="text-muted-foreground mt-2">{t('about.impact.users')}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-primary">5</p>
              <p className="text-muted-foreground mt-2">{t('about.impact.countries')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">{t('about.team.title')}</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {teamMembers.map((member) => (
              <Card key={member.name} className="text-center">
                <CardContent className="pt-6">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-24 h-24 rounded-full mx-auto mb-4 bg-muted"
                  />
                  <h4 className="font-semibold">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">{t('about.cta.title')}</h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">{t('about.cta.subtitle')}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <Link to="/report">{t('nav.reportIssue')}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/contact">{t('nav.contact')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
