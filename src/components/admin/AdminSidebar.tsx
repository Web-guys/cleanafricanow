import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  Users, 
  Clock, 
  Brain, 
  Download, 
  ScrollText,
  Map,
  Home,
  LogOut,
  ChevronRight,
  Settings,
  Activity,
  Globe,
  UserCheck,
  Shield
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminSidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export const AdminSidebar = ({ mobile = false, onNavigate }: AdminSidebarProps) => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const location = useLocation();

  // Fetch pending counts for badges
  const { data: pendingCounts } = useQuery({
    queryKey: ['admin-pending-counts'],
    queryFn: async () => {
      const { data: reports } = await supabase
        .from('reports')
        .select('status, sla_due_date')
        .in('status', ['pending', 'in_progress']);
      
      const { data: registrationRequests } = await supabase
        .from('registration_requests')
        .select('status')
        .eq('status', 'pending');
      
      const pending = reports?.filter(r => r.status === 'pending').length || 0;
      const overdue = reports?.filter(r => 
        r.sla_due_date && new Date(r.sla_due_date) < new Date()
      ).length || 0;
      const pendingRegistrations = registrationRequests?.length || 0;
      
      return { pending, overdue, pendingRegistrations };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const mainLinks = [
    { to: '/admin', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
    { to: '/admin/reports', label: t('nav.allReports'), icon: FileText, badge: pendingCounts?.pending },
    { to: '/admin/sla', label: 'SLA Dashboard', icon: Clock, badge: pendingCounts?.overdue, badgeVariant: 'destructive' as const },
    { to: '/admin/ai-analysis', label: 'AI Analysis', icon: Brain },
  ];

  const managementLinks = [
    { to: '/admin/users', label: t('admin.users.title'), icon: Users },
    { to: '/admin/registration-requests', label: 'Registration Requests', icon: UserCheck, badge: pendingCounts?.pendingRegistrations },
    { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
    { to: '/admin/countries', label: 'Countries', icon: Globe },
    { to: '/admin/cities', label: t('nav.cities'), icon: Map },
  ];

  const toolsLinks = [
    { to: '/admin/analytics', label: 'Analytics', icon: Activity },
    { to: '/admin/export', label: 'Export Data', icon: Download },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const NavLink = ({ to, icon: Icon, children, badge, badgeVariant = 'secondary', exact = false }: { 
    to: string; 
    icon: React.ElementType; 
    children: React.ReactNode;
    badge?: number;
    badgeVariant?: 'secondary' | 'destructive';
    exact?: boolean;
  }) => {
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);
    
    const handleClick = () => {
      if (onNavigate) onNavigate();
    };

    return (
      <Link
        to={to}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group",
          isActive 
            ? "bg-primary text-primary-foreground shadow-md" 
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="font-medium flex-1">{children}</span>
        {badge && badge > 0 && (
          <Badge variant={badgeVariant} className="ml-auto text-xs px-2 py-0.5">
            {badge > 99 ? '99+' : badge}
          </Badge>
        )}
        {isActive && <ChevronRight className="h-4 w-4 ml-auto shrink-0" />}
      </Link>
    );
  };

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2 mt-6">
      {children}
    </p>
  );

  return (
    <div className={cn(
      "flex flex-col h-full bg-card",
      mobile ? "p-4" : "p-4 border-r border-border"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center shadow-lg">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">CleanAfricaNow</p>
        </div>
      </div>

      {/* System Status */}
      <div className="mx-2 mb-4 p-3 bg-success/10 border border-success/20 rounded-lg">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-success">System Healthy</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">All services operational</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto">
        <SectionLabel>Overview</SectionLabel>
        {mainLinks.map((link) => (
          <NavLink 
            key={link.to} 
            to={link.to} 
            icon={link.icon} 
            badge={link.badge}
            badgeVariant={link.badgeVariant}
            exact={link.exact}
          >
            {link.label}
          </NavLink>
        ))}

        <SectionLabel>Management</SectionLabel>
        {managementLinks.map((link) => (
          <NavLink key={link.to} to={link.to} icon={link.icon}>
            {link.label}
          </NavLink>
        ))}

        <SectionLabel>Tools</SectionLabel>
        {toolsLinks.map((link) => (
          <NavLink key={link.to} to={link.to} icon={link.icon}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-1 pt-4 border-t border-border mt-4">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-5 w-5" />
          <span className="font-medium">{t('nav.publicSite')}</span>
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
  );
};
