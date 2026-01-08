import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getCategoryColor, getCategoryIcon } from "@/utils/mapConfig";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface QuickCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

const categories = [
  { key: 'all', emoji: '📍', label: 'All' },
  { key: 'waste', emoji: '🗑️' },
  { key: 'pollution', emoji: '🏭' },
  { key: 'danger', emoji: '⚠️' },
  { key: 'noise', emoji: '🔊' },
  { key: 'water', emoji: '💧' },
  { key: 'air', emoji: '💨' },
  { key: 'illegal_dumping', emoji: '🚯' },
  { key: 'deforestation', emoji: '🌲' },
] as const;

const QuickCategoryFilter = ({
  selectedCategory,
  onCategoryChange,
  className,
}: QuickCategoryFilterProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn("bg-card/95 backdrop-blur-md rounded-xl shadow-lg border border-border/50", className)}>
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1 p-1.5">
          {categories.map((category) => {
            const isSelected = selectedCategory === category.key;
            const bgColor = category.key === 'all' 
              ? 'hsl(var(--primary))' 
              : getCategoryColor(category.key);

            return (
              <button
                key={category.key}
                onClick={() => onCategoryChange(category.key)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "whitespace-nowrap shrink-0",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  isSelected
                    ? "text-primary-foreground shadow-md"
                    : "bg-transparent text-foreground hover:bg-muted"
                )}
                style={isSelected ? { 
                  backgroundColor: bgColor,
                } : undefined}
              >
                <span className="text-base">{category.emoji}</span>
                <span className="hidden sm:inline">
                  {'label' in category 
                    ? category.label 
                    : t(`report.categories.${category.key}`)}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
};

export default QuickCategoryFilter;
