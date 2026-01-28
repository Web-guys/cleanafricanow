import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, ArrowLeft, Plus, Pencil, Trash2, Search, Map, Users, Building2, ChevronDown, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Country-specific regions configuration
const COUNTRY_REGIONS: Record<string, { name: string; color: string }[]> = {
  "Morocco": [
    { name: "Tanger-Tétouan-Al Hoceïma", color: "bg-blue-500" },
    { name: "Oriental", color: "bg-orange-500" },
    { name: "Fès-Meknès", color: "bg-purple-500" },
    { name: "Rabat-Salé-Kénitra", color: "bg-green-500" },
    { name: "Béni Mellal-Khénifra", color: "bg-yellow-500" },
    { name: "Casablanca-Settat", color: "bg-red-500" },
    { name: "Marrakech-Safi", color: "bg-pink-500" },
    { name: "Drâa-Tafilalet", color: "bg-amber-600" },
    { name: "Souss-Massa", color: "bg-teal-500" },
    { name: "Guelmim-Oued Noun", color: "bg-indigo-500" },
    { name: "Laâyoune-Sakia El Hamra", color: "bg-cyan-500" },
    { name: "Dakhla-Oued Ed-Dahab", color: "bg-emerald-500" },
  ],
  "Algeria": [
    { name: "Alger", color: "bg-green-500" },
    { name: "Oran", color: "bg-blue-500" },
    { name: "Constantine", color: "bg-red-500" },
    { name: "Annaba", color: "bg-purple-500" },
    { name: "Blida", color: "bg-yellow-500" },
  ],
  "Tunisia": [
    { name: "Tunis", color: "bg-red-500" },
    { name: "Sfax", color: "bg-blue-500" },
    { name: "Sousse", color: "bg-green-500" },
    { name: "Kairouan", color: "bg-orange-500" },
  ],
  "Egypt": [
    { name: "Cairo", color: "bg-yellow-500" },
    { name: "Alexandria", color: "bg-blue-500" },
    { name: "Giza", color: "bg-amber-500" },
    { name: "Luxor", color: "bg-orange-500" },
  ],
  "Senegal": [
    { name: "Dakar", color: "bg-green-500" },
    { name: "Thiès", color: "bg-yellow-500" },
    { name: "Saint-Louis", color: "bg-blue-500" },
  ],
  "Nigeria": [
    { name: "Lagos", color: "bg-green-500" },
    { name: "Abuja", color: "bg-blue-500" },
    { name: "Kano", color: "bg-red-500" },
    { name: "Ibadan", color: "bg-purple-500" },
  ],
  "Kenya": [
    { name: "Nairobi", color: "bg-green-500" },
    { name: "Mombasa", color: "bg-blue-500" },
    { name: "Kisumu", color: "bg-red-500" },
  ],
  "South Africa": [
    { name: "Gauteng", color: "bg-yellow-500" },
    { name: "Western Cape", color: "bg-blue-500" },
    { name: "KwaZulu-Natal", color: "bg-green-500" },
    { name: "Eastern Cape", color: "bg-red-500" },
  ],
  "Ghana": [
    { name: "Greater Accra", color: "bg-yellow-500" },
    { name: "Ashanti", color: "bg-green-500" },
    { name: "Western", color: "bg-blue-500" },
  ],
  "Ivory Coast": [
    { name: "Abidjan", color: "bg-orange-500" },
    { name: "Bouaké", color: "bg-green-500" },
    { name: "Yamoussoukro", color: "bg-blue-500" },
  ],
};

// Keep Morocco regions for backward compatibility
const MOROCCO_REGIONS = COUNTRY_REGIONS["Morocco"];

const getRegionColor = (regionName: string | null, country?: string) => {
  if (!regionName) return "bg-gray-500";
  const regions = country ? COUNTRY_REGIONS[country] : MOROCCO_REGIONS;
  const region = regions?.find(r => r.name === regionName);
  return region?.color || "bg-gray-500";
};

type Country = {
  id: string;
  name: string;
  code: string;
  flag_emoji: string | null;
  is_active: boolean;
};

