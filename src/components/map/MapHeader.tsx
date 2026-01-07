import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Plus, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MapHeaderProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

const MapHeader = ({ onToggleSidebar, showSidebarToggle }: MapHeaderProps) => {
  const { t } = useTranslation();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md z-50 flex-shrink-0">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleSidebar}>
              <Menu className="w-5 h-5" />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary/25 transition-shadow">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:block">
              CleanAfricaNow
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
            <Link to="/">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          <Button size="sm" asChild className="shadow-lg shadow-primary/20">
            <Link to="/report">
              <Plus className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.reportIssue')}</span>
              <span className="sm:hidden">Report</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MapHeader;
