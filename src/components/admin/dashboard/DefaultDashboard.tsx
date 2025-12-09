import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Settings,
  Shield,
  UserCog,
  Database,
  Activity,
  User,
  Calendar,
  Mail
} from "lucide-react";
import { lazy, Suspense, useState, useEffect } from "react";
import { UserAvatar } from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import UserTable from "../users/UserTable";
import { fetchUsers } from "../users/UserManagementService";
import { AdminUser } from "../users/types";
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
const AdminStats = lazy(() => import("@/components/admin/dashboard/AdminStatsSimple"));
const UnitsOverview = lazy(() => import("@/components/admin/units/UnitsOverview"));

const DefaultDashboard = () => {
  const { user, isSuperUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Loading users...");
      const { users: fetchedUsers, error } = await fetchUsers();

      if (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error fetching users",
          description: error.message,
        });
        setUsers([]);
      } else {
        console.log(`Loaded ${fetchedUsers.length} users`);
        setUsers(fetchedUsers);
      }
    } catch (error: any) {
      console.error("Exception in loadUsers:", error);
      toast({
        variant: "destructive",
        title: "Error fetching users",
        description: error.message || "An unexpected error occurred",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setOpenEditDialog(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchRecentUsers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, created_at, avatar_url')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setRecentUsers(data || []);
      } catch (error) {
        console.error('Error fetching recent users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentUsers();
  }, []);

  const quickActions = [
    {
      title: "Manage Members",
      description: "View and manage church members",
      icon: Users,
      path: "/admin/members",
      color: "bg-blue-500",
    },
    {
      title: "Manage Pastors",
      description: "Manage pastoral staff",
      icon: UserCog,
      path: "/admin/pastors",
      color: "bg-purple-500",
    },
    {
      title: "Settings",
      description: "Configure system settings",
      icon: Settings,
      path: "/admin/settings",
      color: "bg-gray-500",
    },
  ];

  const superUserActions = [
    {
      title: "User Management",
      description: "Manage user accounts and roles",
      icon: Shield,
      path: "/admin/users",
      color: "bg-red-500",
    },
    {
      title: "System Settings",
      description: "Advanced system configuration",
      icon: Database,
      path: "/admin/system",
      color: "bg-yellow-500",
    },
  ];

  const actionsToShow = isSuperUser
    ? [...quickActions, ...superUserActions]
    : quickActions;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      {/* <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.email?.split('@')[0] || 'Admin'}!
        </h1>
        <p className="text-blue-100">
          {isSuperUser 
            ? "You have super admin access to all system features." 
            : "You have admin access to manage church operations."}
        </p>
      </div> */}



      {/* Admin Statistics */}
      <Suspense fallback={<div className="grid grid-cols-4 gap-4 mb-8">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-md"></div>)}</div>}>
        <AdminStats />
      </Suspense>



      {/* Quick Actions */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <div className="w-10 h-10 bg-[#ff0000] rounded-2xl flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div> */}
            <div>
              <h2 className="text-2xl font-bold font-sans text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">Frequently used features at your fingertips</p>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {actionsToShow.map((action, index) => {
            const Icon = action.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(action.path)}
                className="group bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer"
              >
                {/* Icon and Title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-sans text-gray-900 group-hover:text-[#ff0000] transition-colors">
                        {action.title}
                      </h3>
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {action.description}
                </p>

                {/* Footer Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Quick Access
                  </span>
                  <div className="w-2 h-2 bg-[#ff0000] rounded-full group-hover:scale-150 transition-transform"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Units Overview and Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Units Overview */}
        <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg"></div>}>
          <UnitsOverview />
        </Suspense>

        {/* Recent Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-sans">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <UserTable
                users={filteredUsers.slice(0, 5)}
                loading={loading}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Recent Activity */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="font-sans">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Admin system is running normally</span>
              </div>
              <span className="text-xs text-gray-500">Just now</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Database connection is healthy</span>
              </div>
              <span className="text-xs text-gray-500">2 min ago</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">User authentication is working</span>
              </div>
              <span className="text-xs text-gray-500">5 min ago</span>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default DefaultDashboard;