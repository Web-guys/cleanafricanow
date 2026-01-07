import { Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface MapFiltersProps {
  categoryFilter: string;
  statusFilter: string;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  reportCount: number;
}

const MapFilters = ({
  categoryFilter,
  statusFilter,
  onCategoryChange,
  onStatusChange,
  reportCount
}: MapFiltersProps) => {
  const { t } = useTranslation();

  const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    onCategoryChange('all');
    onStatusChange('all');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          {t('map.filters')}
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
            <X className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('map.category')}
          </label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder={t('map.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('map.allCategories')}</SelectItem>
              <SelectItem value="waste">🗑️ {t('report.categories.waste')}</SelectItem>
              <SelectItem value="pollution">🏭 {t('report.categories.pollution')}</SelectItem>
              <SelectItem value="danger">⚠️ {t('report.categories.danger')}</SelectItem>
              <SelectItem value="noise">🔊 {t('report.categories.noise')}</SelectItem>
              <SelectItem value="water">💧 {t('report.categories.water')}</SelectItem>
              <SelectItem value="air">💨 {t('report.categories.air')}</SelectItem>
              <SelectItem value="illegal_dumping">🚯 {t('report.categories.illegal_dumping')}</SelectItem>
              <SelectItem value="deforestation">🌲 {t('report.categories.deforestation')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('map.status')}
          </label>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder={t('map.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('map.allStatus')}</SelectItem>
              <SelectItem value="pending">🟡 {t('report.status.pending')}</SelectItem>
              <SelectItem value="in_progress">🔵 {t('report.status.inProgress')}</SelectItem>
              <SelectItem value="resolved">🟢 {t('report.status.resolved')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Results</span>
          <Badge variant="secondary" className="font-mono">
            {reportCount}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default MapFilters;
