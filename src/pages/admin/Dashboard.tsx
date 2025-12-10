
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, RefreshCw, Shield, AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/ui/loading-spinner";
import { UserAvatar } from "@/components/UserAvatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { withAdminProtection } from "@/components/auth/withRoleProtection";
import { withNetworkAwareness } from "@/components/auth/withNetworkAwareness";
import { useNetworkConnectivity } from "@/hooks/useNetworkConnectivity";
import ConnectionStatus from "@/components/ui/connection-status";

// Lazy load admin components
const AdminSidebar = lazy(() => import("@/components/admin/AdminSidebar"));
const DashboardHeader = lazy(() => import("@/components/admin/dashboard/DashboardHeader"));
const DashboardContent = lazy(() => import("@/components/admin/dashboard/DashboardContent"));
const EnhancedDashboardContent = lazy(() => import("@/components/admin/dashboard/EnhancedDashboardContent"));
const AdminStats = lazy(() => import("@/components/admin/dashboard/AdminStatsSimple"));
const DashboardErrorBoundary = lazy(() => import("@/components/admin/dashboard/DashboardErrorBoundary"));
const FallbackDashboard = lazy(() => import("@/components/admin/dashboard/FallbackDashboard"));

const AdminDashboard = () => {
  const { user, isAdmin, isSuperUser, isLoading, userRole, reVerifyPermissions, hasPermission } = useAuth();
  const { shouldShowOfflineMessage, hasConnectionError } = useNetworkConnectivity();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [forceLoaded, setForceLoaded] = useState(false);
  const [permissionVerified, setPermissionVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  console.log('AdminDashboard rendering with:', {
    user: user ? 'User logged in' : 'No user',
    isAdmin,
    isSuperUser,
    isLoading,
    loadingTimeout,
    forceLoaded,
    permissionVerified,
    email: user?.email,
    role: userRole?.role,
    permissions: userRole?.permissions?.length || 0,
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

  // Enhanced permission verification for admin access
  useEffect(() => {
    const verifyAdminAccess = async () => {
      // If we're still loading but not in a timeout state, just wait
      if (isLoading && !loadingTimeout && !forceLoaded) {
        console.log('Still loading auth state...');
        return;
      }

      if (!user) {
        console.log('No user found, redirecting to auth page');
        navigate("/auth");
        return;
      }

      try {
        // Re-verify admin permissions for sensitive access
        const hasAdminPermission = await reVerifyPermissions('view_admin_dashboard');
        
        if (!hasAdminPermission) {
          // Check for legacy fallbacks
          const storedSuperUserStatus = localStorage.getItem('glm-is-superuser') === 'true';
          const storedAdminStatus = localStorage.getItem('glm-is-admin') === 'true';
          const adminEmails = ['ojidelawrence@gmail.com', 'admin@gospellabourministry.com'];
          const isAdminEmail = user?.email && adminEmails.includes(user.email.toLowerCase());

          const hasLegacyAccess = storedSuperUserStatus || storedAdminStatus || isAdminEmail;

          if (!hasLegacyAccess) {
            console.log('User lacks admin permissions, redirecting to access denied');
            navigate("/admin-access");
            return;
          }

          // Grant temporary access for legacy users but log the fallback
          console.warn('Using legacy admin access fallback for user:', user.email);
          setVerificationError('Using legacy access - please update your permissions');
        }

        setPermissionVerified(true);
        console.log('Admin access verified successfully');

      } catch (error: any) {
        console.error('Error verifying admin access:', error);
        setVerificationError(error.message);
        
        // Still allow access but show warning
        setPermissionVerified(true);
      }
    };

    verifyAdminAccess();
  }, [user, isLoading, loadingTimeout, forceLoaded, navigate, reVerifyPermissions]);

  // Force continue function for when loading gets stuck
  const handleForceContinue = () => {
    setForceLoaded(true);
    toast({
      title: "Loading admin dashboard",
      description: "Continuing to admin dashboard...",
    });
  };

  // Show loading state
  if ((isLoading && !forceLoaded) || (loadingTimeout && !forceLoaded) || !permissionVerified) {
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
                  {permissionVerified ? 'Preparing Admin Dashboard' : 'Verifying Admin Access'}
                </h2>
                <p className="text-gray-600">
                  {permissionVerified 
                    ? 'Please wait while we load your dashboard...'
                    : 'Please wait while we verify your admin permissions...'
                  }
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="md:flex min-h-screen bg-gray-50">
      {/* Permission verification warning */}
      {verificationError && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {verificationError}
            </AlertDescription>
          </Alert>
        </div>
      )}

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
              <UserAvatar className="h-12 w-12" />
            </div>
            {/* <div className="w-10" /> Spacer for alignment */}
          </div>
        </header>

        {/* Main Content */}
        <main className=" md:p-6 lg:p-8">
          {/* Network connectivity status */}
          {(shouldShowOfflineMessage() || hasConnectionError) && (
            <div className="mb-4">
              <ConnectionStatus 
                showTroubleshooting={true}
                compact={false}
              />
            </div>
          )}

          <Suspense fallback={<PageLoader />}>
            <DashboardErrorBoundary
              onError={(error, errorInfo) => {
                console.error('[Dashboard] Main dashboard error:', {
                  error: error.message,
                  componentStack: errorInfo.componentStack,
                });
              }}
              showDetails={process.env.NODE_ENV === 'development'}
              fallback={
                <FallbackDashboard
                  error="Main dashboard component failed to load"
                  onRetry={() => window.location.reload()}
                  onRefresh={() => window.location.reload()}
                />
              }
            >
              <PermissionGuard
                requiredPermission="view_admin_dashboard"
                reVerifyForAdmin={true}
                showAccessDenied={false}
                fallbackComponent={
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Dashboard Access Restricted
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your dashboard access is being verified. Please wait...
                      </p>
                      <Button onClick={() => window.location.reload()} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                }
              >
                <EnhancedDashboardContent />
              </PermissionGuard>
            </DashboardErrorBoundary>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

// Export the component with admin protection and network awareness
const ProtectedAdminDashboard = withAdminProtection(AdminDashboard, {
  showAccessDenied: true,
  reVerifyForAdmin: true,
  redirectTo: '/admin-access'
});

export default withNetworkAwareness(ProtectedAdminDashboard, {
  showConnectionStatus: true,
  showOfflineMessage: true,
  showTroubleshooting: true,
  blockWhenOffline: false, // Allow limited functionality when offline
});
