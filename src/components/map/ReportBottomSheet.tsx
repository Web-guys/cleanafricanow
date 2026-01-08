import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, MapPin, Calendar, Clock, ExternalLink, Navigation, Share2, Copy, Check } from "lucide-react";
import { getCategoryIcon, getCategoryColor } from "@/utils/mapConfig";
import type { Report } from "@/hooks/useReports";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReportBottomSheetProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ReportBottomSheet = ({ report, open, onOpenChange }: ReportBottomSheetProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'Pending' },
    in_progress: { color: 'text-blue-600', bg: 'bg-blue-500/10', label: 'In Progress' },
    verified: { color: 'text-primary', bg: 'bg-primary/10', label: 'Verified' },
    resolved: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', label: 'Resolved' },
    rejected: { color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejected' },
  };

  const status = statusConfig[report.status || 'pending'];

  const handleCopyLocation = async () => {
    await navigator.clipboard.writeText(`${report.latitude}, ${report.longitude}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Report: ${report.category.replace('_', ' ')}`,
          text: report.description,
          url: `https://www.google.com/maps?q=${report.latitude},${report.longitude}`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] focus:outline-none">
        {/* Drag Handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-muted" />
        </div>

        <DrawerHeader className="pb-4 pt-2">
          <div className="flex items-start gap-4">
            {/* Category Icon */}
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: `${getCategoryColor(report.category)}20` }}
            >
              {getCategoryIcon(report.category)}
            </div>
            
            {/* Title & Status */}
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-lg capitalize mb-1">
                {report.category.replace('_', ' ')}
              </DrawerTitle>
              <Badge 
                variant="outline" 
                className={cn("font-medium", status.bg, status.color)}
              >
                {status.label}
              </Badge>
            </div>

            {/* Close Button */}
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="shrink-0 -mt-1 -mr-2">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-5 overflow-y-auto">
          {/* Description */}
          <div className="bg-muted/30 rounded-xl p-4">
            <p className="text-foreground leading-relaxed">{report.description}</p>
          </div>

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Photos
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                {report.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Report photo ${idx + 1}`}
                    className="w-28 h-28 object-cover rounded-xl border border-border shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            {/* Location */}
            <button 
              onClick={handleCopyLocation}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <MapPin className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium truncate">
                  {copied ? "Copied!" : `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`}
                </p>
              </div>
            </button>
            
            {/* Date */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reported</p>
                <p className="text-sm font-medium">
                  {report.created_at ? new Date(report.created_at).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>

            {/* Priority if available */}
            {(report as any).priority && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 col-span-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <p className="text-sm font-medium capitalize">{(report as any).priority}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1" 
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`,
                  '_blank'
                );
              }}
            >
              <Navigation className="mr-2 h-4 w-4" />
              Get Directions
            </Button>
            
            {navigator.share && (
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ReportBottomSheet;
