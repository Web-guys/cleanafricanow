import { Link, useLocation } from "react-router-dom";
import { Home, Map, Plus, User, Calendar, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCenter?: boolean;
}

const NavItem = ({ to, icon: Icon, label, isActive, isCenter }: NavItemProps) => {
  if (isCenter) {
    return (
      <Link
        to={to}
        className={cn(
          "flex flex-col items-center justify-center -mt-6 relative",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-primary to-primary/80",
          "shadow-lg shadow-primary/30",
          "transition-all duration-200 active:scale-95",
          "text-primary-foreground"
        )}
      >
        <Icon className="h-6 w-6" />
        <span className="sr-only">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[60px]",
        "transition-all duration-200",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-xl transition-all duration-200",
        isActive && "bg-primary/10"
      )}>
        <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
      </div>
      <span className={cn(
        "text-[10px] font-medium transition-all",
        isActive && "font-semibold"
      )}>
        {label}
      </span>
    </Link>
  );
};

export const MobileBottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  // Don't show on admin/dashboard pages or auth page
  const hiddenPaths = ['/admin', '/municipality', '/ngo', '/volunteer', '/partner', '/auth'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 md:hidden",
      "bg-card/95 backdrop-blur-lg",
      "border-t border-border",
      "safe-area-inset-bottom"
    )}>
      <div className="flex items-center justify-around px-2 pb-safe">
        <NavItem
          to="/"
          icon={Home}
          label={t('nav.home')}
          isActive={isActive('/')}
        />
        
        <NavItem
          to="/map"
          icon={Map}
          label={t('nav.map')}
          isActive={isActive('/map')}
        />
        
        {/* Center Report Button */}
        <NavItem
          to={user ? "/report" : "/auth"}
          icon={Plus}
          label={t('nav.reportIssue')}
          isActive={isActive('/report')}
          isCenter
        />
        
        <NavItem
          to="/events"
          icon={Calendar}
          label={t('events.title', 'Events')}
          isActive={isActive('/events')}
        />
        
        {user ? (
          <NavItem
            to="/profile"
            icon={User}
            label={t('nav.profile', 'Profile')}
            isActive={isActive('/profile')}
          />
        ) : (
          <NavItem
            to="/auth"
            icon={LogIn}
            label={t('nav.signIn')}
            isActive={isActive('/auth')}
          />
        )}
      </div>
    </nav>
  );
};
