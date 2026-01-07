import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategoryIcon } from "@/utils/mapConfig";
import type { Report } from "@/hooks/useReports";

interface ReportsListProps {
  reports: Report[] | undefined;
  isLoading: boolean;
  selectedReportId: string | null;
  onReportClick: (report: Report) => void;
}

const ReportsList = ({ reports, isLoading, selectedReportId, onReportClick }: ReportsListProps) => {
  const { t } = useTranslation();

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'waste': return 'bg-success/10 text-success border-success/30';
      case 'pollution': return 'bg-warning/10 text-warning border-warning/30';
      case 'danger': return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'noise': return 'bg-purple-500/10 text-purple-500 border-purple-500/30';
      case 'water': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'air': return 'bg-teal-500/10 text-teal-500 border-teal-500/30';
      case 'illegal_dumping': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'deforestation': return 'bg-green-600/10 text-green-600 border-green-600/30';
      default: return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-3">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!reports?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No reports found</p>
        <p className="text-xs text-muted-foreground/70">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-380px)]">
      <div className="space-y-2 pr-3">
        {reports.slice(0, 20).map((report) => (
          <Card
            key={report.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/30 ${
              selectedReportId === report.id 
                ? 'border-primary shadow-md ring-1 ring-primary/20' 
                : 'border-border/50'
            }`}
            onClick={() => onReportClick(report)}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-2.5">
                <span className="text-lg">{getCategoryIcon(report.category)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 ${getCategoryStyle(report.category)}`}
                    >
                      {t(`report.categories.${report.category}`)}
                    </Badge>
                  </div>
                  <p className="text-sm line-clamp-2 text-foreground/90 leading-snug">
                    {report.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ReportsList;
