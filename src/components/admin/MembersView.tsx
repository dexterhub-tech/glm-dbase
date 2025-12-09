
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddMemberDialog } from "./members/AddMemberDialog";
import { EditMemberDialog } from "./members/EditMemberDialog";
import { DeleteMemberDialog } from "./members/DeleteMemberDialog";
import { PaginatedMembersTable } from "./members/PaginatedMembersTable";
import { LoadingState, ErrorState } from "@/components/ui/data-state";
import { SyncProfilesButton } from "./dashboard/SyncProfilesButton";
import { CheckUserButton } from "./dashboard/CheckUserButton";
import {
  useMembers,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  Member as MemberType,
  PaginationOptions
} from "@/hooks/useMembers";
import { usePastors } from "@/hooks/usePastors";
import { MemberFormValues } from "@/types/member";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query-config";

export default function MembersView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberType | null>(null);
  const [pagination, setPagination] = useState<PaginationOptions>({
    page: 1,
    pageSize: 10
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use our custom hooks for data fetching and mutations with pagination
  const {
    data: membersResponse,
    isLoading: membersLoading,
    error: membersError,
    refetch: refetchMembers
  } = useMembers({ searchTerm }, pagination);

  // Extract members data and pagination info
  const members = membersResponse?.data || [];
  const totalCount = membersResponse?.totalCount || 0;
  const totalPages = membersResponse?.totalPages || 1;

  const {
    data: pastors = [],
    isLoading: pastorsLoading,
    refetch: refetchPastors
  } = usePastors({ searchTerm });

  const createMemberMutation = useCreateMember();
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();

  const handleAddMember = async (newMember: MemberFormValues) => {
    // Convert from MemberFormValues to the format expected by the mutation
    const memberData = {
      fullname: newMember.fullName,
      email: newMember.email,
      phone: newMember.phone || undefined,
      address: newMember.address || undefined,
      category: newMember.category,
      assignedto: newMember.assignedTo === "none" ? undefined : newMember.assignedTo,
      churchunit: newMember.churchUnit || undefined,
      churchunits: newMember.churchUnits || [],
      auxanogroup: newMember.auxanoGroup || undefined,
      notes: newMember.notes || undefined,
      isactive: newMember.isActive,
      joindate: newMember.joinDate || new Date().toISOString().split('T')[0],
    };

    createMemberMutation.mutate(memberData);
  };

  const handleEditMember = async (values: MemberFormValues) => {
    if (!selectedMember) return;

    // Convert from MemberFormValues to the format expected by the mutation
    const memberData = {
      id: selectedMember.id,
      fullname: values.fullName,
      email: values.email,
      phone: values.phone || undefined,
      address: values.address || undefined,
      category: values.category,
      assignedto: values.assignedTo === "none" ? undefined : values.assignedTo,
      churchunit: values.churchUnit || undefined,
      churchunits: values.churchUnits || [],
      auxanogroup: values.auxanoGroup || undefined,
      notes: values.notes || undefined,
      isactive: values.isActive,
    };

    updateMemberMutation.mutate(memberData, {
      onSuccess: () => {
        setOpenEditDialog(false);
        setSelectedMember(null);
      }
    });
  };

  const handleDeleteMember = async () => {
    if (!selectedMember) return;

    deleteMemberMutation.mutate(selectedMember.id, {
      onSuccess: () => {
        setOpenDeleteDialog(false);
        setSelectedMember(null);
      }
    });
  };

  const handleSyncComplete = () => {
    console.log("MembersView: handleSyncComplete called");

    // Invalidate all queries to ensure fresh data
    queryClient.invalidateQueries();

    // Explicitly refetch the data
    refetchMembers();
    refetchPastors();

    // Set a timeout to refetch again after a short delay
    setTimeout(() => {
      console.log("MembersView: Performing delayed refetch");
      refetchMembers();
      refetchPastors();
    }, 1000);
  };

  const getAssignedPastorName = (pastorId: string) => {
    const pastor = pastors.find(p => p.id === pastorId);
    return pastor ? pastor.fullname : "Not Assigned";
  };

  // Handle pagination changes
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({
      page: 1, // Reset to first page when changing page size
      pageSize: newPageSize
    });
  };

  // Determine if we're in a loading state
  const isLoading = membersLoading || pastorsLoading;

  // Format members for the table
  const formattedMembers = members.map(member => ({
    id: member.id,
    fullName: member.fullname,
    email: member.email,
    phone: member.phone || undefined,
    address: member.address || undefined,
    category: member.category,
    joinDate: member.joindate,
    assignedTo: member.assignedto || undefined,
    churchUnit: member.churchunit || undefined,
    churchUnits: member.churchunits || [],
    auxanoGroup: member.auxanogroup || undefined,
    notes: member.notes || undefined,
    isActive: member.isactive,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>All Members</CardTitle>
            <CardDescription>Manage church members and their relationships</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <SyncProfilesButton onSyncComplete={handleSyncComplete} />
            <CheckUserButton />
            <AddMemberDialog
              onAddMember={handleAddMember}
              pastors={pastors.map(p => ({
                id: p.id,
                fullName: p.fullname
              }))}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState message="Loading members..." />
        ) : membersError ? (
          <ErrorState
            message={(membersError as Error).message}
            onRetry={() => {
              refetchMembers();
              refetchPastors();
            }}
          />
        ) : (
          <>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search members..."
                className="w-full p-2 border rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <PaginatedMembersTable
              members={formattedMembers}
              onEdit={(member) => {
                // Find the original member from our data
                const originalMember = members.find(m => m.id === member.id);
                if (originalMember) {
                  setSelectedMember(originalMember);
                  setOpenEditDialog(true);
                }
              }}
              onDelete={(member) => {
                // Find the original member from our data
                const originalMember = members.find(m => m.id === member.id);
                if (originalMember) {
                  setSelectedMember(originalMember);
                  setOpenDeleteDialog(true);
                }
              }}
              getAssignedPastorName={getAssignedPastorName}
              currentPage={pagination.page}
              totalPages={totalPages}
              pageSize={pagination.pageSize}
              totalItems={totalCount}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}

        {/* Edit Member Dialog */}
        <EditMemberDialog
          open={openEditDialog}
          onOpenChange={setOpenEditDialog}
          member={selectedMember ? {
            id: selectedMember.id,
            fullName: selectedMember.fullname,
            email: selectedMember.email,
            phone: selectedMember.phone || undefined,
            address: selectedMember.address || undefined,
            category: selectedMember.category,
            joinDate: selectedMember.joindate,
            assignedTo: selectedMember.assignedto || undefined,
            churchUnit: selectedMember.churchunit || undefined,
            churchUnits: selectedMember.churchunits || [],
            auxanoGroup: selectedMember.auxanogroup || undefined,
            notes: selectedMember.notes || undefined,
            isActive: selectedMember.isactive,
          } : null}
          onEditMember={handleEditMember}
          pastors={pastors.map(p => ({
            id: p.id,
            fullName: p.fullname
          }))}
        />

        {/* Delete Member Dialog */}
        <DeleteMemberDialog
          open={openDeleteDialog}
          onOpenChange={setOpenDeleteDialog}
          member={selectedMember ? {
            id: selectedMember.id,
            fullName: selectedMember.fullname,
            email: selectedMember.email,
            phone: selectedMember.phone || undefined,
            address: selectedMember.address || undefined,
            category: selectedMember.category,
            joinDate: selectedMember.joindate,
            assignedTo: selectedMember.assignedto || undefined,
            churchUnit: selectedMember.churchunit || undefined,
            churchUnits: selectedMember.churchunits || [],
            auxanoGroup: selectedMember.auxanogroup || undefined,
            notes: selectedMember.notes || undefined,
            isActive: selectedMember.isactive,
          } : null}
          onDeleteMember={handleDeleteMember}
        />
      </CardContent>
    </Card>
  );
}
