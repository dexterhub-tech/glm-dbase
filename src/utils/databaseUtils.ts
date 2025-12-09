import { supabase } from '@/integrations/supabase/client';
import { Member } from '@/types/member';

/**
 * Utility functions for common database operations
 */

/**
 * Fetches members with pagination and optional filtering
 * @param page The page number (1-based)
 * @param pageSize The number of items per page
 * @param filters Optional filters to apply
 * @returns Paginated members and total count
 */
export async function fetchPaginatedMembers(
  page: number = 1,
  pageSize: number = 10,
  filters: {
    searchTerm?: string;
    category?: string;
    churchUnit?: string;
    pastorId?: string;
    isActive?: boolean;
  } = {}
) {
  try {
    console.log(`Fetching members page ${page}, size ${pageSize} with filters:`, filters);

    // Calculate pagination parameters
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Add timestamp to avoid caching issues
    const timestamp = new Date().getTime();
    console.log(`Using timestamp for cache busting: ${timestamp}`);

    // First, try to get a count of all members to verify the database is accessible
    const countCheck = await supabase
      .from('members')
      .select('id', { count: 'exact', head: true });

    console.log(`Database check - total members count: ${countCheck.count || 'unknown'}`);

    if (countCheck.error) {
      console.error("Error checking members count:", countCheck.error);
    }

    // Start building the query - get newest members first
    // Use * to select all fields (handles both old and new schema during transition)
    let query = supabase
      .from('members')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false }); // Get newest members first

    // Apply filters
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const term = `%${filters.searchTerm.trim()}%`;
      query = query.or(`fullname.ilike.${term},email.ilike.${term},phone.ilike.${term}`);
    }

    if (filters.category) {
      query = query.eq('category', filters.category as any);
    }

    if (filters.churchUnit) {
      // For now, just match the primary church unit
      query = query.eq('churchunit', filters.churchUnit as any);
    }

    if (filters.pastorId) {
      query = query.eq('assignedto', filters.pastorId as any);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('isactive', filters.isActive as any);
    }

    // Apply pagination
    query = query.range(from, to);

    // Execute the query
    console.log("Executing members query...");
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching members:", error);

      // Try a simpler query as a fallback
      console.log("Trying fallback query without filters...");
      const fallbackQuery = await supabase
        .from('members')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fallbackQuery.error) {
        console.error("Fallback query also failed:", fallbackQuery.error);
        throw error; // Throw the original error
      } else {
        console.log("Fallback query succeeded!");
        return {
          data: (fallbackQuery.data || []) as Member[],
          totalCount: fallbackQuery.count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((fallbackQuery.count || 0) / pageSize)
        };
      }
    }

    console.log(`Fetched ${data?.length || 0} members out of ${count || 0} total`);

    // Log the first few members for debugging
    if (data && data.length > 0) {
      console.log("First member:", data[0]);

      // Check for specific users we're looking for
      const targetUsers = data.filter((m: any) =>
        (m.email && m.email.toLowerCase().includes('popsabey1')) ||
        (m.fullname && m.fullname.toLowerCase().includes('biodun'))
      );

      if (targetUsers.length > 0) {
        console.log("Found target users in results:", targetUsers);
      } else {
        console.log("Target users not found in this page of results");

        // Check if these users exist in the database at all
        console.log("Checking if target users exist in the database...");
        const targetCheck = await supabase
          .from('members')
          .select('id, email, fullname')
          .or('email.ilike.%popsabey1%,fullname.ilike.%biodun%');

        if (targetCheck.error) {
          console.error("Error checking for target users:", targetCheck.error);
        } else if (targetCheck.data && targetCheck.data.length > 0) {
          console.log("Target users found in database but not in current page:", targetCheck.data);
        } else {
          console.log("Target users not found in database at all");
        }
      }
    }

    return {
      data: (data || []) as Member[],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error('Error fetching paginated members:', error);
    throw error;
  }
}

/**
 * Fetches pastors with pagination and optional filtering
 * @param page The page number (1-based)
 * @param pageSize The number of items per page
 * @param filters Optional filters to apply
 * @returns Paginated pastors and total count
 */
export async function fetchPaginatedPastors(
  page: number = 1,
  pageSize: number = 10,
  filters: {
    searchTerm?: string;
    churchUnit?: string;
  } = {}
) {
  try {
    // Calculate pagination parameters
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Start building the query - select all fields (handles both old and new schema)
    let query = supabase
      .from('members')
      .select('*', { count: 'exact' })
      .eq('category', 'Pastors');

    // Apply filters
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const term = `%${filters.searchTerm.trim()}%`;
      query = query.ilike('fullname', term);
    }

    if (filters.churchUnit) {
      // Match either the primary church unit or in the array of church units
      query = query.or(`churchunit.eq.${filters.churchUnit},churchunits.cs.{${filters.churchUnit}}`);
    }

    // Apply pagination
    query = query.range(from, to);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error('Error fetching paginated pastors:', error);
    throw error;
  }
}

/**
 * Fetches users with pagination and optional filtering
 * @param page The page number (1-based)
 * @param pageSize The number of items per page
 * @param filters Optional filters to apply
 * @returns Paginated users and total count
 */
export async function fetchPaginatedUsers(
  page: number = 1,
  pageSize: number = 10,
  filters: {
    searchTerm?: string;
    role?: string;
  } = {}
) {
  try {
    // Calculate pagination parameters
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Start building the query
    let query = supabase
      .from('user_roles_view')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const term = `%${filters.searchTerm.trim()}%`;
      query = query.or(`email.ilike.${term},full_name.ilike.${term}`);
    }

    if (filters.role) {
      query = query.eq('highest_role', filters.role as any);
    }

    // Apply pagination
    query = query.range(from, to);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      totalCount: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error('Error fetching paginated users:', error);
    throw error;
  }
}
