import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Member, MemberCategory, AppRole } from "@/types/member";
import { useToast } from "@/hooks/use-toast";
import { LoadingState, ErrorState } from "@/components/ui/data-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { AddMemberToUnitDialog } from "./AddMemberToUnitDialog";

interface UnitMembersTableProps {
  unitId: string;
  unitName: string;
  onStatsUpdate?: () => void;
}

export function UnitMembersTable({ unitId, unitName, onStatsUpdate }: UnitMembersTableProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [pastors, setPastors] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMembers();
    fetchPastors();
  }, [unitId, searchTerm]);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching members for unit: ${unitId}`);

      // Start building the query - select specific fields that exist in the database
      let query = supabase.from('members').select(`
        id,
        fullname,
        email,
        phone,
        category,
        churchunit,
        churchunits,
        assignedto,
        isactive,
        created_at,
        updated_at
      `);

      // Filter by church unit - check both churchunit and churchunits array
      query = query.or(`churchunit.eq.${unitId},churchunits.cs.{${unitId}}`);

      // Apply search filter if provided
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        query = query.or(`fullname.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
      }

      // Execute the query
      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        console.log(`Found ${data.length} members in unit ${unitId}`);

        // Transform the data to match the Member interface
        const formattedMembers: Member[] = data.map(member => ({
          // Required fields
          id: member.id,
          email: member.email || "",
          fullname: member.fullname || "",
          category: member.category as MemberCategory,
          joindate: member.created_at ? member.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          isactive: member.isactive !== false,
          role: 'user' as AppRole, // Default role since it's not in the query
          created_at: member.created_at || new Date().toISOString(),
          updated_at: member.updated_at || new Date().toISOString(),
          
          // Optional fields
          phone: member.phone || undefined,
          address: undefined, // Field doesn't exist in current schema
          genotype: undefined, // Field doesn't exist in current schema
          title: undefined, // Field doesn't exist in current schema
          assignedto: member.assignedto || undefined,
          churchunit: member.churchunit || undefined,
          churchunits: member.churchunits || [],
          auxanogroup: undefined, // Field doesn't exist in current schema
          notes: undefined, // Field doesn't exist in current schema
          user_id: undefined, // Field doesn't exist in current query
          
          // Legacy compatibility fields
          fullName: member.fullname || "",
          assignedTo: member.assignedto || undefined,
          churchUnit: member.churchunit || undefined,
          churchUnits: member.churchunits || [],
          auxanoGroup: undefined,
          joinDate: member.created_at ? member.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          isActive: member.isactive !== false,
        }));

        setMembers(formattedMembers);
      } else {
        console.log(`No members found in unit ${unitId}`);
        setMembers([]);
      }
    } catch (error: any) {
      console.error('Error fetching unit members:', error);
      setError(error.message || 'Failed to fetch unit members');
      toast({
        variant: "destructive",
        title: "Error fetching unit members",
        description: error.message,
      });
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPastors = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, fullname')
        .eq('category', 'Pastors');

      if (error) throw error;

      if (data) {
        setPastors(data.map(pastor => ({
          id: pastor.id,
          fullName: pastor.fullname
        })));
      }
    } catch (error: any) {
      console.error('Error fetching pastors:', error);
    }
  };

  const getAssignedPastorName = (pastorId: string) => {
    const pastor = pastors.find(p => p.id === pastorId);
    return pastor ? pastor.fullName : "Unknown Pastor";
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Pastors':
        return 'bg-church-red text-white';
      case 'Sons':
        return 'bg-church-blue text-white';
      case 'MINT':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div>
      <div className=" flex flex-col md:flex-row justify-between md:items-center space-y-2 mb-4">
        <div className="relative md:w-[400px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search members..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <AddMemberToUnitDialog
          unitId={unitId}
          unitName={unitName}
          onMemberAdded={() => {
            fetchMembers();
            onStatsUpdate?.();
          }}
        />
      </div>

      {loading ? (
        <LoadingState message={`Loading ${unitName} members...`} />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={fetchMembers}
        />
      ) : (
        <Table className="rounded-2xl">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Assigned Pastor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No members found in this unit
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullName}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryBadgeColor(member.category)}>
                      {member.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.assignedTo ? getAssignedPastorName(member.assignedTo) : "Not Assigned"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        member.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {member.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
