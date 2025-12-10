import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  verifyUserRole, 
  checkPermission, 
  reVerifyAdminPermissions,
  updateUserRoleDynamic,
  batchVerifyRoles
} from './roleManagement';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(),
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        error: null
      })),
      upsert: vi.fn(() => ({
        error: null
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('Role Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyUserRole', () => {
    it('should return default user role when no user ID is provided', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null }
      });

      const result = await verifyUserRole();

      expect(result.isVerified).toBe(false);
      expect(result.role).toBe('user');
      expect(result.permissions).toEqual(['read_profile', 'update_own_profile']);
      expect(result.fallbackApplied).toBe(true);
      expect(result.error).toBe('No user ID available');
    });

    it('should return user role when no database role is found', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockUserId = 'test-user-id';
      
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } }
      });

      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          }))
        }))
      });

      const result = await verifyUserRole(mockUserId);

      expect(result.isVerified).toBe(true);
      expect(result.role).toBe('user');
      expect(result.permissions).toEqual(['read_profile', 'update_own_profile']);
      expect(result.fallbackApplied).toBe(true);
    });

    it('should return admin role when database role is admin', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const mockUserId = 'test-admin-id';
      
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: mockUserId } }
      });

      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      });

      const result = await verifyUserRole(mockUserId);

      expect(result.isVerified).toBe(true);
      expect(result.role).toBe('admin');
      expect(result.permissions).toEqual([
        'read_profile', 
        'update_own_profile', 
        'manage_members', 
        'manage_events', 
        'view_admin_dashboard',
        'manage_admins'
      ]);
      expect(result.fallbackApplied).toBe(false);
    });
  });

  describe('checkPermission', () => {
    it('should return false for permission when user has no permissions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'test-user' } }
      });

      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null
            })
          }))
        }))
      });

      const result = await checkPermission('manage_members');

      expect(result.hasPermission).toBe(false);
      expect(result.fallbackApplied).toBe(true);
    });

    it('should return true for permission when user has direct permission', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'test-admin' } }
      });

      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      });

      const result = await checkPermission('manage_members');

      expect(result.hasPermission).toBe(true);
      expect(result.fallbackApplied).toBe(false);
    });
  });

  describe('reVerifyAdminPermissions', () => {
    it('should perform fresh verification of admin permissions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'test-admin' } }
      });

      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        }))
      });

      const result = await reVerifyAdminPermissions('view_admin_dashboard');

      expect(result.hasPermission).toBe(true);
      expect(result.fallbackApplied).toBe(false);
    });

    it('should return false when no user is authenticated', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: null }
      });

      const result = await reVerifyAdminPermissions('view_admin_dashboard');

      expect(result.hasPermission).toBe(false);
      expect(result.fallbackApplied).toBe(true);
      expect(result.error).toBe('No authenticated user');
    });
  });

  describe('updateUserRoleDynamic', () => {
    it('should update user role when user has manage_admins permission', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock current user with admin permissions
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-user' } }
      });

      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { role: 'admin' },
              error: null
            })
          }))
        })),
        upsert: vi.fn().mockResolvedValue({
          error: null
        })
      });

      const result = await updateUserRoleDynamic('target-user', 'admin');

      expect(result.success).toBe(true);
      expect(result.roleData).toBeDefined();
    });

    it('should fail when user lacks manage_admins permission', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock current user without admin permissions
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'regular-user' } }
      });

      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null, // No role = user role
              error: null
            })
          }))
        }))
      });

      const result = await updateUserRoleDynamic('target-user', 'admin');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions to update user roles');
    });
  });

  describe('batchVerifyRoles', () => {
    it('should verify roles for multiple users when user has manage_members permission', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock current user with admin permissions
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'admin-user' } }
      });

      const mockFrom = supabase.from as any;
      let callCount = 0;
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // Permission check for current user
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null
                });
              } else if (callCount === 2) {
                // Role check for user1
                return Promise.resolve({
                  data: { role: 'admin' },
                  error: null
                });
              } else {
                // Role check for user2 (defaults to user)
                return Promise.resolve({
                  data: null,
                  error: null
                });
              }
            })
          }))
        }))
      });

      const userIds = ['user1', 'user2'];
      const results = await batchVerifyRoles(userIds);

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['user1'].role).toBe('admin');
      expect(results['user2'].role).toBe('user');
    });

    it('should return default user roles when user lacks manage_members permission', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Mock current user without admin permissions
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'regular-user' } }
      });

      const mockFrom = supabase.from as any;
      mockFrom.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null, // No role = user role
              error: null
            })
          }))
        }))
      });

      const userIds = ['user1', 'user2'];
      const results = await batchVerifyRoles(userIds);

      expect(Object.keys(results)).toHaveLength(2);
      expect(results['user1'].role).toBe('user');
      expect(results['user1'].fallbackApplied).toBe(true);
      expect(results['user1'].error).toBe('Insufficient permissions for batch verification');
      expect(results['user2'].role).toBe('user');
      expect(results['user2'].fallbackApplied).toBe(true);
    });
  });
});