import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// AdSense Publisher ID - will be set via environment variable
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || "";

let isInitialized = false;

// Initialize AdSense script - only runs once
export const initGoogleAdSense = () => {
  if (!ADSENSE_CLIENT_ID || isInitialized) {
    if (!ADSENSE_CLIENT_ID) {
      console.info(
        "[Google AdSense] Not configured. Add VITE_ADSENSE_CLIENT_ID to enable ads."
      );
    }
    return;
  }

  // Prevent duplicate initialization
  if (document.querySelector(`script[src*="pagead2.googlesyndication.com"]`)) {
    isInitialized = true;
    return;
  }

  // Add AdSense script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
  script.crossOrigin = "anonymous";

  script.onload = () => {
    isInitialized = true;
    console.info(`[Google AdSense] Initialized with client: ${ADSENSE_CLIENT_ID}`);
  };

  script.onerror = () => {
    console.warn("[Google AdSense] Failed to load script");
  };

  document.head.appendChild(script);
};

// Provider component to initialize AdSense
export const GoogleAdSenseProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    initGoogleAdSense();
  }, []);

  return <>{children}</>;
};

// Ad Unit component for displaying ads
interface AdUnitProps {
  slot: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const AdUnit = ({
  slot,
  format = "auto",
  responsive = true,
  className = "",
  style,
}: AdUnitProps) => {
  useEffect(() => {
    if (!ADSENSE_CLIENT_ID) return;

    try {
      // Push the ad to display
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("[Google AdSense] Error displaying ad:", error);
    }
  }, []);

  if (!ADSENSE_CLIENT_ID) {
    return null; // Don't render anything if AdSense is not configured
  }

  return (
    <div className={`adsense-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          ...style,
        }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

// Banner Ad - typically at top or bottom of pages
export const BannerAd = ({ slot, className }: { slot: string; className?: string }) => (
  <AdUnit
    slot={slot}
    format="horizontal"
    className={`w-full min-h-[90px] ${className || ""}`}
  />
);

// In-Article Ad - for between content sections
export const InArticleAd = ({ slot, className }: { slot: string; className?: string }) => (
  <AdUnit
    slot={slot}
    format="auto"
    className={`my-4 ${className || ""}`}
  />
);

// Sidebar Ad - for sidebars
export const SidebarAd = ({ slot, className }: { slot: string; className?: string }) => (
  <AdUnit
    slot={slot}
    format="rectangle"
    className={`min-h-[250px] ${className || ""}`}
  />
);
