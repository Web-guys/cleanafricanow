import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Globe, Users, TreePine, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";
import logo from "@/assets/cleanafricanow-logo.svg";

const tiers = [
  {
    name: "Supporter",
    amount: "$5",
    period: "one-time",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    benefits: [
      "Support 1 community cleanup",
      "Recognition on our wall of supporters",
      "Monthly impact newsletter",
    ],
  },
  {
    name: "Champion",
    amount: "$25",
    period: "monthly",
    icon: Users,
    color: "from-primary to-secondary",
    featured: true,
    benefits: [
      "Fund waste bin installations",
      "Support local cleanup teams",
      "Quarterly impact report",
      "Champion badge on your profile",
    ],
  },
  {
    name: "Guardian",
    amount: "$100",
    period: "monthly",
    icon: Globe,
    color: "from-emerald-500 to-teal-500",
    benefits: [
      "Sponsor a city's waste management",
      "Direct impact dashboard",
      "Name on sponsored bin plaques",
      "Annual impact certificate",
      "Priority support",
    ],
  },
];

const impactStats = [
  { value: "12,500+", label: "Tons of waste collected", icon: TreePine },
  { value: "85+", label: "Communities served", icon: Globe },
  { value: "50,000+", label: "Citizens engaged", icon: Users },
  { value: "200+", label: "Bins installed", icon: Heart },
];

const Donate = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      <SEOHead
        title="Donate - CleanAfricaNow"
        description="Support cleaner communities across Africa. Your donation funds waste management infrastructure, cleanup events, and community engagement."
      />

      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="CleanAfricaNow" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CleanAfricaNow
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6 border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">
              {t('donate.badge', 'Every Contribution Matters')}
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent">
            {t('donate.title', 'Donate to the Network')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t('donate.subtitle', 'Your generosity powers cleaner streets, healthier communities, and a greener future across Africa.')}
          </p>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {impactStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Tiers */}
      <section className="py-20" ref={ref}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-foreground">
            {t('donate.chooseLevel', 'Choose Your Impact Level')}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
            {t('donate.chooseDescription', 'Select a donation tier that works for you. Every amount makes a difference.')}
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {tiers.map((tier, index) => (
              <Card
                key={tier.name}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:scale-105 hover:-translate-y-2 opacity-0",
                  tier.featured && "ring-2 ring-primary shadow-xl shadow-primary/10",
                  isVisible && "animate-scale-in"
                )}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {tier.featured && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-center text-xs font-semibold py-1.5">
                    {t('donate.mostPopular', 'Most Popular')}
                  </div>
                )}
                <CardContent className={cn("p-8", tier.featured && "pt-10")}>
                  <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6", tier.color)}>
                    <tier.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-foreground">{tier.amount}</span>
                    <span className="text-muted-foreground">/{tier.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full group",
                      tier.featured ? "bg-gradient-to-r from-primary to-secondary hover:opacity-90" : ""
                    )}
                    variant={tier.featured ? "default" : "outline"}
                    size="lg"
                  >
                    {t('donate.donateNow', 'Donate Now')}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Custom Amount */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            {t('donate.customTitle', 'Prefer a Custom Amount?')}
          </h3>
          <p className="text-muted-foreground mb-8">
            {t('donate.customDescription', 'Contact us directly to arrange a custom donation or corporate sponsorship.')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="mailto:Cleanafricanow@gmail.com">
                {t('donate.contactUs', 'Contact Us')}
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/about">
                {t('donate.learnMore', 'Learn More About Us')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Donate;
