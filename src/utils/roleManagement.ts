import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/**
 * Add a user role by directly inserting into the user_roles table
 * This requires appropriate permissions
 */
export const addUserRoleSafe = async (
  userId: string,
  role: AppRole
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Insert the role directly into the user_roles table
    const { error } = await supabase
      .from("user_roles")
      .insert({
        user_id: userId,
        role: role,
      });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error: any) {
    console.error("Error adding user role:", error);
    return { success: false, error };
  }
};

/**
 * Check if the current user is a superuser
 */
export const checkIsSuperUser = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin") // Since superuser isn't in the enum, check for admin
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking superuser status:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking superuser status:", error);
    return false;
  }
};

/**
 * Check if the current user is an admin
 */
export const checkIsAdmin = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking admin status:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

/**
 * Remove a user role by deleting from the user_roles table
 * This requires appropriate permissions
 */
export const removeUserRoleSafe = async (
  userId: string,
  role: AppRole
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    // Delete the role from the user_roles table
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

/**
 * Check if a user has a specific role
 */
export const userHasRole = async (userId: string, role: AppRole): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", role)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error("Error checking user role:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
};

/**
 * Get all user roles for a specific user
 */
export const getUserRoles = async (userId: string): Promise<AppRole[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    // Check if current user is admin or if they're querying their own roles
    const isCurrentUser = user?.id === userId;
    const isAdmin = user ? await checkIsAdmin() : false;

    if (isAdmin || isCurrentUser) {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) throw error;

      return data?.map(r => r.role) || [];
    }

    return [];
  } catch (error) {
    console.error("Error getting user roles:", error);
    return [];
  }
};
