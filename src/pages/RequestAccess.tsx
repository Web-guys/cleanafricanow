import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import InstitutionalRegistrationForm from "@/components/registration/InstitutionalRegistrationForm";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Shield } from "lucide-react";
import { MoroccanPattern, MoroccanCorner } from "@/components/ui/moroccan-pattern";

const RequestAccess = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">
            Please sign in first to request institutional access.
          </p>
          <Button asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <MapPin className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CleanAfricaNow
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-moroccan-teal via-primary to-moroccan-blue py-16 overflow-hidden">
        <MoroccanPattern variant="zellige" opacity={0.08} color="white" />
        <MoroccanCorner position="top-left" size={80} className="text-moroccan-gold/30" />
        <MoroccanCorner position="bottom-right" size={80} className="text-moroccan-gold/30" />
        
        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Institutional Access</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Request Institutional Access
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Join CleanAfricaNow as a municipality, NGO, or partner company. 
            Get access to powerful tools for waste management and environmental protection.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <InstitutionalRegistrationForm />

        {/* Info Section */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Verified Access</h3>
            <p className="text-sm text-muted-foreground">
              All institutional accounts are verified by our admin team
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Territory Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage reports and resources in your assigned cities
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Access detailed analytics and reporting tools
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestAccess;
