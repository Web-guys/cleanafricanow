import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Globe, ArrowLeft, Plus, Pencil, Trash2, Search, Flag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const CONTINENTS = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
  "Antarctica"
];

const countrySchema = z.object({
  name: z.string().min(1, "Country name is required"),
  code: z.string().min(2, "Country code is required").max(3, "Code must be 2-3 characters"),
  continent: z.string().optional(),
  flag_emoji: z.string().optional(),
  is_active: z.boolean().default(true),
});

type Country = {
  id: string;
  name: string;
  code: string;
  continent: string | null;
  flag_emoji: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const AdminCountries = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    continent: "",
    flag_emoji: "",
    is_active: true,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [continentFilter, setContinentFilter] = useState<string>("all");

  const { data: countries, isLoading } = useQuery({
    queryKey: ['admin-countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Country[];
    }
  });

  // Get city counts per country
  const { data: cityCounts } = useQuery({
    queryKey: ['country-city-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('country');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(city => {
        counts[city.country] = (counts[city.country] || 0) + 1;
      });
      return counts;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; continent?: string; flag_emoji?: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('countries')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-countries'] });
      toast({ title: "Country created successfully" });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error creating country", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name: string; code: string; continent?: string; flag_emoji?: string; is_active?: boolean } }) => {
      const { error } = await supabase
        .from('countries')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-countries'] });
      toast({ title: "Country updated successfully" });
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error updating country", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('countries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-countries'] });
      toast({ title: "Country deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error deleting country", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", code: "", continent: "", flag_emoji: "", is_active: true });
    setEditingCountry(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = countrySchema.parse(formData);
      const countryData = {
        name: validated.name,
        code: validated.code,
        continent: validated.continent,
        flag_emoji: validated.flag_emoji,
        is_active: validated.is_active,
      };
      if (editingCountry) {
        updateMutation.mutate({ id: editingCountry.id, data: countryData });
      } else {
        createMutation.mutate(countryData);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation error", description: error.errors[0].message, variant: "destructive" });
      }
    }
  };

  const handleEdit = (country: Country) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      code: country.code,
      continent: country.continent || "",
      flag_emoji: country.flag_emoji || "",
      is_active: country.is_active,
    });
    setIsOpen(true);
  };

  const filteredCountries = countries?.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesContinent = continentFilter === "all" || c.continent === continentFilter;
    return matchesSearch && matchesContinent;
  });

  const continents = [...new Set(countries?.map(c => c.continent).filter(Boolean))].sort();

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
                <Globe className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Countries</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Overview */}
      <section className="py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-primary">{countries?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Total Countries</div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/5 border-secondary/20">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-secondary">
                  {countries?.filter(c => c.is_active).length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">{continents.length}</div>
                <div className="text-sm text-muted-foreground">Continents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold">
                  {Object.values(cityCounts || {}).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Cities</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Search & Actions */}
      <section className="py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={continentFilter} onValueChange={setContinentFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Continents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Continents</SelectItem>
                  {CONTINENTS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Country
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingCountry ? "Edit Country" : "Add New Country"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="name">Country Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Morocco"
                      />
                    </div>
                    <div>
                      <Label htmlFor="code">Country Code (ISO)</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="MA"
                        maxLength={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="flag">Flag Emoji</Label>
                      <Input
                        id="flag"
                        value={formData.flag_emoji}
                        onChange={(e) => setFormData({ ...formData, flag_emoji: e.target.value })}
                        placeholder="🇲🇦"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="continent">Continent</Label>
                      <Select
                        value={formData.continent}
                        onValueChange={(value) => setFormData({ ...formData, continent: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select continent..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTINENTS.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 flex items-center justify-between">
                      <Label htmlFor="is_active">Active</Label>
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                      {editingCountry ? "Update" : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Countries Table */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Countries ({filteredCountries?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Continent</TableHead>
                      <TableHead>Cities</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCountries?.map((country) => (
                      <TableRow key={country.id}>
                        <TableCell className="text-2xl">
                          {country.flag_emoji || "🏳️"}
                        </TableCell>
                        <TableCell className="font-medium">{country.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{country.code}</Badge>
                        </TableCell>
                        <TableCell>{country.continent || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {cityCounts?.[country.name] || 0} cities
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={country.is_active ? "default" : "secondary"}>
                            {country.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(country)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this country?")) {
                                  deleteMutation.mutate(country.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredCountries?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No countries found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AdminCountries;
