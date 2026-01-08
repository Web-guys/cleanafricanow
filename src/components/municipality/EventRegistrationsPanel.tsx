import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building2, User, Check, X, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';

interface EventRegistrationsPanelProps {
  cityId: string | null;
}

export const EventRegistrationsPanel = ({ cityId }: EventRegistrationsPanelProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['event-registrations', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      
      // First get events in this city
      const { data: events } = await supabase
        .from('collection_events')
        .select('id')
        .eq('city_id', cityId);
      
      if (!events?.length) return [];
      
      const eventIds = events.map(e => e.id);
      
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          *,
          collection_events(id, title, event_date)
        `)
        .in('event_id', eventIds)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!cityId
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('event_registrations')
        .update({ 
          status,
          approved_by: status === 'approved' ? user?.id : null,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', id);
      if (error) throw error;

      // Send email notification for approved/rejected status
      if (status === 'approved' || status === 'rejected') {
        try {
          const response = await supabase.functions.invoke('send-registration-notification', {
            body: { registrationId: id, status }
          });
          if (response.error) {
            console.error('Failed to send notification:', response.error);
          }
        } catch (e) {
          console.error('Failed to send notification:', e);
        }
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-registrations'] });
      const message = variables.status === 'approved' 
        ? 'Registration approved & notification sent' 
        : variables.status === 'rejected'
        ? 'Registration rejected & notification sent'
        : 'Registration updated';
      toast({ title: message });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'approved': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'attended': return 'bg-blue-500/10 text-blue-600 border-blue-200';
      case 'no_show': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default: return 'bg-muted';
    }
  };

  const pendingCount = registrations?.filter(r => r.status === 'pending').length || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Volunteer & Company Registrations
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingCount} pending</Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading registrations...</p>
        ) : !registrations?.length ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No registrations yet.</p>
            <p className="text-sm text-muted-foreground">Volunteers and companies will appear here when they register.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {reg.participant_type === 'company' ? (
                        <Building2 className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{reg.participant_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {reg.participant_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        For: <span className="font-medium">{reg.collection_events?.title}</span>
                        {reg.collection_events?.event_date && (
                          <span> • {format(new Date(reg.collection_events.event_date), 'MMM d, yyyy')}</span>
                        )}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {reg.contact_email}
                        </span>
                        {reg.contact_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {reg.contact_phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          Team size: {reg.team_size}
                        </span>
                      </div>
                      {reg.notes && (
                        <p className="text-sm text-muted-foreground italic">"{reg.notes}"</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={getStatusColor(reg.status)}>
                      {reg.status.replace('_', ' ')}
                    </Badge>
                    {reg.status === 'pending' ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 hover:bg-emerald-50"
                          onClick={() => updateStatusMutation.mutate({ id: reg.id, status: 'approved' })}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => updateStatusMutation.mutate({ id: reg.id, status: 'rejected' })}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value={reg.status}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: reg.id, status: v })}
                      >
                        <SelectTrigger className="h-8 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="attended">Attended</SelectItem>
                          <SelectItem value="no_show">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
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
