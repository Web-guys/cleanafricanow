import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CONFIG, REGION_COLORS, getRegionColor } from '@/utils/mapConfig';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, Building2 } from 'lucide-react';

interface City {
  id: string;
  name: string;
  region: string | null;
  country: string;
  latitude: number;
  longitude: number;
  population: number | null;
  is_municipality: boolean | null;
}

const CitiesMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const { data: cities } = useQuery({
    queryKey: ['cities-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .eq('country', 'Morocco')
        .order('population', { ascending: false, nullsFirst: false });
      
      if (error) throw error;
      return data as City[];
    }
  });

  // Get unique regions with city counts
  const regionStats = cities?.reduce((acc, city) => {
    const region = city.region || 'Unknown';
    if (!acc[region]) {
      acc[region] = { count: 0, population: 0 };
    }
    acc[region].count += 1;
    acc[region].population += city.population || 0;
    return acc;
  }, {} as Record<string, { count: number; population: number }>) || {};

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current).setView(
      [31.7917, -7.0926], // Center of Morocco
      6
    );

    L.tileLayer(MAP_CONFIG.tileLayer.url, {
      attribution: MAP_CONFIG.tileLayer.attribution,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    }).addTo(mapRef.current);

    markersRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when cities or filter changes
  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !cities) return;

    markersRef.current.clearLayers();

    const filteredCities = selectedRegion 
      ? cities.filter(c => c.region === selectedRegion)
      : cities;

    filteredCities.forEach(city => {
      const color = getRegionColor(city.region);
      const size = city.population ? Math.min(Math.max(20, Math.log10(city.population) * 8), 40) : 24;

      const icon = L.divIcon({
        className: 'city-marker',
        html: `
          <div style="
            background: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <span style="color: white; font-size: ${size * 0.4}px;">🏙️</span>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([Number(city.latitude), Number(city.longitude)], { icon });
      
      marker.bindPopup(`
        <div style="min-width: 200px; padding: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="
              width: 12px; 
              height: 12px; 
              border-radius: 50%; 
              background: ${color};
            "></div>
            <strong style="font-size: 16px;">${city.name}</strong>
          </div>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            ${city.region || 'Unknown Region'}
          </p>
          ${city.population ? `
            <p style="margin: 4px 0; font-size: 13px;">
              <strong>Population:</strong> ${city.population.toLocaleString()}
            </p>
          ` : ''}
          <span style="
            display: inline-block;
            margin-top: 8px;
            font-size: 10px;
            padding: 2px 8px;
            border-radius: 12px;
            background: ${city.is_municipality ? '#10B981' : '#6B7280'};
            color: white;
          ">${city.is_municipality ? 'Municipality' : 'City'}</span>
        </div>
      `);

      marker.on('click', () => setSelectedCity(city));
      markersRef.current!.addLayer(marker);
    });

    // Fit bounds to markers if filtered
    if (selectedRegion && filteredCities.length > 0) {
      const bounds = L.latLngBounds(
        filteredCities.map(c => [Number(c.latitude), Number(c.longitude)])
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [cities, selectedRegion]);

  return (
    <div className="h-full flex flex-col">
      {/* Legend */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Moroccan Cities & Municipalities</h2>
          <Badge variant="secondary" className="ml-2">
            {cities?.length || 0} cities
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedRegion === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedRegion(null)}
          >
            All Regions
          </Badge>
          {Object.entries(REGION_COLORS).map(([region, color]) => (
            <Badge
              key={region}
              variant={selectedRegion === region ? "default" : "outline"}
              className="cursor-pointer flex items-center gap-1.5"
              style={{ 
                borderColor: color,
                backgroundColor: selectedRegion === region ? color : 'transparent',
                color: selectedRegion === region ? 'white' : 'inherit'
              }}
              onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
            >
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: color }}
              />
              {region}
              {regionStats[region] && (
                <span className="text-xs opacity-70">({regionStats[region].count})</span>
              )}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 flex relative">
        {/* Map */}
        <div ref={containerRef} className="flex-1 z-0" />
        
        {/* Selected City Panel */}
        {selectedCity && (
          <Card className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000] p-4 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getRegionColor(selectedCity.region) }}
                  />
                  <h3 className="font-bold text-lg">{selectedCity.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{selectedCity.region}</p>
              </div>
              <button 
                onClick={() => setSelectedCity(null)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              {selectedCity.population && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedCity.population.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>{selectedCity.is_municipality ? 'Municipality' : 'City'}</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground font-mono">
              {Number(selectedCity.latitude).toFixed(4)}, {Number(selectedCity.longitude).toFixed(4)}
            </div>
          </Card>
        )}

        {/* Stats Panel - Desktop */}
        <div className="hidden lg:block absolute top-4 right-4 z-[1000]">
          <Card className="p-4 w-64 shadow-xl">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Region Statistics
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {Object.entries(regionStats)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([region, stats]) => (
                  <div 
                    key={region}
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 p-1.5 rounded"
                    onClick={() => setSelectedRegion(selectedRegion === region ? null : region)}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: getRegionColor(region) }}
                      />
                      <span className="truncate max-w-[120px]">{region}</span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {stats.count} cities
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>

      <style>{`
        .city-marker:hover > div {
          transform: scale(1.2) !important;
        }
      `}</style>
    </div>
  );
};

export default CitiesMap;