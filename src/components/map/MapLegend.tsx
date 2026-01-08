import { useTranslation } from "react-i18next";
import { getCategoryColor, getCategoryIcon } from "@/utils/mapConfig";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";

interface MapLegendProps {
  className?: string;
}

const categories = [
  'waste', 'pollution', 'danger', 'noise', 'water', 'air', 'illegal_dumping', 'deforestation'
] as const;

const statuses = [
  { key: 'pending', label: 'Pending', color: 'bg-amber-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'resolved', label: 'Resolved', color: 'bg-emerald-500' },
] as const;

const MapLegend = ({ className }: MapLegendProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn(
      "bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 overflow-hidden transition-all duration-300",
      isExpanded ? "w-64" : "w-auto",
      className
    )}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors"
      >
        <Info className="h-4 w-4 text-primary" />
        <span className={cn(
          "text-sm font-medium flex-1 text-left transition-opacity",
          isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
        )}>
          Map Legend
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-4 animate-fade-in">
          {/* Categories */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Categories
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <div key={cat} className="flex items-center gap-2 text-xs">
                  <span className="text-base">{getCategoryIcon(cat)}</span>
                  <span className="capitalize truncate">
                    {t(`report.categories.${cat}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Statuses */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Status
            </h4>
            <div className="space-y-1.5">
              {statuses.map((status) => (
                <div key={status.key} className="flex items-center gap-2 text-xs">
                  <div className={cn("w-3 h-3 rounded-full", status.color)} />
                  <span>{status.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Heatmap Intensity
            </h4>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
