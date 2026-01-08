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
import { Trash, Plus, Phone, Mail, MapPin, Trash2, Edit, Clock } from 'lucide-react';

interface DischargeSitesPanelProps {
  cityId: string | null;
}

export const DischargeSitesPanel = ({ cityId }: DischargeSitesPanelProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    site_type: 'landfill',
    address: '',
    latitude: '',
    longitude: '',
    max_capacity_tons: '',
    current_capacity_tons: '',
    status: 'operational',
    contact_name: '',
    phone: '',
    email: '',
    opening_time: '',
    closing_time: '',
  });

  const { data: sites, isLoading } = useQuery({
    queryKey: ['discharge-sites', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const { data, error } = await supabase
        .from('discharge_sites')
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
        max_capacity_tons: parseFloat(data.max_capacity_tons) || null,
        current_capacity_tons: parseFloat(data.current_capacity_tons) || 0,
      };
      const { error } = await supabase.from('discharge_sites').insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discharge-sites'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Discharge site added' });
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
        max_capacity_tons: parseFloat(data.max_capacity_tons) || null,
        current_capacity_tons: parseFloat(data.current_capacity_tons) || 0,
      };
      const { error } = await supabase.from('discharge_sites').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discharge-sites'] });
      setDialogOpen(false);
      setEditingSite(null);
      resetForm();
      toast({ title: 'Discharge site updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('discharge_sites').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discharge-sites'] });
      toast({ title: 'Discharge site removed' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      site_type: 'landfill',
      address: '',
      latitude: '',
      longitude: '',
      max_capacity_tons: '',
      current_capacity_tons: '',
      status: 'operational',
      contact_name: '',
      phone: '',
      email: '',
      opening_time: '',
      closing_time: '',
    });
  };

  const openEditDialog = (site: any) => {
    setEditingSite(site);
    setFormData({
      name: site.name || '',
      site_type: site.site_type || 'landfill',
      address: site.address || '',
      latitude: site.latitude?.toString() || '',
      longitude: site.longitude?.toString() || '',
      max_capacity_tons: site.max_capacity_tons?.toString() || '',
      current_capacity_tons: site.current_capacity_tons?.toString() || '',
      status: site.status || 'operational',
      contact_name: site.contact_name || '',
      phone: site.phone || '',
      email: site.email || '',
      opening_time: site.opening_time || '',
      closing_time: site.closing_time || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingSite) {
      updateMutation.mutate({ id: editingSite.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'maintenance': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'full': return 'bg-red-500/10 text-red-600 border-red-200';
      case 'closed': return 'bg-gray-500/10 text-gray-600 border-gray-200';
      default: return 'bg-muted';
    }
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Trash className="h-5 w-5 text-primary" />
            Discharge Sites (Décharges)
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingSite(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Site</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSite ? 'Edit Discharge Site' : 'Add Discharge Site'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Site Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Site name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.site_type} onValueChange={(v) => setFormData({ ...formData, site_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landfill">Landfill</SelectItem>
                        <SelectItem value="controlled">Controlled Dump</SelectItem>
                        <SelectItem value="transfer_station">Transfer Station</SelectItem>
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
                    <Label>Max Capacity (tons)</Label>
                    <Input
                      type="number"
                      value={formData.max_capacity_tons}
                      onChange={(e) => setFormData({ ...formData, max_capacity_tons: e.target.value })}
                      placeholder="10000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current (tons)</Label>
                    <Input
                      type="number"
                      value={formData.current_capacity_tons}
                      onChange={(e) => setFormData({ ...formData, current_capacity_tons: e.target.value })}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operational">Operational</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
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
                      placeholder="site@example.com"
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
                  {editingSite ? 'Update' : 'Add Site'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading sites...</p>
        ) : !sites?.length ? (
          <div className="text-center py-8">
            <Trash className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No discharge sites added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site: any) => (
              <div key={site.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{site.name}</h4>
                      <Badge variant="outline">{site.site_type.replace('_', ' ')}</Badge>
                      <Badge variant="outline" className={getStatusColor(site.status)}>
                        {site.status}
                      </Badge>
                    </div>
                    {site.max_capacity_tons && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className={getCapacityColor(site.capacity_percentage || 0)}>
                            {site.current_capacity_tons || 0} / {site.max_capacity_tons} tons ({Math.round(site.capacity_percentage || 0)}%)
                          </span>
                        </div>
                        <Progress value={site.capacity_percentage || 0} className="h-2" />
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {site.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {site.address}
                        </span>
                      )}
                      {site.opening_time && site.closing_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {site.opening_time} - {site.closing_time}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {site.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {site.phone}
                        </span>
                      )}
                      {site.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" /> {site.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(site)}>
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
                          <AlertDialogTitle>Remove Discharge Site?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {site.name} from the system.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(site.id)}>
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
