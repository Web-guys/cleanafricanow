import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map } from "lucide-react";
import CitiesMap from "@/components/map/CitiesMap";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { MobileNav } from "@/components/home/MobileNav";
import logo from "@/assets/cleanafricanow-logo.png";

const CitiesMapView = () => {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="CleanAfricaNow" className="w-10 h-10 object-contain" />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
                CleanAfricaNow
              </h1>
            </Link>
            <div className="flex items-center gap-2 sm:hidden">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Map className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm">Cities Map</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link to="/map">View Reports Map</Link>
            </Button>
            <LanguageSwitcher />
            <ThemeToggle />
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="flex-1">
        <CitiesMap />
      </div>
    </div>
  );
};

export default CitiesMapView;