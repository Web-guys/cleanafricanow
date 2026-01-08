import { useState, useRef, useCallback } from "react";
import type L from "leaflet";
import { useTranslation } from "react-i18next";
import { useReports, type Report } from "@/hooks/useReports";
import MapHeader from "@/components/map/MapHeader";
import LeafletMap from "@/components/map/LeafletMap";
import CreateReportDialog from "@/components/map/CreateReportDialog";
import ReportBottomSheet from "@/components/map/ReportBottomSheet";
import QuickCategoryFilter from "@/components/map/QuickCategoryFilter";
import StatusFilter from "@/components/map/StatusFilter";
import MapControls from "@/components/map/MapControls";
import MapLegend from "@/components/map/MapLegend";
import MapStats from "@/components/map/MapStats";
import ReportsSidebar from "@/components/map/ReportsSidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, List, X, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const MapView = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const mapRef = useRef<L.Map | null>(null);
  
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

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const handleLocate = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current?.flyTo(
            [position.coords.latitude, position.coords.longitude],
            14,
            { duration: 1 }
          );
        },
        (error) => console.error('Geolocation error:', error)
      );
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <MapHeader 
        onToggleSidebar={() => setSidebarOpen(true)} 
        showSidebarToggle={true}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-80 xl:w-96 bg-card/50 backdrop-blur-sm border-r border-border flex-col overflow-hidden">
          <ReportsSidebar
            reports={reports}
            isLoading={isLoading}
            selectedReport={selectedReport}
            onReportClick={handleReportClick}
            onCloseReport={handleCloseReport}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            onCategoryChange={setCategoryFilter}
            onStatusChange={setStatusFilter}
          />
        </aside>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[85vw] sm:w-96 p-0">
            <ReportsSidebar
              reports={reports}
              isLoading={isLoading}
              selectedReport={selectedReport}
              onReportClick={(report) => {
                handleReportClick(report);
                setSidebarOpen(false);
              }}
              onCloseReport={handleCloseReport}
              categoryFilter={categoryFilter}
              statusFilter={statusFilter}
              onCategoryChange={setCategoryFilter}
              onStatusChange={setStatusFilter}
            />
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
            mapRef={mapRef}
          />
          
          {/* Top Overlay Controls */}
          <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-3 pointer-events-none">
            {/* Stats Bar - Desktop Only */}
            <div className="hidden lg:flex items-center justify-between">
              <MapStats reports={reports} className="pointer-events-auto" />
              
              {/* Cities Map Link */}
              <Button 
                variant="secondary" 
                size="sm" 
                asChild 
                className="pointer-events-auto shadow-lg bg-card/95 backdrop-blur-md border border-border/50 hover:bg-card"
              >
                <Link to="/cities-map">
                  <MapPin className="mr-2 h-4 w-4" />
                  Cities Map
                </Link>
              </Button>
            </div>

            {/* Category Filter - Always visible */}
            <div className="flex justify-center pointer-events-auto">
              <QuickCategoryFilter
                selectedCategory={categoryFilter}
                onCategoryChange={setCategoryFilter}
                className="max-w-full"
              />
            </div>

            {/* Status Filter - Desktop only */}
            <div className="hidden lg:flex justify-center pointer-events-auto">
              <StatusFilter
                selectedStatus={statusFilter}
                onStatusChange={setStatusFilter}
              />
            </div>
          </div>

          {/* Right Side Controls */}
          <MapControls
            heatmapEnabled={heatmapEnabled}
            onHeatmapToggle={setHeatmapEnabled}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocate={handleLocate}
            className="absolute top-1/2 -translate-y-1/2 right-4 z-[1000]"
          />

          {/* Bottom Left Legend */}
          <MapLegend className="absolute bottom-4 left-4 z-[1000] hidden lg:block" />
          
          {/* Mobile floating buttons */}
          <div className={cn(
            "lg:hidden absolute bottom-4 left-4 right-4 z-[1000] flex justify-between items-end",
            "transition-opacity duration-200",
            bottomSheetOpen && "opacity-0 pointer-events-none"
          )}>
            <Button
              variant="secondary"
              size="lg"
              className="shadow-lg bg-card/95 backdrop-blur-md border border-border/50 hover:bg-card gap-2"
              onClick={() => setSidebarOpen(true)}
            >
              <List className="w-5 h-5" />
              <span className="font-medium">{reports?.length || 0}</span>
            </Button>
            
            {user && (
              <Button
                size="lg"
                className="shadow-xl gap-2 bg-primary hover:bg-primary/90"
                onClick={() => {
                  setClickedLocation({ lat: 31.6295, lng: -7.9811 });
                  setCreateDialogOpen(true);
                }}
              >
                <Plus className="w-5 h-5" />
                {t('nav.reportIssue')}
              </Button>
            )}
          </div>

          {/* Selected Report Preview - Desktop */}
          {selectedReport && !isMobile && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4 lg:hidden xl:block">
              <div className="bg-card/95 backdrop-blur-md rounded-xl shadow-xl border border-border/50 p-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shrink-0">
                    {reports?.find(r => r.id === selectedReport.id)?.category && 
                      (categoryIcons as Record<string, string>)[selectedReport.category] || '📍'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold capitalize truncate">
                      {selectedReport.category.replace('_', ' ')}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {selectedReport.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 -mr-2 -mt-2"
                    onClick={handleCloseReport}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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

// Category icons for quick lookup
const categoryIcons: Record<string, string> = {
  waste: '🗑️',
  pollution: '🏭',
  danger: '⚠️',
  noise: '🔊',
  water: '💧',
  air: '💨',
  illegal_dumping: '🚯',
  deforestation: '🌲',
  other: '📍',
};

export default MapView;
