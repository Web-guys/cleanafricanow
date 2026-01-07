import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, FileText } from "lucide-react";

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number;
  longitude: number;
}

const CreateReportDialog = ({
  open,
  onOpenChange,
  latitude,
  longitude,
}: CreateReportDialogProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCreateReport = () => {
    // Clear the temp marker
    window.dispatchEvent(new Event('clearTempMarker'));
    
    // Navigate to report page with coordinates
    navigate(`/report?lat=${latitude.toFixed(6)}&lng=${longitude.toFixed(6)}`);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Clear the temp marker
    window.dispatchEvent(new Event('clearTempMarker'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t('report.title')}
          </DialogTitle>
          <DialogDescription>
            {t('report.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Location preview */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Navigation className="h-4 w-4 text-primary" />
              {t('report.location')}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">{t('report.latitude')}:</span>
                <p className="font-mono font-medium">{latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">{t('report.longitude')}:</span>
                <p className="font-mono font-medium">{longitude.toFixed(6)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tip: Drag the marker to adjust the location
            </p>
          </div>

          {/* Quick action hint */}
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <FileText className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              You'll be redirected to fill in the report details including category, description, and photos.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreateReport} className="gap-2">
            <FileText className="h-4 w-4" />
            Continue to Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReportDialog;