import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Types for verification results
export interface AuthVerificationResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export interface SystemHealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface AuthFlowTestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Superadmin credentials for testing
export const SUPERADMIN_CREDENTIALS = {
  email: 'ojidelawrence@gmail.com',
  password: 'Fa-#8rC6DRTkd$5'
};

/**
 * Test login functionality using the fixed superadmin credentials
 */
export async function testSuperadminLogin(): Promise<AuthVerificationResult> {
  try {
    console.log('🔐 Testing superadmin login...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: SUPERADMIN_CREDENTIALS.email,
      password: SUPERADMIN_CREDENTIALS.password
    });

    if (error) {
      return {
        success: false,
        message: 'Login failed',
        error: error.message,
        details: error
      };
    }

    if (!data.user) {
      return {
        success: false,
        message: 'Login returned no user data',
        error: 'No user data returned'
      };
    }

    return {
      success: true,
      message: 'Login successful',
      details: {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmed: !!data.user.email_confirmed_at,
        lastSignIn: data.user.last_sign_in_at
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Login test failed with exception',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}/**
 
* Verify admin dashboard access for authenticated user
 */
export async function verifyAdminDashboardAccess(userId?: string): Promise<AuthVerificationResult> {
  try {
    console.log('🏠 Testing admin dashboard access...');
    
    // Get current session if userId not provided
    if (!userId) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        return {
          success: false,
          message: 'No active session found',
          error: 'User must be logged in'
        };
      }
      userId = sessionData.session.user.id;
    }

    // Check profile access
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      return {
        success: false,
        message: 'Profile access failed',
        error: profileError.message,
        details: profileError
      };
    }

    // Check user roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (rolesError) {
      return {
        success: false,
        message: 'User roles access failed',
        error: rolesError.message,
        details: rolesError
      };
    }

    // Check if user has admin role
    const roles = rolesData?.map(r => r.role) || [];
    const hasAdminRole = roles.includes('admin');

    if (!hasAdminRole) {
      return {
        success: false,
        message: 'User does not have admin privileges',
        error: 'Missing admin role',
        details: { roles }
      };
    }

    // Test access to admin-specific tables/functions
    const adminChecks = await Promise.allSettled([
      supabase.from('members').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*', { count: 'exact', head: true })
    ]);

    const failedChecks = adminChecks
      .map((result, index) => ({ result, table: ['members', 'profiles', 'user_roles'][index] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ table, result }) => ({ 
        table, 
        error: result.status === 'rejected' ? result.reason : null 
      }));

    return {
      success: true,
      message: 'Admin dashboard access verified',
      details: {
        profile: profileData,
        roles,
        hasAdminRole,
        tableAccessResults: adminChecks.map((result, index) => ({
          table: ['members', 'profiles', 'user_roles'][index],
          success: result.status === 'fulfilled',
          error: result.status === 'rejected' ? result.reason : null
        })),
        failedChecks
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Admin dashboard access verification failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}/**

 * Perform comprehensive system health checks
 */
export async function performSystemHealthChecks(): Promise<SystemHealthCheck[]> {
  const checks: SystemHealthCheck[] = [];
  
  try {
    console.log('🏥 Performing system health checks...');

    // 1. Supabase connection check
    try {
      const { data, error } = await supabase.auth.getSession();
      checks.push({
        component: 'Supabase Connection',
        status: error ? 'error' : 'healthy',
        message: error ? `Connection failed: ${error.message}` : 'Connection successful',
        details: error || { hasSession: !!data.session }
      });
    } catch (error) {
      checks.push({
        component: 'Supabase Connection',
        status: 'error',
        message: 'Connection test failed',
        details: error
      });
    }

    // 2. Database tables accessibility
    try {
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      checks.push({
        component: 'Database Table: profiles',
        status: profilesError ? 'error' : 'healthy',
        message: profilesError ? `Table access failed: ${profilesError.message}` : 'Table accessible',
        details: profilesError || { accessible: true }
      });
    } catch (error) {
      checks.push({
        component: 'Database Table: profiles',
        status: 'error',
        message: 'Table access test failed',
        details: error
      });
    }

    try {
      const { error: membersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
      
      checks.push({
        component: 'Database Table: members',
        status: membersError ? 'error' : 'healthy',
        message: membersError ? `Table access failed: ${membersError.message}` : 'Table accessible',
        details: membersError || { accessible: true }
      });
    } catch (error) {
      checks.push({
        component: 'Database Table: members',
        status: 'error',
        message: 'Table access test failed',
        details: error
      });
    }

    try {
      const { error: userRolesError } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true });
      
      checks.push({
        component: 'Database Table: user_roles',
        status: userRolesError ? 'error' : 'healthy',
        message: userRolesError ? `Table access failed: ${userRolesError.message}` : 'Table accessible',
        details: userRolesError || { accessible: true }
      });
    } catch (error) {
      checks.push({
        component: 'Database Table: user_roles',
        status: 'error',
        message: 'Table access test failed',
        details: error
      });
    }

    // 3. Authentication service check
    try {
      const { data: user } = await supabase.auth.getUser();
      checks.push({
        component: 'Authentication Service',
        status: 'healthy',
        message: 'Authentication service responsive',
        details: { currentUser: user.user?.email || 'No active session' }
      });
    } catch (error) {
      checks.push({
        component: 'Authentication Service',
        status: 'error',
        message: 'Authentication service check failed',
        details: error
      });
    }

    // 4. RLS Policy check (attempt to access data)
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        const userId = sessionData.session.user.id;
        
        // Test RLS policies by trying to access user's own data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        checks.push({
          component: 'RLS Policies',
          status: error ? 'warning' : 'healthy',
          message: error ? `RLS may be blocking access: ${error.message}` : 'RLS policies working correctly',
          details: error || { profileAccessible: !!data }
        });
      } else {
        checks.push({
          component: 'RLS Policies',
          status: 'warning',
          message: 'Cannot test RLS policies without active session',
          details: { reason: 'No active session' }
        });
      }
    } catch (error) {
      checks.push({
        component: 'RLS Policies',
        status: 'error',
        message: 'RLS policy check failed',
        details: error
      });
    }

    // 5. Environment variables check
    const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
    
    checks.push({
      component: 'Environment Variables',
      status: missingEnvVars.length > 0 ? 'error' : 'healthy',
      message: missingEnvVars.length > 0 
        ? `Missing environment variables: ${missingEnvVars.join(', ')}` 
        : 'All required environment variables present',
      details: { 
        required: requiredEnvVars,
        missing: missingEnvVars,
        present: requiredEnvVars.filter(varName => import.meta.env[varName])
      }
    });

  } catch (error) {
    checks.push({
      component: 'System Health Check',
      status: 'error',
      message: 'Health check process failed',
      details: error
    });
  }

  return checks;
}/**
 *
 Test complete authentication flow from login to admin access
 */
export async function testCompleteAuthFlow(): Promise<AuthFlowTestResult[]> {
  const results: AuthFlowTestResult[] = [];
  
  try {
    console.log('🔄 Testing complete authentication flow...');

    // Step 1: Sign out any existing session
    results.push({
      step: '1. Sign Out Existing Session',
      success: true,
      message: 'Clearing any existing session'
    });
    await supabase.auth.signOut();

    // Step 2: Sign in with superadmin credentials
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: SUPERADMIN_CREDENTIALS.email,
      password: SUPERADMIN_CREDENTIALS.password
    });

    if (signInError || !signInData.user) {
      results.push({
        step: '2. Sign In',
        success: false,
        message: 'Sign in failed',
        error: signInError?.message || 'No user data returned'
      });
      return results;
    }

    results.push({
      step: '2. Sign In',
      success: true,
      message: 'Sign in successful',
      data: {
        userId: signInData.user.id,
        email: signInData.user.email
      }
    });

    // Step 3: Verify session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    results.push({
      step: '3. Verify Session',
      success: !sessionError && !!sessionData.session,
      message: sessionError ? 'Session verification failed' : 'Session verified',
      error: sessionError?.message,
      data: sessionData.session ? {
        userId: sessionData.session.user.id,
        expiresAt: sessionData.session.expires_at
      } : null
    });

    if (sessionError || !sessionData.session) {
      return results;
    }

    const userId = sessionData.session.user.id;

    // Step 4: Access profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    results.push({
      step: '4. Access Profile Data',
      success: !profileError && !!profileData,
      message: profileError ? 'Profile access failed' : 'Profile data retrieved',
      error: profileError?.message,
      data: profileData ? {
        email: profileData.email,
        fullName: profileData.full_name
      } : null
    });

    // Step 5: Access member data
    let memberData: any = null;
    let memberError: any = null;
    
    try {
      // Use a simpler query to avoid type issues
      const { data, error } = await (supabase as any)
        .from('members')
        .select('fullname, category, isactive')
        .eq('user_id', userId)
        .single();
      
      memberData = data;
      memberError = error;
    } catch (error) {
      memberError = error;
    }

    results.push({
      step: '5. Access Member Data',
      success: !memberError && !!memberData,
      message: memberError ? 'Member access failed' : 'Member data retrieved',
      error: memberError?.message,
      data: memberData ? {
        fullname: memberData.fullname,
        category: memberData.category,
        isActive: memberData.isactive
      } : null
    });

    // Step 6: Access user roles
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    const roles = rolesData?.map(r => r.role) || [];
    const hasAdminRole = roles.includes('admin');

    results.push({
      step: '6. Access User Roles',
      success: !rolesError,
      message: rolesError ? 'User roles access failed' : `Roles retrieved: ${roles.join(', ')}`,
      error: rolesError?.message,
      data: {
        roles,
        hasAdminRole
      }
    });

    // Step 7: Test admin operations (count records in admin tables)
    // Test members table
    const { count: membersCount, error: membersCountError } = await supabase
      .from('members')
      .select('*', { count: 'exact', head: true });

    results.push({
      step: '7a. Admin Operation: Count all members',
      success: !membersCountError,
      message: membersCountError ? 'Failed to count members' : `Successfully counted ${membersCount} records in members`,
      error: membersCountError?.message,
      data: { table: 'members', count: membersCount }
    });

    // Test profiles table
    const { count: profilesCount, error: profilesCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    results.push({
      step: '7b. Admin Operation: Count all profiles',
      success: !profilesCountError,
      message: profilesCountError ? 'Failed to count profiles' : `Successfully counted ${profilesCount} records in profiles`,
      error: profilesCountError?.message,
      data: { table: 'profiles', count: profilesCount }
    });

    // Test user_roles table
    const { count: userRolesCount, error: userRolesCountError } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true });

    results.push({
      step: '7c. Admin Operation: Count all user roles',
      success: !userRolesCountError,
      message: userRolesCountError ? 'Failed to count user_roles' : `Successfully counted ${userRolesCount} records in user_roles`,
      error: userRolesCountError?.message,
      data: { table: 'user_roles', count: userRolesCount }
    });

    // Step 8: Sign out
    const { error: signOutError } = await supabase.auth.signOut();
    
    results.push({
      step: '8. Sign Out',
      success: !signOutError,
      message: signOutError ? 'Sign out failed' : 'Sign out successful',
      error: signOutError?.message
    });

  } catch (error) {
    results.push({
      step: 'Authentication Flow Test',
      success: false,
      message: 'Authentication flow test failed with exception',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

/**
 * Create a service role client for administrative operations
 */
export function createServiceRoleClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase URL or Service Role Key for admin operations');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Verify superadmin account exists and is properly configured
 */
export async function verifySuperadminAccount(): Promise<AuthVerificationResult> {
  try {
    console.log('👑 Verifying superadmin account configuration...');
    
    const serviceClient = createServiceRoleClient();
    
    // Check auth.users table
    const { data: authUsers, error: authError } = await serviceClient.auth.admin.listUsers();
    
    if (authError) {
      return {
        success: false,
        message: 'Failed to access auth.users',
        error: authError.message
      };
    }
    
    const superadminUser = authUsers.users.find((user: any) => 
      user.email === SUPERADMIN_CREDENTIALS.email
    );
    
    if (!superadminUser) {
      return {
        success: false,
        message: 'Superadmin user not found in auth.users',
        error: 'User does not exist'
      };
    }
    
    // Check profile record
    const { data: profileData, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', superadminUser.id)
      .single();
    
    // Check member record
    const { data: memberData, error: memberError } = await serviceClient
      .from('members')
      .select('*')
      .eq('user_id', superadminUser.id)
      .single();
    
    // Check user roles
    const { data: rolesData, error: rolesError } = await serviceClient
      .from('user_roles')
      .select('*')
      .eq('user_id', superadminUser.id);
    
    const roles = rolesData?.map(r => r.role) || [];
    const hasAdminRole = roles.includes('admin');
    
    return {
      success: true,
      message: 'Superadmin account verification complete',
      details: {
        authUser: {
          id: superadminUser.id,
          email: superadminUser.email,
          emailConfirmed: !!superadminUser.email_confirmed_at,
          lastSignIn: superadminUser.last_sign_in_at
        },
        profile: {
          exists: !profileError,
          data: profileData,
          error: profileError?.message
        },
        member: {
          exists: !memberError,
          data: memberData,
          error: memberError?.message
        },
        roles: {
          exists: !rolesError,
          roles,
          hasAdminRole,
          error: rolesError?.message
        }
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Superadmin account verification failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run all verification tests
 */
export async function runAllVerificationTests(): Promise<{
  loginTest: AuthVerificationResult;
  adminAccess: AuthVerificationResult;
  systemHealth: SystemHealthCheck[];
  authFlow: AuthFlowTestResult[];
  accountVerification: AuthVerificationResult;
}> {
  console.log('🧪 Running all authentication verification tests...');
  
  const [
    loginTest,
    systemHealth,
    authFlow,
    accountVerification
  ] = await Promise.all([
    testSuperadminLogin(),
    performSystemHealthChecks(),
    testCompleteAuthFlow(),
    verifySuperadminAccount()
  ]);
  
  // Test admin access only if login was successful
  let adminAccess: AuthVerificationResult;
  if (loginTest.success && loginTest.details?.userId) {
    adminAccess = await verifyAdminDashboardAccess(loginTest.details.userId);
  } else {
    adminAccess = {
      success: false,
      message: 'Skipped admin access test due to login failure',
      error: 'Login test failed'
    };
  }
  
  return {
    loginTest,
    adminAccess,
    systemHealth,
    authFlow,
    accountVerification
  };
}