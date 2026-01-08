import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, Plus, Phone, Mail, MapPin, Trash2, Edit, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface PartnerCompaniesPanelProps {
  cityId: string | null;
}

export const PartnerCompaniesPanel = ({ cityId }: PartnerCompaniesPanelProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    company_type: 'waste_collection',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    contract_start: '',
    contract_end: '',
    status: 'active',
    notes: '',
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ['partner-companies', cityId],
    queryFn: async () => {
      if (!cityId) return [];
      const { data, error } = await supabase
        .from('partner_companies')
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
        contract_start: data.contract_start || null,
        contract_end: data.contract_end || null,
      };
      const { error } = await supabase.from('partner_companies').insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-companies'] });
      setDialogOpen(false);
      resetForm();
      toast({ title: 'Company added successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload = {
        ...data,
        contract_start: data.contract_start || null,
        contract_end: data.contract_end || null,
      };
      const { error } = await supabase.from('partner_companies').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-companies'] });
      setDialogOpen(false);
      setEditingCompany(null);
      resetForm();
      toast({ title: 'Company updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('partner_companies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-companies'] });
      toast({ title: 'Company removed' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      company_type: 'waste_collection',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      contract_start: '',
      contract_end: '',
      status: 'active',
      notes: '',
    });
  };

  const openEditDialog = (company: any) => {
    setEditingCompany(company);
    setFormData({
      name: company.name || '',
      company_type: company.company_type || 'waste_collection',
      contact_name: company.contact_name || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      contract_start: company.contract_start || '',
      contract_end: company.contract_end || '',
      status: company.status || 'active',
      notes: company.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingCompany) {
      updateMutation.mutate({ id: editingCompany.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
      case 'suspended': return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'terminated': return 'bg-red-500/10 text-red-600 border-red-200';
      default: return 'bg-muted';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      waste_collection: 'Waste Collection',
      recycling: 'Recycling',
      hazardous_waste: 'Hazardous Waste',
      transport: 'Transport',
      equipment: 'Equipment',
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Partner Companies
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingCompany(null); resetForm(); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Company</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCompany ? 'Edit Company' : 'Add Partner Company'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={formData.company_type} onValueChange={(v) => setFormData({ ...formData, company_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="waste_collection">Waste Collection</SelectItem>
                        <SelectItem value="recycling">Recycling</SelectItem>
                        <SelectItem value="hazardous_waste">Hazardous Waste</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      placeholder="Contact name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+212 5XX XXX XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="company@example.com"
                    />
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
                    <Label>Contract Start</Label>
                    <Input
                      type="date"
                      value={formData.contract_start}
                      onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contract End</Label>
                    <Input
                      type="date"
                      value={formData.contract_end}
                      onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={!formData.name || createMutation.isPending || updateMutation.isPending}>
                  {editingCompany ? 'Update' : 'Add Company'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center py-8 text-muted-foreground">Loading companies...</p>
        ) : !companies?.length ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No partner companies added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map((company: any) => (
              <div key={company.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{company.name}</h4>
                      <Badge variant="outline">{getTypeLabel(company.company_type)}</Badge>
                      <Badge variant="outline" className={getStatusColor(company.status)}>
                        {company.status}
                      </Badge>
                    </div>
                    {company.contact_name && (
                      <p className="text-sm text-muted-foreground">Contact: {company.contact_name}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {company.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" /> {company.phone}
                        </span>
                      )}
                      {company.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" /> {company.email}
                        </span>
                      )}
                    </div>
                    {company.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {company.address}
                      </p>
                    )}
                    {(company.contract_start || company.contract_end) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> 
                        Contract: {company.contract_start ? format(new Date(company.contract_start), 'MMM d, yyyy') : 'N/A'} 
                        {' - '} 
                        {company.contract_end ? format(new Date(company.contract_end), 'MMM d, yyyy') : 'Ongoing'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(company)}>
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
                          <AlertDialogTitle>Remove Company?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove {company.name} from partners.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(company.id)}>
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
