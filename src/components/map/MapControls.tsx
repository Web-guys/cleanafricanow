import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { 
  Flame, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Locate,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  heatmapEnabled: boolean;
  onHeatmapToggle: (enabled: boolean) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onLocate?: () => void;
  onFullscreen?: () => void;
  className?: string;
}

const MapControls = ({
  heatmapEnabled,
  onHeatmapToggle,
  onZoomIn,
  onZoomOut,
  onLocate,
  onFullscreen,
  className,
}: MapControlsProps) => {
  return (
    <div className={cn(
      "flex flex-col gap-2 bg-card/95 backdrop-blur-md rounded-xl p-1.5 shadow-lg border border-border/50",
      className
    )}>
      {/* Heatmap Toggle */}
      <Toggle
        pressed={heatmapEnabled}
        onPressedChange={onHeatmapToggle}
        aria-label="Toggle heatmap"
        className={cn(
          "w-10 h-10 p-0 data-[state=on]:bg-orange-500/20 data-[state=on]:text-orange-500",
          "hover:bg-muted transition-colors"
        )}
      >
        <Flame className="h-4 w-4" />
      </Toggle>

      <div className="w-full h-px bg-border/50" />

      {/* Zoom Controls */}
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 hover:bg-muted"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 hover:bg-muted"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <div className="w-full h-px bg-border/50" />

      {/* Location */}
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 hover:bg-muted"
        onClick={onLocate}
        aria-label="My location"
      >
        <Locate className="h-4 w-4" />
      </Button>

      {/* Fullscreen */}
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 hover:bg-muted"
        onClick={onFullscreen}
        aria-label="Fullscreen"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MapControls;
