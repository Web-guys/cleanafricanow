import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, Plus, Clock, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface CollectionEventsPanelProps {
  cityId: string | null;
}

export const CollectionEventsPanel = ({ cityId }: CollectionEventsPanelProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location_name: '',
    latitude: '',
    longitude: '',
    event_date: '',
    end_date: '',
    max_participants: '50',
    event_type: 'cleanup',
    notes: ''
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['collection-events', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const { data, error } = await supabase
        .from('collection_events')
        .select('*')
        .eq('city_id', cityId)
        .order('event_date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!cityId
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('collection_events')
        .insert({
          title: formData.title,
          description: formData.description,
          city_id: cityId,
          location_name: formData.location_name,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          event_date: formData.event_date,
          end_date: formData.end_date || null,
          max_participants: parseInt(formData.max_participants),
          event_type: formData.event_type,
          notes: formData.notes,
          created_by: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-events'] });
      setCreateOpen(false);
      setFormData({
        title: '', description: '', location_name: '', latitude: '', longitude: '',
        event_date: '', end_date: '', max_participants: '50', event_type: 'cleanup', notes: ''
      });
      toast({ title: 'Event Created', description: 'Collection event has been scheduled.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('collection_events')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-events'] });
      toast({ title: 'Status Updated' });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('collection_events')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-events'] });
      toast({ title: 'Event Deleted' });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'in_progress': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cleanup': return '🧹';
      case 'collection': return '🚛';
      case 'awareness': return '📢';
      case 'recycling': return '♻️';
      default: return '📍';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Collection Events
          </CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Schedule Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Schedule Collection Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Event Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Beach Cleanup Day"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={formData.event_type} onValueChange={(v) => setFormData({ ...formData, event_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleanup">🧹 Cleanup</SelectItem>
                      <SelectItem value="collection">🚛 Collection</SelectItem>
                      <SelectItem value="awareness">📢 Awareness</SelectItem>
                      <SelectItem value="recycling">♻️ Recycling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the event..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location Name</Label>
                  <Input
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    placeholder="Central Beach, Casablanca"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude *</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="33.5731"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude *</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="-7.5898"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date & Time *</Label>
                    <Input
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <Input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createEventMutation.mutate()}
                  disabled={!formData.title || !formData.latitude || !formData.longitude || !formData.event_date || createEventMutation.isPending}
                >
                  {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading events...</p>
        ) : !events?.length ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No collection events scheduled.</p>
            <p className="text-sm text-muted-foreground">Create your first event to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="text-2xl">{getTypeIcon(event.event_type)}</div>
                    <div className="space-y-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(event.event_date), 'PPP p')}
                      </div>
                      {event.location_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location_name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        Max {event.max_participants} participants
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={getStatusColor(event.status)}>
                      {event.status.replace('_', ' ')}
                    </Badge>
                    <div className="flex gap-1">
                      <Select
                        value={event.status}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: event.id, status: v })}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteEventMutation.mutate(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
