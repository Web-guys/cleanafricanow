import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/utils/mapConfig";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import CategoryIcon from "./CategoryIcon";

interface QuickCategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

const categories = [
  { key: 'all', label: 'All' },
  { key: 'waste' },
  { key: 'pollution' },
  { key: 'danger' },
  { key: 'noise' },
  { key: 'water' },
  { key: 'air' },
  { key: 'illegal_dumping' },
  { key: 'deforestation' },
] as const;

const QuickCategoryFilter = ({
  selectedCategory,
  onCategoryChange,
  className,
}: QuickCategoryFilterProps) => {
  const { t } = useTranslation();

  return (
    <div className={cn(
      "relative bg-card/95 backdrop-blur-md rounded-2xl shadow-xl border border-border/50",
      "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-moroccan-gold/5 before:via-transparent before:to-moroccan-teal/5 before:pointer-events-none",
      className
    )}>
      {/* Moroccan decorative top border */}
      <div className="absolute top-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-moroccan-gold/40 to-transparent" />
      
      <ScrollArea className="w-full">
        <div className="flex items-center gap-1.5 p-2">
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
                  "group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                  "whitespace-nowrap shrink-0",
                  "hover:scale-[1.03] active:scale-[0.97]",
                  isSelected
                    ? "text-white shadow-lg"
                    : "bg-transparent text-foreground hover:bg-muted/80"
                )}
                style={isSelected ? { 
                  backgroundColor: bgColor,
                  boxShadow: `0 4px 12px -2px ${bgColor}50`
                } : undefined}
              >
                {/* Selected state decorative overlay */}
                {isSelected && (
                  <div className="absolute inset-0 rounded-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5" />
                    {/* Moroccan star accent */}
                    <svg className="absolute -right-2 -top-2 w-8 h-8 text-white/20" viewBox="0 0 24 24">
                      <polygon 
                        points="12,2 14,9 21,9 15,14 17,21 12,17 7,21 9,14 3,9 10,9" 
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                )}
                
                <CategoryIcon 
                  category={category.key}
                  size={18}
                  isSelected={isSelected}
                  className={cn(
                    "relative z-10 transition-all duration-300",
                    isSelected 
                      ? "text-white drop-shadow-sm" 
                      : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                  )}
                />
                
                <span className={cn(
                  "relative z-10 hidden sm:inline",
                  !isSelected && "group-hover:text-primary"
                )}>
                  {'label' in category 
                    ? category.label 
                    : t(`report.categories.${category.key}`)}
                </span>

                {/* Hover indicator */}
                {!isSelected && (
                  <div 
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 group-hover:w-8 transition-all duration-300 rounded-full"
                    style={{ backgroundColor: bgColor }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
      
      {/* Moroccan decorative bottom border */}
      <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-moroccan-teal/40 to-transparent" />
    </div>
  );
};

export default QuickCategoryFilter;
