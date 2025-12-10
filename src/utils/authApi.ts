// Minimal auth API helper for backend integration
// Handles token storage and authenticated requests



const ACCESS_TOKEN_KEY = 'accessToken';

export type AuthUser = {
  id: string;
  email: string;
  role: string;
};

export type CurrentUser = {
  _id: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: string;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
};

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<{
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
}> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.session || !data.user) {
    throw new Error('Login failed: No session returned');
  }

  // Fetch user role if possible, or default to 'user' for initial login
  // The AuthProvider will do a full profile/role fetch on mount/refresh
  let role = 'user';

  // Try to get role from metadata if available (optional optimization)
  if (data.user.app_metadata?.role) {
    role = data.user.app_metadata.role as string;
  }

  const authUser: AuthUser = {
    id: data.user.id,
    email: data.user.email!,
    role: role,
  };

  return {
    user: authUser,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  };
}

import { supabase } from "@/integrations/supabase/client";

export async function getCurrentUser(): Promise<CurrentUser> {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw new Error('Not authenticated');

  // Also try to get profile data if it exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Fetch role from user_roles
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  // Map Supabase user/profile to CurrentUser type
  return {
    _id: user.id,
    email: user.email || '',
    role: roleData?.role || 'user',
    fullName: profile?.full_name || '',
    isActive: true, // Default to true if logged in
  };
}


