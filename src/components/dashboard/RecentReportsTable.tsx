import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, MapPin, Clock, FileText, Image } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Report {
  id: string;
  category: string;
  description: string;
  status: string | null;
  latitude: number;
  longitude: number;
  city_id: string | null;
  created_at: string | null;
  photos?: string[] | null;
  cities?: {
    name: string;
    country: string;
  } | null;
}

interface RecentReportsTableProps {
  reports: Report[] | undefined;
  isLoading?: boolean;
  showCity?: boolean;
  showStatusSelect?: boolean;
  onStatusChange?: (id: string, status: string) => void;
  emptyMessage?: string;
  title?: string;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'waste':
      return 'bg-success/20 text-success-foreground border-success';
    case 'pollution':
      return 'bg-warning/20 text-warning-foreground border-warning';
    case 'danger':
      return 'bg-destructive/20 text-destructive-foreground border-destructive';
    case 'water':
      return 'bg-info/20 text-info-foreground border-info';
    case 'air':
      return 'bg-primary/20 text-primary-foreground border-primary';
    case 'noise':
      return 'bg-secondary/20 text-secondary-foreground border-secondary';
    case 'illegal_dumping':
      return 'bg-destructive/20 text-destructive-foreground border-destructive';
    case 'deforestation':
      return 'bg-success/20 text-success-foreground border-success';
    default:
      return 'bg-muted';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-warning/20 text-warning-foreground';
    case 'in_progress':
      return 'bg-info/20 text-info-foreground';
    case 'resolved':
      return 'bg-success/20 text-success-foreground';
    default:
      return 'bg-muted';
  }
};

export const RecentReportsTable = ({ 
  reports, 
  isLoading, 
  showCity = false,
  showStatusSelect = false,
  onStatusChange,
  emptyMessage,
  title
}: RecentReportsTableProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title || t('admin.dashboard.recentReports')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {title || t('admin.dashboard.recentReports')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!reports || reports.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {emptyMessage || t('admin.reports.noResults')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.reports.category')}</TableHead>
                  {showCity && <TableHead>{t('ngo.dashboard.city', 'City')}</TableHead>}
                  <TableHead className="hidden md:table-cell">{t('admin.reports.description')}</TableHead>
                  <TableHead>{t('admin.reports.status')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('admin.reports.date')}</TableHead>
                  <TableHead className="text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(report.category)}>
                          {t(`report.categories.${report.category}`)}
                        </Badge>
                        {report.photos && report.photos.length > 0 && (
                          <Image className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    {showCity && (
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {report.cities?.name || '-'}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="hidden md:table-cell max-w-xs">
                      <p className="truncate text-sm">{report.description}</p>
                    </TableCell>
                    <TableCell>
                      {showStatusSelect && onStatusChange ? (
                        <Select
                          value={report.status || 'pending'}
                          onValueChange={(value) => onStatusChange(report.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t('report.status.pending')}</SelectItem>
                            <SelectItem value="in_progress">{t('report.status.inProgress')}</SelectItem>
                            <SelectItem value="resolved">{t('report.status.resolved')}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getStatusColor(report.status || 'pending')}>
                          {t(`report.status.${report.status === 'in_progress' ? 'inProgress' : report.status || 'pending'}`)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {report.created_at ? format(new Date(report.created_at), 'MMM d') : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                        <Link to={`/map?lat=${report.latitude}&lng=${report.longitude}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          {t('admin.dashboard.view')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
