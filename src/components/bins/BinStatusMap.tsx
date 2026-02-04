import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useBins, WasteBin, BinStatus } from "@/hooks/useWasteBins";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getStatusColor } from "./BinStatusBadge";

interface BinStatusMapProps {
  cityId?: string;
  onBinSelect?: (bin: WasteBin) => void;
  selectedBinId?: string;
  height?: string;
}

const statusLabels: Record<BinStatus, string> = {
  empty: "Empty",
  half_full: "Half Full",
  almost_full: "Almost Full",
  full: "Full",
  overflowing: "Overflowing!",
  damaged: "Damaged",
  missing: "Missing",
};

export const BinStatusMap = ({ 
  cityId, 
  onBinSelect, 
  selectedBinId,
  height = "500px" 
}: BinStatusMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { data: bins, isLoading } = useBins(cityId);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map centered on Morocco
    mapRef.current = L.map(containerRef.current).setView([31.7917, -7.0926], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !bins) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    bins.forEach((bin) => {
      const color = getStatusColor(bin.current_status);
      const isSelected = bin.id === selectedBinId;
      
      // Create custom icon
      const icon = L.divIcon({
        className: 'custom-bin-marker',
        html: `
          <div style="
            width: ${isSelected ? '32px' : '24px'};
            height: ${isSelected ? '32px' : '24px'};
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            ${isSelected ? 'transform: scale(1.2);' : ''}
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </div>
        `,
        iconSize: [isSelected ? 32 : 24, isSelected ? 32 : 24],
        iconAnchor: [isSelected ? 16 : 12, isSelected ? 16 : 12],
      });

      const marker = L.marker([bin.latitude, bin.longitude], { icon })
        .addTo(mapRef.current!);

      // Add popup
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${bin.bin_code}</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="
              display: inline-block;
              padding: 2px 8px;
              background: ${color}20;
              color: ${color};
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            ">${statusLabels[bin.current_status]}</span>
          </div>
          <div style="font-size: 12px; color: #666;">
            ${bin.district ? `<div>${bin.district}</div>` : ''}
            ${bin.street ? `<div>${bin.street}</div>` : ''}
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onBinSelect) {
          onBinSelect(bin);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if there are bins
    if (bins.length > 0) {
      const bounds = L.latLngBounds(bins.map(b => [b.latitude, b.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bins, selectedBinId, onBinSelect]);

  if (isLoading) {
    return <Skeleton className="w-full" style={{ height }} />;
  }

  return (
    <Card className="overflow-hidden">
      <div ref={containerRef} style={{ height, width: '100%' }} />
      
      {/* Legend */}
      <div className="p-3 border-t bg-muted/30 flex flex-wrap gap-4 text-xs">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: getStatusColor(status as BinStatus) }}
            />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
