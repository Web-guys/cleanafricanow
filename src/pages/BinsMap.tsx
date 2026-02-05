import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SEOHead } from "@/components/seo/SEOHead";
import { useBins, WasteBin, BinStatus } from "@/hooks/useWasteBins";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  MapPin, 
  Trash2, 
  AlertCircle, 
  ZoomIn, 
  ZoomOut, 
  Locate,
  Info,
  X
} from "lucide-react";
import { getStatusColor, BinStatusBadge } from "@/components/bins/BinStatusBadge";
import { PublicBinReportDialog } from "@/components/bins/PublicBinReportDialog";
import { cn } from "@/lib/utils";

const statusLabels: Record<BinStatus, string> = {
  empty: "Vide",
  half_full: "Mi-plein",
  almost_full: "Presque plein",
  full: "Plein",
  overflowing: "Débordant!",
  damaged: "Endommagé",
  missing: "Manquant",
};

const statusEmojis: Record<BinStatus, string> = {
  empty: "✅",
  half_full: "🟡",
  almost_full: "🟠",
  full: "🔴",
  overflowing: "⚠️",
  damaged: "🔧",
  missing: "❓",
};

const BinsMap = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [selectedBin, setSelectedBin] = useState<WasteBin | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  
  const { data: bins, isLoading } = useBins();

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
    }).setView([31.7917, -7.0926], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when bins change
  useEffect(() => {
    if (!mapRef.current || !bins) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    bins.forEach((bin) => {
      const color = getStatusColor(bin.current_status);
      const emoji = statusEmojis[bin.current_status];
      
      const icon = L.divIcon({
        className: 'custom-bin-marker',
        html: `
          <div style="
            width: 40px;
            height: 40px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${emoji}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([bin.latitude, bin.longitude], { icon })
        .addTo(mapRef.current!);

      marker.on('click', () => {
        setSelectedBin(bin);
        mapRef.current?.flyTo([bin.latitude, bin.longitude], 16, { duration: 0.5 });
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if there are bins
    if (bins.length > 0) {
      const bounds = L.latLngBounds(bins.map(b => [b.latitude, b.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [bins]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current?.flyTo(
            [position.coords.latitude, position.coords.longitude],
            16,
            { duration: 1 }
          );
        },
        (error) => console.error('Geolocation error:', error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    }
  }, []);

  const handleReportClick = () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/auth?redirect=/bins-map';
      return;
    }
    setReportDialogOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SEOHead 
        title="Carte des Poubelles | Clean Africa Now"
        description="Trouvez et signalez l'état des poubelles près de chez vous"
      />
      
      {/* Header */}
      <header className="bg-card border-b px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/map">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-primary" />
              Carte des Poubelles
            </h1>
            <p className="text-xs text-muted-foreground">
              {bins?.length || 0} poubelles • Cliquez pour signaler
            </p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowLegend(!showLegend)}
        >
          <Info className="h-4 w-4" />
        </Button>
      </header>

      {/* Map Container */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Skeleton className="w-full h-full" />
          </div>
        ) : (
          <div ref={containerRef} className="h-full w-full" />
        )}

        {/* Legend Panel */}
        {showLegend && (
          <Card className="absolute top-4 left-4 z-[1000] w-64 shadow-lg animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Légende</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setShowLegend(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <div key={status} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow flex items-center justify-center text-xs"
                      style={{ backgroundColor: getStatusColor(status as BinStatus) }}
                    >
                      {statusEmojis[status as BinStatus]}
                    </div>
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Controls */}
        <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[1000] flex flex-col gap-2">
          <Button variant="secondary" size="icon" onClick={handleZoomIn} className="shadow-lg">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={handleZoomOut} className="shadow-lg">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" onClick={handleLocate} className="shadow-lg">
            <Locate className="h-4 w-4" />
          </Button>
        </div>

        {/* Selected Bin Card */}
        {selectedBin && (
          <Card className={cn(
            "absolute bottom-24 left-4 right-4 z-[1000] shadow-xl animate-fade-in",
            "md:left-auto md:right-4 md:w-80"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{selectedBin.bin_code}</span>
                    <BinStatusBadge status={selectedBin.current_status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedBin.street || selectedBin.district || "Emplacement"}
                  </p>
                  {selectedBin.cities && (
                    <p className="text-xs text-muted-foreground mt-1">
                      📍 {selectedBin.cities.name}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setSelectedBin(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-4 flex gap-2">
                <Button 
                  className="flex-1 gap-2"
                  onClick={handleReportClick}
                >
                  <AlertCircle className="h-4 w-4" />
                  Signaler l'état
                </Button>
              </div>
              
              {!user && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Connectez-vous pour signaler
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Action Button (Mobile) */}
        <div className="absolute bottom-24 right-4 z-[1000] md:hidden">
          {!selectedBin && (
            <Button
              size="lg"
              className="shadow-xl gap-2 rounded-full"
              onClick={() => {
                if (bins && bins.length > 0) {
                  // Select nearest bin or first one
                  setSelectedBin(bins[0]);
                }
              }}
            >
              <Trash2 className="h-5 w-5" />
              Trouver une poubelle
            </Button>
          )}
        </div>
      </div>

      {/* Report Dialog */}
      {selectedBin && (
        <PublicBinReportDialog
          bin={selectedBin}
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
        />
      )}
    </div>
  );
};

export default BinsMap;
