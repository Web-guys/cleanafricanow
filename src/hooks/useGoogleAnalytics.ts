import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// GA Measurement ID - this is a publishable key, safe for frontend
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-J2XLQBJY47";

let isInitialized = false;

export const useGoogleAnalytics = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip if no measurement ID configured
    if (!GA_MEASUREMENT_ID) {
      if (isFirstRender.current) {
        console.info(
          "[Google Analytics] Not configured. Add VITE_GA_MEASUREMENT_ID to enable tracking."
        );
        isFirstRender.current = false;
      }
      return;
    }

    // Track page view on route change
    if (window.gtag && isInitialized) {
      window.gtag("config", GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
        page_title: document.title,
      });
      
      if (import.meta.env.DEV) {
        console.debug(`[GA] Page view: ${location.pathname}`);
      }
    }
  }, [location.pathname, location.search]);
};

// Initialize GA script - only runs once
export const initGoogleAnalytics = () => {
  if (!GA_MEASUREMENT_ID || isInitialized) {
    return;
  }

  // Prevent duplicate initialization
  if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) {
    isInitialized = true;
    return;
  }

  // Add gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  
  script.onload = () => {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: true,
    });
    
    isInitialized = true;
    console.info(`[Google Analytics] Initialized with ID: ${GA_MEASUREMENT_ID}`);
  };

  script.onerror = () => {
    console.warn("[Google Analytics] Failed to load gtag script");
  };

  document.head.appendChild(script);
};

// Track custom events
export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, unknown>
) => {
  if (!GA_MEASUREMENT_ID) {
    return;
  }
  
  if (window.gtag && isInitialized) {
    window.gtag("event", eventName, eventParams);
    
    if (import.meta.env.DEV) {
      console.debug(`[GA] Event: ${eventName}`, eventParams);
    }
  }
};

// Track user interactions
export const trackClick = (elementName: string, category?: string) => {
  trackEvent("click", {
    element_name: elementName,
    event_category: category || "engagement",
  });
};

// Track form submissions
export const trackFormSubmit = (formName: string, success: boolean) => {
  trackEvent("form_submit", {
    form_name: formName,
    success,
  });
};

// Track report actions
export const trackReportAction = (
  action: "create" | "view" | "update" | "delete",
  reportId?: string,
  category?: string
) => {
  trackEvent(`report_${action}`, {
    report_id: reportId,
    report_category: category,
  });
};
