import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Crown, Settings, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FloatingAdminButton = () => {
  const { user, isAdmin, isSuperUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show on admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  // Check localStorage for stored admin status
  const storedSuperUserStatus = localStorage.getItem('glm-is-superuser') === 'true';
  const storedAdminStatus = localStorage.getItem('glm-is-admin') === 'true';

  const effectiveIsAdmin = isAdmin || storedAdminStatus;
  const effectiveIsSuperUser = isSuperUser || storedSuperUserStatus;

  // Only show floating button for admin users
  if (!user || (!effectiveIsAdmin && !effectiveIsSuperUser)) {
    return null;
  }

  const handleAdminAccess = () => {
    if (user && (effectiveIsAdmin || effectiveIsSuperUser)) {
      navigate("/admin");
    } else {
      navigate("/admin-access");
    }
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50">
        {isExpanded && (
          <div className="mb-4 bg-white rounded-lg shadow-lg border p-4 min-w-[200px]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900">Admin Access</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              {user ? (
                <>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={effectiveIsAdmin || effectiveIsSuperUser ? "text-green-600" : "text-red-600"}>
                      {effectiveIsSuperUser ? "Super Admin" : effectiveIsAdmin ? "Admin" : "No Access"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="text-xs">{user.email}</span>
                  </div>
                </>
              ) : (
                <p className="text-gray-600">Not logged in</p>
              )}
            </div>
            
            <Button
              onClick={handleAdminAccess}
              className={`w-full mt-3 ${
                effectiveIsSuperUser 
                  ? "bg-yellow-500 hover:bg-[#ff0000] text-black" 
                  : effectiveIsAdmin
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-500 hover:bg-gray-600"
              }`}
              size="sm"
            >
              {user && (effectiveIsAdmin || effectiveIsSuperUser) ? (
                <>
                  {effectiveIsSuperUser ? <Crown className="h-4 w-4 mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                  Go to Dashboard
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Access
                </>
              )}
            </Button>
          </div>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`rounded-full w-14 h-14 shadow-lg ${
                effectiveIsSuperUser 
                  ? "bg-yellow-500 hover:bg-[#ff0000] text-black" 
                  : effectiveIsAdmin
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {effectiveIsSuperUser ? (
                <Crown className="h-6 w-6" />
              ) : effectiveIsAdmin ? (
                <Shield className="h-6 w-6" />
              ) : (
                <Settings className="h-6 w-6" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>
              {effectiveIsSuperUser 
                ? "Super Admin Dashboard" 
                : effectiveIsAdmin 
                ? "Admin Dashboard" 
                : "Admin Access"}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};

export default FloatingAdminButton;