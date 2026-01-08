import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map } from "lucide-react";
import CitiesMap from "@/components/map/CitiesMap";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const CitiesMapView = () => {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Home
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Map className="w-4 h-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold hidden sm:block">Morocco Cities Map</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/map">View Reports Map</Link>
            </Button>
            <LanguageSwitcher />
            <ThemeToggle />
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