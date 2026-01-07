import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Users, MessageCircle, Calendar, Award, MapPin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Community = () => {
  const { t } = useTranslation();

  const stats = [
    { labelKey: 'pages.community.activeMembers', value: "12,500+" },
    { labelKey: 'pages.community.reportsFiled', value: "45,000+" },
    { labelKey: 'pages.community.citiesCovered', value: "120+" },
    { labelKey: 'pages.community.countries', value: "15" },
  ];

  const events = [
    {
      titleKey: 'pages.community.event1Title',
      dateKey: 'pages.community.event1Date',
      location: "Casablanca Beach",
      attendees: 45,
    },
    {
      titleKey: 'pages.community.event2Title',
      dateKey: 'pages.community.event2Date',
      location: "Lagos Tech Hub",
      attendees: 120,
    },
    {
      titleKey: 'pages.community.event3Title',
      dateKey: 'pages.community.event3Date',
      location: "Karura Forest",
      attendees: 200,
    },
  ];

  const topContributors = [
    { name: "Sarah M.", reports: 156, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
    { name: "Ahmed K.", reports: 142, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
    { name: "Fatima B.", reports: 128, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
    { name: "Joseph N.", reports: 115, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
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
            <Users className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('pages.community.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('pages.community.subtitle')}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Contributors */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-12">
            <Award className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">{t('pages.community.topContributors')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {topContributors.map((contributor, index) => (
              <div
                key={index}
                className="bg-background rounded-xl p-6 border border-border/40 text-center hover:shadow-lg transition-shadow"
              >
                <Avatar className="w-16 h-16 mx-auto mb-4 ring-4 ring-primary/10">
                  <AvatarImage src={contributor.avatar} alt={contributor.name} />
                  <AvatarFallback>{contributor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <h3 className="font-semibold">{contributor.name}</h3>
                <p className="text-sm text-muted-foreground">{contributor.reports} {t('pages.community.reports')}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 mb-12">
            <Calendar className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold">{t('pages.community.upcomingEvents')}</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {events.map((event, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 border border-border/40 hover:shadow-lg transition-all hover:border-primary/40"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{t(event.titleKey)}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {t(event.dateKey)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event.attendees} {t('pages.community.attending')}
                      </span>
                    </div>
                  </div>
                  <Button>{t('pages.community.joinEvent')}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Community CTA */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <Heart className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">{t('pages.community.bePartOf')}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('pages.community.bePartOfDesc')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth">
              <Button size="lg">{t('pages.community.joinNow')}</Button>
            </Link>
            <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                {t('pages.community.joinDiscord')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Community;
