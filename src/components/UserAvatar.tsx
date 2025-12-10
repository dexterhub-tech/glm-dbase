import { useNavigate } from "react-router-dom";
import { User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { clearAccessToken } from "@/utils/authApi";
import { useToast } from "@/hooks/use-toast";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const UserAvatar = ({ className }: { className?: string }) => {
  const { user, isAdmin, isSuperUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!user) return null;

  // Check for stored admin status as fallback
  const storedAdminStatus = localStorage.getItem('glm-is-admin') === 'true';
  const storedSuperUserStatus = localStorage.getItem('glm-is-superuser') === 'true';
  const effectiveIsAdmin = isAdmin || storedAdminStatus;
  const effectiveIsSuperUser = isSuperUser || storedSuperUserStatus;

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out...");

      // Show toast before logout to ensure it's visible
      toast({
        title: "Logging out...",
      });

      // Clear backend token
      clearAccessToken();

      // Clear session storage as well
      sessionStorage.removeItem('glm-auth-token');

      // Clear any session cookies
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // No remote sign-out required for backend token-only auth

      console.log("Logout successful");

      // Navigate and reload to ensure clean state
      navigate("/");
      setTimeout(() => {
        window.location.reload();
      }, 100);

    } catch (error: any) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: error.message,
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className={`cursor-pointer border-2 border-white hover:border-gray-200 transition-colors ${className || "h-9 w-9"}`}>
          <AvatarFallback className="bg-blue-600 text-white">
            {getInitials(user.fullName)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {(effectiveIsAdmin || effectiveIsSuperUser) && (
            <DropdownMenuItem
              onClick={() => navigate("/admin")}
              className="cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100"
            >
              <LayoutDashboard className="mr-2 h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-700">
                {effectiveIsSuperUser ? "Super Admin Dashboard" : "Admin Dashboard"}
              </span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => navigate("/profile")}
            className="cursor-pointer"
          >
            <User className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
          {(effectiveIsAdmin || effectiveIsSuperUser) && (
            <DropdownMenuItem
              onClick={() => navigate("/settings")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatar;
