import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Briefcase, MapPin, Clock, Heart, Leaf, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";

const Careers = () => {
  const { t } = useTranslation();

  const benefits = [
    { icon: Heart, titleKey: 'pages.careers.benefit1', descKey: 'pages.careers.benefit1Desc' },
    { icon: Leaf, titleKey: 'pages.careers.benefit2', descKey: 'pages.careers.benefit2Desc' },
    { icon: Users, titleKey: 'pages.careers.benefit3', descKey: 'pages.careers.benefit3Desc' },
    { icon: Zap, titleKey: 'pages.careers.benefit4', descKey: 'pages.careers.benefit4Desc' },
  ];

  const openings = [
    {
      titleKey: 'pages.careers.job1Title',
      departmentKey: 'pages.careers.job1Dept',
      location: "Remote (Africa)",
      type: "Full-time",
    },
    {
      titleKey: 'pages.careers.job2Title',
      departmentKey: 'pages.careers.job2Dept',
      location: "Casablanca, Morocco",
      type: "Full-time",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CleanAfricaNow
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Briefcase className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('pages.careers.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('pages.careers.subtitle')}
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.careers.whyJoin')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 border border-border/40 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t(benefit.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(benefit.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.careers.openPositions')}</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {openings.map((job, index) => (
              <div
                key={index}
                className="bg-background rounded-xl p-6 border border-border/40 hover:shadow-lg transition-all hover:border-primary/40"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t(job.titleKey)}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant="secondary">{t(job.departmentKey)}</Badge>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <Button>{t('pages.careers.applyNow')}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('pages.careers.noPosition')}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('pages.careers.noPositionDesc')}
          </p>
          <a href="mailto:careers@cleanafricanow.com">
            <Button size="lg" variant="outline">
              {t('pages.careers.sendResume')}
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
