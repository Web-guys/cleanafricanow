import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { GoogleAnalyticsProvider } from "./components/GoogleAnalytics";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Eager-loaded for instant first paint
import Home from "./pages/Home";

// Lazy-loaded routes for better performance
const Auth = lazy(() => import("./pages/Auth"));
const Report = lazy(() => import("./pages/Report"));
const MapView = lazy(() => import("./pages/MapView"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminCities = lazy(() => import("./pages/admin/Cities"));
const AdminCountries = lazy(() => import("./pages/admin/Countries"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminOrganizations = lazy(() => import("./pages/admin/Organizations"));
const AdminSLADashboard = lazy(() => import("./pages/admin/SLADashboard"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const AdminAIAnalysis = lazy(() => import("./pages/admin/AIAnalysis"));
const AdminExport = lazy(() => import("./pages/admin/Export"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminRegistrationRequests = lazy(() => import("./pages/admin/RegistrationRequests"));
const RequestAccess = lazy(() => import("./pages/RequestAccess"));
const NgoDashboard = lazy(() => import("./pages/ngo/Dashboard"));
const MunicipalityDashboard = lazy(() => import("./pages/municipality/Dashboard"));
const WasteBinsDashboard = lazy(() => import("./pages/municipality/WasteBinsDashboard"));
const VolunteerDashboard = lazy(() => import("./pages/volunteer/Dashboard"));
const PartnerDashboard = lazy(() => import("./pages/partner/Dashboard"));
const TouristDashboard = lazy(() => import("./pages/tourist/Dashboard"));
const Mission = lazy(() => import("./pages/Mission"));
const Team = lazy(() => import("./pages/Team"));
const Careers = lazy(() => import("./pages/Careers"));
const Docs = lazy(() => import("./pages/Docs"));
const Community = lazy(() => import("./pages/Community"));
const Blog = lazy(() => import("./pages/Blog"));
const Press = lazy(() => import("./pages/Press"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Support = lazy(() => import("./pages/Support"));
const Profile = lazy(() => import("./pages/Profile"));
const CitiesMapView = lazy(() => import("./pages/CitiesMapView"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const CollectionEvents = lazy(() => import("./pages/CollectionEvents"));
const Install = lazy(() => import("./pages/Install"));
const BinsMap = lazy(() => import("./pages/BinsMap"));
const Donate = lazy(() => import("./pages/Donate"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <GoogleAnalyticsProvider>
          <MobileBottomNav />
          <Suspense fallback={<PageLoader />}>
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
            <Route path="/donate" element={<Donate />} />
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
              path="/admin/registration-requests"
              element={
                <ProtectedRoute requiredRoles={['admin']}>
                  <AdminRegistrationRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request-access"
              element={
                <ProtectedRoute>
                  <RequestAccess />
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
            <Route
              path="/municipality/bins"
              element={
                <ProtectedRoute requiredRoles={['admin', 'municipality']}>
                  <WasteBinsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bins"
              element={<WasteBinsDashboard />}
            />
            <Route
              path="/bins-map"
              element={<BinsMap />}
            />
            <Route
              path="/volunteer"
              element={
                <ProtectedRoute requiredRoles={['volunteer']}>
                  <VolunteerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/partner"
              element={
                <ProtectedRoute requiredRoles={['partner']}>
                  <PartnerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tourist"
              element={
                <ProtectedRoute requiredRoles={['tourist']}>
                  <TouristDashboard />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </GoogleAnalyticsProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
