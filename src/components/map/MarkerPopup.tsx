import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategoryIcon } from "@/utils/mapConfig";
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

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'waste': return 'bg-success text-success-foreground';
      case 'pollution': return 'bg-warning text-warning-foreground';
      case 'danger': return 'bg-destructive text-destructive-foreground';
      case 'noise': return 'bg-purple-500 text-white';
      case 'water': return 'bg-blue-500 text-white';
      case 'air': return 'bg-teal-500 text-white';
      case 'illegal_dumping': return 'bg-orange-500 text-white';
      case 'deforestation': return 'bg-green-600 text-white';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-w-[280px] max-w-[320px] p-1">
      <div className="space-y-3">
        {/* Header with icon and category */}
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getCategoryIcon(report.category)}</span>
          <div className="flex-1">
            <Badge className={getCategoryStyle(report.category)}>
              {t(`report.categories.${report.category}`)}
            </Badge>
            <Badge className={`ml-2 ${getStatusColor(report.status)}`} variant="outline">
              {t(`report.status.${report.status?.replace('_', '') || 'pending'}`)}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground leading-relaxed line-clamp-3">
          {report.description}
        </p>

        {/* Meta info */}
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(report.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</span>
          </div>
        </div>

        {/* Action button */}
        <Button size="sm" className="w-full" variant="outline" asChild>
          <Link to={`/report?lat=${report.latitude}&lng=${report.longitude}`}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            {t('admin.dashboard.view')}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default MarkerPopup;
