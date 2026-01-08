import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Clock, ArrowLeft, Building2, User, Check } from 'lucide-react';
import { format } from 'date-fns';

const CollectionEvents = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [formData, setFormData] = useState({
    participant_type: 'volunteer',
    participant_name: '',
    contact_email: '',
    contact_phone: '',
    team_size: '1',
    notes: ''
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['public-collection-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_events')
        .select(`
          *,
          cities(name, country)
        `)
        .in('status', ['scheduled', 'in_progress'])
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: selectedEvent?.id,
          participant_type: formData.participant_type,
          user_id: user?.id || null,
          participant_name: formData.participant_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone || null,
          team_size: parseInt(formData.team_size),
          notes: formData.notes || null
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      setRegisterOpen(false);
      setSelectedEvent(null);
      setFormData({
        participant_type: 'volunteer',
        participant_name: '',
        contact_email: '',
        contact_phone: '',
        team_size: '1',
        notes: ''
      });
      toast({ 
        title: 'Registration Submitted!', 
        description: 'Your registration is pending approval. We\'ll contact you soon.' 
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cleanup': return '🧹';
      case 'collection': return '🚛';
      case 'awareness': return '📢';
      case 'recycling': return '♻️';
      default: return '📍';
    }
  };

  const openRegisterDialog = (event: any) => {
    setSelectedEvent(event);
    setRegisterOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              CleanAfricaNow
            </h1>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Join Our Collection Events</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Volunteer your time or bring your company team to help keep our cities clean. 
            Every participant makes a difference!
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <p className="text-center py-12 text-muted-foreground">Loading events...</p>
          ) : !events?.length ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Upcoming Events</h3>
              <p className="text-muted-foreground">Check back soon for new collection events in your area.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-3xl">{getTypeIcon(event.event_type)}</div>
                      <Badge variant="outline" className="capitalize">
                        {event.event_type}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2">{event.title}</CardTitle>
                    {event.cities && (
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.cities.name}, {event.cities.country}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.event_date), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(event.event_date), 'h:mm a')}
                        {event.end_date && ` - ${format(new Date(event.end_date), 'h:mm a')}`}
                      </div>
                      {event.location_name && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {event.location_name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Up to {event.max_participants} participants
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => openRegisterDialog(event)}
                    >
                      Register to Participate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Registration Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Register for Event</DialogTitle>
            <DialogDescription>
              {selectedEvent?.title} on {selectedEvent?.event_date && format(new Date(selectedEvent.event_date), 'PPP')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>I'm registering as a...</Label>
              <Select 
                value={formData.participant_type} 
                onValueChange={(v) => setFormData({ ...formData, participant_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volunteer">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Individual Volunteer
                    </span>
                  </SelectItem>
                  <SelectItem value="company">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Company / Organization
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {formData.participant_type === 'company' ? 'Company Name *' : 'Your Name *'}
              </Label>
              <Input
                value={formData.participant_name}
                onChange={(e) => setFormData({ ...formData, participant_name: e.target.value })}
                placeholder={formData.participant_type === 'company' ? 'Acme Corp' : 'John Doe'}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Email *</Label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+212 600 000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Team Size</Label>
              <Input
                type="number"
                min="1"
                value={formData.team_size}
                onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                How many people will be participating?
              </p>
            </div>
            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requirements or questions?"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => registerMutation.mutate()}
              disabled={!formData.participant_name || !formData.contact_email || registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollectionEvents;
