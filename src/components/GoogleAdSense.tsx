import { useEffect } from "react";
import { fetchIntegrationSettings, getIntegrationSettings } from "@/hooks/useIntegrationSettings";

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

let isInitialized = false;

// Get AdSense client ID from settings or env
const getAdSenseClientId = () => {
  const settings = getIntegrationSettings();
  if (settings.google_adsense_enabled && settings.google_adsense_id) {
    return settings.google_adsense_id;
  }
  // Fallback to env variable
  return import.meta.env.VITE_ADSENSE_CLIENT_ID || "";
};

// Initialize AdSense script - only runs once
export const initGoogleAdSense = async () => {
  // Fetch settings from DB first
  await fetchIntegrationSettings();
  
  const clientId = getAdSenseClientId();
  
  if (!clientId || isInitialized) {
    if (!clientId) {
      console.info(
        "[Google AdSense] Not configured. Configure in Admin → Settings → Integrations."
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
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
  script.crossOrigin = "anonymous";

  script.onload = () => {
    isInitialized = true;
    console.info(`[Google AdSense] Initialized with client: ${clientId}`);
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
  const clientId = getAdSenseClientId();

  useEffect(() => {
    if (!clientId) return;

    try {
      // Push the ad to display
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error("[Google AdSense] Error displaying ad:", error);
    }
  }, [clientId]);

  if (!clientId) {
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
        data-ad-client={clientId}
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
