import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Clock, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";

const getEventBadge = (eventDate: Date) => {
  if (isToday(eventDate)) {
    return { label: "Today", variant: "destructive" as const };
  }
  if (isTomorrow(eventDate)) {
    return { label: "Tomorrow", variant: "default" as const };
  }
  if (isThisWeek(eventDate)) {
    return { label: "This Week", variant: "secondary" as const };
  }
  return null;
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case "cleanup":
      return "bg-success/10 text-success border-success/20";
    case "awareness":
      return "bg-info/10 text-info border-info/20";
    case "recycling":
      return "bg-warning/10 text-warning border-warning/20";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
};

const getEventTypeLabel = (type: string) => {
  switch (type) {
    case "cleanup":
      return "🧹 Cleanup";
    case "awareness":
      return "📢 Awareness";
    case "recycling":
      return "♻️ Recycling";
    case "collection":
      return "🚛 Collection";
    default:
      return "📅 Event";
  }
};

export const UpcomingEvents = () => {
  const { t } = useTranslation();

  const { data: events, isLoading } = useQuery({
    queryKey: ["upcoming-events-home"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("collection_events")
        .select(`
          id,
          title,
          description,
          event_date,
          end_date,
          location_name,
          event_type,
          max_participants,
          status,
          latitude,
          longitude,
          city_id,
          cities:city_id (name, country)
        `)
        .gte("event_date", now)
        .in("status", ["scheduled", "in_progress"])
        .order("event_date", { ascending: true })
        .limit(4);

      if (error) throw error;
      return data;
    },
  });

  // Get registrations count for each event
  const { data: registrationCounts } = useQuery({
    queryKey: ["event-registrations-count", events?.map(e => e.id)],
    queryFn: async () => {
      if (!events?.length) return {};
      
      const counts: Record<string, number> = {};
      for (const event of events) {
        const { count } = await supabase
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .eq("status", "approved");
        counts[event.id] = count || 0;
      }
      return counts;
    },
    enabled: !!events?.length,
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!events?.length) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-8 w-8 text-primary" />
            <h3 className="text-3xl md:text-4xl font-bold">
              {t("events.upcoming", "Upcoming Events")}
            </h3>
          </div>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("events.noUpcoming", "No upcoming events at the moment. Check back soon or organize your own cleanup event!")}
          </p>
          <Button asChild>
            <Link to="/events">
              {t("events.viewAll", "View All Events")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Join the movement</span>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Calendar className="h-8 w-8 text-primary" />
            <h3 className="text-3xl md:text-4xl font-bold">
              {t("events.upcoming", "Upcoming Events")}
            </h3>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("events.upcomingDesc", "Join community cleanup events and make a real difference in your neighborhood")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {events.map((event, index) => {
            const eventDate = new Date(event.event_date);
            const badge = getEventBadge(eventDate);
            const registrations = registrationCounts?.[event.id] || 0;
            const spotsLeft = event.max_participants ? event.max_participants - registrations : null;
            const city = event.cities as { name: string; country: string } | null;

            return (
              <Card 
                key={event.id} 
                className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-2 border-transparent hover:border-primary/20 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Event Type Header */}
                <div className={`px-4 py-3 ${getEventTypeColor(event.event_type)} border-b`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {getEventTypeLabel(event.event_type)}
                    </span>
                    {badge && (
                      <Badge variant={badge.variant} className="text-xs">
                        {badge.label}
                      </Badge>
                    )}
                  </div>
                </div>

                <CardContent className="p-4 space-y-3">
                  <h4 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {event.title}
                  </h4>

                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{format(eventDate, "MMM d, yyyy • HH:mm")}</span>
                    </div>

                    {(event.location_name || city) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {event.location_name || city?.name}
                          {city && !event.location_name && `, ${city.country}`}
                        </span>
                      </div>
                    )}

                    {event.max_participants && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span>
                          {registrations}/{event.max_participants} registered
                          {spotsLeft !== null && spotsLeft <= 10 && spotsLeft > 0 && (
                            <span className="text-warning ml-1">({spotsLeft} spots left)</span>
                          )}
                          {spotsLeft === 0 && (
                            <span className="text-destructive ml-1">(Full)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground" 
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link to={`/events?event=${event.id}`}>
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
            <Link to="/events">
              <Calendar className="mr-2 h-5 w-5" />
              {t("events.viewAll", "View All Events")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
