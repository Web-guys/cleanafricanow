import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.heat';
import { MAP_CONFIG, getCategoryColor, getCategoryIcon } from '@/utils/mapConfig';
import type { Report } from '@/hooks/useReports';

// Extend Leaflet types for heatmap
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

interface LeafletMapProps {
  reports: Report[] | undefined;
  selectedReport: Report | null;
  onMarkerClick: (report: Report) => void;
  onMapClick?: (lat: number, lng: number) => void;
  showHeatmap?: boolean;
  mapRef?: React.MutableRefObject<L.Map | null>;
}

const LeafletMap = ({ reports, selectedReport, onMarkerClick, onMapClick, showHeatmap = false, mapRef: externalMapRef }: LeafletMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Fix for default marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    const map = L.map(containerRef.current, {
      zoomControl: false, // We use custom controls
    }).setView(
      MAP_CONFIG.defaultCenter,
      MAP_CONFIG.defaultZoom
    );
    
    mapRef.current = map;
    if (externalMapRef) externalMapRef.current = map;

    L.tileLayer(MAP_CONFIG.tileLayer.url, {
      attribution: MAP_CONFIG.tileLayer.attribution,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
    }).addTo(map);

    // Initialize marker cluster group with custom styling
    clusterGroupRef.current = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        let size = 'small';
        let diameter = 40;
        
        if (count > 50) {
          size = 'large';
          diameter = 56;
        } else if (count > 10) {
          size = 'medium';
          diameter = 48;
        }

        return L.divIcon({
          html: `
            <div class="cluster-marker cluster-${size}" style="
              background: linear-gradient(135deg, hsl(145, 63%, 42%), hsl(145, 63%, 35%));
              width: ${diameter}px;
              height: ${diameter}px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.3);
              color: white;
              font-weight: 600;
              font-size: ${count > 99 ? '12px' : '14px'};
            ">
              ${count}
            </div>
          `,
          className: 'custom-cluster-icon',
          iconSize: L.point(diameter, diameter),
          iconAnchor: [diameter / 2, diameter / 2],
        });
      },
    });

    mapRef.current.addLayer(clusterGroupRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle map clicks for creating reports
  useEffect(() => {
    if (!mapRef.current || !onMapClick) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Remove existing temp marker
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
      }

      // Add temporary marker at click location
      const tempIcon = L.divIcon({
        className: 'temp-marker',
        html: `
          <div style="
            background: hsl(145, 63%, 42%);
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 16px rgba(0,0,0,0.4);
            font-size: 20px;
            animation: pulse 1.5s ease-in-out infinite;
          ">
            📍
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      tempMarkerRef.current = L.marker([lat, lng], { 
        icon: tempIcon,
        draggable: true 
      }).addTo(mapRef.current!);

      // Update position on drag
      tempMarkerRef.current.on('dragend', (event) => {
        const marker = event.target;
        const position = marker.getLatLng();
        onMapClick(position.lat, position.lng);
      });

      onMapClick(lat, lng);
    };

    mapRef.current.on('click', handleMapClick);

    return () => {
      mapRef.current?.off('click', handleMapClick);
    };
  }, [onMapClick]);

  // Clear temp marker function
  const clearTempMarker = useCallback(() => {
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }
  }, []);

  // Expose clearTempMarker through a custom event
  useEffect(() => {
    const handleClearMarker = () => clearTempMarker();
    window.addEventListener('clearTempMarker', handleClearMarker);
    return () => window.removeEventListener('clearTempMarker', handleClearMarker);
  }, [clearTempMarker]);

  // Update markers when reports change
  useEffect(() => {
    if (!mapRef.current || !clusterGroupRef.current) return;

    // Clear existing markers from cluster group
    clusterGroupRef.current.clearLayers();

    // Add new markers to cluster group
    reports?.forEach(report => {
      const color = getCategoryColor(report.category);
      const emoji = getCategoryIcon(report.category);

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            ${emoji}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
      });

      const marker = L.marker([report.latitude, report.longitude], { icon })
        .bindPopup(`
          <div style="min-width: 220px; padding: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 20px;">${emoji}</span>
              <strong style="font-size: 14px; text-transform: capitalize;">${report.category.replace('_', ' ')}</strong>
            </div>
            <p style="margin: 8px 0; font-size: 13px; color: #666; line-height: 1.4;">${report.description.slice(0, 100)}${report.description.length > 100 ? '...' : ''}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
              <span style="font-size: 11px; color: #999;">${new Date(report.created_at!).toLocaleDateString()}</span>
              <span style="
                font-size: 10px;
                padding: 2px 8px;
                border-radius: 12px;
                background: ${report.status === 'resolved' ? '#10B981' : report.status === 'in_progress' ? '#3B82F6' : '#F59E0B'};
                color: white;
                text-transform: capitalize;
              ">${report.status?.replace('_', ' ')}</span>
            </div>
          </div>
        `);

      marker.on('click', () => onMarkerClick(report));
      clusterGroupRef.current!.addLayer(marker);
    });
  }, [reports, onMarkerClick]);

  // Handle heatmap layer
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!showHeatmap || !reports?.length) return;

    // Create heatmap data with intensity based on status
    const heatData: Array<[number, number, number]> = reports.map(report => {
      let intensity = 0.5;
      if (report.status === 'pending') intensity = 1.0;
      else if (report.status === 'in_progress') intensity = 0.7;
      else if (report.status === 'resolved') intensity = 0.2;
      return [report.latitude, report.longitude, intensity];
    });

    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 12,
      max: 1.0,
      gradient: {
        0.2: '#22c55e',
        0.4: '#eab308',
        0.6: '#f97316',
        0.8: '#ef4444',
        1.0: '#dc2626',
      },
    });

    heatLayerRef.current.addTo(mapRef.current);
  }, [reports, showHeatmap]);

  // Fly to selected report
  useEffect(() => {
    if (!mapRef.current || !selectedReport) return;
    mapRef.current.flyTo([selectedReport.latitude, selectedReport.longitude], 14, {
      duration: 1,
    });
  }, [selectedReport]);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .custom-marker:hover > div {
          transform: scale(1.15) !important;
        }
        .custom-cluster-icon {
          background: transparent !important;
        }
      `}</style>
      <div ref={containerRef} className="h-full w-full z-0" />
    </>
  );
};

export default LeafletMap;