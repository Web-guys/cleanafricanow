import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Menu, Home, Map, FileText, User, LogOut, Shield, Building2, Heart, X, MapPin, Trophy, Calendar, Info, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export const MobileNav = () => {
  const { user, signOut, hasRole } = useAuth();
  const { t } = useTranslation();

  const NavLink = ({ to, icon: Icon, children }: { to: string; icon: React.ElementType; children: React.ReactNode }) => (
    <SheetClose asChild>
      <Link
        to={to}
        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 transition-colors"
      >
        <Icon className="h-5 w-5 text-primary" />
        <span className="font-medium">{children}</span>
      </Link>
    </SheetClose>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CleanAfricaNow
            </span>
            <SheetClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <NavLink to="/" icon={Home}>{t('nav.home')}</NavLink>
            <NavLink to="/map" icon={Map}>{t('nav.map')}</NavLink>
            <NavLink to="/leaderboard" icon={Trophy}>Leaderboard</NavLink>
            <NavLink to="/cities-map" icon={MapPin}>Cities Map</NavLink>
            <NavLink to="/events" icon={Calendar}>Collection Events</NavLink>
            
            {user && (
              <>
                <div className="pt-2 pb-1">
                  <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Your Account
                  </p>
                </div>
                <NavLink to="/report" icon={FileText}>{t('nav.reportIssue')}</NavLink>
                <NavLink to="/profile" icon={User}>Profile</NavLink>
                
                {hasRole('admin') && (
                  <NavLink to="/admin" icon={Shield}>{t('nav.admin')}</NavLink>
                )}
                
                {hasRole('municipality') && !hasRole('admin') && (
                  <NavLink to="/municipality" icon={Building2}>{t('nav.municipality', 'Municipality')}</NavLink>
                )}
                
                {hasRole('ngo') && (
                  <NavLink to="/ngo" icon={Heart}>{t('nav.ngo', 'NGO Dashboard')}</NavLink>
                )}
              </>
            )}
            
            <div className="pt-2 pb-1">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                More
              </p>
            </div>
            <NavLink to="/about" icon={Info}>{t('nav.about')}</NavLink>
            <NavLink to="/contact" icon={Mail}>{t('nav.contact')}</NavLink>
          </nav>

          {/* Footer Actions */}
          <div className="p-4 border-t space-y-3">
            {user ? (
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3" 
                onClick={signOut}
              >
                <LogOut className="h-5 w-5" />
                {t('nav.signOut')}
              </Button>
            ) : (
              <SheetClose asChild>
                <Button asChild className="w-full">
                  <Link to="/auth">{t('nav.signIn')}</Link>
                </Button>
              </SheetClose>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
