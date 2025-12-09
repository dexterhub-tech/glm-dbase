import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, invalidateRelatedQueries } from '@/lib/react-query-config';
import { useToast } from '@/hooks/use-toast';
import { fetchPaginatedMembers } from '@/utils/databaseUtils';
import { Member } from '@/types/member';

// Define filter options for fetching members
export interface MemberFilters {
  searchTerm?: string;
  category?: string;
  churchUnit?: string;
  pastorId?: string;
  isActive?: boolean;
}

// Define pagination options
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

// Define paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Custom hook for fetching members with optional filtering and pagination
 */
export const useMembers = (
  filters?: MemberFilters,
  pagination?: PaginationOptions
) => {
  return useQuery({
    queryKey: queryKeys.members.list({ filters, pagination }),
    queryFn: async () => {
      console.log("useMembers hook called with filters:", filters, "pagination:", pagination);

      // Use the database utility for paginated queries
      if (pagination) {
        return fetchPaginatedMembers(
          pagination.page,
          pagination.pageSize,
          filters
        ) as Promise<PaginatedResponse<Member>>;
      }

      // If no pagination is requested, use a more robust approach
      // Add timestamp to avoid caching issues
      const timestamp = new Date().getTime();

      // Start building the query - get newest members first
      let query = supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false }); // Get newest members first

      // Note: .options() method is not available in this Supabase version
      console.log(`Cache-busting timestamp: ${timestamp}`);

      // Apply filters
      if (filters) {
        // Search term filter (case-insensitive search on multiple columns)
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
          const term = filters.searchTerm.toLowerCase();
          query = query.or(`fullname.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
        }

        // Category filter
        if (filters.category) {
          query = query.eq('category', filters.category);
        }

        // Church unit filter
        if (filters.churchUnit) {
          // Try to match either the primary church unit or in the array of church units
          query = query.or(`churchunit.eq.${filters.churchUnit},churchunits.cs.{${filters.churchUnit}}`);
        }

        // Pastor filter
        if (filters.pastorId) {
          query = query.eq('assignedto', filters.pastorId);
        }

        // Active status filter
        if (filters.isActive !== undefined) {
          query = query.eq('isactive', filters.isActive);
        }
      }

      // Execute the query
      console.log("Executing non-paginated members query...");
      const { data, error } = await query;

      if (error) {
        console.error("Error fetching members:", error);
        throw error;
      }

      console.log(`Fetched ${data?.length || 0} members`);

      // Log the first few members for debugging
      if (data && data.length > 0) {
        console.log("First member:", data[0]);

        // Check for specific users we're looking for
        const targetUsers = data.filter(m =>
          m.email?.toLowerCase().includes('popsabey1') ||
          m.fullname?.toLowerCase().includes('biodun')
        );

        if (targetUsers.length > 0) {
          console.log("Found target users in results:", targetUsers);
        } else {
          console.log("Target users not found in results");
        }
      }

      return {
        data: data as Member[],
        totalCount: data.length,
        page: 1,
        pageSize: data.length,
        totalPages: 1
      } as PaginatedResponse<Member>;
    },
    // Reduce stale time to ensure we get fresh data more often
    staleTime: 30 * 1000, // 30 seconds
    // Add refetch options to ensure data stays fresh
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

/**
 * Custom hook for fetching a single member by ID
 */
export const useMember = (id: string) => {
  return useQuery({
    queryKey: queryKeys.members.detail(id),
    queryFn: async () => {
      console.log(`Fetching member with ID: ${id}`);

      // Add timestamp to avoid caching issues
      const timestamp = new Date().getTime();

      // Note: .options() method is not available in this Supabase version
      console.log(`Cache-busting timestamp for member fetch: ${timestamp}`);

      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error(`Error fetching member with ID ${id}:`, error);
        throw error;
      }

      console.log(`Successfully fetched member: ${data?.fullname || 'Unknown'}`);
      return data as Member;
    },
    enabled: !!id, // Only run the query if an ID is provided
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

/**
 * Custom hook for fetching members assigned to a specific pastor
 */
export const useMembersByPastor = (pastorId: string) => {
  return useQuery({
    queryKey: queryKeys.members.byPastor(pastorId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('assignedto', pastorId);

      if (error) {
        throw error;
      }

      return data as Member[];
    },
    enabled: !!pastorId, // Only run the query if a pastor ID is provided
  });
};

/**
 * Custom hook for creating a new member
 */
export const useCreateMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newMember: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('members')
        .insert([newMember])
        .select();

      if (error) {
        throw error;
      }

      return data[0] as Member;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      invalidateRelatedQueries(queryClient, 'members');

      // Show success toast
      toast({
        title: 'Member created',
        description: `${data.fullname} has been added successfully.`,
      });
    },
    onError: (error: any) => {
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Failed to create member',
        description: error.message || 'An unexpected error occurred',
      });
    },
  });
};

/**
 * Custom hook for updating an existing member
 */
export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Member> & { id: string }) => {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      return data[0] as Member;
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      invalidateRelatedQueries(queryClient, 'members', data.id);

      // If the member is a pastor, also invalidate pastor queries
      if (data.category === 'Pastors') {
        invalidateRelatedQueries(queryClient, 'pastors', data.id);
      }

      // Show success toast
      toast({
        title: 'Member updated',
        description: `${data.fullname}'s information has been updated.`,
      });
    },
    onError: (error: any) => {
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Failed to update member',
        description: error.message || 'An unexpected error occurred',
      });
    },
  });
};

/**
 * Custom hook for deleting a member
 */
export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // First, get the member to have their data for the success message
      const { data: member, error: fetchError } = await supabase
        .from('members')
        .select('fullname, category')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Then delete the member
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { id, fullname: member.fullname, category: member.category };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      invalidateRelatedQueries(queryClient, 'members');

      // If the member was a pastor, also invalidate pastor queries
      if (data.category === 'Pastors') {
        invalidateRelatedQueries(queryClient, 'pastors');
      }

      // Show success toast
      toast({
        title: 'Member deleted',
        description: `${data.fullname} has been removed.`,
      });
    },
    onError: (error: any) => {
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Failed to delete member',
        description: error.message || 'An unexpected error occurred',
      });
    },
  });
};
