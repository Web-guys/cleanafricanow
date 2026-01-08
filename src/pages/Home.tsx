import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User, Trophy } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { CommunityImpact } from "@/components/home/CommunityImpact";
import { FeaturedCities } from "@/components/home/FeaturedCities";
import { MobileNav } from "@/components/home/MobileNav";
import { HeroSection } from "@/components/home/HeroSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { PartnersSection } from "@/components/home/PartnersSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { CTASection } from "@/components/home/CTASection";
import logo from "@/assets/cleanafricanow-logo.png";

const Home = () => {
  const { user, signOut, hasRole } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="CleanAfricaNow" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CleanAfricaNow
            </h1>
          </Link>
          <nav className="hidden md:flex gap-2 items-center">
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
      <HeroSection />

      {/* Partners */}
      <PartnersSection />

      {/* Community Impact Stats */}
      <CommunityImpact />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Featured Cities */}
      <FeaturedCities />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
