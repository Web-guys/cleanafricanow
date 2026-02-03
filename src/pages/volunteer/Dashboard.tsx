import { Heart, Calendar, Trophy, TrendingUp, CheckCircle2, Clock, Star, Award, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isPast, isFuture } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

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

  return (
    <DashboardLayout 
      title="Espace Bénévole" 
      icon={<Heart className="h-6 w-6 text-primary" />}
      role="ngo" // Use ngo layout as base
    >
      <div className="p-4 lg:p-8 space-y-8">
        {/* Welcome Banner */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Bienvenue</p>
                <h2 className="text-2xl font-bold">{profile?.full_name || 'Bénévole'}</h2>
                <p className="text-sm text-muted-foreground">
                  {pastEvents.length > 0 
                    ? `Merci pour vos ${pastEvents.length} participation(s) !`
                    : 'Prêt à faire la différence ?'
                  }
                </p>
              </div>
              <Link to="/events">
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Voir les Événements
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              À Venir ({upcomingRegistrations.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Historique ({pastEvents.length})
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Découvrir
            </TabsTrigger>
          </TabsList>

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
