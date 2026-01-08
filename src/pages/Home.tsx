import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, MapPin, Map, LogOut, User, TrendingUp, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { CommunityImpact } from "@/components/home/CommunityImpact";
import { FeaturedCities } from "@/components/home/FeaturedCities";
import { MobileNav } from "@/components/home/MobileNav";

const Home = () => {
  const { user, signOut, hasRole } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CleanAfricaNow
            </h1>
          </div>
          <nav className="hidden md:flex gap-4 items-center">
            <Button variant="ghost" asChild>
              <Link to="/">{t('nav.home')}</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/map">{t('nav.map')}</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/leaderboard">
                <Trophy className="mr-2 h-4 w-4" />
                Leaderboard
              </Link>
            </Button>
            {user ? (
              <>
                <Button asChild>
                  <Link to="/report">{t('nav.reportIssue')}</Link>
                </Button>
                {hasRole('admin') && (
                  <Button variant="outline" asChild>
                    <Link to="/admin">{t('nav.admin')}</Link>
                  </Button>
                )}
                {hasRole('municipality') && !hasRole('admin') && (
                  <Button variant="outline" asChild>
                    <Link to="/municipality">{t('nav.municipality', 'Municipality')}</Link>
                  </Button>
                )}
                {hasRole('ngo') && (
                  <Button variant="outline" asChild>
                    <Link to="/ngo">{t('nav.ngo', 'NGO Dashboard')}</Link>
                  </Button>
                )}
                <Button variant="ghost" size="icon" asChild>
                  <Link to="/profile">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link to="/auth">{t('nav.signIn')}</Link>
              </Button>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-glow to-secondary py-20 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              {t('hero.title')}
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-95">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link to="/report?category=waste">
                  <Trash2 className="mr-2 h-5 w-5" />
                  {t('hero.reportWaste')}
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link to="/report?category=pollution">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  {t('hero.reportPollution')}
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild className="shadow-lg hover:shadow-xl transition-all">
                <Link to="/report?category=danger">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  {t('hero.reportDanger')}
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 border-primary-foreground/20" asChild>
                <Link to="/map">
                  <Map className="mr-2 h-5 w-5" />
                  {t('hero.viewMap')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Impact Stats */}
      <CommunityImpact />

      {/* Featured Cities */}
      <FeaturedCities />

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">{t('howItWorks.title')}</h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">{t('howItWorks.step1Title')}</h4>
              <p className="text-muted-foreground">
                {t('howItWorks.step1Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">{t('howItWorks.step2Title')}</h4>
              <p className="text-muted-foreground">
                {t('howItWorks.step2Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-2">{t('howItWorks.step3Title')}</h4>
              <p className="text-muted-foreground">
                {t('howItWorks.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">{t('cta.title')}</h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('cta.subtitle')}
          </p>
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all">
            <Link to="/report">{t('cta.button')}</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
