import { Compass, MapPin, Camera, Info, AlertTriangle, Globe, Map, Shield, Heart, Phone, Eye, CheckCircle2, Zap, Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import PlatformIntroCard from "@/components/dashboard/PlatformIntroCard";
import HowItWorksSection from "@/components/dashboard/HowItWorksSection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useState } from "react";

const TouristDashboard = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [showIntro, setShowIntro] = useState(() => {
    return localStorage.getItem('tourist-intro-dismissed') !== 'true';
  });

  const dismissIntro = () => {
    setShowIntro(false);
    localStorage.setItem('tourist-intro-dismissed', 'true');
  };

  const introFeatures = [
    {
      icon: <Camera className="h-5 w-5 text-amber-500" />,
      title: t('tourist.intro.feature1Title', 'Report While Traveling'),
      description: t('tourist.intro.feature1Desc', 'Noticed pollution at a beautiful beach or park? Report it to help protect the places you love.')
    },
    {
      icon: <Map className="h-5 w-5 text-amber-500" />,
      title: t('tourist.intro.feature2Title', 'Discover Clean Areas'),
      description: t('tourist.intro.feature2Desc', 'Use the map to find well-maintained areas and avoid polluted zones during your travels.')
    },
    {
      icon: <Shield className="h-5 w-5 text-amber-500" />,
      title: t('tourist.intro.feature3Title', 'Stay Safe'),
      description: t('tourist.intro.feature3Desc', 'View environmental hazards and warnings in your destination to plan safer trips.')
    },
    {
      icon: <Globe className="h-5 w-5 text-amber-500" />,
      title: t('tourist.intro.feature4Title', 'Multi-Language Support'),
      description: t('tourist.intro.feature4Desc', 'Available in English, French, Arabic, and Spanish for easy use anywhere.')
    },
    {
      icon: <Heart className="h-5 w-5 text-amber-500" />,
      title: t('tourist.intro.feature5Title', 'Support Local Communities'),
      description: t('tourist.intro.feature5Desc', 'Your reports help local communities maintain clean, healthy environments.')
    },
    {
      icon: <Info className="h-5 w-5 text-amber-500" />,
      title: t('tourist.intro.feature6Title', 'Learn About Issues'),
      description: t('tourist.intro.feature6Desc', 'Understand local environmental challenges and how you can help.')
    }
  ];

  const introBenefits = [
    { text: t('tourist.intro.benefit1', 'Help protect tourist destinations') },
    { text: t('tourist.intro.benefit2', 'Find clean beaches, parks, and nature spots') },
    { text: t('tourist.intro.benefit3', 'No account required for basic features') },
    { text: t('tourist.intro.benefit4', 'Available in multiple languages') },
    { text: t('tourist.intro.benefit5', 'Leave a positive impact on places you visit') },
    { text: t('tourist.intro.benefit6', 'Easy to use on mobile devices') }
  ];

  const howItWorksSteps = [
    {
      number: 1,
      icon: <Eye className="h-4 w-4" />,
      title: t('tourist.intro.step1Title', 'Explore the Map'),
      description: t('tourist.intro.step1Desc', 'View environmental conditions in your destination before or during your trip.')
    },
    {
      number: 2,
      icon: <Camera className="h-4 w-4" />,
      title: t('tourist.intro.step2Title', 'Report Issues'),
      description: t('tourist.intro.step2Desc', 'See pollution or waste? Take a photo and submit a quick report.')
    },
    {
      number: 3,
      icon: <Zap className="h-4 w-4" />,
      title: t('tourist.intro.step3Title', 'Help Local Authorities'),
      description: t('tourist.intro.step3Desc', 'Your report is sent to local authorities who can take action.')
    },
    {
      number: 4,
      icon: <Leaf className="h-4 w-4" />,
      title: t('tourist.intro.step4Title', 'Protect Natural Beauty'),
      description: t('tourist.intro.step4Desc', 'Contribute to preserving the beautiful places you visit for future travelers.')
    }
  ];

  const quickActions = [
    {
      icon: <Map className="h-6 w-6" />,
      title: t('tourist.actions.viewMap', 'Explore the Map'),
      description: t('tourist.actions.viewMapDesc', 'See environmental conditions across Africa'),
      to: '/map',
      color: 'bg-blue-500'
    },
    {
      icon: <Camera className="h-6 w-6" />,
      title: t('tourist.actions.report', 'Report an Issue'),
      description: t('tourist.actions.reportDesc', 'Help by reporting environmental problems'),
      to: '/report',
      color: 'bg-amber-500'
    },
    {
      icon: <Compass className="h-6 w-6" />,
      title: t('tourist.actions.cities', 'Browse Cities'),
      description: t('tourist.actions.citiesDesc', 'Discover cities and their environmental status'),
      to: '/cities',
      color: 'bg-emerald-500'
    }
  ];

  const safetyTips = [
    t('tourist.tips.tip1', 'Always check the map for environmental hazards before visiting remote areas.'),
    t('tourist.tips.tip2', 'Carry a bag for your waste when visiting beaches and natural areas.'),
    t('tourist.tips.tip3', 'Report pollution immediately - your input helps local communities.'),
    t('tourist.tips.tip4', 'Respect local environmental regulations and protected areas.')
  ];

  return (
    <DashboardLayout 
      title={t('tourist.dashboard.title', 'Tourist Information')}
      icon={<Compass className="h-6 w-6 text-primary" />}
      role="tourist"
    >
      <div className="p-4 lg:p-8 space-y-6 overflow-x-hidden">
        {/* Platform Introduction */}
        {showIntro && (
          <div className="relative">
            <button 
              onClick={dismissIntro}
              className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground text-sm underline"
            >
              {t('common.dismiss', 'Dismiss')}
            </button>
            <PlatformIntroCard
              role="tourist"
              title={t('tourist.intro.title', 'Travel Responsibly, Report Easily')}
              subtitle={t('tourist.intro.subtitle', 'For Tourists & Visitors')}
              description={t('tourist.intro.description', 'CleanAfricaNow helps you explore Africa while contributing to environmental protection. Find clean destinations, report issues you encounter, and help preserve the natural beauty of the places you visit. Together, we can keep Africa beautiful for generations to come.')}
              features={introFeatures}
              benefits={introBenefits}
            />
            <div className="mt-4">
              <HowItWorksSection steps={howItWorksSteps} />
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <Card className="border-2 border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-transparent overflow-hidden relative">
          {/* Decorative compass */}
          <div className="absolute -right-8 -top-8 w-32 h-32 opacity-10">
            <Compass className="w-full h-full text-amber-500" />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                <Compass className="h-7 w-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {t('tourist.dashboard.visitor', 'Visitor')}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold">{t('tourist.dashboard.welcomeTitle', 'Welcome to Africa!')}</h2>
                <p className="text-muted-foreground mt-1">
                  {t('tourist.dashboard.welcomeSubtitle', 'Help us keep the beautiful places you visit clean and safe for everyone.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.to}>
              <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/30">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${action.color} text-white flex items-center justify-center mb-4`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Safety Tips */}
        <Card className="border-emerald-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-500" />
              {t('tourist.dashboard.safetyTips', 'Eco-Friendly Travel Tips')}
            </CardTitle>
            <CardDescription>
              {t('tourist.dashboard.safetyTipsDesc', 'Simple ways to protect the environment during your travels')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {safetyTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Emergency Info */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('tourist.dashboard.emergency', 'Emergency Information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('tourist.dashboard.emergencyDesc', 'If you encounter a serious environmental emergency (toxic spills, fires, etc.), contact local authorities immediately.')}
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border">
                <Phone className="h-4 w-4 text-destructive" />
                <span className="font-mono font-semibold">190</span>
                <span className="text-xs text-muted-foreground">{t('tourist.dashboard.civilProtection', 'Civil Protection')}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg border">
                <Phone className="h-4 w-4 text-destructive" />
                <span className="font-mono font-semibold">15</span>
                <span className="text-xs text-muted-foreground">{t('tourist.dashboard.ambulance', 'Ambulance')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2">{t('tourist.dashboard.ctaTitle', 'Ready to Help?')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('tourist.dashboard.ctaDesc', 'Every report makes a difference. Help us keep Africa clean and beautiful.')}
            </p>
            <Link to="/report">
              <Button size="lg" className="gap-2">
                <Camera className="h-4 w-4" />
                {t('tourist.dashboard.ctaButton', 'Report an Issue')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TouristDashboard;
