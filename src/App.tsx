import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import FloatingAdminButton from "@/components/FloatingAdminButton";
import { PageLoader } from "@/components/ui/loading-spinner";
import { useEffect, useState, lazy, Suspense } from "react";
import { useAOS } from "@/hooks/useAOS";
import 'aos/dist/aos.css';
import { createQueryClient } from "@/lib/react-query-config";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Sermons = lazy(() => import("./pages/Sermons"));
const Contact = lazy(() => import("./pages/Contact"));
const Partnership = lazy(() => import("./pages/Partnership"));
const Terms = lazy(() => import("./pages/Terms"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthLogin = lazy(() => import("./pages/AuthLogin"));
const AuthSignup = lazy(() => import("./pages/AuthSignup"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminAccess = lazy(() => import("./pages/AdminAccess"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));

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
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Only render the Header when not on admin routes */}
      {!isAdminRoute && <Header className="mt-28" />}
      {/* Floating Admin Button - shows on all non-admin pages */}
      {!isAdminRoute && <FloatingAdminButton />}
      <main className={`flex-grow ${isAdminRoute ? 'pt-0' : ''}`}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/sermons" element={<Sermons />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/partnership" element={<Partnership />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/login" element={<AuthLogin />} />
            <Route path="/auth/signup" element={<AuthSignup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin-access" element={<AdminAccess />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/members" element={<AdminDashboard />} />
            <Route path="/admin/pastors" element={<AdminDashboard />} />
            <Route path="/admin/pastors/:pastorId" element={<AdminDashboard />} />
            <Route path="/admin/events" element={<AdminDashboard />} />
            <Route path="/admin/sermons" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminDashboard />} />
            <Route path="/admin/system" element={<AdminDashboard />} />
            <Route path="/admin/profile" element={<AdminDashboard />} />
            {/* Church Units Routes */}
            <Route path="/admin/units/3hmedia" element={<AdminDashboard />} />
            <Route path="/admin/units/3hmusic" element={<AdminDashboard />} />
            <Route path="/admin/units/3hmovies" element={<AdminDashboard />} />
            <Route path="/admin/units/3hsecurity" element={<AdminDashboard />} />
            <Route path="/admin/units/discipleship" element={<AdminDashboard />} />
            <Route path="/admin/units/praisefeet" element={<AdminDashboard />} />
            <Route path="/admin/units/ushering" element={<AdminDashboard />} />
            <Route path="/admin/units/sanitation" element={<AdminDashboard />} />
            <Route path="/admin/units/tof" element={<AdminDashboard />} />
            <Route path="/admin/units/cloventongues" element={<AdminDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
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