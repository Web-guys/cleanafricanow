import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Settings, Clock, Bell, Brain, Shield, Save, Loader2 } from "lucide-react";

interface AdminSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  category: string;
}

export const SystemSettingsPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .order("category");

      if (error) throw error;
      return data as AdminSetting[];
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("admin_settings")
        .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({
        title: "Settings updated",
        description: "Your changes have been saved successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveAllChanges = async () => {
    for (const [key, value] of Object.entries(pendingChanges)) {
      await updateSettingMutation.mutateAsync({ key, value });
    }
    setPendingChanges({});
  };

  const getSettingValue = (key: string) => {
    if (pendingChanges[key] !== undefined) return pendingChanges[key];
    const setting = settings?.find((s) => s.key === key);
    if (!setting) return "";
    // Parse JSON value (it's stored as JSON string)
    try {
      return JSON.parse(setting.value);
    } catch {
      return setting.value;
    }
  };

  const updateLocalSetting = (key: string, value: string) => {
    setPendingChanges((prev) => ({ ...prev, [key]: value }));
  };

  const getSettingsByCategory = (category: string) => {
    return settings?.filter((s) => s.category === category) || [];
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "sla":
        return <Clock className="h-4 w-4" />;
      case "notifications":
        return <Bell className="h-4 w-4" />;
      case "ai":
        return <Brain className="h-4 w-4" />;
      case "security":
        return <Shield className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
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
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">
            Configure platform-wide settings and preferences
          </p>
        </div>
        {Object.keys(pendingChanges).length > 0 && (
          <Button onClick={saveAllChanges} disabled={updateSettingMutation.isPending}>
            {updateSettingMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes ({Object.keys(pendingChanges).length})
          </Button>
        )}
      </div>

      <Tabs defaultValue="sla">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            SLA
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sla" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SLA Configuration</CardTitle>
              <CardDescription>
                Configure Service Level Agreement thresholds for report resolution
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sla_critical">Critical Priority (hours)</Label>
                <Input
                  id="sla_critical"
                  type="number"
                  value={getSettingValue("sla_critical_hours")}
                  onChange={(e) => updateLocalSetting("sla_critical_hours", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Time limit for critical priority reports
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sla_high">High Priority (hours)</Label>
                <Input
                  id="sla_high"
                  type="number"
                  value={getSettingValue("sla_high_hours")}
                  onChange={(e) => updateLocalSetting("sla_high_hours", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Time limit for high priority reports
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sla_medium">Medium Priority (hours)</Label>
                <Input
                  id="sla_medium"
                  type="number"
                  value={getSettingValue("sla_medium_hours")}
                  onChange={(e) => updateLocalSetting("sla_medium_hours", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Time limit for medium priority reports
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sla_low">Low Priority (hours)</Label>
                <Input
                  id="sla_low"
                  type="number"
                  value={getSettingValue("sla_low_hours")}
                  onChange={(e) => updateLocalSetting("sla_low_hours", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Time limit for low priority reports
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure global notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable email notifications globally
                  </p>
                </div>
                <Switch
                  checked={getSettingValue("email_notifications_enabled") === "true"}
                  onCheckedChange={(checked) =>
                    updateLocalSetting("email_notifications_enabled", String(checked))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Features</CardTitle>
              <CardDescription>
                Configure AI-powered automation features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Priority Scoring</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically assign priority to new reports using AI
                  </p>
                </div>
                <Switch
                  checked={getSettingValue("ai_auto_priority") === "true"}
                  onCheckedChange={(checked) =>
                    updateLocalSetting("ai_auto_priority", String(checked))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Duplicate Detection</Label>
                  <p className="text-sm text-muted-foreground">
                    Detect and flag potential duplicate reports
                  </p>
                </div>
                <Switch
                  checked={getSettingValue("ai_duplicate_detection") === "true"}
                  onCheckedChange={(checked) =>
                    updateLocalSetting("ai_duplicate_detection", String(checked))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic platform configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max_photos">Max Photos per Report</Label>
                <Input
                  id="max_photos"
                  type="number"
                  value={getSettingValue("max_photos_per_report")}
                  onChange={(e) => updateLocalSetting("max_photos_per_report", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of photos allowed per report submission
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>System Controls</CardTitle>
              <CardDescription>
                Critical system settings - use with caution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                <div>
                  <Label className="text-destructive">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, only admins can access the platform
                  </p>
                </div>
                <Switch
                  checked={getSettingValue("maintenance_mode") === "true"}
                  onCheckedChange={(checked) =>
                    updateLocalSetting("maintenance_mode", String(checked))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
