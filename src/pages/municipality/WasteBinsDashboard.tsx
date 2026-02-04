import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Map, BarChart3, Bell, List } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { BinStatsGrid } from "@/components/bins/BinStatsGrid";
import { BinAlertsList } from "@/components/bins/BinAlertsList";
import { BinsTable } from "@/components/bins/BinsTable";
import { BinStatusMap } from "@/components/bins/BinStatusMap";
import { BinAnalytics } from "@/components/bins/BinAnalytics";
import { AddBinDialog } from "@/components/bins/AddBinDialog";
import { MoroccanPattern, MoroccanCorner } from "@/components/ui/moroccan-pattern";

const WasteBinsDashboard = () => {
  const { hasRole } = useAuth();
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: cities } = useQuery({
    queryKey: ['cities-for-bins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, country')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const canManageBins = hasRole('admin') || hasRole('municipality');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-moroccan-teal via-primary to-moroccan-blue text-primary-foreground overflow-hidden">
        <MoroccanPattern variant="geometric" opacity={0.06} color="white" />
        <MoroccanCorner position="top-right" size={80} className="text-moroccan-gold/20" />
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Trash2 className="h-8 w-8" />
                Waste Bins Dashboard
              </h1>
              <p className="text-primary-foreground/80 mt-1">
                Monitor and manage city waste bins in real-time
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* City Filter */}
              <Select value={selectedCityId} onValueChange={setSelectedCityId}>
                <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cities</SelectItem>
                  {cities?.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Add Bin Button */}
              {canManageBins && (
                <AddBinDialog defaultCityId={selectedCityId || undefined} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <BinStatsGrid cityId={selectedCityId || undefined} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BinAlertsList cityId={selectedCityId || undefined} maxItems={8} />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Quick Map View
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <BinStatusMap 
                    cityId={selectedCityId || undefined} 
                    height="350px"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            <BinStatusMap 
              cityId={selectedCityId || undefined} 
              height="600px"
            />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <BinsTable cityId={selectedCityId || undefined} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <BinAnalytics cityId={selectedCityId || undefined} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WasteBinsDashboard;
