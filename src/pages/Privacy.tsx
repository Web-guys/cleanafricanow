import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";

const Privacy = () => {
  const { t } = useTranslation();

  const sections = [
    { titleKey: 'pages.privacy.infoCollect', contentKey: 'pages.privacy.infoCollectContent' },
    { titleKey: 'pages.privacy.infoUse', contentKey: 'pages.privacy.infoUseContent' },
    { titleKey: 'pages.privacy.infoShare', contentKey: 'pages.privacy.infoShareContent' },
    { titleKey: 'pages.privacy.dataSecurity', contentKey: 'pages.privacy.dataSecurityContent' },
    { titleKey: 'pages.privacy.yourRights', contentKey: 'pages.privacy.yourRightsContent' },
    { titleKey: 'pages.privacy.dataRetention', contentKey: 'pages.privacy.dataRetentionContent' },
    { titleKey: 'pages.privacy.contactUs', contentKey: 'pages.privacy.contactUsContent' },
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
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('pages.privacy.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('pages.privacy.lastUpdated')}: December 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground mb-12">
              {t('pages.privacy.intro')}
            </p>
            
            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={index}>
                  <h2 className="text-2xl font-bold mb-4">{t(section.titleKey)}</h2>
                  <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                    {t(section.contentKey)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Privacy;
