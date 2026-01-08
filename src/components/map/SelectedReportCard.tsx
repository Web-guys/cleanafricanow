import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Calendar, MapPin, Navigation, ExternalLink, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategoryIcon, getCategoryColor } from "@/utils/mapConfig";
import type { Report } from "@/hooks/useReports";
import { cn } from "@/lib/utils";

interface SelectedReportCardProps {
  report: Report;
  onClose: () => void;
}

const SelectedReportCard = ({ report, onClose }: SelectedReportCardProps) => {
  const { t } = useTranslation();

  const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
    pending: { color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    in_progress: { color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    verified: { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
    resolved: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    rejected: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
  };

  const status = statusConfig[report.status || 'pending'];

  const openInMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`,
      '_blank'
    );
  };

  return (
    <Card className="border-primary/20 shadow-lg overflow-hidden animate-fade-in">
      {/* Header with gradient */}
      <div 
        className="h-2"
        style={{ backgroundColor: getCategoryColor(report.category) }}
      />
      
      <CardHeader className="pb-3 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: `${getCategoryColor(report.category)}15` }}
            >
              {getCategoryIcon(report.category)}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold capitalize">
                {report.category.replace('_', ' ')}
              </CardTitle>
              <Badge 
                variant="outline" 
                className={cn("text-[10px] mt-1", status.bg, status.color, status.border)}
              >
                {t(`report.status.${(report.status || 'pending').replace('_', '')}`)}
              </Badge>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0 -mr-2 -mt-1" 
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pb-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {report.description}
        </p>
        
        {/* Meta Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(report.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button 
            size="sm" 
            className="flex-1 h-9"
            onClick={openInMaps}
          >
            <Navigation className="w-3.5 h-3.5 mr-1.5" />
            Directions
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="h-9"
            onClick={() => window.open(`https://www.google.com/maps?q=${report.latitude},${report.longitude}`, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectedReportCard;
