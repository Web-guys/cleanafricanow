import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Smartphone, AlertTriangle, FileText, Calendar, Loader2, Clock, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface NotificationPreferencesData {
  email_enabled: boolean;
  in_app_enabled: boolean;
  report_updates: boolean;
  sla_warnings: boolean;
  assignment_alerts: boolean;
  weekly_digest: boolean;
}

const NotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [preferences, setPreferences] = useState<NotificationPreferencesData>({
    email_enabled: true,
    in_app_enabled: true,
    report_updates: true,
    sla_warnings: true,
    assignment_alerts: true,
    weekly_digest: false,
  });

  const { data: savedPreferences, isLoading } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (savedPreferences) {
      setPreferences({
        email_enabled: savedPreferences.email_enabled,
        in_app_enabled: savedPreferences.in_app_enabled,
        report_updates: savedPreferences.report_updates,
        sla_warnings: savedPreferences.sla_warnings,
        assignment_alerts: savedPreferences.assignment_alerts,
        weekly_digest: savedPreferences.weekly_digest,
      });
    }
  }, [savedPreferences]);

  const saveMutation = useMutation({
    mutationFn: async (newPreferences: NotificationPreferencesData) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: user.id,
          ...newPreferences,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast({
        title: t("profile.preferencesSaved", "Preferences Saved"),
        description: t("profile.preferencesUpdated", "Your notification preferences have been updated."),
      });
    },
    onError: () => {
      toast({
        title: t("common.error", "Error"),
        description: t("profile.preferencesError", "Failed to save preferences. Please try again."),
        variant: "destructive",
      });
    },
  });

  const handleToggle = (key: keyof NotificationPreferencesData) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(preferences);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t("profile.notificationPreferences", "Notification Preferences")}
        </CardTitle>
        <CardDescription>
          {t("profile.notificationDescription", "Manage how you receive updates about your reports and activities.")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Channels */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t("profile.deliveryChannels", "Delivery Channels")}
          </h4>
          
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="email_enabled" className="font-medium cursor-pointer">
                  {t("profile.emailNotifications", "Email Notifications")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("profile.emailDescription", "Receive updates via email")}
                </p>
              </div>
            </div>
            <Switch
              id="email_enabled"
              checked={preferences.email_enabled}
              onCheckedChange={() => handleToggle("email_enabled")}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-secondary/10">
                <Smartphone className="h-4 w-4 text-secondary" />
              </div>
              <div>
                <Label htmlFor="in_app_enabled" className="font-medium cursor-pointer">
                  {t("profile.inAppNotifications", "In-App Notifications")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("profile.inAppDescription", "Show notifications in the app")}
                </p>
              </div>
            </div>
            <Switch
              id="in_app_enabled"
              checked={preferences.in_app_enabled}
              onCheckedChange={() => handleToggle("in_app_enabled")}
            />
          </div>

          {/* Gmail Integration Coming Soon */}
          <div className="relative flex items-center justify-between p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
            <div className="absolute -top-2 right-3">
              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
                <Clock className="h-2.5 w-2.5 mr-1" />
                Coming Soon
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/10">
                <svg className="h-4 w-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                </svg>
              </div>
              <div>
                <Label className="font-medium text-muted-foreground flex items-center gap-2">
                  Gmail Notifications
                  <Sparkles className="h-3 w-3 text-amber-500" />
                </Label>
                <p className="text-sm text-muted-foreground/70">
                  Send emails directly via your Gmail account
                </p>
              </div>
            </div>
            <Switch disabled className="opacity-50" />
          </div>
        </div>

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {t("profile.notificationTypes", "Notification Types")}
          </h4>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <FileText className="h-4 w-4 text-success" />
              </div>
              <div>
                <Label htmlFor="report_updates" className="font-medium cursor-pointer">
                  {t("profile.reportUpdates", "Report Updates")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("profile.reportUpdatesDescription", "Status changes on your submitted reports")}
                </p>
              </div>
            </div>
            <Switch
              id="report_updates"
              checked={preferences.report_updates}
              onCheckedChange={() => handleToggle("report_updates")}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <div>
                <Label htmlFor="sla_warnings" className="font-medium cursor-pointer">
                  {t("profile.slaWarnings", "SLA Warnings")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("profile.slaDescription", "Alerts when reports are approaching deadlines")}
                </p>
              </div>
            </div>
            <Switch
              id="sla_warnings"
              checked={preferences.sla_warnings}
              onCheckedChange={() => handleToggle("sla_warnings")}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-info/10">
                <Bell className="h-4 w-4 text-info" />
              </div>
              <div>
                <Label htmlFor="assignment_alerts" className="font-medium cursor-pointer">
                  {t("profile.assignmentAlerts", "Assignment Alerts")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("profile.assignmentDescription", "When reports are assigned or reassigned")}
                </p>
              </div>
            </div>
            <Switch
              id="assignment_alerts"
              checked={preferences.assignment_alerts}
              onCheckedChange={() => handleToggle("assignment_alerts")}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor="weekly_digest" className="font-medium cursor-pointer">
                  {t("profile.weeklyDigest", "Weekly Digest")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t("profile.weeklyDescription", "Summary of activities sent weekly")}
                </p>
              </div>
            </div>
            <Switch
              id="weekly_digest"
              checked={preferences.weekly_digest}
              onCheckedChange={() => handleToggle("weekly_digest")}
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
            className="w-full sm:w-auto"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("common.saving", "Saving...")}
              </>
            ) : (
              t("common.save", "Save Preferences")
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
