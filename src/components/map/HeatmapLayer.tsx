import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
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

interface HeatmapLayerProps {
  map: L.Map | null;
  reports: Report[] | undefined;
  visible: boolean;
}

const HeatmapLayer = ({ map, reports, visible }: HeatmapLayerProps) => {
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!map) return;

    // Remove existing layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!visible || !reports?.length) return;

    // Create heatmap data with intensity based on status
    const heatData: Array<[number, number, number]> = reports.map(report => {
      // Higher intensity for unresolved reports
      let intensity = 0.5;
      if (report.status === 'pending') intensity = 1.0;
      else if (report.status === 'in_progress') intensity = 0.7;
      else if (report.status === 'resolved') intensity = 0.2;

      return [report.latitude, report.longitude, intensity];
    });

    // Create and add heat layer
    heatLayerRef.current = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 12,
      max: 1.0,
      gradient: {
        0.2: '#22c55e', // green - resolved
        0.4: '#eab308', // yellow
        0.6: '#f97316', // orange
        0.8: '#ef4444', // red
        1.0: '#dc2626', // dark red - hot spots
      },
    });

    heatLayerRef.current.addTo(map);

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, reports, visible]);

  return null;
};

export default HeatmapLayer;