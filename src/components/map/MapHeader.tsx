import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Menu, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { NetworkStatusIndicator } from "@/components/NetworkStatusIndicator";

import logo from "@/assets/cleanafricanow-logo.png";

interface MapHeaderProps {
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

const MapHeader = ({ onToggleSidebar, showSidebarToggle }: MapHeaderProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className={cn(
      "border-b border-border bg-card/80 backdrop-blur-md z-50 flex-shrink-0",
      "transition-all duration-200"
    )}>
      <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {showSidebarToggle && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-9 w-9" 
              onClick={onToggleSidebar}
            >
              <Menu className="w-5 h-5" />
            </Button>
          )}
          
          <Link to="/" className="flex items-center gap-2 group">
            <img src={logo} alt="CleanAfricaNow" className="w-9 h-9 object-contain" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                CleanAfricaNow
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">Environmental Reports</p>
            </div>
          </Link>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <NetworkStatusIndicator className="hidden sm:flex" />
          <LanguageSwitcher />
          <ThemeToggle />
          
          <div className="hidden sm:block h-6 w-px bg-border mx-1" />
          
          <Button 
            variant="ghost" 
            size="sm" 
            asChild 
            className="hidden sm:inline-flex h-9"
          >
            <Link to="/">
              <Home className="mr-1.5 h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>
          
          <Button 
            size="sm" 
            asChild 
            className={cn(
              "h-9 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all",
              !user && "hidden sm:inline-flex"
            )}
          >
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