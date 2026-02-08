import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Clock,
  Settings,
  Home
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: number;
  badgeVariant?: "default" | "destructive";
}

const NavItem = ({ to, icon: Icon, label, isActive, badge, badgeVariant = "default" }: NavItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-0 flex-1 relative",
        "transition-all duration-200",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-xl transition-all duration-200 relative",
        isActive && "bg-primary/10"
      )}>
        <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
        {badge && badge > 0 && (
          <Badge 
            variant={badgeVariant === "destructive" ? "destructive" : "default"}
            className="absolute -top-1.5 -right-1.5 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]"
          >
            {badge > 9 ? "9+" : badge}
          </Badge>
        )}
      </div>
      <span className={cn(
        "text-[10px] font-medium transition-all truncate max-w-full",
        isActive && "font-semibold"
      )}>
        {label}
      </span>
    </Link>
  );
};

export const AdminMobileNav = () => {
  const location = useLocation();

  // Fetch pending counts for badges
  const { data: pendingCounts } = useQuery({
    queryKey: ['admin-mobile-nav-counts'],
    queryFn: async () => {
      const { data: reports } = await supabase
        .from('reports')
        .select('status, sla_due_date')
        .in('status', ['pending', 'in_progress']);
      
      const pending = reports?.filter(r => r.status === 'pending').length || 0;
      const overdue = reports?.filter(r => 
        r.sla_due_date && new Date(r.sla_due_date) < new Date()
      ).length || 0;
      
      return { pending, overdue };
    },
    refetchInterval: 60000,
  });

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
      "bg-card/95 backdrop-blur-lg",
      "border-t border-border",
      "safe-area-inset-bottom"
    )}>
      <div className="flex items-center justify-around px-1 pb-safe">
        <NavItem
          to="/admin"
          icon={LayoutDashboard}
          label="Dashboard"
          isActive={isActive('/admin', true)}
        />
        
        <NavItem
          to="/admin/reports"
          icon={FileText}
          label="Reports"
          isActive={isActive('/admin/reports')}
          badge={pendingCounts?.pending}
        />
        
        <NavItem
          to="/admin/sla"
          icon={Clock}
          label="SLA"
          isActive={isActive('/admin/sla')}
          badge={pendingCounts?.overdue}
          badgeVariant="destructive"
        />
        
        <NavItem
          to="/admin/users"
          icon={Users}
          label="Users"
          isActive={isActive('/admin/users')}
        />
        
        <NavItem
          to="/admin/settings"
          icon={Settings}
          label="Settings"
          isActive={isActive('/admin/settings')}
        />
        
        <NavItem
          to="/"
          icon={Home}
          label="Home"
          isActive={false}
        />
      </div>
    </nav>
  );
};
