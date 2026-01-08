import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useReports, type Report } from "@/hooks/useReports";
import MapHeader from "@/components/map/MapHeader";
import MapFilters from "@/components/map/MapFilters";
import ReportsList from "@/components/map/ReportsList";
import SelectedReportCard from "@/components/map/SelectedReportCard";
import LeafletMap from "@/components/map/LeafletMap";
import CreateReportDialog from "@/components/map/CreateReportDialog";
import CategoryFilterChips from "@/components/map/CategoryFilterChips";
import ReportBottomSheet from "@/components/map/ReportBottomSheet";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { PanelLeft, Plus, MousePointerClick, Flame, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarContentProps {
  categoryFilter: string;
  statusFilter: string;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  reportCount: number;
  selectedReport: Report | null;
  onCloseReport: () => void;
  reports: Report[] | undefined;
  isLoading: boolean;
  onReportClick: (report: Report) => void;
}

const SidebarContent = ({
  categoryFilter,
  statusFilter,
  onCategoryChange,
  onStatusChange,
  reportCount,
  selectedReport,
  onCloseReport,
  reports,
  isLoading,
  onReportClick,
}: SidebarContentProps) => {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <MapFilters
        categoryFilter={categoryFilter}
        statusFilter={statusFilter}
        onCategoryChange={onCategoryChange}
        onStatusChange={onStatusChange}
        reportCount={reportCount}
      />

      {selectedReport && (
        <SelectedReportCard
          report={selectedReport}
          onClose={onCloseReport}
        />
      )}

      <div className="flex-1 min-h-0">
        <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">
          {t('map.recentReports')}
        </h3>
        <ReportsList
          reports={reports}
          isLoading={isLoading}
          selectedReportId={selectedReport?.id || null}
          onReportClick={onReportClick}
        />
      </div>
    </div>
  );
};

const MapView = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  
  // Create report dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data: reports, isLoading } = useReports({
    categoryFilter,
    statusFilter
  });

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    if (isMobile) {
      setBottomSheetOpen(true);
    }
  };

  const handleMarkerClick = (report: Report) => {
    setSelectedReport(report);
    if (isMobile) {
      setBottomSheetOpen(true);
    }
  };

  const handleCloseReport = () => {
    setSelectedReport(null);
    setBottomSheetOpen(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    if (user) {
      setClickedLocation({ lat, lng });
      setCreateDialogOpen(true);
    }
  };

  const sidebarProps = {
    categoryFilter,
    statusFilter,
    onCategoryChange: setCategoryFilter,
    onStatusChange: setStatusFilter,
    reportCount: reports?.length || 0,
    selectedReport,
    onCloseReport: handleCloseReport,
    reports,
    isLoading,
    onReportClick: handleReportClick,
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <MapHeader 
        onToggleSidebar={() => setSidebarOpen(true)} 
        showSidebarToggle={true}
      />

      {/* Category filter chips - visible on desktop */}
      <div className="hidden lg:block border-b border-border bg-card/50 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CategoryFilterChips
              selectedCategory={categoryFilter}
              onCategoryChange={setCategoryFilter}
            />
            <div className="h-6 w-px bg-border" />
            <Toggle
              pressed={heatmapEnabled}
              onPressedChange={setHeatmapEnabled}
              aria-label="Toggle heatmap"
              className="gap-2"
            >
              <Flame className="h-4 w-4" />
              Heatmap
            </Toggle>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/cities-map">
                <MapPin className="mr-2 h-4 w-4" />
                Cities Map
              </Link>
            </Button>
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MousePointerClick className="h-4 w-4" />
                <span>Click map to report</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-80 xl:w-96 bg-card border-r border-border flex-col overflow-hidden">
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[85vw] sm:w-96 p-0">
            <SidebarContent {...sidebarProps} />
          </SheetContent>
        </Sheet>

        {/* Map Container */}
        <div className="flex-1 relative">
          <LeafletMap
            reports={reports}
            selectedReport={selectedReport}
            onMarkerClick={handleMarkerClick}
            onMapClick={user ? handleMapClick : undefined}
            showHeatmap={heatmapEnabled}
          />
          
          {/* Mobile floating buttons */}
          <div className="lg:hidden absolute bottom-4 left-4 right-4 z-[1000] flex justify-between items-end">
            <Button
              variant="secondary"
              size="icon"
              className="shadow-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeft className="w-5 h-5" />
            </Button>
            
            {user && (
              <Button
                size="lg"
                className="shadow-lg gap-2"
                onClick={() => {
                  // Use current map center or default location
                  setClickedLocation({ lat: 31.6295, lng: -7.9811 });
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="w-5 h-5" />
                {t('nav.reportIssue')}
              </Button>
            )}
          </div>

          {/* Instruction overlay for logged-in users */}
          {user && !createDialogOpen && (
            <div className="hidden lg:flex absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-border items-center gap-2 text-sm animate-fade-in">
              <MousePointerClick className="h-4 w-4 text-primary" />
              <span>Click anywhere on the map to report an issue</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Report Dialog */}
      {clickedLocation && (
        <CreateReportDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              window.dispatchEvent(new Event('clearTempMarker'));
            }
          }}
          latitude={clickedLocation.lat}
          longitude={clickedLocation.lng}
        />
      )}

      {/* Mobile Report Bottom Sheet */}
      <ReportBottomSheet
        report={selectedReport}
        open={bottomSheetOpen}
        onOpenChange={setBottomSheetOpen}
      />
    </div>
  );
};

export default MapView;