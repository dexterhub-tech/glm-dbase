import api from '@/lib/api';

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
 * NOTE: This functionality requires backend API endpoints to be implemented
 */
export const addSuperAdminByEmail = async (email: string): Promise<SuperAdminResult> => {
  try {
    console.log('Adding super admin by email:', email);

    const response = await api.post('/admin/superadmin', { email });

    return {
      success: true,
      message: `Successfully added ${email} as super admin`,
      status: 'SUCCESS',
      user_id: response.data.userId
    };
  } catch (error: any) {
    console.error('Exception adding super admin:', error);
    return {
      success: false,
      message: error.response?.data?.message || `Exception adding super admin: ${error.message}`,
      status: 'EXCEPTION'
    };
  }
};

/**
 * List all super admins
 * NOTE: This functionality requires backend API endpoints to be implemented
 */
export const listSuperAdmins = async (): Promise<{ superAdmins: SuperAdmin[], error: Error | null }> => {
  try {
    console.log('Fetching super admins...');

    const response = await api.get('/admin/superadmin');

    return { superAdmins: response.data, error: null };
  } catch (error: any) {
    console.error('Exception listing super admins:', error);
    return { superAdmins: [], error };
  }
};

/**
 * Remove a super admin
 * NOTE: This functionality requires backend API endpoints to be implemented
 */
export const removeSuperAdmin = async (userId: string): Promise<SuperAdminResult> => {
  try {
    console.log('Removing super admin for user:', userId);

    await api.delete(`/admin/superadmin/${userId}`);

    return {
      success: true,
      message: `Successfully removed super admin privileges`,
      status: 'SUCCESS',
      user_id: userId
    };
  } catch (error: any) {
    console.error('Exception removing super admin:', error);
    return {
      success: false,
      message: error.response?.data?.message || `Exception removing super admin: ${error.message}`,
      status: 'EXCEPTION'
    };
  }
};
