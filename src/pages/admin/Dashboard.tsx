
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, RefreshCw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/ui/loading-spinner";
import { UserAvatar } from "@/components/UserAvatar";

// Lazy load admin components
const AdminSidebar = lazy(() => import("@/components/admin/AdminSidebar"));
const DashboardHeader = lazy(() => import("@/components/admin/dashboard/DashboardHeader"));
const DashboardContent = lazy(() => import("@/components/admin/dashboard/DashboardContent"));
const AdminStats = lazy(() => import("@/components/admin/dashboard/AdminStatsSimple"));

const AdminDashboard = () => {
  const { user, isAdmin, isSuperUser, isLoading, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [forceLoaded, setForceLoaded] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  console.log('AdminDashboard rendering with:', {
    user: user ? 'User logged in' : 'No user',
    isAdmin,
    isSuperUser,
    isLoading,
    loadingTimeout,
    forceLoaded,
    email: user?.email,
    storedSuperUserStatus: localStorage.getItem('glm-is-superuser') === 'true'
  });

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when changing to mobile view
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Add a timeout for loading state
  useEffect(() => {
    // Clear any existing timeout when component unmounts or dependencies change
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Set a timeout to show continue option if loading takes too long
  useEffect(() => {
    if (isLoading && !loadingTimeout && !forceLoaded) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.log('Auth loading taking longer than expected, showing continue option');
        setLoadingTimeout(true);
      }, 2000); // Reduced to 2 seconds for faster response
    } else if (!isLoading && loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [isLoading, loadingTimeout, forceLoaded]);

  // Redirect if not logged in or not an admin/superuser
  useEffect(() => {
    const checkAuth = async () => {
      // If we're still loading but not in a timeout state, just wait
      if (isLoading && !loadingTimeout && !forceLoaded) {
        console.log('Still loading auth state...');
        return;
      }

      // Check for admin status with multiple fallbacks
      const storedSuperUserStatus = localStorage.getItem('glm-is-superuser') === 'true';
      const storedAdminStatus = localStorage.getItem('glm-is-admin') === 'true';

      // Admin email whitelist
      const adminEmails = ['ojidelawrence@gmail.com', 'admin@gospellabourministry.com'];
      const isAdminEmail = user?.email && adminEmails.includes(user.email.toLowerCase());

      const hasAdminAccess = isAdmin || isSuperUser || storedSuperUserStatus || storedAdminStatus || isAdminEmail;

      // if (!user && !storedSuperUserStatus && !storedAdminStatus) {
      //   console.log('No user found, redirecting to auth page');
      //   navigate("/auth");
      //   return;
      // }

      // if (user && !hasAdminAccess) {
      //   console.log('User is not admin, redirecting to auth page');
      //   navigate("/auth");
      //   return;
      // }

      // If user has admin email but no stored status, grant access
      if (user && isAdminEmail && !storedAdminStatus) {
        localStorage.setItem('glm-is-admin', 'true');
        if (user.email?.toLowerCase() === 'ojidelawrence@gmail.com') {
          localStorage.setItem('glm-is-superuser', 'true');
        }
      }

      console.log('User is authorized to access admin dashboard');
    };

    checkAuth();
  }, [user, isAdmin, isSuperUser, isLoading, loadingTimeout, forceLoaded, navigate]);

  // Force continue function for when loading gets stuck
  const handleForceContinue = () => {
    setForceLoaded(true);
    toast({
      title: "Loading admin dashboard",
      description: "Continuing to admin dashboard...",
    });
  };

  // Show loading state
  if ((isLoading && !forceLoaded) || (loadingTimeout && !forceLoaded)) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-gray-50">
        <div className="text-center space-y-6 max-w-md">
          <div className="bg-white rounded-lg p-8 shadow-sm border">
            {loadingTimeout ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Loading Admin Dashboard
                </h2>
                <p className="text-gray-600 mb-4">
                  We're setting up your admin access. This may take a moment.
                </p>
                <Button
                  onClick={handleForceContinue}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Preparing Admin Dashboard
                </h2>
                <p className="text-gray-600">
                  Please wait while we verify your admin access...
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isSuperUser)) {
    return null;
  }

  return (
    <div className="md:flex min-h-screen bg-gray-50">

      {/* Floating Sidebar */}
      <aside className={`
    fixed top-8 md:left-8 z-40 h-[90vh] md:w-64 bg-white rounded-3xl shadow-lg border border-gray-100
    transition-transform duration-300 ease-in-out
    ${sidebarOpen ? 'translate-x-0 left-4' : '-translate-x-full'}
    md:translate-x-0
  `}>
       {isMobile && sidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="absolute top-6 right-4 text-gray-700 hover:bg-gray-100 rounded-full h-8 w-8 p-0"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </Button>
        )}
        <Suspense fallback={<div className="p-4">Loading sidebar...</div>}>
          <AdminSidebar />
        </Suspense>
      </aside>

      {/* Backdrop for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="md:flex-1 flex flex-col md:ml-72">

        {/* Mobile Header */}
        <header className="md:hidden sticky top-4 mx-4 z-20 bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm px-4 py-3 rounded-2xl md:mx-2">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-gray-700 hover:bg-gray-100 rounded-xl"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <h1 className={`text-lg font-sans font-bold ${isSuperUser ? "text-[#ff0000]" : "text-[#ff0000]"}`}>
              {isSuperUser ? "GLM-Admin" : "Admin"}
            </h1>

            <div className="flex items-center space-x-3 mb-2">
              <UserAvatar user={user} className="h-12 w-12" />
            </div>
            {/* <div className="w-10" /> Spacer for alignment */}
          </div>
        </header>

        {/* Main Content */}
        <main className=" md:p-6 lg:p-8">
          <Suspense fallback={<PageLoader />}>
            <DashboardContent />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
