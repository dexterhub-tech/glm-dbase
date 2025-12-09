
import { AdminUser } from "./types";
import { getAccessToken } from "@/utils/authApi";

/**
 * Fetch all users with their roles
 * This improved version adds better error handling and logging
 */
export const fetchUsers = async (): Promise<{ users: AdminUser[]; error: Error | null }> => {
  try {
    console.log("Fetching users from backend /api/users...");
    const token = getAccessToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch('https://church-management-api-p709.onrender.com/api/users', { headers });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to fetch users');
    }
    const json = await res.json();
    const rawUsers: any[] = json?.data ?? [];
    const users: AdminUser[] = rawUsers.map((u) => ({
      id: u._id,
      email: u.email,
      fullName: u.fullName ?? null,
      role: (u.role as AdminUser['role']) ?? 'user',
      isActive: u.isActive,
      isSuperUser: u.role === 'superadmin',
    }));
    console.log(`Loaded ${users.length} users`);
    return { users, error: null };
  } catch (error: any) {
    console.error("Error in fetchUsers:", error);
    return { users: [], error };
  }
};

/**
 * Add a user role
 */
export const addUserRole = async (userId: string, role: "admin" | "user" | "superuser"): Promise<{ success: boolean; error: Error | null }> => {
  try {
    console.warn('addUserRole not implemented for backend API');
    return { success: false, error: new Error('Not implemented') };
  } catch (error: any) {
    console.error("Error adding user role:", error);
    return { success: false, error };
  }
};

/**
 * Remove a user role
 */
export const removeUserRole = async (userId: string, role: "admin" | "user" | "superuser"): Promise<{ success: boolean; error: Error | null }> => {
  try {
    console.warn('removeUserRole not implemented for backend API');
    return { success: false, error: new Error('Not implemented') };
  } catch (error: any) {
    console.error("Error removing user role:", error);
    return { success: false, error };
  }
};
