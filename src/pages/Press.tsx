import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Newspaper, Download, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";

const Press = () => {
  const { t } = useTranslation();

  const pressReleases = [
    {
      titleKey: 'pages.press.release1Title',
      date: "December 2024",
      summaryKey: 'pages.press.release1Summary',
    },
    {
      titleKey: 'pages.press.release2Title',
      date: "November 2024",
      summaryKey: 'pages.press.release2Summary',
    },
    {
      titleKey: 'pages.press.release3Title',
      date: "October 2024",
      summaryKey: 'pages.press.release3Summary',
    },
  ];

  const mediaKit = [
    { nameKey: 'pages.press.brandGuidelines', type: "PDF", size: "2.4 MB" },
    { nameKey: 'pages.press.logoPack', type: "ZIP", size: "1.8 MB" },
    { nameKey: 'pages.press.executiveBios', type: "PDF", size: "500 KB" },
    { nameKey: 'pages.press.screenshots', type: "ZIP", size: "5.2 MB" },
  ];

  const coverage = [
    { outlet: "TechCrunch", titleKey: 'pages.press.coverage1Title', date: "Dec 2024" },
    { outlet: "BBC Africa", titleKey: 'pages.press.coverage2Title', date: "Nov 2024" },
    { outlet: "The Guardian", titleKey: 'pages.press.coverage3Title', date: "Oct 2024" },
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
            <Newspaper className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('pages.press.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('pages.press.subtitle')}
          </p>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.press.pressReleases')}</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {pressReleases.map((release, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 border border-border/40 hover:shadow-lg transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{release.date}</p>
                    <h3 className="text-lg font-semibold mb-2">{t(release.titleKey)}</h3>
                    <p className="text-muted-foreground">{t(release.summaryKey)}</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
                    <Download className="w-4 h-4" />
                    {t('pages.press.download')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Kit */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.press.mediaKit')}</h2>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {mediaKit.map((item, index) => (
              <div
                key={index}
                className="bg-background rounded-xl p-6 border border-border/40 hover:border-primary/40 transition-all flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold">{t(item.nameKey)}</h3>
                  <p className="text-sm text-muted-foreground">{item.type} • {item.size}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Download className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Coverage */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.press.recentCoverage')}</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {coverage.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-xl p-6 border border-border/40 hover:shadow-lg transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary mb-1">{item.outlet}</p>
                    <h3 className="font-semibold">{t(item.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">{t('pages.press.mediaContact')}</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('pages.press.mediaContactDesc')}
          </p>
          <a href="mailto:press@cleanafricanow.com">
            <Button size="lg" className="gap-2">
              <Mail className="w-4 h-4" />
              press@cleanafricanow.com
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Press;
