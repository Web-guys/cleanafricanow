import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { useReportBinStatus, BinStatus, WasteBin } from "@/hooks/useWasteBins";
import { BinStatusBadge } from "./BinStatusBadge";

interface ReportBinStatusDialogProps {
  bin: WasteBin;
  trigger?: React.ReactNode;
}

const statusOptions: { value: BinStatus; label: string; description: string }[] = [
  { value: "empty", label: "Empty", description: "Bin is empty or nearly empty" },
  { value: "half_full", label: "Half Full", description: "Bin is about 50% full" },
  { value: "almost_full", label: "Almost Full", description: "Bin is 75-90% full" },
  { value: "full", label: "Full", description: "Bin is completely full" },
  { value: "overflowing", label: "Overflowing", description: "Waste is spilling out" },
  { value: "damaged", label: "Damaged", description: "Bin is broken or damaged" },
  { value: "missing", label: "Missing", description: "Bin is not at location" },
];

export const ReportBinStatusDialog = ({ bin, trigger }: ReportBinStatusDialogProps) => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<BinStatus | "">("");
  const [notes, setNotes] = useState("");
  
  const reportStatus = useReportBinStatus();

  const handleSubmit = async () => {
    if (!status) return;

    await reportStatus.mutateAsync({
      bin_id: bin.id,
      reported_status: status,
      notes: notes || undefined,
    });

    setOpen(false);
    setStatus("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            Report Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report Bin Status</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Bin Info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{bin.bin_code}</p>
                <p className="text-sm text-muted-foreground">
                  {bin.street || bin.district || "Unknown location"}
                </p>
              </div>
              <BinStatusBadge status={bin.current_status} />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label>Current Status *</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as BinStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select bin status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes</Label>
            <Textarea
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button 
            onClick={handleSubmit} 
            disabled={!status || reportStatus.isPending}
            className="w-full"
          >
            {reportStatus.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
