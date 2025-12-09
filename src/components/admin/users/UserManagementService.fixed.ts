import { supabase } from "@/integrations/supabase/client";
import { AdminUser } from "./types";

/**
 * Fetch all users with their roles
 * This improved version adds better error handling and logging
 */
export const fetchUsers = async (): Promise<{ users: AdminUser[]; error: Error | null }> => {
  try {
    console.log("Fetching users from profiles table...");
    
    // First, fetch all profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profilesData?.length || 0} profiles`);
    
    // Then, fetch all user roles
    console.log("Fetching user roles...");
    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("*");

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError);
      throw rolesError;
    }

    console.log(`Found ${rolesData?.length || 0} user roles`);
    
    // Log the roles for debugging
    if (rolesData && rolesData.length > 0) {
      console.log("Sample role data:", rolesData[0]);
    } else {
      console.warn("No user roles found in the database");
    }

    // Map profiles with their roles
    const usersWithRoles = profilesData.map((profile) => {
      // Find all roles for this user
      const userRoles = rolesData.filter((role) => role.user_id === profile.id);
      
      // Determine the highest role (superuser > admin > user)
      let highestRole = "user";
      if (userRoles.some(r => r.role === "superuser")) {
        highestRole = "superuser";
      } else if (userRoles.some(r => r.role === "admin")) {
        highestRole = "admin";
      }
      
      return {
        ...profile,
        role: highestRole,
      };
    });

    console.log(`Processed ${usersWithRoles.length} users with roles`);
    
    return { users: usersWithRoles, error: null };
  } catch (error: any) {
    console.error("Error in fetchUsers:", error);
    return { users: [], error };
  }
};

/**
 * Add a user role
 */
export const addUserRole = async (userId: string, role: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Check if the user already has this role
    const { data: existingRoles, error: checkError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", role);

    if (checkError) throw checkError;

    // If the user already has this role, return success
    if (existingRoles && existingRoles.length > 0) {
      return { success: true, error: null };
    }

    // Add the role
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (insertError) throw insertError;

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error adding user role:", error);
    return { success: false, error };
  }
};

/**
 * Remove a user role
 */
export const removeUserRole = async (userId: string, role: string): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error removing user role:", error);
    return { success: false, error };
  }
};
