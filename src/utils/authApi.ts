// Minimal auth API helper for backend integration
// Handles token storage and authenticated requests

const API_BASE_URL = 'http://localhost:8000';

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
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || 'Login failed');
  }

  const json = await response.json();
  const data = json?.data;
  if (!data?.accessToken || !data?.user) {
    throw new Error('Invalid login response');
  }

  return {
    user: data.user as AuthUser,
    accessToken: data.accessToken as string,
    refreshToken: data.refreshToken as string | undefined,
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


