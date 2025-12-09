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

export async function getCurrentUser(): Promise<CurrentUser> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch current user');
  }

  const json = await response.json();
  return json?.data as CurrentUser;
}


