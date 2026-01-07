import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Phone, FileText, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Support = () => {
  const { t } = useTranslation();

  const faqs = [
    { questionKey: 'pages.support.faq1Q', answerKey: 'pages.support.faq1A' },
    { questionKey: 'pages.support.faq2Q', answerKey: 'pages.support.faq2A' },
    { questionKey: 'pages.support.faq3Q', answerKey: 'pages.support.faq3A' },
    { questionKey: 'pages.support.faq4Q', answerKey: 'pages.support.faq4A' },
    { questionKey: 'pages.support.faq5Q', answerKey: 'pages.support.faq5A' },
    { questionKey: 'pages.support.faq6Q', answerKey: 'pages.support.faq6A' },
  ];

  const contactMethods = [
    {
      icon: Mail,
      titleKey: 'pages.support.emailSupport',
      descriptionKey: 'pages.support.emailSupportDesc',
      action: "support@cleanafricanow.com",
      href: "mailto:support@cleanafricanow.com",
    },
    {
      icon: MessageCircle,
      titleKey: 'pages.support.liveChat',
      descriptionKey: 'pages.support.liveChatDesc',
      actionKey: 'pages.support.startChat',
      href: "#",
    },
    {
      icon: Phone,
      titleKey: 'pages.support.phoneSupport',
      descriptionKey: 'pages.support.phoneSupportDesc',
      action: "+212 123 456 789",
      href: "tel:+212123456789",
    },
  ];

  const resources = [
    { icon: FileText, titleKey: 'footer.documentation', descriptionKey: 'pages.docs.gettingStartedDesc', href: "/docs" },
    { icon: Users, titleKey: 'footer.community', descriptionKey: 'pages.community.forumsDesc', href: "/community" },
    { icon: Zap, titleKey: 'pages.docs.quickStart', descriptionKey: 'pages.docs.gettingStartedDesc', href: "/docs" },
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
            <HelpCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t('pages.support.title')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('pages.support.subtitle')}
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('contact.info.title')}</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                className="bg-card rounded-xl p-6 border border-border/40 hover:shadow-lg transition-all hover:border-primary/40 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <method.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t(method.titleKey)}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t(method.descriptionKey)}</p>
                <span className="text-primary font-medium">
                  {method.actionKey ? t(method.actionKey) : method.action}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.support.faq')}</h2>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-background rounded-xl border border-border/40 px-6"
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {t(faq.questionKey)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t(faq.answerKey)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pages.support.helpfulResources')}</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {resources.map((resource, index) => (
              <Link
                key={index}
                to={resource.href}
                className="bg-card rounded-xl p-6 border border-border/40 hover:shadow-lg transition-all hover:border-primary/40 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <resource.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{t(resource.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(resource.descriptionKey)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Support;
