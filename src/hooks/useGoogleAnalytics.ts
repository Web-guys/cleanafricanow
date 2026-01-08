import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) {
      console.warn("Google Analytics: GA_MEASUREMENT_ID not configured");
      return;
    }

    // Track page view on route change
    if (window.gtag) {
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
};

// Initialize GA script
export const initGoogleAnalytics = () => {
  if (!GA_MEASUREMENT_ID) {
    return;
  }

  // Add gtag script
  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", GA_MEASUREMENT_ID);
};

// Track custom events
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
) => {
  if (window.gtag && GA_MEASUREMENT_ID) {
    window.gtag("event", eventName, eventParams);
  }
};
