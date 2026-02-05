import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, Check, Loader2, Trash2 } from "lucide-react";
import { useReportBinStatus, BinStatus, WasteBin } from "@/hooks/useWasteBins";
import { BinStatusBadge, getStatusColor } from "./BinStatusBadge";
import { cn } from "@/lib/utils";

interface PublicBinReportDialogProps {
  bin: WasteBin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions: { value: BinStatus; label: string; emoji: string; description: string }[] = [
  { value: "empty", label: "Vide", emoji: "✅", description: "La poubelle est vide ou presque" },
  { value: "half_full", label: "Mi-plein", emoji: "🟡", description: "Environ 50% remplie" },
  { value: "almost_full", label: "Presque plein", emoji: "🟠", description: "75-90% remplie" },
  { value: "full", label: "Plein", emoji: "🔴", description: "Complètement pleine" },
  { value: "overflowing", label: "Débordant", emoji: "⚠️", description: "Déchets qui débordent" },
  { value: "damaged", label: "Endommagé", emoji: "🔧", description: "Poubelle cassée ou abîmée" },
  { value: "missing", label: "Manquant", emoji: "❓", description: "Poubelle absente" },
];

export const PublicBinReportDialog = ({ bin, open, onOpenChange }: PublicBinReportDialogProps) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<BinStatus | "">("");
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  
  const reportStatus = useReportBinStatus();

  const handleSubmit = async () => {
    if (!status) return;

    await reportStatus.mutateAsync({
      bin_id: bin.id,
      reported_status: status,
      notes: notes || undefined,
    });

    setSuccess(true);
    setTimeout(() => {
      onOpenChange(false);
      setSuccess(false);
      setStatus("");
      setNotes("");
    }, 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSuccess(false);
    setStatus("");
    setNotes("");
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Merci pour votre signalement!</h3>
            <p className="text-muted-foreground">
              Votre contribution aide à maintenir notre ville propre.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Signaler l'état de la poubelle
          </DialogTitle>
          <DialogDescription>
            Aidez-nous à savoir quand les poubelles doivent être vidées
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Bin Info */}
          <div className="p-3 rounded-lg bg-muted/50 border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{bin.bin_code}</p>
              <p className="text-sm text-muted-foreground">
                {bin.street || bin.district || "Emplacement non spécifié"}
              </p>
            </div>
            <BinStatusBadge status={bin.current_status} />
          </div>

          {/* Status Selection - Visual Grid */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Quel est l'état actuel? *</Label>
            <RadioGroup 
              value={status} 
              onValueChange={(v) => setStatus(v as BinStatus)}
              className="grid grid-cols-2 gap-2"
            >
              {statusOptions.map((option) => (
                <Label
                  key={option.value}
                  htmlFor={option.value}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    status === option.value 
                      ? "border-primary bg-primary/10" 
                      : "border-border"
                  )}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={option.value}
                    className="sr-only"
                  />
                  <span className="text-xl">{option.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{option.label}</p>
                  </div>
                  {status === option.value && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </Label>
              ))}
            </RadioGroup>
            
            {status && (
              <p className="text-sm text-muted-foreground mt-2">
                {statusOptions.find(o => o.value === status)?.description}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes additionnelles (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Débordement de cartons, mauvaise odeur..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!status || reportStatus.isPending}
            className="gap-2"
          >
            {reportStatus.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
