import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Calendar, Clock, ExternalLink } from "lucide-react";
import { getCategoryIcon, getCategoryColor } from "@/utils/mapConfig";
import type { Report } from "@/hooks/useReports";
import { useTranslation } from "react-i18next";

interface ReportBottomSheetProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportBottomSheet = ({ report, open, onOpenChange }: ReportBottomSheetProps) => {
  const { t } = useTranslation();

  if (!report) return null;

  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-warning-foreground',
    in_progress: 'bg-info text-info-foreground',
    verified: 'bg-primary text-primary-foreground',
    resolved: 'bg-success text-success-foreground',
    rejected: 'bg-destructive text-destructive-foreground',
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: `${getCategoryColor(report.category)}20` }}
              >
                {getCategoryIcon(report.category)}
              </div>
              <div>
                <DrawerTitle className="capitalize">
                  {report.category.replace('_', ' ')}
                </DrawerTitle>
                <Badge className={statusColors[report.status || 'pending']}>
                  {report.status?.replace('_', ' ') || 'pending'}
                </Badge>
              </div>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-4 overflow-y-auto">
          {/* Description */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
            <p className="text-foreground">{report.description}</p>
          </div>

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Photos</h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {report.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Report photo ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{Number(report.latitude).toFixed(4)}, {Number(report.longitude).toFixed(4)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{report.created_at ? new Date(report.created_at).toLocaleDateString() : '-'}</span>
            </div>

            {(report as any).priority && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Priority: <Badge variant="outline" className="capitalize">{(report as any).priority}</Badge></span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t flex gap-2">
            <Button 
              className="flex-1" 
              variant="outline"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps?q=${report.latitude},${report.longitude}`,
                  '_blank'
                );
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in Google Maps
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ReportBottomSheet;