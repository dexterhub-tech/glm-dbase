import { supabase } from "@/integrations/supabase/client";

export interface SuperAdmin {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface SuperAdminResult {
  success: boolean;
  message: string;
  status: string;
  user_id?: string;
}

/**
 * Add a super admin by email
 * @param email The email of the user to make a super admin
 * @returns Result of the operation
 */
export const addSuperAdminByEmail = async (email: string): Promise<SuperAdminResult> => {
  try {
    console.log('Adding super admin by email:', email);

    // First, find the user in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      return {
        success: false,
        message: `Error accessing user list: ${authError.message}`,
        status: 'ERROR'
      };
    }

    const targetUser = authUsers.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase().trim());
    if (!targetUser) {
      return {
        success: false,
        message: `User with email ${email} not found`,
        status: 'USER_NOT_FOUND'
      };
    }

    if (!targetUser.email) {
      return {
        success: false,
        message: `User found but has no email address`,
        status: 'NO_EMAIL'
      };
    }

    // Check if user already has superuser role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', targetUser.id)
      .eq('role', 'superuser' as any)
      .single();

    if (roleCheckError && roleCheckError.code !== 'PGRST116') {
      return {
        success: false,
        message: `Error checking existing role: ${roleCheckError.message}`,
        status: 'ERROR'
      };
    }

    if (existingRole) {
      return {
        success: true,
        message: `User ${email} already has super admin privileges`,
        status: 'ALREADY_EXISTS',
        user_id: targetUser.id
      };
    }

    // Add superuser role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: targetUser.id,
        role: 'superuser' as any
      });

    if (insertError) {
      return {
        success: false,
        message: `Error adding super admin role: ${insertError.message}`,
        status: 'ERROR'
      };
    }

    return {
      success: true,
      message: `Successfully added ${email} as super admin`,
      status: 'SUCCESS',
      user_id: targetUser.id
    };
  } catch (error: any) {
    console.error('Exception adding super admin:', error);
    return {
      success: false,
      message: `Exception adding super admin: ${error.message}`,
      status: 'EXCEPTION'
    };
  }
};

/**
 * List all super admins
 * @returns List of super admins
 */
export const listSuperAdmins = async (): Promise<{ superAdmins: SuperAdmin[], error: Error | null }> => {
  try {
    console.log('Fetching super admins using direct query...');

    // Use direct query instead of the problematic function
    // First get all superuser roles
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at')
      .eq('role', 'superuser' as any);

    if (rolesError) {
      console.error('Error fetching superuser roles:', rolesError);
      return { superAdmins: [], error: rolesError };
    }

    console.log(`Found ${roles.length} superuser roles`);

    // For each role, get the profile information
    const superAdmins: SuperAdmin[] = [];

    for (const role of roles) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', role.user_id)
        .single();

      if (profileError) {
        console.warn(`No profile found for user ${role.user_id}:`, profileError.message);
        // Still add the user with minimal info
        superAdmins.push({
          user_id: role.user_id,
          email: 'unknown@example.com',
          full_name: 'Unknown User',
          created_at: role.created_at
        });
      } else {
        superAdmins.push({
          user_id: role.user_id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: role.created_at
        });
      }
    }

    // Sort by creation date (newest first)
    superAdmins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    console.log('Super admins loaded:', superAdmins.length);
    console.log('Super admins:', superAdmins.map(sa => sa.email));

    return { superAdmins, error: null };
  } catch (error: any) {
    console.error('Exception listing super admins:', error);
    return { superAdmins: [], error };
  }
};

/**
 * Remove a super admin
 * @param userId The ID of the user to remove super admin role from
 * @returns Result of the operation
 */
export const removeSuperAdmin = async (userId: string): Promise<SuperAdminResult> => {
  try {
    console.log('Removing super admin for user:', userId);

    // Get user info for the response message
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    const userEmail = profile?.email || 'Unknown user';

    // Remove superuser role
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'superuser' as any);

    if (deleteError) {
      return {
        success: false,
        message: `Error removing super admin role: ${deleteError.message}`,
        status: 'ERROR'
      };
    }

    return {
      success: true,
      message: `Successfully removed super admin privileges from ${userEmail}`,
      status: 'SUCCESS',
      user_id: userId
    };
  } catch (error: any) {
    console.error('Exception removing super admin:', error);
    return {
      success: false,
      message: `Exception removing super admin: ${error.message}`,
      status: 'EXCEPTION'
    };
  }
};
