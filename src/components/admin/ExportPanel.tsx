import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  Users, 
  Building2,
  FileText,
  BarChart3,
  Loader2,
  Calendar
} from "lucide-react";
import { format, subDays } from "date-fns";

type ExportAction = "reports" | "users" | "organizations" | "summary";
type ExportFormat = "json" | "csv";

interface ExportFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  category?: string;
  priority?: string;
}

export const ExportPanel = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<ExportAction>("reports");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [filters, setFilters] = useState<ExportFilters>({
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analytics-export', {
        body: {
          action: exportType,
          format: exportFormat,
          filters: exportType === 'reports' ? filters : undefined,
        },
      });

      if (error) throw error;

      if (exportFormat === 'csv' && typeof data === 'string') {
        // Download CSV file
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${exportType}-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        toast({
          title: "Export Successful",
          description: `${exportType} exported as CSV`,
        });
      } else {
        // Download JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${exportType}-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        toast({
          title: "Export Successful",
          description: `${exportType} exported as JSON`,
        });
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportOptions = [
    { value: 'reports', label: 'Reports', icon: FileText, description: 'All environmental reports with location and status' },
    { value: 'users', label: 'Users', icon: Users, description: 'User profiles with roles and activity metrics' },
    { value: 'organizations', label: 'Organizations', icon: Building2, description: 'Organization details and member counts' },
    { value: 'summary', label: 'Summary Analytics', icon: BarChart3, description: 'Aggregated statistics and trends' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Export Data
        </CardTitle>
        <CardDescription>
          Export reports, users, and analytics data in CSV or JSON format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {exportOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setExportType(option.value as ExportAction)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                exportType === option.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <option.icon className={`h-5 w-5 mb-2 ${exportType === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-medium">{option.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
            </button>
          ))}
        </div>

        {/* Format Selection */}
        <div className="flex items-center gap-4">
          <Label>Format:</Label>
          <div className="flex gap-2">
            <Button
              variant={exportFormat === 'csv' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportFormat('csv')}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </Button>
            <Button
              variant={exportFormat === 'json' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setExportFormat('json')}
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              JSON
            </Button>
          </div>
        </div>

        {/* Filters for Reports */}
        {exportType === 'reports' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </Label>
              <Input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </Label>
              <Input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(v) => setFilters(prev => ({ ...prev, status: v === 'all' ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={filters.priority || 'all'}
                onValueChange={(v) => setFilters(prev => ({ ...prev, priority: v === 'all' ? undefined : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          size="lg"
          className="w-full md:w-auto"
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export {exportOptions.find(o => o.value === exportType)?.label}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ExportPanel;
