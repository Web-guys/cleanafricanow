import { useEffect } from "react";
import { useGoogleAnalytics, initGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { initGoogleAdSense } from "./GoogleAdSense";

export const GoogleAnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    initGoogleAnalytics();
    initGoogleAdSense();
  }, []);

  useGoogleAnalytics();

  return <>{children}</>;
};
