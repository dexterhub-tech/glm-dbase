import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys, invalidateRelatedQueries } from '@/lib/react-query-config';
import { useToast } from '@/hooks/use-toast';
import { Pastor } from '@/types/member';

// Define filter options for fetching pastors
export interface PastorFilters {
  searchTerm?: string;
  title?: string;
  churchUnit?: string;
}

/**
 * Custom hook for fetching all pastors with optional filtering
 */
export const usePastors = (filters?: PastorFilters) => {
  return useQuery<Pastor[]>({
    queryKey: queryKeys.pastors.list(),
    queryFn: async (): Promise<Pastor[]> => {
      // Execute query using the correct members table
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('category', 'Pastors');

      if (error) {
        throw error;
      }

      // Apply client-side filtering for now to avoid complex query type issues
      let filteredData = data || [];

      if (filters?.searchTerm && filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.toLowerCase();
        filteredData = filteredData.filter((item: any) =>
          item.fullname?.toLowerCase().includes(term)
        );
      }

      if (filters?.title) {
        filteredData = filteredData.filter((item: any) => item.title === filters.title);
      }

      if (filters?.churchUnit) {
        filteredData = filteredData.filter((item: any) =>
          item.churchunit === filters.churchUnit ||
          (item.churchunits && item.churchunits.includes(filters.churchUnit))
        );
      }

      return filteredData.map((item: any) => normalizePastor(item));
    },
  });
};

/**
 * Custom hook for fetching a single pastor by ID
 */
export const usePastor = (id: string) => {
  return useQuery<Pastor>({
    queryKey: queryKeys.pastors.detail(id),
    queryFn: async (): Promise<Pastor> => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', id)
        .eq('category', 'Pastors')
        .single();

      if (error) {
        throw error;
      }

      return normalizePastor(data as any);
    },
    enabled: !!id, // Only run the query if an ID is provided
  });
};

/**
 * Normalize pastor data to handle case inconsistencies in the database
 * @param pastor The pastor data from the database
 * @returns Normalized pastor data
 */
export const normalizePastor = (pastor: any): Pastor => {
  // Handle case inconsistencies in column names and include new consolidated fields
  return {
    id: pastor.id,
    user_id: pastor.user_id || pastor.userid || null, // Handle both old and new column names
    fullname: pastor.fullname || pastor.fullName || '',
    email: pastor.email || '',
    phone: pastor.phone || '',
    address: pastor.address || '',
    genotype: pastor.genotype || '', // New field, may not exist yet
    category: 'Pastors' as const,
    title: pastor.title || '',
    assignedto: pastor.assignedto || pastor.assignedTo || null,
    churchunit: pastor.churchunit || pastor.churchUnit || '',
    churchunits: pastor.churchunits || pastor.churchUnits || [],
    auxanogroup: pastor.auxanogroup || pastor.auxanoGroup || '',
    joindate: pastor.joindate || pastor.joinDate || new Date().toISOString().split('T')[0],
    notes: pastor.notes || '',
    isactive: pastor.isactive !== undefined ? pastor.isactive : (pastor.isActive !== undefined ? pastor.isActive : true),
    role: pastor.role || 'user', // New field, may not exist yet
    created_at: pastor.created_at || new Date().toISOString(),
    updated_at: pastor.updated_at || new Date().toISOString(),

    // Legacy compatibility fields
    fullName: pastor.fullname || pastor.fullName || '',
    assignedTo: pastor.assignedto || pastor.assignedTo || null,
    churchUnit: pastor.churchunit || pastor.churchUnit || '',
    auxanoGroup: pastor.auxanogroup || pastor.auxanoGroup || '',
  };
};

/**
 * Custom hook for creating a new pastor
 */
export const useCreatePastor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newPastor: Omit<Pastor, 'id' | 'created_at' | 'updated_at'>) => {
      // Ensure category is set to 'Pastors'
      const pastorData = {
        ...newPastor,
        category: 'Pastors',
      };

      const { data, error } = await supabase
        .from('members')
        .insert([pastorData])
        .select();

      if (error) {
        throw error;
      }

      return normalizePastor(data[0]);
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      invalidateRelatedQueries(queryClient, 'pastors');
      invalidateRelatedQueries(queryClient, 'members');

      // Show success toast
      toast({
        title: 'Pastor created',
        description: `${data.fullname} has been added as a pastor.`,
      });
    },
    onError: (error: any) => {
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Failed to create pastor',
        description: error.message || 'An unexpected error occurred',
      });
    },
  });
};

/**
 * Custom hook for updating an existing pastor
 */
export const useUpdatePastor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Pastor> & { id: string }) => {
      // Ensure category remains 'Pastors'
      const pastorUpdates = {
        ...updates,
        category: 'Pastors',
      };

      const { data, error } = await supabase
        .from('members')
        .update(pastorUpdates)
        .eq('id', id)
        .select();

      if (error) {
        throw error;
      }

      return normalizePastor(data[0]);
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      invalidateRelatedQueries(queryClient, 'pastors', data.id);
      invalidateRelatedQueries(queryClient, 'members', data.id);

      // Show success toast
      toast({
        title: 'Pastor updated',
        description: `${data.fullname}'s information has been updated.`,
      });
    },
    onError: (error: any) => {
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Failed to update pastor',
        description: error.message || 'An unexpected error occurred',
      });
    },
  });
};

/**
 * Custom hook for assigning members to a pastor
 */
export const useAssignMembersToPastor = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ pastorId, memberIds }: { pastorId: string; memberIds: string[] }) => {
      // Update all members to be assigned to this pastor
      const { data, error } = await supabase
        .from('members')
        .update({ assignedto: pastorId })
        .in('id', memberIds)
        .select('id, fullname');

      if (error) {
        throw error;
      }

      return { pastorId, assignedMembers: data };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      invalidateRelatedQueries(queryClient, 'pastors', data.pastorId);
      invalidateRelatedQueries(queryClient, 'members');

      // Show success toast
      const memberCount = data.assignedMembers.length;
      toast({
        title: 'Members assigned',
        description: `${memberCount} member${memberCount !== 1 ? 's' : ''} assigned to pastor.`,
      });
    },
    onError: (error: any) => {
      // Show error toast
      toast({
        variant: 'destructive',
        title: 'Failed to assign members',
        description: error.message || 'An unexpected error occurred',
      });
    },
  });
};
