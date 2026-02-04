import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Megaphone, 
  Save, 
  Loader2, 
  Key,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  LogIn,
  Mail,
  Clock,
  Sparkles,
  Bell
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
    google_oauth_client_id: "",
    google_oauth_enabled: false,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setSettings({
        google_analytics_id: currentSettings.google_analytics_id || "",
        google_analytics_enabled: currentSettings.google_analytics_enabled || false,
        google_adsense_id: currentSettings.google_adsense_id || "",
        google_adsense_enabled: currentSettings.google_adsense_enabled || false,
        google_oauth_client_id: currentSettings.google_oauth_client_id || "",
        google_oauth_enabled: currentSettings.google_oauth_enabled || false,
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
      {
        key: "google_oauth_client_id",
        value: settings.google_oauth_client_id,
        description: "Google OAuth Client ID for Sign-In",
        category: "integrations",
        is_public: true,
      },
      {
        key: "google_oauth_enabled",
        value: settings.google_oauth_enabled,
        description: "Enable Google OAuth Sign-In",
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

        {/* Google OAuth Sign-In */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <LogIn className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Google OAuth Sign-In</CardTitle>
                  <CardDescription>Allow users to sign in with their Google account</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {settings.google_oauth_enabled && settings.google_oauth_client_id ? (
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
              <Label htmlFor="oauth_enabled">Enable Google Sign-In</Label>
              <Switch
                id="oauth_enabled"
                checked={settings.google_oauth_enabled}
                onCheckedChange={(checked) => updateSetting("google_oauth_enabled", checked)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oauth_client_id">OAuth Client ID</Label>
              <Input
                id="oauth_client_id"
                placeholder="XXXXXXXX.apps.googleusercontent.com"
                value={settings.google_oauth_client_id}
                onChange={(e) => updateSetting("google_oauth_client_id", e.target.value)}
                disabled={!settings.google_oauth_enabled}
              />
              <p className="text-xs text-muted-foreground">
                Found in Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs
              </p>
            </div>
            <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Le Client Secret doit être configuré dans Lovable Cloud → Users → Authentication Settings → Google.
                <br />
                <strong>Redirect URI:</strong> <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">https://csmdggopddxjixwsqnom.supabase.co/auth/v1/callback</code>
              </AlertDescription>
            </Alert>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="https://console.cloud.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-3 w-3" />
                Open Google Cloud Console
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Gmail API - Coming Soon */}
        <Card className="relative overflow-hidden border-dashed border-2 border-muted-foreground/30">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent pointer-events-none" />
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse">
              <Clock className="h-3 w-3 mr-1" />
              Coming Soon
            </Badge>
          </div>
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 rounded-lg">
                <Mail className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Gmail API Integration
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </CardTitle>
                <CardDescription>Send transactional emails and notifications via Gmail</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">What's coming:</strong>
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Bell className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>Automated email notifications for report updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Report resolution confirmations to users</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <span>Weekly digest emails for community updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>SLA breach alerts for municipalities</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">In Development</span>
              </div>
              <span className="text-xs text-muted-foreground">ETA: Q2 2026</span>
            </div>
            <Button variant="outline" size="sm" disabled className="opacity-60">
              <ExternalLink className="h-3 w-3 mr-2" />
              Configure Gmail (Coming Soon)
            </Button>
          </CardContent>
        </Card>

        {/* Future Integrations Preview */}
        <Card className="border-dashed border-muted-foreground/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              More Integrations Coming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "WhatsApp", icon: "💬", color: "bg-green-500/10" },
                { name: "Slack", icon: "📣", color: "bg-purple-500/10" },
                { name: "Stripe", icon: "💳", color: "bg-blue-500/10" },
                { name: "Twilio SMS", icon: "📱", color: "bg-red-500/10" },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className={`${integration.color} rounded-lg p-3 text-center opacity-60 hover:opacity-80 transition-opacity`}
                >
                  <span className="text-2xl">{integration.icon}</span>
                  <p className="text-xs font-medium mt-1">{integration.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
