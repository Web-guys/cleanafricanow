import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Search, X, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getCategoryIcon, getCategoryColor } from "@/utils/mapConfig";
import type { Report } from "@/hooks/useReports";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import SelectedReportCard from "./SelectedReportCard";

interface ReportsSidebarProps {
  reports: Report[] | undefined;
  isLoading: boolean;
  selectedReport: Report | null;
  onReportClick: (report: Report) => void;
  onCloseReport: () => void;
  categoryFilter: string;
  statusFilter: string;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
}

const ReportsSidebar = ({ 
  reports, 
  isLoading, 
  selectedReport,
  onReportClick, 
  onCloseReport,
  categoryFilter,
  statusFilter,
  onCategoryChange,
  onStatusChange,
}: ReportsSidebarProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (!searchQuery.trim()) return reports;
    
    const query = searchQuery.toLowerCase();
    return reports.filter(report => 
      report.description.toLowerCase().includes(query) ||
      report.category.toLowerCase().includes(query)
    );
  }, [reports, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500';
      case 'in_progress': return 'bg-blue-500';
      case 'resolved': return 'bg-emerald-500';
      case 'verified': return 'bg-primary';
      case 'rejected': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Reports</h2>
            <p className="text-sm text-muted-foreground">
              {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
            </p>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onCategoryChange('all');
                onStatusChange('all');
              }}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background/50"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Quick Status Filter */}
        <div className="flex gap-1">
          {['all', 'pending', 'in_progress', 'resolved'].map((status) => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={cn(
                "flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all",
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {status === 'all' ? 'All' : status === 'in_progress' ? 'Active' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Report */}
      {selectedReport && (
        <div className="p-4 border-b border-border">
          <SelectedReportCard report={selectedReport} onClose={onCloseReport} />
        </div>
      )}

      {/* Reports List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No reports found</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {searchQuery ? "Try a different search term" : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            filteredReports.slice(0, 50).map((report) => (
              <Card
                key={report.id}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
                  "active:translate-y-0",
                  selectedReport?.id === report.id 
                    ? "border-primary shadow-md ring-2 ring-primary/20" 
                    : "border-border/50"
                )}
                onClick={() => onReportClick(report)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                      style={{ 
                        backgroundColor: `${getCategoryColor(report.category)}15`,
                      }}
                    >
                      {getCategoryIcon(report.category)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium capitalize truncate">
                          {report.category.replace('_', ' ')}
                        </span>
                        <div className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          getStatusColor(report.status || 'pending')
                        )} />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ReportsSidebar;
