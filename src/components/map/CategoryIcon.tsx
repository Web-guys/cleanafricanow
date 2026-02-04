import { 
  Trash2, 
  Factory, 
  AlertTriangle, 
  Volume2, 
  Droplets, 
  Wind, 
  Ban, 
  TreeDeciduous,
  MapPin,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

// Map category keys to Lucide icons
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  waste: Trash2,
  pollution: Factory,
  danger: AlertTriangle,
  noise: Volume2,
  water: Droplets,
  air: Wind,
  illegal_dumping: Ban,
  deforestation: TreeDeciduous,
  all: MapPin,
};

interface CategoryIconProps {
  category: string;
  size?: number;
  className?: string;
  withBackground?: boolean;
  isSelected?: boolean;
}

const CategoryIcon = ({ 
  category, 
  size = 18, 
  className,
  withBackground = false,
  isSelected = false
}: CategoryIconProps) => {
  const Icon = CATEGORY_ICON_MAP[category] || MapPin;
  
  if (withBackground) {
    return (
      <div 
        className={cn(
          "relative flex items-center justify-center rounded-lg transition-all duration-300",
          "before:absolute before:inset-0 before:rounded-lg before:opacity-20",
          isSelected 
            ? "bg-white/20 shadow-inner" 
            : "bg-gradient-to-br from-white/10 to-transparent",
          className
        )}
        style={{ width: size + 8, height: size + 8 }}
      >
        {/* Moroccan decorative corner accents */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-30" 
          viewBox="0 0 24 24"
        >
          <path 
            d="M0,0 L4,0 L4,1 L1,1 L1,4 L0,4 Z" 
            fill="currentColor" 
          />
          <path 
            d="M24,0 L20,0 L20,1 L23,1 L23,4 L24,4 Z" 
            fill="currentColor" 
          />
          <path 
            d="M0,24 L4,24 L4,23 L1,23 L1,20 L0,20 Z" 
            fill="currentColor" 
          />
          <path 
            d="M24,24 L20,24 L20,23 L23,23 L23,20 L24,20 Z" 
            fill="currentColor" 
          />
        </svg>
        <Icon size={size} className="relative z-10" />
      </div>
    );
  }
  
  return <Icon size={size} className={className} />;
};

export default CategoryIcon;
export { CATEGORY_ICON_MAP };
