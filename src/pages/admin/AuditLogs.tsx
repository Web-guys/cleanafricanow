import { useState } from "react";
import { ScrollText, Download, Filter, Search, RefreshCw, User, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuditLogs, useExportAuditLogs } from "@/hooks/useAdminApi";
import { format } from "date-fns";

const ACTION_TYPES = [
  "login",
  "logout",
  "report_created",
  "report_status_updated",
  "report_assigned",
  "bulk_status_update",
  "role_assigned",
  "role_revoked",
  "organization_created",
  "sla_updated",
];

const AdminAuditLogs = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{
    action_type?: string;
    start_date?: string;
    end_date?: string;
  }>({});

  const { data, isLoading, refetch } = useAuditLogs(page, filters.action_type || filters.start_date || filters.end_date ? filters : undefined);
  const exportMutation = useExportAuditLogs();

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync(filters);
      // Create and download CSV
      const blob = new Blob([result], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Success", description: "Audit logs exported successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("created")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (action.includes("updated") || action.includes("assigned")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (action.includes("revoked") || action.includes("deleted")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (action.includes("login") || action.includes("logout")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  };

  const getEntityIcon = (entityType: string | null) => {
    switch (entityType) {
      case "report":
        return "📋";
      case "user":
        return "👤";
      case "organization":
        return "🏢";
      case "assignment":
        return "📌";
      default:
        return "📝";
    }
  };

  return (
    <DashboardLayout
      title="Audit Logs"
      icon={<ScrollText className="h-6 w-6 text-primary" />}
      role="admin"
    >
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-muted-foreground">
              Track all system activities and user actions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={exportMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action Type</label>
                <Select
                  value={filters.action_type || "all"}
                  onValueChange={(v) => setFilters({ ...filters, action_type: v === "all" ? undefined : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {ACTION_TYPES.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={filters.start_date || ""}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value || undefined })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={filters.end_date || ""}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value || undefined })}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilters({});
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              Showing {data?.logs?.length || 0} of {data?.pagination?.total || 0} entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.logs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.logs?.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {format(new Date(log.created_at), "MMM dd, yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), "HH:mm:ss")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {log.profiles?.full_name || "System"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {log.profiles?.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.entity_type && (
                            <div className="flex items-center gap-2">
                              <span>{getEntityIcon(log.entity_type)}</span>
                              <span className="text-sm capitalize">{log.entity_type}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.metadata && (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {JSON.stringify(log.metadata).substring(0, 50)}
                              {JSON.stringify(log.metadata).length > 50 ? "..." : ""}
                            </code>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            {data?.pagination && data.pagination.total_pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="py-2 px-4 text-sm">
                  Page {page} of {data.pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAuditLogs;
