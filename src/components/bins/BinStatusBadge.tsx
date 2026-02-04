import { Badge } from "@/components/ui/badge";
import { BinStatus } from "@/hooks/useWasteBins";
import { cn } from "@/lib/utils";

interface BinStatusBadgeProps {
  status: BinStatus;
  size?: "sm" | "md" | "lg";
}

const statusConfig: Record<BinStatus, { label: string; className: string }> = {
  empty: { label: "Empty", className: "bg-success/20 text-success border-success/30" },
  half_full: { label: "Half Full", className: "bg-info/20 text-info border-info/30" },
  almost_full: { label: "Almost Full", className: "bg-warning/20 text-warning border-warning/30" },
  full: { label: "Full", className: "bg-moroccan-terracotta/20 text-moroccan-terracotta border-moroccan-terracotta/30" },
  overflowing: { label: "Overflowing", className: "bg-destructive/20 text-destructive border-destructive/30" },
  damaged: { label: "Damaged", className: "bg-muted text-muted-foreground border-muted" },
  missing: { label: "Missing", className: "bg-muted text-muted-foreground border-muted" },
};

export const BinStatusBadge = ({ status, size = "md" }: BinStatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className,
        size === "sm" && "text-xs px-2 py-0",
        size === "lg" && "text-sm px-3 py-1"
      )}
    >
      {config.label}
    </Badge>
  );
};

export const getStatusColor = (status: BinStatus): string => {
  const colors: Record<BinStatus, string> = {
    empty: "#22c55e",
    half_full: "#3b82f6",
    almost_full: "#f59e0b",
    full: "#f97316",
    overflowing: "#ef4444",
    damaged: "#6b7280",
    missing: "#6b7280",
  };
  return colors[status];
};
