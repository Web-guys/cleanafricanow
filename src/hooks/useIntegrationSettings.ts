import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface IntegrationSettings {
  google_analytics_id: string;
  google_adsense_id: string;
  google_adsense_enabled: boolean;
  google_analytics_enabled: boolean;
  google_oauth_client_id: string;
  google_oauth_enabled: boolean;
}

const DEFAULT_SETTINGS: IntegrationSettings = {
  google_analytics_id: "",
  google_adsense_id: "",
  google_adsense_enabled: false,
  google_analytics_enabled: false,
  google_oauth_client_id: "",
  google_oauth_enabled: false,
};

// Cache for synchronous access
let cachedSettings: IntegrationSettings | null = null;

export const useIntegrationSettings = () => {
  return useQuery({
    queryKey: ["integration-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "google_analytics_id",
          "google_adsense_id",
          "google_adsense_enabled",
          "google_analytics_enabled",
          "google_oauth_client_id",
          "google_oauth_enabled",
        ]);

      if (error) {
        console.error("Error fetching integration settings:", error);
        return DEFAULT_SETTINGS;
      }

      const settings: IntegrationSettings = { ...DEFAULT_SETTINGS };

      data?.forEach((item) => {
        try {
          const value = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
          if (item.key === "google_analytics_id") settings.google_analytics_id = value || "";
          if (item.key === "google_adsense_id") settings.google_adsense_id = value || "";
          if (item.key === "google_adsense_enabled") settings.google_adsense_enabled = value === true || value === "true";
          if (item.key === "google_analytics_enabled") settings.google_analytics_enabled = value === true || value === "true";
          if (item.key === "google_oauth_client_id") settings.google_oauth_client_id = value || "";
          if (item.key === "google_oauth_enabled") settings.google_oauth_enabled = value === true || value === "true";
        } catch {
          // Handle parse errors gracefully
        }
      });

      // Update cache
      cachedSettings = settings;
      return settings;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Fetch settings synchronously from cache or return defaults
export const getIntegrationSettings = (): IntegrationSettings => {
  return cachedSettings || DEFAULT_SETTINGS;
};

// Fetch settings once (for initialization)
export const fetchIntegrationSettings = async (): Promise<IntegrationSettings> => {
  if (cachedSettings) return cachedSettings;

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "google_analytics_id",
        "google_adsense_id",
        "google_adsense_enabled",
        "google_analytics_enabled",
        "google_oauth_client_id",
        "google_oauth_enabled",
      ]);

    if (error) throw error;

    const settings: IntegrationSettings = { ...DEFAULT_SETTINGS };

    data?.forEach((item) => {
      try {
        const value = typeof item.value === "string" ? JSON.parse(item.value) : item.value;
        if (item.key === "google_analytics_id") settings.google_analytics_id = value || "";
        if (item.key === "google_adsense_id") settings.google_adsense_id = value || "";
        if (item.key === "google_adsense_enabled") settings.google_adsense_enabled = value === true || value === "true";
        if (item.key === "google_analytics_enabled") settings.google_analytics_enabled = value === true || value === "true";
        if (item.key === "google_oauth_client_id") settings.google_oauth_client_id = value || "";
        if (item.key === "google_oauth_enabled") settings.google_oauth_enabled = value === true || value === "true";
      } catch {
        // Handle parse errors gracefully
      }
    });

    cachedSettings = settings;
    return settings;
  } catch (error) {
    console.error("Error fetching integration settings:", error);
    return DEFAULT_SETTINGS;
  }
};