const citySchema = z.object({
  name: z.string().min(1, "City name is required"),
  country: z.string().min(1, "Country is required"),
  region: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  population: z.coerce.number().optional(),
  is_featured: z.boolean().optional(),
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
    region: "",
    latitude: 0 as number,
    longitude: 0 as number,
    population: 0 as number,
    is_featured: false,
  });
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "regions">("regions");

  // Fetch countries from database
  const { data: countries } = useQuery({
    queryKey: ['countries-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Country[];
    }
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

  // Get regions for selected country
  const availableRegions = useMemo(() => {
    return COUNTRY_REGIONS[formData.country] || [];
  }, [formData.country]);


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
    setFormData({ name: "", country: "Morocco", region: "", latitude: 0, longitude: 0, population: 0, is_featured: false });
    setEditingCity(null);
  };

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from('cities')
        .update({ is_featured })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      queryClient.invalidateQueries({ queryKey: ['featured-cities'] });
      toast({ title: "Featured status updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating featured status", description: error.message, variant: "destructive" });
    },
  });

  const regions = cities ? [...new Set(cities.map(c => c.region).filter(Boolean))].sort() : [];
  const filteredCities = cities?.filter(c => {
    const matchesRegion = regionFilter === "all" || c.region === regionFilter;
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.region?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  // Group cities by region with stats
  const regionStats = regions.map(region => {
    const regionCities = cities?.filter(c => c.region === region) || [];
    const totalPopulation = regionCities.reduce((sum, c) => sum + (c.population || 0), 0);
    return {
      name: region,
      cityCount: regionCities.length,
      totalPopulation,
      cities: regionCities.sort((a, b) => (b.population || 0) - (a.population || 0)),
    };
  });

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
      region: city.region || "",
      latitude: Number(city.latitude),
      longitude: Number(city.longitude),
      population: city.population || 0,
      is_featured: city.is_featured || false,
    });
    setIsOpen(true);
  };

  const featuredCount = cities?.filter(c => c.is_featured).length || 0;

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
          <Button variant="outline" asChild>
            <Link to="/cities-map">
              <Map className="mr-2 h-4 w-4" />
              View Map
            </Link>
          </Button>
        </div>
      </header>

      {/* Region Overview Stats */}
      <section className="py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{cities?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Villes couvertes</div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-secondary">{regions.length}</div>
                <div className="text-sm text-muted-foreground">Régions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">
                  {cities?.reduce((sum, c) => sum + (c.population || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Population totale</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="text-3xl font-bold text-amber-600">{featuredCount}</span>
                </div>
                <div className="text-sm text-muted-foreground">Featured Cities</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* View Toggle & Search */}
      <section className="py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <Button 
                variant={viewMode === "regions" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("regions")}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Par région
              </Button>
              <Button 
                variant={viewMode === "table" ? "default" : "outline"} 
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Liste complète
              </Button>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une ville..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('admin.cities.addNew')}</span>
                    <span className="sm:hidden">Ajouter</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingCity ? t('admin.cities.editCity') : t('admin.cities.addNew')}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
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
                        <Select
                          value={formData.country}
                          onValueChange={(value) => setFormData({ ...formData, country: value, region: "" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            {countries?.map(c => (
                              <SelectItem key={c.id} value={c.name}>
                                <span className="flex items-center gap-2">
                                  {c.flag_emoji && <span>{c.flag_emoji}</span>}
                                  {c.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="region">Région</Label>
                        <Select
                          value={formData.region}
                          onValueChange={(value) => setFormData({ ...formData, region: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={availableRegions.length ? "Sélectionner..." : "No regions defined"} />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            {availableRegions.length > 0 ? (
                              availableRegions.map(r => (
                                <SelectItem key={r.name} value={r.name}>
                                  <span className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${r.color}`} />
                                    {r.name}
                                  </span>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="other" disabled>
                                No regions for this country
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="population">Population</Label>
                        <Input
                          id="population"
                          type="number"
                          value={formData.population}
                          onChange={(e) => setFormData({ ...formData, population: parseInt(e.target.value) || 0 })}
                          placeholder="1000000"
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
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <Label htmlFor="is_featured" className="cursor-pointer">Featured on Homepage</Label>
                      </div>
                      <Switch
                        id="is_featured"
                        checked={formData.is_featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
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
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          {viewMode === "regions" ? (
            /* Region Cards View */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {regionStats
                .filter(r => !searchQuery || r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  r.cities.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((region) => (
                <Card key={region.name} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getRegionColor(region.name)}`} />
                        <CardTitle className="text-lg">{region.name}</CardTitle>
                      </div>
                      <Badge variant="secondary">{region.cityCount} villes</Badge>
                    </div>
                    <CardDescription>
                      Population: {region.totalPopulation.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-32">
                      <div className="space-y-1">
                        {region.cities
                          .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((city) => (
                          <div 
                            key={city.id} 
                            className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {city.is_featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                              <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span className="text-sm truncate">{city.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {city.population?.toLocaleString() || '-'}
                              </span>
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleEdit(city)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Table View */
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <CardTitle>{t('admin.cities.covered')} ({filteredCities?.length || 0})</CardTitle>
                  {/* Mobile Region Filter */}
                  <div className="md:hidden">
                    <Select value={regionFilter} onValueChange={setRegionFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filtrer par région" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les régions</SelectItem>
                        {regions.map(region => (
                          <SelectItem key={region} value={region!}>
                            <span className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${getRegionColor(region)}`} />
                              {region}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Desktop Region Pills */}
                  <div className="hidden md:flex gap-2 flex-wrap">
                    <Button 
                      variant={regionFilter === "all" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setRegionFilter("all")}
                    >
                      Toutes
                    </Button>
                    {regions.map(region => (
                      <Button
                        key={region}
                        variant={regionFilter === region ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRegionFilter(region!)}
                        className="gap-1.5"
                      >
                        <span className={`w-2 h-2 rounded-full ${getRegionColor(region)}`} />
                        {region}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 md:p-6">
                {/* Mobile List */}
                <div className="md:hidden divide-y">
                  {filteredCities?.map((city) => (
                    <div key={city.id} className="p-4 flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${getRegionColor(city.region)}`} />
                          <span className="font-medium truncate">{city.name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {city.region} • {city.population?.toLocaleString() || '-'} hab.
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(city)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteCityMutation.mutate(city.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop Table */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.cities.cityName')}</TableHead>
                        <TableHead>Région</TableHead>
                        <TableHead>Population</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead>{t('admin.cities.latitude')}</TableHead>
                        <TableHead>{t('admin.cities.longitude')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCities?.map((city) => (
                        <TableRow key={city.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${getRegionColor(city.region)}`} />
                              <span className="font-semibold">{city.name}</span>
                              <span className="text-muted-foreground text-xs">{city.country}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{city.region || '-'}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {city.population?.toLocaleString() || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={city.is_featured || false}
                                onCheckedChange={(checked) => toggleFeaturedMutation.mutate({ id: city.id, is_featured: checked })}
                              />
                              {city.is_featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {Number(city.latitude).toFixed(4)}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {Number(city.longitude).toFixed(4)}
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminCities;
