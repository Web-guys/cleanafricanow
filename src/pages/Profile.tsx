import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Trash2,
  Eye,
  Plus,
  Pencil,
  Bell,
  FileText,
  ArrowLeft,
  LogOut,
  Settings
} from "lucide-react";

import logo from "@/assets/cleanafricanow-logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";
import NotificationPreferences from "@/components/profile/NotificationPreferences";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: userReports, isLoading } = useQuery({
    queryKey: ["user-reports", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", reportId)
        .eq("user_id", user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-reports"] });
      toast({
        title: t("profile.reportDeleted", "Report Deleted"),
        description: t("profile.reportDeletedDesc", "Your report has been deleted successfully."),
      });
    },
    onError: () => {
      toast({
        title: t("common.error", "Error"),
        description: t("profile.deleteError", "Failed to delete the report. Please try again."),
        variant: "destructive",
      });
    }
  });

  const stats = {
    total: userReports?.length || 0,
    pending: userReports?.filter(r => r.status === "pending").length || 0,
    inProgress: userReports?.filter(r => r.status === "in_progress").length || 0,
    resolved: userReports?.filter(r => r.status === "resolved").length || 0,
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "waste":
        return <Trash2 className="h-4 w-4" />;
      case "pollution":
      case "danger":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "waste":
        return "bg-success/20 text-success border-success";
      case "pollution":
        return "bg-warning/20 text-warning border-warning";
      case "danger":
        return "bg-destructive/20 text-destructive border-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-warning/20 text-warning";
      case "in_progress":
        return "bg-info/20 text-info";
      case "resolved":
        return "bg-success/20 text-success";
      default:
        return "bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "in_progress":
        return <AlertTriangle className="h-3 w-3" />;
      case "resolved":
        return <CheckCircle2 className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back", "Back")}
              </Link>
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="CleanAfricaNow" className="w-10 h-10 object-contain" />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                CleanAfricaNow
              </h1>
            </Link>
          </div>
          <nav className="hidden md:flex gap-2 items-center">
            <Button variant="ghost" asChild>
              <Link to="/">{t("nav.home")}</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/map">{t("nav.map")}</Link>
            </Button>
            <Button asChild>
              <Link to="/report">{t("nav.reportIssue")}</Link>
            </Button>
            <LanguageSwitcher />
            <ThemeToggle />
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{profile?.full_name || t("profile.citizen")}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              {/* Sign Out Button - visible on mobile */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="md:hidden flex items-center gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("nav.signOut", "Sign Out")}</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t("profile.totalReports")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  <p className="text-3xl font-bold text-warning">{stats.pending}</p>
                </div>
                <p className="text-sm text-muted-foreground">{t("profile.pending")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-info" />
                  <p className="text-3xl font-bold text-info">{stats.inProgress}</p>
                </div>
                <p className="text-sm text-muted-foreground">{t("profile.inProgress")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <p className="text-3xl font-bold text-success">{stats.resolved}</p>
                </div>
                <p className="text-sm text-muted-foreground">{t("profile.resolved")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs defaultValue="reports" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t("profile.yourReports", "Your Reports")}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {t("profile.notifications", "Notifications")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports">
              {/* Reports List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{t("profile.yourReports")}</CardTitle>
                  <Button asChild>
                    <Link to="/report">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("profile.newReport")}
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {t("common.loading")}
                    </div>
                  ) : userReports && userReports.length > 0 ? (
                    <div className="space-y-4">
                      {userReports.map((report) => (
                        <div
                          key={report.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getCategoryColor(report.category)}>
                                  {getCategoryIcon(report.category)}
                                  <span className="ml-1">{t(`report.categories.${report.category}`)}</span>
                                </Badge>
                                <Badge className={getStatusColor(report.status)}>
                                  {getStatusIcon(report.status)}
                                  <span className="ml-1">
                                    {t(`report.status.${report.status === "in_progress" ? "inProgress" : report.status}`)}
                                  </span>
                                </Badge>
                              </div>
                              <p className="text-sm line-clamp-2 mb-2">{report.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(report.created_at), "PPP")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" asChild>
                                <Link to={`/map?lat=${report.latitude}&lng=${report.longitude}`}>
                                  <Eye className="h-4 w-4 mr-1" />
                                  {t("profile.viewOnMap")}
                                </Link>
                              </Button>
                              {report.status === "pending" && (
                                <>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/report?edit=${report.id}&lat=${report.latitude}&lng=${report.longitude}&category=${report.category}`}>
                                      <Pencil className="h-4 w-4 mr-1" />
                                      {t("common.edit", "Edit")}
                                    </Link>
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        {t("common.delete", "Delete")}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>{t("profile.deleteConfirmTitle", "Delete Report?")}</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {t("profile.deleteConfirmDesc", "This action cannot be undone. This will permanently delete your report.")}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => deleteReportMutation.mutate(report.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          {t("common.delete", "Delete")}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </div>
                          {report.photos && report.photos.length > 0 && (
                            <div className="flex gap-2 mt-3 overflow-x-auto">
                              {report.photos.slice(0, 3).map((photo, index) => (
                                <img
                                  key={index}
                                  src={photo}
                                  alt={`Report photo ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-md"
                                />
                              ))}
                              {report.photos.length > 3 && (
                                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
                                  +{report.photos.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold mb-2">{t("profile.noReports")}</h3>
                      <p className="text-muted-foreground mb-4">{t("profile.noReportsDesc")}</p>
                      <Button asChild>
                        <Link to="/report">{t("profile.submitFirst")}</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <NotificationPreferences />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
