import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Recycle, Plus, Phone, Mail, MapPin, Trash2, Edit, Clock } from 'lucide-react';

interface SortingCentersPanelProps {
  cityId: string | null;
}

export const SortingCentersPanel = ({ cityId }: SortingCentersPanelProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    center_type: 'recycling',
    address: '',
    latitude: '',
    longitude: '',
    daily_capacity_tons: '',
    current_load_tons: '',
    status: 'operational',
    contact_name: '',
    phone: '',
    email: '',
    opening_time: '',
    closing_time: '',
  });

  const { data: centers, isLoading } = useQuery({
    queryKey: ['sorting-centers', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const { data, error } = await supabase
        .from('sorting_centers')
        .select('*')
        .eq('city_id', cityId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!cityId
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { data: user } = await supabase.auth.getUser();
      const payload = {
        ...data,
        city_id: cityId,
        created_by: user.user?.id,
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        daily_capacity_tons: parseFloat(data.daily_capacity_tons) || null,
        current_load_tons: parseFloat(data.current_load_tons) || 0,
      };
      const { error } = await supabase.from('sorting_centers').insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorting-centers'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Sorting center added' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload = {
        ...data,
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        daily_capacity_tons: parseFloat(data.daily_capacity_tons) || null,
        current_load_tons: parseFloat(data.current_load_tons) || 0,
      };
      const { error } = await supabase.from('sorting_centers').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorting-centers'] });
      setDialogOpen(false);
      setEditingCenter(null);
      resetForm();
      toast({ title: 'Sorting center updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sorting_centers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sorting-centers'] });
      toast({ title: 'Sorting center removed' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      center_type: 'recycling',
      address: '',
      latitude: '',
      longitude: '',
      daily_capacity_tons: '',
      current_load_tons: '',
      status: 'operational',
      contact_name: '',
      phone: '',
      email: '',
      opening_time: '',
      closing_time: '',
    });
  };

  const openEditDialog = (center: any) => {
    setEditingCenter(center);
    setFormData({
      name: center.name || '',
      center_type: center.center_type || 'recycling',
      address: center.address || '',
      latitude: center.latitude?.toString() || '',
      longitude: center.longitude?.toString() || '',
      daily_capacity_tons: center.daily_capacity_tons?.toString() || '',
      current_load_tons: center.current_load_tons?.toString() || '',
      status: center.status || 'operational',
      contact_name: center.contact_name || '',
      phone: center.phone || '',
      email: center.email || '',
      opening_time: center.opening_time || '',
      closing_time: center.closing_time || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingCenter) {
      updateMutation.mutate({ id: editingCenter.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'maintenance': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'overloaded': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'closed': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default: return 'bg-muted';
    }
  };

  const getLoadPercentage = (current: number, max: number) => {
    if (!max) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getLoadColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Recycle className="h-5 w-5 text-primary" />
            Sorting Centers (Centres de tri)
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingCenter(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Center</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCenter ? 'Edit Sorting Center' : 'Add Sorting Center'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Center Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Center name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.center_type} onValueChange={(v) => setFormData({ ...formData, center_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recycling">Recycling</SelectItem>
                        <SelectItem value="composting">Composting</SelectItem>
                        <SelectItem value="mixed">Mixed Waste</SelectItem>
                        <SelectItem value="hazardous">Hazardous</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Latitude *</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="30.4278"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude *</Label>
                    <Input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="-9.5981"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Daily Capacity (tons)</Label>
                    <Input
                      type="number"
                      value={formData.daily_capacity_tons}
                      onChange={(e) => setFormData({ ...formData, daily_capacity_tons: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Load (tons)</Label>
                    <Input
                      type="number"
                      value={formData.current_load_tons}
                      onChange={(e) => setFormData({ ...formData, current_load_tons: e.target.value })}
                      placeholder="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="overloaded">Overloaded</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Manager name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+212 5XX XXX XXX"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="center@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Opens</Label>
                    <Input
                      type="time"
                      value={formData.opening_time}
                      onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Closes</Label>
                    <Input
                      type="time"
                      value={formData.closing_time}
                      onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!formData.name || !formData.latitude || !formData.longitude || createMutation.isPending || updateMutation.isPending}>
                  {editingCenter ? 'Update' : 'Add Center'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading centers...</p>
        ) : !centers?.length ? (
          <div className="text-center py-8">
            <Recycle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No sorting centers added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {centers.map((center: any) => {
              const loadPercentage = getLoadPercentage(center.current_load_tons || 0, center.daily_capacity_tons);
              return (
                <div key={center.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{center.name}</h4>
                        <Badge variant="outline">{center.center_type}</Badge>
                        <Badge variant="outline" className={getStatusColor(center.status)}>
                          {center.status}
                        </Badge>
                      </div>
                      {center.daily_capacity_tons && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Daily Load:</span>
                            <span className={getLoadColor(loadPercentage)}>
                              {center.current_load_tons || 0} / {center.daily_capacity_tons} tons ({Math.round(loadPercentage)}%)
                            </span>
                          </div>
                          <Progress value={loadPercentage} className="h-2" />
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {center.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {center.address}
                          </span>
                        )}
                        {center.opening_time && center.closing_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {center.opening_time} - {center.closing_time}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {center.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" /> {center.phone}
                          </span>
                        )}
                        {center.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5" /> {center.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditDialog(center)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Sorting Center?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {center.name} from the system.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(center.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
