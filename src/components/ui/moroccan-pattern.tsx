import { cn } from "@/lib/utils";

interface MoroccanPatternProps {
  className?: string;
  variant?: "zellige" | "arabesque" | "geometric" | "stars";
  opacity?: number;
  color?: string;
}

export const MoroccanPattern = ({ 
  className, 
  variant = "zellige",
  opacity = 0.1,
  color = "currentColor"
}: MoroccanPatternProps) => {
  const patterns = {
    zellige: (
      <pattern id="zellige" patternUnits="userSpaceOnUse" width="60" height="60" patternTransform="rotate(0)">
        <g fill="none" stroke={color} strokeWidth="0.5">
          {/* Central 8-pointed star */}
          <polygon points="30,5 35,20 50,20 38,30 43,45 30,37 17,45 22,30 10,20 25,20" />
          {/* Corner decorations */}
          <polygon points="0,0 15,0 7.5,10 0,10" />
          <polygon points="60,0 60,10 52.5,10 45,0" />
          <polygon points="0,60 0,50 7.5,50 15,60" />
          <polygon points="60,60 45,60 52.5,50 60,50" />
          {/* Connecting lines */}
          <line x1="15" y1="0" x2="25" y2="20" />
          <line x1="45" y1="0" x2="35" y2="20" />
          <line x1="0" y1="10" x2="10" y2="20" />
          <line x1="60" y1="10" x2="50" y2="20" />
          <line x1="0" y1="50" x2="10" y2="40" />
          <line x1="60" y1="50" x2="50" y2="40" />
          <line x1="15" y1="60" x2="22" y2="45" />
          <line x1="45" y1="60" x2="38" y2="45" />
        </g>
      </pattern>
    ),
    arabesque: (
      <pattern id="arabesque" patternUnits="userSpaceOnUse" width="80" height="80">
        <g fill="none" stroke={color} strokeWidth="0.5">
          {/* Interlocking arches */}
          <path d="M0,40 Q20,20 40,40 Q60,60 80,40" />
          <path d="M0,40 Q20,60 40,40 Q60,20 80,40" />
          <path d="M40,0 Q20,20 40,40 Q60,20 40,0" />
          <path d="M40,80 Q20,60 40,40 Q60,60 40,80" />
          {/* Center diamond */}
          <polygon points="40,25 55,40 40,55 25,40" />
          {/* Corner flowers */}
          <circle cx="0" cy="0" r="8" />
          <circle cx="80" cy="0" r="8" />
          <circle cx="0" cy="80" r="8" />
          <circle cx="80" cy="80" r="8" />
        </g>
      </pattern>
    ),
    geometric: (
      <pattern id="geometric" patternUnits="userSpaceOnUse" width="40" height="40">
        <g fill="none" stroke={color} strokeWidth="0.5">
          {/* Hexagonal grid */}
          <polygon points="20,0 40,10 40,30 20,40 0,30 0,10" />
          {/* Inner star */}
          <polygon points="20,8 25,15 33,15 27,21 29,29 20,25 11,29 13,21 7,15 15,15" />
          {/* Center dot */}
          <circle cx="20" cy="20" r="2" fill={color} />
        </g>
      </pattern>
    ),
    stars: (
      <pattern id="stars" patternUnits="userSpaceOnUse" width="50" height="50">
        <g fill="none" stroke={color} strokeWidth="0.5">
          {/* 8-pointed star */}
          <polygon points="25,5 28,18 40,15 32,25 40,35 28,32 25,45 22,32 10,35 18,25 10,15 22,18" />
          {/* Connecting squares */}
          <rect x="0" y="0" width="10" height="10" transform="rotate(45, 5, 5)" />
          <rect x="40" y="0" width="10" height="10" transform="rotate(45, 45, 5)" />
          <rect x="0" y="40" width="10" height="10" transform="rotate(45, 5, 45)" />
          <rect x="40" y="40" width="10" height="10" transform="rotate(45, 45, 45)" />
        </g>
      </pattern>
    ),
  };

  return (
    <svg 
      className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}
      style={{ opacity }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {patterns[variant]}
      </defs>
      <rect width="100%" height="100%" fill={`url(#${variant})`} />
    </svg>
  );
};

// Moroccan decorative border component
interface MoroccanBorderProps {
  className?: string;
  position?: "top" | "bottom" | "both";
}

export const MoroccanBorder = ({ className, position = "top" }: MoroccanBorderProps) => {
  const borderSvg = (
    <svg viewBox="0 0 1200 40" className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <pattern id="moroccan-border" patternUnits="userSpaceOnUse" width="60" height="40">
          <g fill="none" stroke="currentColor" strokeWidth="1">
            {/* Arch pattern */}
            <path d="M0,40 Q15,10 30,40 Q45,10 60,40" />
            {/* Star accent */}
            <polygon points="30,15 33,22 40,22 35,27 37,35 30,30 23,35 25,27 20,22 27,22" fill="currentColor" fillOpacity="0.3" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#moroccan-border)" />
    </svg>
  );

  return (
    <div className={cn("text-moroccan-terracotta/30", className)}>
      {(position === "top" || position === "both") && borderSvg}
      {(position === "bottom" || position === "both") && (
        <div className="rotate-180">{borderSvg}</div>
      )}
    </div>
  );
};

// Moroccan corner decoration
interface MoroccanCornerProps {
  className?: string;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: number;
}

export const MoroccanCorner = ({ 
  className, 
  position = "top-left",
  size = 80 
}: MoroccanCornerProps) => {

  const positions = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  };

  // Calculate the proper transform including origin
  const getTransform = () => {
    const rotation = {
      "top-left": 0,
      "top-right": 90,
      "bottom-right": 180,
      "bottom-left": 270,
    }[position];
    
    // Using rotate around center point (40, 40)
    return `rotate(${rotation}, 40, 40)`;
  };

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 80 80"
      className={cn("absolute pointer-events-none", positions[position], className)}
    >
      <g transform={getTransform()}>
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Corner arch */}
          <path d="M0,0 Q40,0 40,40 Q40,80 80,80" />
          <path d="M0,0 Q30,10 30,40 Q30,70 60,80" />
          {/* Decorative elements */}
          <circle cx="20" cy="20" r="5" />
          <polygon points="20,10 23,17 30,17 25,22 27,30 20,25 13,30 15,22 10,17 17,17" />
        </g>
      </g>
    </svg>
  );
};
