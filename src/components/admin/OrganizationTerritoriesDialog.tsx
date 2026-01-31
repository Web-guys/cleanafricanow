import { useState } from "react";
import { MapPin, Plus, X, Search, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrganizationTerritoriesDialogProps {
  organization: { id: string; name: string; type: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrganizationTerritoriesDialog = ({
  organization,
  open,
  onOpenChange,
}: OrganizationTerritoriesDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch assigned territories
  const { data: territories, isLoading: territoriesLoading } = useQuery({
    queryKey: ["organization-territories", organization?.id],
    queryFn: async () => {
      if (!organization) return [];
      const { data, error } = await supabase
        .from("organization_territories")
        .select("*, cities(id, name, country, region)")
        .eq("organization_id", organization.id);
      if (error) throw error;
      return data;
    },
    enabled: !!organization,
  });

  // Search available cities
  const { data: searchResults } = useQuery({
    queryKey: ["search-cities", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const { data, error } = await supabase
        .from("cities")
        .select("id, name, country, region")
        .or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%`)
        .limit(10);
      if (error) throw error;
      // Filter out already assigned cities
      const assignedIds = territories?.map((t: any) => t.city_id) || [];
      return data.filter((city: any) => !assignedIds.includes(city.id));
    },
    enabled: searchQuery.length >= 2 && !!territories,
  });

  // Add territory mutation
  const addTerritoryMutation = useMutation({
    mutationFn: async (cityId: string) => {
      if (!organization) return;
      const { error } = await supabase.from("organization_territories").insert({
        organization_id: organization.id,
        city_id: cityId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-territories", organization?.id] });
      toast({ title: "Success", description: "Territory assigned successfully" });
      setSearchQuery("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Remove territory mutation
  const removeTerritoryMutation = useMutation({
    mutationFn: async (territoryId: string) => {
      const { error } = await supabase
        .from("organization_territories")
        .delete()
        .eq("id", territoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-territories", organization?.id] });
      toast({ title: "Success", description: "Territory removed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {organization.name} - Territories
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Add Territory Section */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Assign City/Territory
            </h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((city: any) => (
                    <button
                      key={city.id}
                      className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between"
                      onClick={() => addTerritoryMutation.mutate(city.id)}
                      disabled={addTerritoryMutation.isPending}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{city.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {city.region && `${city.region}, `}{city.country}
                          </p>
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Territories */}
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Assigned Territories ({territories?.length || 0})
            </h4>
            {territoriesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : territories?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                <MapPin className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No territories assigned</p>
                <p className="text-sm">Search and add cities above</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2 pr-4">
                  {territories?.map((territory: any) => (
                    <div
                      key={territory.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{territory.cities?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {territory.cities?.region && `${territory.cities.region}, `}
                            {territory.cities?.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {new Date(territory.assigned_at).toLocaleDateString()}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-opacity"
                          onClick={() => removeTerritoryMutation.mutate(territory.id)}
                          disabled={removeTerritoryMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
