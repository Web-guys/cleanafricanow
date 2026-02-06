import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SEOHead } from "@/components/seo/SEOHead";
import { useBins, WasteBin, BinStatus } from "@/hooks/useWasteBins";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  X,
  Share2,
  Copy,
  Navigation,
  Check
} from "lucide-react";
import { getStatusColor, BinStatusBadge } from "@/components/bins/BinStatusBadge";
import { PublicBinReportDialog } from "@/components/bins/PublicBinReportDialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [selectedBin, setSelectedBin] = useState<WasteBin | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  const { data: bins, isLoading } = useBins();

  // Handle deep linking to specific bin
  useEffect(() => {
    const binId = searchParams.get('bin');
    if (binId && bins) {
      const bin = bins.find(b => b.id === binId);
      if (bin) {
        setSelectedBin(bin);
        setTimeout(() => {
          mapRef.current?.flyTo([bin.latitude, bin.longitude], 17, { duration: 1 });
        }, 500);
      }
    }
  }, [searchParams, bins]);

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

    // Fit bounds if there are bins (only on initial load, not when selecting)
    if (bins.length > 0 && !searchParams.get('bin')) {
      const bounds = L.latLngBounds(bins.map(b => [b.latitude, b.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [bins, searchParams]);

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
      window.location.href = '/auth?redirect=/bins-map';
      return;
    }
    setReportDialogOpen(true);
  };

  const getBinShareUrl = (bin: WasteBin) => {
    return `${window.location.origin}/bins-map?bin=${bin.id}`;
  };

  const handleCopyLink = async (bin: WasteBin) => {
    const url = getBinShareUrl(bin);
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      toast({
        title: "Lien copié!",
        description: "Le lien de la poubelle a été copié dans le presse-papier.",
      });
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le lien.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (bin: WasteBin) => {
    const url = getBinShareUrl(bin);
    const title = `Poubelle ${bin.bin_code}`;
    const text = `État: ${statusLabels[bin.current_status]} - ${bin.street || bin.district || "Voir sur la carte"}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      handleCopyLink(bin);
    }
  };

  const handleNavigate = (bin: WasteBin) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${bin.latitude},${bin.longitude}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppShare = (bin: WasteBin) => {
    const url = getBinShareUrl(bin);
    const text = `🗑️ Poubelle ${bin.bin_code}\n📍 ${bin.street || bin.district || "Voir localisation"}\n${statusEmojis[bin.current_status]} État: ${statusLabels[bin.current_status]}\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SEOHead 
        title="Carte des Poubelles | Clean Africa Now"
        description="Trouvez et signalez l'état des poubelles près de chez vous"
      />
      
      {/* Header */}
      <header className="bg-card border-b px-3 sm:px-4 py-3 flex items-center justify-between z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/map">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Carte des Poubelles
            </h1>
            <p className="text-xs text-muted-foreground">
              {bins?.length || 0} poubelles • Cliquez pour signaler
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowLegend(!showLegend)}
            className="gap-1"
          >
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Légende</span>
          </Button>
        </div>
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

        {/* Selected Bin Card - Enhanced */}
        {selectedBin && (
          <Card className={cn(
            "absolute bottom-24 left-3 right-3 z-[1000] shadow-xl animate-fade-in",
            "sm:left-4 sm:right-4 md:left-auto md:right-4 md:w-96"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-lg">{selectedBin.bin_code}</span>
                    <BinStatusBadge status={selectedBin.current_status} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
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
                  className="shrink-0 -mr-2 -mt-2"
                  onClick={() => setSelectedBin(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Action Buttons - Enhanced */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button 
                  className="gap-2"
                  onClick={handleReportClick}
                >
                  <AlertCircle className="h-4 w-4" />
                  Signaler
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Partager
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleShare(selectedBin)}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager...
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCopyLink(selectedBin)}>
                      {linkCopied ? (
                        <Check className="h-4 w-4 mr-2 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copier le lien
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleWhatsAppShare(selectedBin)}>
                      <span className="mr-2">💬</span>
                      Envoyer via WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigate(selectedBin)}>
                      <Navigation className="h-4 w-4 mr-2" />
                      Itinéraire
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Quick share row */}
              <div className="mt-3 flex items-center justify-center gap-3 pt-3 border-t">
                <button
                  onClick={() => handleWhatsAppShare(selectedBin)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="text-lg">💬</span>
                  WhatsApp
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  onClick={() => handleCopyLink(selectedBin)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {linkCopied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  {linkCopied ? "Copié!" : "Copier lien"}
                </button>
                <span className="text-muted-foreground">•</span>
                <button
                  onClick={() => handleNavigate(selectedBin)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Navigation className="h-3 w-3" />
                  Y aller
                </button>
              </div>
              
              {!user && (
                <p className="text-xs text-muted-foreground mt-3 text-center bg-muted/50 rounded-lg py-2">
                  <Link to="/auth?redirect=/bins-map" className="text-primary hover:underline">
                    Connectez-vous
                  </Link> pour signaler l'état
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions (Mobile) */}
        <div className={cn(
          "absolute bottom-24 left-4 right-4 z-[1000] flex justify-between items-end",
          "md:hidden transition-opacity duration-200",
          selectedBin && "opacity-0 pointer-events-none"
        )}>
          <Button
            variant="secondary"
            size="lg"
            className="shadow-lg bg-card backdrop-blur-md border gap-2"
            onClick={handleLocate}
          >
            <Locate className="h-5 w-5" />
            Ma position
          </Button>
          
          <Button
            size="lg"
            className="shadow-xl gap-2 rounded-full"
            onClick={() => {
              if (bins && bins.length > 0) {
                // Find nearest bin if we have location
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const userLat = position.coords.latitude;
                      const userLng = position.coords.longitude;
                      
                      // Find nearest bin
                      let nearest = bins[0];
                      let minDist = Infinity;
                      bins.forEach(bin => {
                        const dist = Math.sqrt(
                          Math.pow(bin.latitude - userLat, 2) + 
                          Math.pow(bin.longitude - userLng, 2)
                        );
                        if (dist < minDist) {
                          minDist = dist;
                          nearest = bin;
                        }
                      });
                      
                      setSelectedBin(nearest);
                      mapRef.current?.flyTo([nearest.latitude, nearest.longitude], 17, { duration: 0.5 });
                    },
                    () => {
                      // Fallback to first bin
                      setSelectedBin(bins[0]);
                    }
                  );
                } else {
                  setSelectedBin(bins[0]);
                }
              }
            }}
          >
            <Trash2 className="h-5 w-5" />
            Trouver
          </Button>
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
