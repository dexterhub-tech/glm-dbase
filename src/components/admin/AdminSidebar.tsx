import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronRight,
  Shield,
  UserCheck,
  X,
  Church,
  Camera,
  Headphones,
  Film,
  ShieldCheck,
  Speaker,
  UserCog,
  User,
  Database,
  LogOut,
  Calendar,
  Trash2,
  Zap
} from "lucide-react";
import { OFFICIAL_CHURCH_UNITS } from "@/constants/churchUnits";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { UserAvatar } from "@/components/UserAvatar";
import { clearAccessToken } from "@/utils/authApi";

interface AdminSidebarProps {
  onClose?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperUser, isAdmin } = useAuth();
  const isMobile = useIsMobile();

  console.log('AdminSidebar rendering with:', { isSuperUser, isAdmin });
  
  const handleLogout = async () => {
    clearAccessToken();
    navigate('/');
  };

  // Common menu items for all admins
  const dashboardMenuItem = {
    name: "Dashboard",
    path: "/admin",
    icon: <LayoutDashboard size={20} />
  };

  // Regular admin menu items
  const regularAdminMenuItems = [
    {
      name: "Events",
      path: "/admin/events",
      icon: <Calendar size={20} />
    },
    {
      name: "Members",
      path: "/admin/members",
      icon: <Users size={20} />
    },
    {
      name: "Pastors",
      path: "/admin/pastors",
      icon: <UserCog size={20} />
    }
  ];

  // Super user specific menu items
  const superUserMenuItems = [
    {
      name: "User Management",
      path: "/admin/users",
      icon: <Shield size={20} />
    },
    {
      name: "Events",
      path: "/admin/events",
      icon: <Calendar size={20} />
    },
    {
      name: "Members",
      path: "/admin/members",
      icon: <UserCheck size={20} />
    },
    {
      name: "Pastors",
      path: "/admin/pastors",
      icon: <UserCog size={20} />
    },
    {
      name: "System Settings",
      path: "/admin/system",
      icon: <Database size={20} />
    }
  ];

  // Helper function to get appropriate icon for each church unit
  function getIconForChurchUnit(unitId: string) {
    switch (unitId) {
      case "3hmedia": return <Camera size={20} />;
      case "3hmusic": return <Headphones size={20} />;
      case "3hmovies": return <Film size={20} />;
      case "3hsecurity": return <ShieldCheck size={20} />;
      case "discipleship": return <Users size={20} />;
      case "praisefeet": return <Zap size={20} />;
      case "ushering": return <UserCheck size={20} />;
      case "sanitation": return <Trash2 size={20} />;
      case "cloventongues": return <Church size={20} />;
      default: return <Users size={20} />;
    }
  }

  // Church units menu items (only for super users)
  const churchUnitsMenuItems = OFFICIAL_CHURCH_UNITS.map(unit => ({
    name: unit.name,
    path: `/admin/units/${unit.id}`,
    icon: getIconForChurchUnit(unit.id)
  }));

  // Profile menu item for all
  const profileMenuItem = {
    name: "My Profile",
    path: "/admin/profile",
    icon: <User size={20} />
  };

  // Settings menu item for all
  const settingsMenuItem = {
    name: "Settings",
    path: "/admin/settings",
    icon: <Settings size={20} />
  };

  // Combine menu items based on user role
  const menuItems = isSuperUser
    ? [dashboardMenuItem, ...superUserMenuItems, profileMenuItem, settingsMenuItem]
    : [dashboardMenuItem, ...regularAdminMenuItems, profileMenuItem, settingsMenuItem];

  return (
    <div className="w-full md:w-64 bg-white rounded-xl border-r h-full flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className={`font-sans text-xl font-bold ${isSuperUser ? "text-[#ff0000]" : "text-church-red"}`}>
            {isSuperUser ? "Super Admin" : "Gospel Labour"}
          </div>
        </Link>

        {isMobile && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            {/* <X size={20} /> */}
          </Button>
        )}
      </div>

      <div className="px-3 py-2 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
          {isSuperUser ? "SUPER ADMIN PANEL" : "ADMIN PANEL"}
        </p>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path
                ? isSuperUser
                  ? "bg-red-50 text-[#ff0000]"
                  : "bg-church-red/10 text-church-red"
                : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
              {location.pathname === item.path && (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </Link>
          ))}
        </nav>

        {/* Church Units Section (Only for super users) */}
        {isSuperUser && (
          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              CHURCH UNITS
            </p>
            <nav className="space-y-1">
              {churchUnitsMenuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${location.pathname === item.path
                    ? "bg-red-100 text-[#ff0000]"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                  {location.pathname === item.path && (
                    <ChevronRight size={16} className="ml-auto" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* User profile and logout section */}
      <div className="mt-auto p-4 border-t">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {(user?.fullName || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.fullName || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex items-center justify-center mt-2" 
          onClick={handleLogout}
        >
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
