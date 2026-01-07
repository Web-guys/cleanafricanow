import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, X, Calendar, MapPin, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategoryIcon } from "@/utils/mapConfig";
import type { Report } from "@/hooks/useReports";

interface SelectedReportCardProps {
  report: Report;
  onClose: () => void;
}

const SelectedReportCard = ({ report, onClose }: SelectedReportCardProps) => {
  const { t } = useTranslation();

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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/10 text-warning border-warning/30';
      case 'in_progress': return 'bg-info/10 text-info border-info/30';
      case 'resolved': return 'bg-success/10 text-success border-success/30';
      default: return 'bg-muted';
    }
  };

  const openInMaps = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`,
      '_blank'
    );
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-xl">{getCategoryIcon(report.category)}</span>
            {t('map.reportDetails')}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7 -mr-2 -mt-1" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge className={getCategoryStyle(report.category)}>
            {t(`report.categories.${report.category}`)}
          </Badge>
          <Badge className={getStatusStyle(report.status || 'pending')} variant="outline">
            {t(`report.status.${(report.status || 'pending').replace('_', '')}`)}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {report.description}
        </p>
        
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('map.reported')}: {new Date(report.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={openInMaps}>
          <Navigation className="w-3.5 h-3.5 mr-1.5" />
          Get Directions
        </Button>
      </CardContent>
    </Card>
  );
};

export default SelectedReportCard;
