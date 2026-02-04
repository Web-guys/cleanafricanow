import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/utils/mapConfig";
import CategoryIcon from "./CategoryIcon";

interface CategoryFilterChipsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  'all',
  'waste',
  'pollution',
  'danger',
  'noise',
  'water',
  'air',
  'illegal_dumping',
  'deforestation',
] as const;

const CategoryFilterChips = ({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterChipsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        const bgColor = category === 'all' 
          ? 'hsl(var(--primary))' 
          : getCategoryColor(category);

        return (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "group relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
              "border hover:scale-105 active:scale-95",
              "overflow-hidden",
              isSelected
                ? "text-white shadow-lg border-transparent"
                : "bg-background text-foreground border-border/60 hover:border-primary/50 hover:shadow-md"
            )}
            style={isSelected ? { 
              backgroundColor: bgColor, 
              borderColor: bgColor,
              boxShadow: `0 4px 14px -2px ${bgColor}40`
            } : undefined}
          >
            {/* Moroccan-inspired decorative pattern overlay */}
            {isSelected && (
              <div className="absolute inset-0 opacity-20">
                <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                  <pattern id={`zellige-${category}`} patternUnits="userSpaceOnUse" width="20" height="20">
                    <path 
                      d="M10,0 L20,10 L10,20 L0,10 Z" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="0.5"
                    />
                    <circle cx="10" cy="10" r="2" fill="white" fillOpacity="0.3" />
                  </pattern>
                  <rect width="100%" height="100%" fill={`url(#zellige-${category})`} />
                </svg>
              </div>
            )}
            
            {/* Icon with Moroccan frame */}
            <CategoryIcon 
              category={category} 
              size={16}
              isSelected={isSelected}
              className={cn(
                "relative z-10 transition-transform duration-300",
                isSelected ? "text-white" : "text-muted-foreground group-hover:text-primary"
              )}
            />
            
            <span className={cn(
              "relative z-10 hidden sm:inline transition-colors duration-300",
              !isSelected && "group-hover:text-primary"
            )}>
              {category === 'all' 
                ? t('map.allCategories')
                : t(`report.categories.${category}`)}
            </span>

            {/* Hover glow effect */}
            {!isSelected && (
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"
                style={{ backgroundColor: bgColor }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilterChips;
