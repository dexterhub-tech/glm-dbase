import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useEffect, useState, lazy, Suspense } from "react";
import { useAOS } from "@/hooks/useAOS";
import 'aos/dist/aos.css';
import { createQueryClient } from "@/lib/react-query-config";
import RouteGuard from "@/components/auth/RouteGuard";
import AuthGuard from "@/components/auth/AuthGuard";
import EnhancedRouteProtection from "@/components/auth/EnhancedRouteProtection";
import RouteProtectionProvider from "@/components/auth/RouteProtectionManager";
import { routeProtectionConfig } from "@/config/routeConfig";

// Lazy load pages for code splitting
// Lazy load pages for code splitting
const AdminAccess = lazy(() => import("./pages/AdminAccess"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthLogin = lazy(() => import("./pages/AuthLogin"));
const AuthSignup = lazy(() => import("./pages/AuthSignup"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
// Remaining lazy loads
const NotFound = lazy(() => import("./pages/NotFound"));
// Profile and Settings are kept as they might be used within admin or generic auth
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));

// Lazy load React Query Devtools for development
const ReactQueryDevtoolsLazy = lazy(() =>
  import('@tanstack/react-query-devtools').then(mod => ({
    default: mod.ReactQueryDevtools
  }))
);

// Component to conditionally render the header
const AppContent = () => {
  const location = useLocation();

  // Initialize AOS with optimized settings
  const { refreshAOS } = useAOS({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    mirror: false,
    offset: 80,
  });

  // Refresh AOS when route changes
  useEffect(() => {
    refreshAOS();
  }, [location.pathname, refreshAOS]);

  // Check if the current path is an admin route
  // const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow pt-0">
        <RouteProtectionProvider
          defaultRedirectPath="/auth/login"
          onUnauthorizedAccess={(path, reason) => {
            console.warn(`Unauthorized access attempt to ${path}: ${reason}`);
            // Could dispatch analytics event here
          }}
          onAccessGranted={(path, config) => {
            console.log(`Access granted to ${path}`, config);
            // Could dispatch analytics event here
          }}
        >
          <EnhancedRouteProtection
            onAuthRequired={(path, reason) => {
              console.log(`Authentication required for ${path}: ${reason}`);
            }}
            onAccessDenied={(path, reason) => {
              console.warn(`Access denied to ${path}: ${reason}`);
            }}
            onRedirect={(from, to, reason) => {
              console.log(`Redirecting from ${from} to ${to}: ${reason}`);
            }}
          >
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/login" element={<AuthLogin />} />
              <Route path="/auth/signup" element={<AuthSignup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected User Routes */}
              <Route 
                path="/profile" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="update_own_profile"
                  >
                    <Profile />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="update_own_profile"
                  >
                    <Settings />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin-access" 
                element={
                  <AuthGuard requireAuth={true}>
                    <AdminAccess />
                  </AuthGuard>
                } 
              />
              
              {/* Protected Admin Routes */}
              <Route 
                path="/" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="view_admin_dashboard"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="view_admin_dashboard"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/members" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/pastors" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/pastors/:pastorId" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/events" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_events"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/sermons" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_events"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/settings" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="system_admin"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/users" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/system" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="system_admin"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/profile" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="view_admin_dashboard"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              
              {/* Church Units Routes */}
              <Route 
                path="/admin/units/3hmedia" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/units/3hmusic" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/units/3hmovies" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/units/3hsecurity" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/units/discipleship" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/units/praisefeet" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/units/ushering" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/units/sanitation" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/units/tof" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              <Route 
                path="/admin/units/cloventongues" 
                element={
                  <AuthGuard 
                    requireAuth={true} 
                    requiredPermission="manage_members"
                    reVerifyForAdmin={true}
                  >
                    <AdminDashboard />
                  </AuthGuard>
                } 
              />
              
              {/* Fallback route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </EnhancedRouteProtection>
        </RouteProtectionProvider>
      </main>
    </div>
  );
};

const App = () => {
  // Create a new QueryClient instance with our optimized configuration
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      {/* Add React Query Devtools - only visible in development */}
      {import.meta.env.DEV && (
        <Suspense fallback={null}>
          <ReactQueryDevtoolsLazy />
        </Suspense>
      )}
    </QueryClientProvider>
  );
};

export default App;