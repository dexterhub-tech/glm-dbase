import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, Crown, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
  fullWidth?: boolean;
}

const AdminLoginButton = ({ 
  variant = "default", 
  size = "default", 
  className = "",
  showIcon = true,
  fullWidth = false
}: AdminLoginButtonProps) => {
  const { user, isAdmin, isSuperUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for stored admin status as fallback
  const storedAdminStatus = localStorage.getItem('glm-is-admin') === 'true';
  const storedSuperUserStatus = localStorage.getItem('glm-is-superuser') === 'true';
  const effectiveIsAdmin = isAdmin || storedAdminStatus;
  const effectiveIsSuperUser = isSuperUser || storedSuperUserStatus;

  const handleClick = () => {
    if (!user) {
      // Redirect to login with return URL
      navigate("/auth?returnTo=/admin");
      return;
    }

    if (effectiveIsAdmin || effectiveIsSuperUser) {
      // Direct access to admin dashboard
      navigate("/admin");
      return;
    }

    // Check if user should have admin access based on email
    const adminEmails = [
      'ojidelawrence@gmail.com',
      'admin@gospellabourministry.com',
      'superadmin@gospellabourministry.com'
    ];

    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      // Grant admin access
      localStorage.setItem('glm-is-admin', 'true');
      if (user.email.toLowerCase() === 'ojidelawrence@gmail.com') {
        localStorage.setItem('glm-is-superuser', 'true');
      }
      
      toast({
        title: "Admin access granted",
        description: "Welcome to the admin dashboard!",
      });
      
      // Reload to update auth context
      window.location.href = '/admin';
      return;
    }

    // No admin access
    navigate("/admin-access");
  };

  const getButtonContent = () => {
    if (!user) {
      return (
        <>
          {showIcon && <LogIn className="h-4 w-4 mr-2" />}
          Login for Admin Access
        </>
      );
    }

    if (effectiveIsSuperUser) {
      return (
        <>
          {showIcon && <Crown className="h-4 w-4 mr-2" />}
          Super Admin Dashboard
        </>
      );
    }

    if (effectiveIsAdmin) {
      return (
        <>
          {showIcon && <Shield className="h-4 w-4 mr-2" />}
          Admin Dashboard
        </>
      );
    }

    return (
      <>
        {showIcon && <Shield className="h-4 w-4 mr-2" />}
        Request Admin Access
      </>
    );
  };

  const getButtonStyle = () => {
    if (effectiveIsSuperUser) {
      return "bg-gradient-to-r from-yellow-500 to-[#ff0000] hover:from-[#ff0000] hover:to-yellow-700 text-black font-medium";
    }
    
    if (effectiveIsAdmin) {
      return "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium";
    }

    return "";
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`${getButtonStyle()} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {getButtonContent()}
    </Button>
  );
};

export default AdminLoginButton;