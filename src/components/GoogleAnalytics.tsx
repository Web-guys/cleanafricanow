import { useEffect } from "react";
import { useGoogleAnalytics, initGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

export const GoogleAnalyticsProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    initGoogleAnalytics();
  }, []);

  useGoogleAnalytics();

  return <>{children}</>;
};
