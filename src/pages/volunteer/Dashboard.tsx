import { Heart, Calendar, Trophy, TrendingUp, CheckCircle2, Clock, Star, Award, Target, MapPin, Camera, Users, Leaf, Eye, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import PlatformIntroCard from "@/components/dashboard/PlatformIntroCard";
import HowItWorksSection from "@/components/dashboard/HowItWorksSection";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";

interface EventRegistration {
  id: string;
  event_id: string;
  status: string;
  created_at: string;
  collection_events: {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
    location_name: string | null;
    status: string;
    cities: {
      name: string;
      country: string;
    } | null;
  } | null;
}

const BADGES = [
  { id: 'first_event', name: 'Premier Pas', description: 'Participer à votre premier événement', icon: Star, requirement: 1, color: 'bg-amber-500' },
  { id: 'five_events', name: 'Engagé', description: 'Participer à 5 événements', icon: Award, requirement: 5, color: 'bg-blue-500' },
  { id: 'ten_events', name: 'Champion Vert', description: 'Participer à 10 événements', icon: Trophy, requirement: 10, color: 'bg-green-500' },
  { id: 'twenty_events', name: 'Légende', description: 'Participer à 20 événements', icon: Target, requirement: 20, color: 'bg-purple-500' },
];

const VolunteerDashboard = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [showIntro, setShowIntro] = useState(() => {
    return localStorage.getItem('citizen-intro-dismissed') !== 'true';
  });

  const dismissIntro = () => {
    setShowIntro(false);
    localStorage.setItem('citizen-intro-dismissed', 'true');
  };

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['volunteer-registrations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          id,
          event_id,
          status,
          created_at,
          collection_events(
            id,
            title,
            description,
            event_date,
            location_name,
            status,
            cities(name, country)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as EventRegistration[];
    },
    enabled: !!user
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_events')
        .select('*, cities(name, country)')
        .gte('event_date', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('event_date', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data || [];
    }
  });

  const pastEvents = registrations?.filter(
    r => r.collection_events && isPast(new Date(r.collection_events.event_date)) && r.status === 'approved'
  ) || [];

  const upcomingRegistrations = registrations?.filter(
    r => r.collection_events && isFuture(new Date(r.collection_events.event_date))
  ) || [];

  const pendingRegistrations = registrations?.filter(r => r.status === 'pending') || [];
  const approvedCount = registrations?.filter(r => r.status === 'approved').length || 0;

  // Calculate earned badges
  const earnedBadges = BADGES.filter(badge => pastEvents.length >= badge.requirement);
  const nextBadge = BADGES.find(badge => pastEvents.length < badge.requirement);
  const progressToNext = nextBadge ? (pastEvents.length / nextBadge.requirement) * 100 : 100;

  const statsData = [
    {
      title: 'Événements Participés',
      value: pastEvents.length,
      icon: CheckCircle2,
      color: 'success' as const,
      subtitle: 'Événements complétés',
    },
    {
      title: 'À Venir',
      value: upcomingRegistrations.length,
      icon: Calendar,
      color: 'primary' as const,
      subtitle: 'Inscriptions actives',
    },
    {
      title: 'En Attente',
      value: pendingRegistrations.length,
      icon: Clock,
      color: 'warning' as const,
      subtitle: 'En attente d\'approbation',
    },
    {
      title: 'Badges Gagnés',
      value: earnedBadges.length,
      icon: Trophy,
      color: 'secondary' as const,
      subtitle: `${BADGES.length} disponibles`,
    },
  ];

  const introFeatures = [
    {
      icon: <Camera className="h-5 w-5 text-purple-500" />,
      title: t('citizen.intro.feature1Title', 'Report Issues'),
      description: t('citizen.intro.feature1Desc', 'Spot pollution, waste, or environmental hazards? Report them instantly with photos and location.')
    },
    {
      icon: <MapPin className="h-5 w-5 text-purple-500" />,
      title: t('citizen.intro.feature2Title', 'Track Progress'),
      description: t('citizen.intro.feature2Desc', 'Follow your reports on the map and get notified when they\'re being addressed.')
    },
    {
      icon: <Calendar className="h-5 w-5 text-purple-500" />,
      title: t('citizen.intro.feature3Title', 'Join Events'),
      description: t('citizen.intro.feature3Desc', 'Participate in community cleanup events organized in your city.')
    },
    {
      icon: <Trophy className="h-5 w-5 text-purple-500" />,
      title: t('citizen.intro.feature4Title', 'Earn Recognition'),
      description: t('citizen.intro.feature4Desc', 'Collect badges and climb the leaderboard as you contribute to a cleaner environment.')
    },
    {
      icon: <Users className="h-5 w-5 text-purple-500" />,
      title: t('citizen.intro.feature5Title', 'Community Impact'),
      description: t('citizen.intro.feature5Desc', 'Join thousands of citizens making a real difference in their communities.')
    },
    {
      icon: <Leaf className="h-5 w-5 text-purple-500" />,
      title: t('citizen.intro.feature6Title', 'Environmental Awareness'),
      description: t('citizen.intro.feature6Desc', 'Learn about environmental issues and best practices for sustainable living.')
    }
  ];

  const introBenefits = [
    { text: t('citizen.intro.benefit1', 'Direct impact on your community\'s cleanliness') },
    { text: t('citizen.intro.benefit2', 'Real-time updates on issue resolution') },
    { text: t('citizen.intro.benefit3', 'Connect with like-minded citizens') },
    { text: t('citizen.intro.benefit4', 'Free and easy to use') },
    { text: t('citizen.intro.benefit5', 'Your voice matters to authorities') },
    { text: t('citizen.intro.benefit6', 'Contribute to a cleaner Africa') }
  ];

  const howItWorksSteps = [
    {
      number: 1,
      icon: <Eye className="h-4 w-4" />,
      title: t('citizen.intro.step1Title', 'Spot a Problem'),
      description: t('citizen.intro.step1Desc', 'See illegal dumping, pollution, or environmental hazards in your neighborhood.')
    },
    {
      number: 2,
      icon: <Camera className="h-4 w-4" />,
      title: t('citizen.intro.step2Title', 'Take a Photo'),
      description: t('citizen.intro.step2Desc', 'Capture the issue with your phone. The app automatically records your location.')
    },
    {
      number: 3,
      icon: <Zap className="h-4 w-4" />,
      title: t('citizen.intro.step3Title', 'Submit Report'),
      description: t('citizen.intro.step3Desc', 'Add a description and submit. It\'s sent instantly to the relevant authorities.')
    },
    {
      number: 4,
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: t('citizen.intro.step4Title', 'See Results'),
      description: t('citizen.intro.step4Desc', 'Track your report\'s progress and get notified when it\'s resolved. You made a difference!')
    }
  ];

  return (
    <DashboardLayout 
      title={t('citizen.dashboard.title', 'Citizen Dashboard')}
      icon={<Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />}
      role="volunteer"
    >
      <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden">
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
              role="citizen"
              title={t('citizen.intro.title', 'Be the Change You Want to See')}
              subtitle={t('citizen.intro.subtitle', 'For Citizens')}
              description={t('citizen.intro.description', 'CleanAfricaNow empowers you to report environmental issues directly to authorities. Your reports create real change in your community. Join thousands of active citizens making Africa cleaner, one report at a time.')}
              features={introFeatures}
              benefits={introBenefits}
            />
            <div className="mt-4">
              <HowItWorksSection steps={howItWorksSteps} />
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{t('common.welcome', 'Welcome')}</p>
                <h2 className="text-2xl font-bold">{profile?.full_name || t('citizen.dashboard.citizen', 'Citizen')}</h2>
                <p className="text-sm text-muted-foreground">
                  {pastEvents.length > 0 
                    ? t('citizen.dashboard.thanksParticipation', 'Thank you for your {{count}} participation(s)!', { count: pastEvents.length })
                    : t('citizen.dashboard.readyToMakeDifference', 'Ready to make a difference?')
                  }
                </p>
              </div>
              <Link to="/events">
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('citizen.dashboard.viewEvents', 'View Events')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <StatsGrid stats={statsData} />

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Vos Badges
            </CardTitle>
            <CardDescription>
              {nextBadge 
                ? `Plus que ${nextBadge.requirement - pastEvents.length} événement(s) pour débloquer "${nextBadge.name}"`
                : 'Félicitations ! Vous avez tous les badges !'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nextBadge && (
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progrès vers "{nextBadge.name}"</span>
                  <span>{pastEvents.length}/{nextBadge.requirement}</span>
                </div>
                <Progress value={progressToNext} className="h-2" />
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {BADGES.map((badge) => {
                const earned = pastEvents.length >= badge.requirement;
                const BadgeIcon = badge.icon;
                return (
                  <div 
                    key={badge.id}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      earned 
                        ? 'border-primary bg-primary/5' 
                        : 'border-dashed border-muted-foreground/30 opacity-50'
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      earned ? badge.color : 'bg-muted'
                    }`}>
                      <BadgeIcon className={`h-6 w-6 ${earned ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <p className="font-semibold text-sm">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Events Tabs */}
        <Tabs defaultValue="upcoming" className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-2">
            <TabsList className="inline-flex w-max min-w-full md:grid md:w-full md:grid-cols-3 gap-1">
              <TabsTrigger value="upcoming" className="flex items-center gap-2 px-3 py-2 whitespace-nowrap">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="text-xs md:text-sm">À Venir ({upcomingRegistrations.length})</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 px-3 py-2 whitespace-nowrap">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-xs md:text-sm">Historique ({pastEvents.length})</span>
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex items-center gap-2 px-3 py-2 whitespace-nowrap">
                <TrendingUp className="h-4 w-4 shrink-0" />
                <span className="text-xs md:text-sm">Découvrir</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Vos Prochains Événements</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingRegistrations.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucun événement à venir.</p>
                    <Link to="/events">
                      <Button variant="outline" className="mt-4">
                        Découvrir les événements
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingRegistrations.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div>
                          <h4 className="font-semibold">{reg.collection_events?.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reg.collection_events?.event_date && format(new Date(reg.collection_events.event_date), 'PPP', { locale: fr })}
                            {reg.collection_events?.location_name && ` • ${reg.collection_events.location_name}`}
                          </p>
                        </div>
                        <Badge variant={reg.status === 'approved' ? 'default' : 'secondary'}>
                          {reg.status === 'approved' ? 'Confirmé' : 'En attente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des Participations</CardTitle>
              </CardHeader>
              <CardContent>
                {pastEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucune participation pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastEvents.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div>
                          <h4 className="font-semibold">{reg.collection_events?.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reg.collection_events?.event_date && format(new Date(reg.collection_events.event_date), 'PPP', { locale: fr })}
                            {reg.collection_events?.cities && ` • ${reg.collection_events.cities.name}`}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Participé
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discover">
            <Card>
              <CardHeader>
                <CardTitle>Événements Disponibles</CardTitle>
                <CardDescription>Inscrivez-vous à un événement près de chez vous</CardDescription>
              </CardHeader>
              <CardContent>
                {!upcomingEvents || upcomingEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Aucun événement disponible pour le moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.event_date), 'PPP', { locale: fr })}
                            {event.cities && ` • ${event.cities.name}`}
                          </p>
                        </div>
                        <Link to="/events">
                          <Button size="sm">S'inscrire</Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default VolunteerDashboard;
