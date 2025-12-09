import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CHURCH_UNIT_NAMES } from "@/constants/churchUnits";
import {
  Users,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Download,
  RefreshCw,
  UserCheck,
  UserX
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Member {
  id: string;
  user_id?: string | null;
  email: string;
  fullname: string;
  phone?: string | null;
  address?: string | null;
  genotype?: string | null; // New field from consolidated structure
  churchunit?: string | null;
  churchunits?: string[];
  assignedto?: string | null;
  category: string;
  title?: string | null; // New field from consolidated structure
  auxanogroup?: string | null; // New field from consolidated structure
  joindate?: string; // New field from consolidated structure
  notes?: string | null; // New field from consolidated structure
  isactive: boolean;
  role?: string; // New field from consolidated structure
  created_at: string;
  updated_at: string;
}

const MembersManager = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    address: "",
    genotype: "", // New field for consolidated structure
    churchunit: "",
    assignedto: "",
    category: "Members",
    title: "", // New field for consolidated structure
    auxanogroup: "", // New field for consolidated structure
    joindate: new Date().toISOString().split('T')[0], // New field for consolidated structure
    notes: "", // New field for consolidated structure
    isactive: true,
    role: "user", // New field for consolidated structure
  });

  const churchUnits = CHURCH_UNIT_NAMES;

  const categories = ["Members", "Pastors", "Workers", "Visitors", "Partners"];
  const roles = ["user", "admin", "superuser"];

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch members data
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Set members data directly
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch members",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare data with proper null handling for UUID fields
      const preparedData = {
        ...formData,
        // Convert empty strings to null for UUID fields
        assignedto: formData.assignedto?.trim() === "" ? null : formData.assignedto,
        // Convert empty strings to null for other optional fields
        phone: formData.phone?.trim() === "" ? null : formData.phone,
        address: formData.address?.trim() === "" ? null : formData.address,
        genotype: formData.genotype?.trim() === "" ? null : formData.genotype,
        churchunit: formData.churchunit?.trim() === "" ? null : formData.churchunit,
        title: formData.title?.trim() === "" ? null : formData.title,
        auxanogroup: formData.auxanogroup?.trim() === "" ? null : formData.auxanogroup,
        notes: formData.notes?.trim() === "" ? null : formData.notes,
      };

      // Remove any undefined values to prevent issues
      Object.keys(preparedData).forEach(key => {
        if (preparedData[key] === undefined) {
          delete preparedData[key];
        }
      });

      if (editingMember) {
        const { error } = await supabase
          .from('members')
          .update({
            ...preparedData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Member updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('members')
          .insert([{
            ...preparedData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Member created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      console.error('Error saving member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save member",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Member deleted successfully",
      });

      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete member",
      });
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      fullname: member.fullname,
      email: member.email,
      phone: member.phone || "",
      address: member.address || "",
      genotype: member.genotype || "",
      churchunit: member.churchunit || "",
      assignedto: member.assignedto || "",
      category: member.category,
      title: member.title || "",
      auxanogroup: member.auxanogroup || "",
      joindate: member.joindate || new Date().toISOString().split('T')[0],
      notes: member.notes || "",
      isactive: member.isactive,
      role: member.role || "user",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      fullname: "",
      email: "",
      phone: "",
      address: "",
      genotype: "",
      churchunit: "",
      assignedto: "",
      category: "Members",
      title: "",
      auxanogroup: "",
      joindate: new Date().toISOString().split('T')[0],
      notes: "",
      isactive: true,
      role: "user",
    });
    setEditingMember(null);
  };

  const syncWithAuth = async () => {
    try {
      setLoading(true);
      toast({
        title: "Syncing...",
        description: "Syncing profiles to consolidated members table",
      });

      // Import and use the updated sync utility
      const { syncProfilesToMembers } = await import("@/utils/syncProfilesToMembers");
      const result = await syncProfilesToMembers();

      if (result.success) {
        await fetchMembers(); // Refresh the members data
        toast({
          title: "Sync completed",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sync failed",
          description: result.message,
        });
      }
    } catch (error) {
      console.error('Error syncing with auth:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sync with authentication system",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportMembers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Address', 'Genotype', 'Church Unit', 'Auxano Group', 'Category', 'Title', 'Role', 'Status', 'Join Date', 'Created Date'],
      ...filteredMembers.map(member => [
        member.fullname,
        member.email,
        member.phone || '',
        member.address || '',
        member.genotype || '',
        member.churchunit || '',
        member.auxanogroup || '',
        member.category,
        member.title || '',
        member.role || 'user',
        member.isactive ? 'Active' : 'Inactive',
        member.joindate || '',
        new Date(member.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consolidated-members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.phone && member.phone.includes(searchTerm));
    const matchesCategory = categoryFilter === "all" || member.category === categoryFilter;
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && member.isactive === true) ||
      (statusFilter === "inactive" && member.isactive === false);
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pastors': return 'bg-purple-100 text-purple-800';
      case 'Deacons': return 'bg-blue-100 text-blue-800';
      case 'Elders': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading members...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 max-w-7xl mx-auto pb-6">

        {/* Header Section - No Background */}
        <div className="space-y-4 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* <div className="w-10 h-10 bg-[#ff0000] rounded-2xl flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div> */}
              <div>
                <h2 className="text-2xl font-bold font-sans text-gray-900">Members</h2>
                <p className="text-sm text-gray-600">Manage church members</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={syncWithAuth}
                className="flex-1 sm:flex-none rounded-xl border-gray-200 hover:border-[#ff0000] hover:text-[#ff0000]"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sync</span>
              </Button>
              <Button
                variant="outline"
                onClick={exportMembers}
                className="flex-1 sm:flex-none rounded-xl border-gray-200 hover:border-[#ff0000] hover:text-[#ff0000]"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={resetForm}
                    className="flex-1 sm:flex-none bg-[#ff0000] hover:bg-[#e60000] rounded-xl"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
                  <DialogHeader className="pb-4 border-b border-gray-100">
                    <DialogTitle className="text-xl font-bold">
                      {editingMember ? "Edit Member" : "Add New Member"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullname" className="text-sm font-semibold text-gray-900">Full Name *</Label>
                        <Input
                          id="fullname"
                          value={formData.fullname}
                          onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                          required
                          className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-900">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-900">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="genotype" className="text-sm font-semibold text-gray-900">Genotype</Label>
                        <Input
                          id="genotype"
                          value={formData.genotype}
                          onChange={(e) => setFormData({ ...formData, genotype: e.target.value })}
                          placeholder="e.g., AA, AS, SS"
                          className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-semibold text-gray-900">Title</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g., Pastor, Deacon"
                          className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="churchunit" className="text-sm font-semibold text-gray-900">Church Unit</Label>
                        <Select
                          value={formData.churchunit || "none"}
                          onValueChange={(value) => setFormData({ ...formData, churchunit: value === "none" ? "" : value })}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select church unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {churchUnits.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="auxanogroup" className="text-sm font-semibold text-gray-900">Auxano Group</Label>
                        <Input
                          id="auxanogroup"
                          value={formData.auxanogroup}
                          onChange={(e) => setFormData({ ...formData, auxanogroup: e.target.value })}
                          className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-semibold text-gray-900">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="joindate" className="text-sm font-semibold text-gray-900">Join Date</Label>
                        <Input
                          id="joindate"
                          type="date"
                          value={formData.joindate}
                          onChange={(e) => setFormData({ ...formData, joindate: e.target.value })}
                          className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assignedto" className="text-sm font-semibold text-gray-900">Assigned Pastor</Label>
                        <Select
                          value={formData.assignedto || "none"}
                          onValueChange={(value) => setFormData({ ...formData, assignedto: value === "none" ? "" : value })}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select assigned pastor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {members.filter(m => m.category === 'Pastors').map((pastor) => (
                              <SelectItem key={pastor.id} value={pastor.id}>
                                {pastor.fullname} {pastor.title ? `(${pastor.title})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-semibold text-gray-900">Notes</Label>
                      <Input
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Additional notes about the member"
                        className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-sm font-semibold text-gray-900">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-sm font-semibold text-gray-900">Role</Label>
                        <Select
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="isactive" className="text-sm font-semibold text-gray-900">Status</Label>
                        <Select
                          value={formData.isactive.toString()}
                          onValueChange={(value) => setFormData({ ...formData, isactive: value === 'true' })}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Active</SelectItem>
                            <SelectItem value="false">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1 h-12 rounded-xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 h-12 bg-[#ff0000] hover:bg-[#e60000] rounded-xl"
                      >
                        {editingMember ? "Update" : "Create"} Member
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Total Members */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{members.length}</p>
            </div>
          </div>

          {/* Active Members */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {members.filter(m => m.isactive === true).length}
              </p>
            </div>
          </div>

          {/* With Auth */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Auth</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {members.filter(m => m.user_id).length}
              </p>
            </div>
          </div>

          {/* Pastors */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                <UserCheck className="h-5 w-5 sm:h-6 sm:w-6 text-[#ff0000]" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Pastors</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {members.filter(m => m.category === 'Pastors').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-[#ff0000]/20 focus:border-[#ff0000]"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-12 w-full sm:w-48 rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-12 w-full sm:w-48 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-sans font-bold">Members ({filteredMembers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Church Unit</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auth Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{member.fullname}</div>
                        {member.title && (
                          <div className="text-xs text-gray-500">{member.title}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{member.phone || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <div>{member.churchunit || '-'}</div>
                        {member.auxanogroup && (
                          <div className="text-xs text-gray-500">Auxano: {member.auxanogroup}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(member.category)}>
                        {member.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={member.role === 'superuser' ? 'bg-red-100 text-red-800' :
                        member.role === 'admin' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'}>
                        {(member.role || 'user').charAt(0).toUpperCase() + (member.role || 'user').slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(member.isactive ? 'active' : 'inactive')}>
                        {member.isactive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {member.user_id ? (
                        <div className="flex items-center space-x-1">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-green-600">Linked</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <UserX className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-red-600">No Auth</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Member</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {member.fullname}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(member.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredMembers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No members found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembersManager;