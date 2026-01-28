import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { GoogleAnalyticsProvider } from "./components/GoogleAnalytics";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Report from "./pages/Report";
import MapView from "./pages/MapView";
import About from "./pages/About";
import Contact from "./pages/Contact";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminReports from "./pages/admin/Reports";
import AdminCities from "./pages/admin/Cities";
import AdminCountries from "./pages/admin/Countries";
import AdminUsers from "./pages/admin/Users";
import AdminOrganizations from "./pages/admin/Organizations";
import AdminSLADashboard from "./pages/admin/SLADashboard";
import AdminAuditLogs from "./pages/admin/AuditLogs";
import AdminAIAnalysis from "./pages/admin/AIAnalysis";
import AdminExport from "./pages/admin/Export";
import AdminSettings from "./pages/admin/Settings";
import AdminAnalytics from "./pages/admin/Analytics";
import NgoDashboard from "./pages/ngo/Dashboard";
import MunicipalityDashboard from "./pages/municipality/Dashboard";
import Mission from "./pages/Mission";
import Team from "./pages/Team";
import Careers from "./pages/Careers";
import Docs from "./pages/Docs";
import Community from "./pages/Community";
import Blog from "./pages/Blog";
import Press from "./pages/Press";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import Support from "./pages/Support";
import Profile from "./pages/Profile";
import CitiesMapView from "./pages/CitiesMapView";
import Leaderboard from "./pages/Leaderboard";
import CollectionEvents from "./pages/CollectionEvents";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GoogleAnalyticsProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/cities-map" element={<CitiesMapView />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/install" element={<Install />} />
            <Route path="/events" element={<CollectionEvents />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/mission" element={<Mission />} />
            <Route path="/team" element={<Team />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/community" element={<Community />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/press" element={<Press />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="/support" element={<Support />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <Report />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute requiredRoles={['admin', 'municipality']}>
                  <AdminReports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cities"
              element={
                <ProtectedRoute requiredRoles={['admin', 'municipality', 'ngo']}>
                  <AdminCities />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/organizations"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminOrganizations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/countries"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminCountries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/sla"
              element={
                <ProtectedRoute requiredRoles={['admin', 'municipality', 'ngo']}>
                  <AdminSLADashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ai-analysis"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminAIAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/export"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminExport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ngo"
              element={
                <ProtectedRoute requiredRoles={['ngo']}>
                  <NgoDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/municipality"
              element={
                <ProtectedRoute requiredRoles={['municipality']}>
                  <MunicipalityDashboard />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </GoogleAnalyticsProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
