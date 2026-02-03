import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  Megaphone, 
  Save, 
  Loader2, 
  Key,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIntegrationSettings } from "@/hooks/useIntegrationSettings";

interface SettingValue {
  key: string;
  value: string | boolean;
  description: string;
  category: string;
  is_public: boolean;
}

export const IntegrationSettingsPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: currentSettings, isLoading } = useIntegrationSettings();

  const [settings, setSettings] = useState({
    google_analytics_id: "",
    google_analytics_enabled: false,
    google_adsense_id: "",
    google_adsense_enabled: false,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setSettings({
        google_analytics_id: currentSettings.google_analytics_id || "",
        google_analytics_enabled: currentSettings.google_analytics_enabled || false,
        google_adsense_id: currentSettings.google_adsense_id || "",
        google_adsense_enabled: currentSettings.google_adsense_enabled || false,
      });
    }
  }, [currentSettings]);

  const saveMutation = useMutation({
    mutationFn: async (settingsToSave: SettingValue[]) => {
      for (const setting of settingsToSave) {
        // First try to update
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("key", setting.key)
          .single();

        if (existing) {
          const { error } = await supabase
            .from("system_settings")
            .update({ 
              value: JSON.stringify(setting.value),
              updated_at: new Date().toISOString(),
            })
            .eq("key", setting.key);
          
          if (error) throw error;
        } else {
          // Insert new setting
          const { error } = await supabase
            .from("system_settings")
            .insert({
              key: setting.key,
              value: JSON.stringify(setting.value),
              description: setting.description,
              category: setting.category,
              is_public: setting.is_public,
            });
          
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-settings"] });
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Integration settings have been updated. Changes will take effect on page reload.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const settingsToSave: SettingValue[] = [
      {
        key: "google_analytics_id",
        value: settings.google_analytics_id,
        description: "Google Analytics Measurement ID (e.g., G-XXXXXXXXXX)",
        category: "integrations",
        is_public: true,
      },
      {
        key: "google_analytics_enabled",
        value: settings.google_analytics_enabled,
        description: "Enable Google Analytics tracking",
        category: "integrations",
        is_public: true,
      },
      {
        key: "google_adsense_id",
        value: settings.google_adsense_id,
        description: "Google AdSense Publisher ID (e.g., ca-pub-XXXXXXXXXXXXXXXX)",
        category: "integrations",
        is_public: true,
      },
      {
        key: "google_adsense_enabled",
        value: settings.google_adsense_enabled,
        description: "Enable Google AdSense ads",
        category: "integrations",
        is_public: true,
      },
    ];

    saveMutation.mutate(settingsToSave);
  };

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            API Integrations
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure third-party service integrations
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Ces paramètres sont stockés en base de données et seront utilisés après rechargement de la page.
          Les clés publiques (Analytics ID, AdSense ID) peuvent être configurées ici en toute sécurité.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {/* Google Analytics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Google Analytics</CardTitle>
                  <CardDescription>Track user behavior and site performance</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {settings.google_analytics_enabled && settings.google_analytics_id ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                    <AlertTriangle className="h-3 w-3" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="ga_enabled">Enable Google Analytics</Label>
              <Switch
                id="ga_enabled"
                checked={settings.google_analytics_enabled}
                onCheckedChange={(checked) => updateSetting("google_analytics_enabled", checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ga_id">Measurement ID</Label>
              <Input
                id="ga_id"
                placeholder="G-XXXXXXXXXX"
                value={settings.google_analytics_id}
                onChange={(e) => updateSetting("google_analytics_id", e.target.value)}
                disabled={!settings.google_analytics_enabled}
              />
              <p className="text-xs text-muted-foreground">
                Found in Google Analytics → Admin → Data Streams → Your Stream
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://analytics.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Open Google Analytics
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Google AdSense */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Megaphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Google AdSense</CardTitle>
                  <CardDescription>Display ads and generate revenue</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {settings.google_adsense_enabled && settings.google_adsense_id ? (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    <CheckCircle className="h-3 w-3" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                    <AlertTriangle className="h-3 w-3" />
                    Inactive
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="adsense_enabled">Enable Google AdSense</Label>
              <Switch
                id="adsense_enabled"
                checked={settings.google_adsense_enabled}
                onCheckedChange={(checked) => updateSetting("google_adsense_enabled", checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adsense_id">Publisher ID</Label>
              <Input
                id="adsense_id"
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                value={settings.google_adsense_id}
                onChange={(e) => updateSetting("google_adsense_id", e.target.value)}
                disabled={!settings.google_adsense_enabled}
              />
              <p className="text-xs text-muted-foreground">
                Found in Google AdSense → Account → Account information
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://www.google.com/adsense" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Open Google AdSense
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
