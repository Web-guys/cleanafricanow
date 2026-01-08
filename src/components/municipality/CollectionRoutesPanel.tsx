import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Route, Plus, Clock, Trash2, Truck, Recycle, Leaf, AlertTriangle } from 'lucide-react';

interface CollectionRoutesPanelProps {
  cityId: string | null;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

export const CollectionRoutesPanel = ({ cityId }: CollectionRoutesPanelProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    route_type: 'waste',
    schedule_days: [] as string[],
    schedule_time: '',
    estimated_duration_minutes: '',
    assigned_team: ''
  });

  const { data: routes, isLoading } = useQuery({
    queryKey: ['collection-routes', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const { data, error } = await supabase
        .from('collection_routes')
        .select('*')
        .eq('city_id', cityId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!cityId
  });

  const createRouteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('collection_routes')
        .insert({
          name: formData.name,
          city_id: cityId,
          route_type: formData.route_type,
          schedule_days: formData.schedule_days,
          schedule_time: formData.schedule_time || null,
          estimated_duration_minutes: formData.estimated_duration_minutes ? parseInt(formData.estimated_duration_minutes) : null,
          assigned_team: formData.assigned_team || null,
          created_by: user?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-routes'] });
      setCreateOpen(false);
      setFormData({
        name: '', route_type: 'waste', schedule_days: [], schedule_time: '',
        estimated_duration_minutes: '', assigned_team: ''
      });
      toast({ title: 'Route Created', description: 'Collection route has been added.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('collection_routes')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-routes'] });
      toast({ title: 'Route Updated' });
    }
  });

  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('collection_routes')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-routes'] });
      toast({ title: 'Route Deleted' });
    }
  });

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      schedule_days: prev.schedule_days.includes(day)
        ? prev.schedule_days.filter(d => d !== day)
        : [...prev.schedule_days, day]
    }));
  };

  const getRouteTypeIcon = (type: string) => {
    switch (type) {
      case 'waste': return <Truck className="h-5 w-5 text-gray-600" />;
      case 'recycling': return <Recycle className="h-5 w-5 text-blue-600" />;
      case 'organic': return <Leaf className="h-5 w-5 text-green-600" />;
      case 'hazardous': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default: return <Truck className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'paused': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'completed': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default: return 'bg-muted';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            Collection Routes
          </CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Collection Route</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Route Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Downtown Route A"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Route Type</Label>
                  <Select value={formData.route_type} onValueChange={(v) => setFormData({ ...formData, route_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="waste">🚛 General Waste</SelectItem>
                      <SelectItem value="recycling">♻️ Recycling</SelectItem>
                      <SelectItem value="organic">🌿 Organic</SelectItem>
                      <SelectItem value="hazardous">⚠️ Hazardous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Schedule Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={day.key}
                          checked={formData.schedule_days.includes(day.key)}
                          onCheckedChange={() => toggleDay(day.key)}
                        />
                        <label htmlFor={day.key} className="text-sm cursor-pointer">
                          {day.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Schedule Time</Label>
                    <Input
                      type="time"
                      value={formData.schedule_time}
                      onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Est. Duration (min)</Label>
                    <Input
                      type="number"
                      value={formData.estimated_duration_minutes}
                      onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: e.target.value })}
                      placeholder="120"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Assigned Team</Label>
                  <Input
                    value={formData.assigned_team}
                    onChange={(e) => setFormData({ ...formData, assigned_team: e.target.value })}
                    placeholder="Team Alpha"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createRouteMutation.mutate()}
                  disabled={!formData.name || createRouteMutation.isPending}
                >
                  {createRouteMutation.isPending ? 'Creating...' : 'Create Route'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading routes...</p>
        ) : !routes?.length ? (
          <div className="text-center py-8">
            <Route className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No collection routes configured.</p>
            <p className="text-sm text-muted-foreground">Add routes to optimize waste collection.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {routes.map((route) => (
              <div
                key={route.id}
                className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      {getRouteTypeIcon(route.route_type)}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold">{route.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs capitalize">
                          {route.route_type}
                        </Badge>
                        {route.assigned_team && (
                          <span>• {route.assigned_team}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {route.schedule_days?.length > 0 
                          ? route.schedule_days.map(d => d.slice(0, 3)).join(', ')
                          : 'No schedule'}
                        {route.schedule_time && ` at ${route.schedule_time}`}
                        {route.estimated_duration_minutes && ` • ~${route.estimated_duration_minutes}min`}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={getStatusColor(route.status)}>
                      {route.status}
                    </Badge>
                    <div className="flex gap-1">
                      <Select
                        value={route.status}
                        onValueChange={(v) => updateStatusMutation.mutate({ id: route.id, status: v })}
                      >
                        <SelectTrigger className="h-8 w-[100px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteRouteMutation.mutate(route.id)}
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
