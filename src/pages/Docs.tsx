import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, BookOpen, FileText, HelpCircle, Code, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";

const Docs = () => {
  const { t } = useTranslation();

  const sections = [
    {
      icon: FileText,
      titleKey: 'pages.docs.gettingStarted',
      descriptionKey: 'pages.docs.gettingStartedDesc',
      links: [
        { key: 'pages.docs.createAccount' },
        { key: 'pages.docs.submitReport' },
        { key: 'pages.docs.trackStatus' },
      ],
    },
    {
      icon: HelpCircle,
      titleKey: 'pages.support.faq',
      descriptionKey: 'pages.support.faqDesc',
      links: [
        { key: 'pages.docs.whatCanReport' },
        { key: 'pages.docs.howHandled' },
        { key: 'pages.docs.privacyData' },
      ],
    },
    {
      icon: Code,
      titleKey: 'pages.docs.api',
      descriptionKey: 'pages.docs.apiDesc',
      links: [
        { key: 'pages.docs.authentication' },
        { key: 'pages.docs.endpoints' },
        { key: 'pages.docs.rateLimits' },
      ],
    },
    {
      icon: Shield,
      titleKey: 'pages.docs.bestPractices',
      descriptionKey: 'pages.docs.bestPracticesDesc',
      links: [
        { key: 'pages.docs.takingPhotos' },
        { key: 'pages.docs.writingDesc' },
        { key: 'pages.docs.locationAccuracy' },
      ],
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
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('pages.docs.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('pages.docs.subtitle')}
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 md:p-12 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-primary" />
              <h2 className="text-2xl font-bold">{t('pages.docs.quickStart')}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-background/50 rounded-xl p-6">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">1</div>
                <h3 className="font-semibold mb-2">{t('pages.docs.step1Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('pages.docs.step1Desc')}</p>
              </div>
              <div className="bg-background/50 rounded-xl p-6">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">2</div>
                <h3 className="font-semibold mb-2">{t('pages.docs.step2Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('pages.docs.step2Desc')}</p>
              </div>
              <div className="bg-background/50 rounded-xl p-6">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-4">3</div>
                <h3 className="font-semibold mb-2">{t('pages.docs.step3Title')}</h3>
                <p className="text-sm text-muted-foreground">{t('pages.docs.step3Desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.docs.browseDocs')}</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {sections.map((section, index) => (
              <div
                key={index}
                className="bg-background rounded-xl p-6 border border-border/40 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <section.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{t(section.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{t(section.descriptionKey)}</p>
                    <ul className="space-y-2">
                      {section.links.map((link, linkIndex) => (
                        <li key={linkIndex}>
                          <a href="#" className="text-sm text-primary hover:underline">
                            {t(link.key)}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('pages.docs.needHelp')}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('pages.docs.needHelpDesc')}
          </p>
          <Link to="/support">
            <Button size="lg">{t('pages.support.contactSupport')}</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Docs;
