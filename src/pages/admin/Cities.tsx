import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { z } from "zod";

const citySchema = z.object({
  name: z.string().min(1, "City name is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

const AdminCities = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    country: "Morocco",
    latitude: 0 as number,
    longitude: 0 as number,
  });

  const { data: cities } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const createCityMutation = useMutation({
    mutationFn: async (data: { name: string; country: string; latitude: number; longitude: number }) => {
      const { error } = await supabase
        .from('cities')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      toast({ title: t('admin.cities.createSuccess') });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: t('admin.cities.createError'), description: error.message, variant: "destructive" });
    },
  });

  const updateCityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; country: string; latitude: number; longitude: number } }) => {
      const { error } = await supabase
        .from('cities')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      toast({ title: t('admin.cities.updateSuccess') });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: t('admin.cities.updateError'), description: error.message, variant: "destructive" });
    },
  });

  const deleteCityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      toast({ title: t('admin.cities.deleteSuccess') });
    },
    onError: (error: Error) => {
      toast({ title: t('admin.cities.deleteError'), description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", country: "Morocco", latitude: 0, longitude: 0 });
    setEditingCity(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = citySchema.parse(formData) as { name: string; country: string; latitude: number; longitude: number };
      if (editingCity) {
        updateCityMutation.mutate({ id: editingCity.id, data: validated });
      } else {
        createCityMutation.mutate(validated);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: t('admin.cities.validationError'), description: error.errors[0].message, variant: "destructive" });
      }
    }
  };

  const handleEdit = (city: any) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      country: city.country,
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
    });
    setIsOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('nav.dashboard')}
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">{t('admin.cities.title')}</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Cities Table */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t('admin.cities.covered')} ({cities?.length || 0})</CardTitle>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('admin.cities.addNew')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingCity ? t('admin.cities.editCity') : t('admin.cities.addNew')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="name">{t('admin.cities.cityName')}</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Casablanca"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">{t('admin.cities.country')}</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="Morocco"
                        />
                      </div>
                      <div>
                        <Label htmlFor="latitude">{t('admin.cities.latitude')}</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                          placeholder="33.5731"
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">{t('admin.cities.longitude')}</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                          placeholder="-7.5898"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button type="submit">
                          {editingCity ? t('common.update') : t('common.create')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.cities.cityName')}</TableHead>
                    <TableHead>{t('admin.cities.country')}</TableHead>
                    <TableHead>{t('admin.cities.latitude')}</TableHead>
                    <TableHead>{t('admin.cities.longitude')}</TableHead>
                    <TableHead>{t('admin.cities.addedDate')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities?.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-semibold">{city.name}</TableCell>
                      <TableCell>{city.country}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {Number(city.latitude).toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {Number(city.longitude).toFixed(4)}
                      </TableCell>
                      <TableCell>
                        {new Date(city.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(city)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCityMutation.mutate(city.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AdminCities;
