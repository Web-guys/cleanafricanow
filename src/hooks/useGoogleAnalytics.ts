import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { fetchIntegrationSettings, getIntegrationSettings } from "./useIntegrationSettings";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

// Fallback to env variable if DB setting is not available
const getGAMeasurementId = () => {
  const settings = getIntegrationSettings();
  if (settings.google_analytics_enabled && settings.google_analytics_id) {
    return settings.google_analytics_id;
  }
  // Fallback to env variable
  return import.meta.env.VITE_GA_MEASUREMENT_ID || "G-J2XLQBJY47";
};

let isInitialized = false;
let currentMeasurementId = "";

export const useGoogleAnalytics = () => {
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const measurementId = getGAMeasurementId();
    
    // Skip if no measurement ID configured
    if (!measurementId) {
      if (isFirstRender.current) {
        console.info(
          "[Google Analytics] Not configured. Configure in Admin → Settings → Integrations."
        );
        isFirstRender.current = false;
      }
      return;
    }

    // Track page view on route change
    if (window.gtag && isInitialized) {
      window.gtag("config", measurementId, {
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
export const initGoogleAnalytics = async () => {
  // First fetch settings from DB
  await fetchIntegrationSettings();
  
  const settings = getIntegrationSettings();
  
  // Check if enabled via DB settings
  let measurementId = "";
  if (settings.google_analytics_enabled && settings.google_analytics_id) {
    measurementId = settings.google_analytics_id;
  } else {
    // Fallback to env variable
    measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-J2XLQBJY47";
  }

  if (!measurementId || isInitialized) {
    return;
  }

  // Prevent duplicate initialization
  if (document.querySelector(`script[src*="googletagmanager.com/gtag"]`)) {
    isInitialized = true;
    currentMeasurementId = measurementId;
    return;
  }

  // Add gtag script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  
  script.onload = () => {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: true,
    });
    
    isInitialized = true;
    currentMeasurementId = measurementId;
    console.info(`[Google Analytics] Initialized with ID: ${measurementId}`);
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
  const measurementId = getGAMeasurementId();
  
  if (!measurementId) {
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
