import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Users, Clock, ArrowRight, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, isToday, isTomorrow, isThisWeek } from "date-fns";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

const getEventBadge = (eventDate: Date) => {
  if (isToday(eventDate)) {
    return { label: "Today", variant: "destructive" as const, icon: Zap };
  }
  if (isTomorrow(eventDate)) {
    return { label: "Tomorrow", variant: "default" as const, icon: null };
  }
  if (isThisWeek(eventDate)) {
    return { label: "This Week", variant: "secondary" as const, icon: null };
  }
  return null;
};

const getEventTypeStyle = (type: string) => {
  switch (type) {
    case "cleanup":
      return { bg: "bg-success/10", text: "text-success", border: "border-success/20", icon: "🧹", gradient: "from-success/20 to-success/5" };
    case "awareness":
      return { bg: "bg-info/10", text: "text-info", border: "border-info/20", icon: "📢", gradient: "from-info/20 to-info/5" };
    case "recycling":
      return { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20", icon: "♻️", gradient: "from-warning/20 to-warning/5" };
    case "collection":
      return { bg: "bg-primary/10", text: "text-primary", border: "border-primary/20", icon: "🚛", gradient: "from-primary/20 to-primary/5" };
    default:
      return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", icon: "📅", gradient: "from-muted to-muted/50" };
  }
};

export const UpcomingEvents = () => {
  const { t } = useTranslation();
  const { ref, isVisible } = useScrollAnimation();

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

  const { data: registrationCounts } = useQuery({
    queryKey: ["event-registrations-count", events?.map(e => e.id)],
    queryFn: async () => {
      if (!events?.length) return {};
      
      const eventIds = events.map(e => e.id);
      
      // Fetch all registrations in a single query
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select("event_id")
        .in("event_id", eventIds)
        .eq("status", "approved");
      
      // Count registrations per event
      const counts = (registrations || []).reduce((acc, r) => {
        acc[r.event_id] = (acc[r.event_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return counts;
    },
    enabled: !!events?.length,
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-10 w-72 bg-muted rounded-lg mx-auto" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 bg-muted rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!events?.length) {
    return (
      <section className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-3">
              {t("events.upcoming", "Upcoming Events")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("events.noUpcoming", "No upcoming events at the moment. Check back soon!")}
            </p>
            <Button asChild size="lg">
              <Link to="/events">
                {t("events.viewAll", "View All Events")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-muted/30 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className={cn(
          "text-center mb-14 opacity-0",
          isVisible && "animate-fade-in"
        )}>
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Join the movement</span>
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            {t("events.upcoming", "Upcoming Events")}
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("events.upcomingDesc", "Join community cleanup events and make a real difference in your neighborhood")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {events.map((event, index) => {
            const eventDate = new Date(event.event_date);
            const badge = getEventBadge(eventDate);
            const style = getEventTypeStyle(event.event_type);
            const registrations = registrationCounts?.[event.id] || 0;
            const spotsLeft = event.max_participants ? event.max_participants - registrations : null;
            const city = event.cities as { name: string; country: string } | null;
            const isFull = spotsLeft === 0;

            return (
              <div
                key={event.id}
                className={cn(
                  "opacity-0",
                  isVisible && "animate-slide-up"
                )}
                style={{ animationDelay: `${200 + index * 100}ms` }}
              >
                <Card className={cn(
                  "group h-full overflow-hidden transition-all duration-300 cursor-pointer",
                  "hover:shadow-2xl hover:-translate-y-2",
                  "border-2 border-transparent hover:border-primary/20"
                )}>
                  {/* Gradient Header */}
                  <div className={cn(
                    "px-4 py-4 bg-gradient-to-br relative",
                    style.gradient
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{style.icon}</span>
                        <span className={cn("text-sm font-semibold capitalize", style.text)}>
                          {event.event_type}
                        </span>
                      </div>
                      {badge && (
                        <Badge variant={badge.variant} className="text-xs animate-pulse-glow">
                          {badge.icon && <badge.icon className="h-3 w-3 mr-1" />}
                          {badge.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    <h4 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
                      {event.title}
                    </h4>

                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="font-medium">{format(eventDate, "MMM d • HH:mm")}</span>
                      </div>

                      {(event.location_name || city) && (
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                          <span className="truncate">
                            {event.location_name || `${city?.name}, ${city?.country}`}
                          </span>
                        </div>
                      )}

                      {event.max_participants && (
                        <div className="flex items-center gap-2.5">
                          <Users className="h-4 w-4 flex-shrink-0 text-primary" />
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{registrations}/{event.max_participants}</span>
                              {spotsLeft !== null && spotsLeft <= 5 && !isFull && (
                                <span className="text-warning font-medium">{spotsLeft} left!</span>
                              )}
                              {isFull && (
                                <span className="text-destructive font-medium">Full</span>
                              )}
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  isFull ? "bg-destructive" : "bg-primary"
                                )}
                                style={{ width: `${Math.min((registrations / event.max_participants) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={isFull}
                    >
                      <Link to={`/events?event=${event.id}`}>
                        {isFull ? "View Details" : "Register Now"}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className={cn(
          "text-center mt-12 opacity-0",
          isVisible && "animate-fade-in"
        )} style={{ animationDelay: "700ms" }}>
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all group">
            <Link to="/events">
              <Calendar className="mr-2 h-5 w-5" />
              {t("events.viewAll", "View All Events")}
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
