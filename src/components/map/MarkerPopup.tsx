import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategoryColor } from "@/utils/mapConfig";
import CategoryIcon from "./CategoryIcon";
import type { Report } from "@/hooks/useReports";

interface MarkerPopupProps {
  report: Report;
}

const MarkerPopup = ({ report }: MarkerPopupProps) => {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/20 text-warning border-warning';
      case 'in_progress': return 'bg-info/20 text-info border-info';
      case 'resolved': return 'bg-success/20 text-success border-success';
      default: return 'bg-muted';
    }
  };

  const categoryColor = getCategoryColor(report.category);

  return (
    <div className="min-w-[280px] max-w-[320px] p-1 relative overflow-hidden">
      {/* Moroccan decorative top border */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${categoryColor}, transparent)` 
        }}
      />
      
      <div className="space-y-3 pt-1">
        {/* Header with icon and category */}
        <div className="flex items-start gap-3">
          <div 
            className="p-2 rounded-xl shadow-md relative overflow-hidden"
            style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
          >
            {/* Moroccan star decoration */}
            <svg 
              className="absolute inset-0 w-full h-full opacity-10 animate-moroccan-star" 
              viewBox="0 0 24 24"
            >
              <polygon 
                points="12,2 14,9 21,9 15,14 17,21 12,17 7,21 9,14 3,9 10,9" 
                fill={categoryColor}
              />
            </svg>
            <CategoryIcon 
              category={report.category} 
              size={24}
              className="relative z-10"
            />
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            <Badge 
              className="text-white shadow-sm"
              style={{ backgroundColor: categoryColor }}
            >
              {t(`report.categories.${report.category}`)}
            </Badge>
            <Badge className={`${getStatusColor(report.status)}`} variant="outline">
              {t(`report.status.${report.status?.replace('_', '') || 'pending'}`)}
            </Badge>
          </div>
        </div>

        {/* Description with Moroccan quote style */}
        <div className="relative pl-3 border-l-2 border-moroccan-gold/50">
          <p className="text-sm text-foreground leading-relaxed line-clamp-3">
            {report.description}
          </p>
        </div>

        {/* Meta info */}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-moroccan-teal" />
            <span>{new Date(report.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-moroccan-terracotta" />
            <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
          </div>
        </div>

        {/* Action button with Moroccan styling */}
        <Button 
          size="sm" 
          className="w-full bg-gradient-to-r from-primary to-moroccan-teal hover:from-primary/90 hover:to-moroccan-teal/90 text-white border-0 shadow-md" 
          asChild
        >
          <Link to={`/report?lat=${report.latitude}&lng=${report.longitude}`}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            {t('admin.dashboard.view')}
          </Link>
        </Button>
      </div>
      
      {/* Moroccan decorative corner */}
      <svg 
        className="absolute bottom-0 right-0 w-8 h-8 text-moroccan-gold/20 pointer-events-none"
        viewBox="0 0 32 32"
      >
        <path d="M32,0 L32,32 L0,32 Q16,32 32,16 Q32,0 32,0 Z" fill="currentColor" />
        <path d="M32,8 L32,32 L8,32" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      </svg>
    </div>
  );
};

export default MarkerPopup;
