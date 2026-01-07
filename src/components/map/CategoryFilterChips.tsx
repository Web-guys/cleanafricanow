import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getCategoryColor } from "@/utils/mapConfig";

interface CategoryFilterChipsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { key: 'all', emoji: '📍' },
  { key: 'waste', emoji: '🗑️' },
  { key: 'pollution', emoji: '🏭' },
  { key: 'danger', emoji: '⚠️' },
  { key: 'noise', emoji: '🔊' },
  { key: 'water', emoji: '💧' },
  { key: 'air', emoji: '💨' },
  { key: 'illegal_dumping', emoji: '🚯' },
  { key: 'deforestation', emoji: '🌲' },
] as const;

const CategoryFilterChips = ({
  selectedCategory,
  onCategoryChange,
}: CategoryFilterChipsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
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
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              "border-2 hover:scale-105 active:scale-95",
              isSelected
                ? "text-white shadow-md"
                : "bg-background text-foreground border-border hover:border-primary/50"
            )}
            style={isSelected ? { 
              backgroundColor: bgColor, 
              borderColor: bgColor 
            } : undefined}
          >
            <span>{category.emoji}</span>
            <span className="hidden sm:inline">
              {category.key === 'all' 
                ? t('map.allCategories')
                : t(`report.categories.${category.key}`)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilterChips;