import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Users, 
  LogOut, 
  Home,
  Menu,
  X,
  ChevronRight,
  Heart
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ReactNode, useState } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  icon?: ReactNode;
  role: 'admin' | 'municipality' | 'ngo' | 'volunteer' | 'partner' | 'tourist';
}

export const DashboardLayout = ({ children, title, icon, role }: DashboardLayoutProps) => {
  const { t } = useTranslation();
  const { signOut, hasRole } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const adminLinks = [
    { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/admin/reports', label: t('nav.allReports'), icon: FileText },
    { to: '/admin/cities', label: t('nav.cities'), icon: Building2 },
    { to: '/admin/users', label: t('admin.users.title'), icon: Users },
  ];

  const municipalityLinks = [
    { to: '/municipality', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/admin/reports', label: t('municipality.dashboard.manageReports', 'Manage Reports'), icon: FileText },
  ];

  const ngoLinks = [
    { to: '/ngo', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/admin/reports', label: t('municipality.dashboard.manageReports', 'Manage Reports'), icon: FileText },
  ];

  const volunteerLinks = [
    { to: '/volunteer', label: t('nav.dashboard'), icon: LayoutDashboard },
  ];

  const partnerLinks = [
    { to: '/partner', label: t('nav.dashboard'), icon: LayoutDashboard },
  ];

  const touristLinks = [
    { to: '/tourist', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/map', label: t('nav.map'), icon: MapPin },
  ];

  const getLinks = () => {
    switch (role) {
      case 'admin': return adminLinks;
      case 'municipality': return municipalityLinks;
      case 'ngo': return ngoLinks;
      case 'volunteer': return volunteerLinks;
      case 'partner': return partnerLinks;
      case 'tourist': return touristLinks;
      default: return [];
    }
  };

  const links = getLinks();

  const NavLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
          isActive 
            ? "bg-primary text-primary-foreground shadow-lg" 
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{children}</span>
        {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
      </Link>
    );
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={cn(
      "flex flex-col h-full bg-card",
      mobile ? "p-4" : "p-6 border-r border-border"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
          <MapPin className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            CleanAfricaNow
          </h1>
          <p className="text-xs text-muted-foreground capitalize">{role} Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          mobile ? (
            <SheetClose key={link.to} asChild>
              <NavLink to={link.to} icon={link.icon}>{link.label}</NavLink>
            </SheetClose>
          ) : (
            <NavLink key={link.to} to={link.to} icon={link.icon}>{link.label}</NavLink>
          )
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-2 pt-4 border-t border-border">
        {mobile ? (
          <SheetClose asChild>
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-5 w-5" />
              <span className="font-medium">{t('nav.publicSite')}</span>
            </Link>
          </SheetClose>
        ) : (
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-5 w-5" />
            <span className="font-medium">{t('nav.publicSite')}</span>
          </Link>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="fixed w-72 h-screen overflow-y-auto scrollbar-thin">
          <Sidebar />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 py-3 sm:py-4 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Mobile Menu */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                    <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-72 p-0">
                  <Sidebar mobile />
                </SheetContent>
              </Sheet>
              
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="shrink-0">{icon}</div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  );
};
