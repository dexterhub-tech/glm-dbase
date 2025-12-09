import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import UserTable from "./users/UserTable";
import AddUserDialog from "./users/AddUserDialog";
import EditUserDialog from "./users/EditUserDialog";
import DeleteUserDialog from "./users/DeleteUserDialog";
import SuperAdminDialog from "./users/SuperAdminDialog";
import { fetchUsers } from "./users/UserManagementService";
import { AdminUser } from "./users/types";
import { Users, UserPlus, Shield, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UserManagement() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  const superAdminCount = users.filter(u => u.role === 'superuser' || u.isSuperUser === true).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Header Section - No Background */}
      <div className="space-y-1 pt-6">
        <div className="flex items-center gap-3 mb-2">
          {/* <div className="w-10 h-10 bg-[#ff0000] rounded-2xl flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div> */}
          <div>
            <h1 className="text-2xl font-bold font-sans font-sans text-gray-900">User Management</h1>
            <p className="text-gray-600 text-sm">Manage administrators and team members</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
       
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="text-3xl font-bold font-sans text-gray-900 mb-1">{totalUsers}</div>
          <p className="text-sm font-medium text-gray-600">Total Users</p>
        </div>

   
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold font-sans text-gray-900 mb-1">{adminCount}</div>
          <p className="text-sm font-medium text-gray-600">Administrators</p>
        </div>

      
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-[#ff0000]" />
            </div>
          </div>
          <div className="text-3xl font-bold font-sans text-gray-900 mb-1">{superAdminCount}</div>
          <p className="text-sm font-medium text-gray-600">Super Admins</p>
        </div>
      </div>

      {/* Main Content Card */}

      <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
  
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
              />
            </div>

 
            <div className="flex gap-3 w-full sm:w-auto">
              <SuperAdminDialog onSuperAdminAdded={loadUsers}>
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none rounded-xl border-gray-200 hover:border-[#ff0000] hover:text-[#ff0000]"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add Super Admin</span>
                  <span className="sm:hidden">Super Admin</span>
                </Button>
              </SuperAdminDialog>
              
              <AddUserDialog onUserAdded={loadUsers}>
                <Button className="flex-1 sm:flex-none bg-[#ff0000] hover:bg-[#e60000] rounded-xl">
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </AddUserDialog>
            </div>
          </div>


          {searchQuery && (
            <div className="mt-4 flex items-center gap-2">
              <div className="text-sm text-gray-600">
                Found <span className="font-semibold text-gray-900">{filteredUsers.length}</span> {filteredUsers.length === 1 ? 'user' : 'users'}
              </div>
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm text-[#ff0000] hover:text-[#e60000] font-medium"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
        <div className="p-6 overflow-x-auto">
          <UserTable
            users={filteredUsers}
            loading={loading}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
          />
        </div>
      </div>

      {/* Dialogs */}
      <EditUserDialog
        user={selectedUser}
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
        onUserUpdated={loadUsers}
      />

      <DeleteUserDialog
        user={selectedUser}
        open={openDeleteDialog}
        onOpenChange={setOpenDeleteDialog}
        onUserDeleted={loadUsers}
      />
    </div>
  );
}