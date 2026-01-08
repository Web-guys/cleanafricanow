import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface StatusFilterProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  className?: string;
}

const statuses = [
  { key: 'all', label: 'All', color: 'bg-muted' },
  { key: 'pending', label: 'Pending', color: 'bg-amber-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { key: 'resolved', label: 'Resolved', color: 'bg-emerald-500' },
] as const;

const StatusFilter = ({ selectedStatus, onStatusChange, className }: StatusFilterProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn(
      "flex items-center gap-1 bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50 p-1.5",
      className
    )}>
      {statuses.map((status) => {
        const isSelected = selectedStatus === status.key;
        
        return (
          <button
            key={status.key}
            onClick={() => onStatusChange(status.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200",
              "hover:bg-muted/50",
              isSelected && "bg-muted shadow-sm"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full transition-transform",
              status.color,
              isSelected && "scale-125"
            )} />
            <span className="hidden sm:inline">{status.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default StatusFilter;
