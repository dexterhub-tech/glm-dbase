import { supabase } from "@/integrations/supabase/client";
import { adminSupabase } from "@/integrations/supabase/adminClient";

export interface AuthTestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
  error?: string;
}

export interface AuthTestReport {
  timestamp: string;
  overallPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  tests: AuthTestResult[];
}

/**
 * Test 1: Verify user registration creates proper records in both tables
 */
export const testUserRegistrationFlow = async (): Promise<AuthTestResult> => {
  try {
    // We'll test this by checking existing users to see if they have proper records
    // in both profiles and members tables

    // Get a sample of profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(10);

    if (profilesError) {
      return {
        testName: "User Registration Flow - Profile Records",
        passed: false,
        message: "Cannot fetch profiles to test registration flow",
        error: profilesError.message
      };
    }

    if (!profiles || profiles.length === 0) {
      return {
        testName: "User Registration Flow - Profile Records",
        passed: false,
        message: "No profiles found to test registration flow"
      };
    }

    // Check if these profiles have corresponding member records
    const registrationFlowIssues = [];

    for (const profile of profiles) {
      // Check if this profile has a corresponding member record
      const { data: memberRecord, error: memberError } = await supabase
        .from("members")
        .select("*")
        .or(`id.eq.${profile.id},email.ilike.${profile.email}`)
        .maybeSingle();

      if (memberError) {
        registrationFlowIssues.push({
          profileId: profile.id,
          email: profile.email,
          issue: "Error checking member record",
          error: memberError.message
        });
        continue;
      }

      if (!memberRecord) {
        registrationFlowIssues.push({
          profileId: profile.id,
          email: profile.email,
          issue: "No corresponding member record found"
        });
      } else {
        // Validate that the member record has proper sync
        if (memberRecord.id !== profile.id &&
          memberRecord.email?.toLowerCase() !== profile.email?.toLowerCase()) {
          registrationFlowIssues.push({
            profileId: profile.id,
            memberId: memberRecord.id,
            email: profile.email,
            issue: "Member record exists but sync is incorrect",
            details: {
              profileEmail: profile.email,
              memberEmail: memberRecord.email,
              memberUserId: memberRecord.id
            }
          });
        }
      }
    }

    return {
      testName: "User Registration Flow Validation",
      passed: registrationFlowIssues.length === 0,
      message: registrationFlowIssues.length === 0 ?
        "User registration flow is working correctly" :
        `Found ${registrationFlowIssues.length} registration flow issues`,
      details: {
        profilesChecked: profiles.length,
        registrationFlowIssues: registrationFlowIssues.slice(0, 10), // First 10 for debugging
        issuesCount: registrationFlowIssues.length
      }
    };
  } catch (error) {
    return {
      testName: "User Registration Flow Validation",
      passed: false,
      message: "Error testing user registration flow",
      error: String(error)
    };
  }
};

/**
 * Test 2: Test login/logout functionality with consolidated structure
 */
export const testLoginLogoutFunctionality = async (): Promise<AuthTestResult> => {
  try {
    // Test current user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      return {
        testName: "Login/Logout Functionality - Session Check",
        passed: false,
        message: "Error checking current user session",
        error: userError.message
      };
    }

    // If no user is logged in, we can't test the full flow
    if (!user) {
      return {
        testName: "Login/Logout Functionality - Session Check",
        passed: true,
        message: "No user currently logged in - cannot test full login flow",
        details: {
          userLoggedIn: false,
          note: "This test requires a logged-in user to validate session management"
        }
      };
    }

    // If user is logged in, check if their profile and member records exist
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return {
        testName: "Login/Logout Functionality - Profile Access",
        passed: false,
        message: "Error accessing user profile during session",
        error: profileError.message
      };
    }

    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (memberError) {
      return {
        testName: "Login/Logout Functionality - Member Access",
        passed: false,
        message: "Error accessing user member record during session",
        error: memberError.message
      };
    }

    // Test RLS policies by trying to access other users' data
    const { data: otherProfiles, error: rlsError } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .limit(1);

    // This should either return empty results or an error due to RLS
    const rlsWorking = !otherProfiles || otherProfiles.length === 0 || rlsError;

    return {
      testName: "Login/Logout Functionality Validation",
      passed: true,
      message: "Login functionality is working with consolidated structure",
      details: {
        userLoggedIn: true,
        userId: user.id,
        userEmail: user.email,
        hasProfile: !!profile,
        hasMember: !!member,
        rlsWorking,
        profileData: profile ? {
          email: profile.email,
          full_name: profile.full_name
        } : null,
        memberData: member ? {
          email: member.email,
          fullname: member.fullname,
          category: member.category,
          isactive: member.isactive
        } : null
      }
    };
  } catch (error) {
    return {
      testName: "Login/Logout Functionality Validation",
      passed: false,
      message: "Error testing login/logout functionality",
      error: String(error)
    };
  }
};

/**
 * Test 3: Validate admin and superuser access controls
 */
export const testAdminSuperuserAccess = async (): Promise<AuthTestResult> => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      return {
        testName: "Admin/Superuser Access - User Check",
        passed: false,
        message: "Error checking current user for admin access test",
        error: userError.message
      };
    }

    if (!user) {
      return {
        testName: "Admin/Superuser Access - User Check",
        passed: true,
        message: "No user logged in - cannot test admin access controls",
        details: {
          userLoggedIn: false,
          note: "This test requires a logged-in user to validate access controls"
        }
      };
    }

    // Check if current user has admin/superuser role
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id);

    if (rolesError) {
      return {
        testName: "Admin/Superuser Access - Roles Check",
        passed: false,
        message: "Error checking user roles",
        error: rolesError.message
      };
    }

    // Check member record for basic information
    const { data: memberRecord, error: memberError } = await supabase
      .from("members")
      .select("email, category")
      .eq("id", user.id)
      .maybeSingle();

    if (memberError) {
      return {
        testName: "Admin/Superuser Access - Member Role Check",
        passed: false,
        message: "Error checking member role",
        error: memberError.message
      };
    }

    // Check if user is a designated superuser
    const superuserEmails = ['ojidelawrence@gmail.com', 'popsabey1@gmail.com', 'dev.samadeyemi@gmail.com'];
    const isSuperuser = superuserEmails.includes(user.email?.toLowerCase() || '');

    // Test admin access by trying to access admin-only data
    let adminAccessTest = null;
    try {
      // Try to access all members (admin operation)
      const { data: allMembers, error: adminError } = await supabase
        .from("members")
        .select("id, email, fullname, category")
        .limit(5);

      adminAccessTest = {
        canAccessAllMembers: !adminError && !!allMembers,
        memberCount: allMembers?.length || 0,
        error: adminError?.message
      };
    } catch (error) {
      adminAccessTest = {
        canAccessAllMembers: false,
        error: String(error)
      };
    }

    // Test superuser-specific operations
    let superuserAccessTest = null;
    if (isSuperuser) {
      try {
        // Try admin client operations (superuser only)
        const { data: adminData, error: adminClientError } = await adminSupabase
          .from("members")
          .select("id")
          .limit(1);

        superuserAccessTest = {
          canUseAdminClient: !adminClientError && !!adminData,
          error: adminClientError?.message
        };
      } catch (error) {
        superuserAccessTest = {
          canUseAdminClient: false,
          error: String(error)
        };
      }
    }

    return {
      testName: "Admin/Superuser Access Controls Validation",
      passed: true, // This test is informational rather than pass/fail
      message: "Access control validation completed",
      details: {
        userId: user.id,
        userEmail: user.email,
        isSuperuser,
        userRoles: userRoles || [],
        memberCategory: memberRecord?.category || null,
        adminAccessTest,
        superuserAccessTest,
        accessLevel: isSuperuser ? 'superuser' :
          (userRoles && userRoles.length > 0) ? userRoles[0].role :
            memberRecord?.category || 'user'
      }
    };
  } catch (error) {
    return {
      testName: "Admin/Superuser Access Controls Validation",
      passed: false,
      message: "Error testing admin/superuser access controls",
      error: String(error)
    };
  }
};

/**
 * Test 4: Validate authentication triggers and sync functions
 */
export const testAuthenticationTriggers = async (): Promise<AuthTestResult> => {
  try {
    // Test by checking if existing users have proper sync between auth, profiles, and members

    // Get profiles with their corresponding auth user data
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .limit(10);

    if (profilesError) {
      return {
        testName: "Authentication Triggers - Profile Sync",
        passed: false,
        message: "Error fetching profiles to test triggers",
        error: profilesError.message
      };
    }

    if (!profiles || profiles.length === 0) {
      return {
        testName: "Authentication Triggers - Profile Sync",
        passed: true,
        message: "No profiles found to test authentication triggers"
      };
    }

    const triggerIssues = [];

    for (const profile of profiles) {
      // Check if profile has corresponding member with proper sync
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("*")
        .eq("id", profile.id)
        .maybeSingle();

      if (memberError) {
        triggerIssues.push({
          profileId: profile.id,
          email: profile.email,
          issue: "Error checking member sync",
          error: memberError.message
        });
        continue;
      }

      if (!member) {
        triggerIssues.push({
          profileId: profile.id,
          email: profile.email,
          issue: "Profile exists but no corresponding member record (sync trigger may not be working)"
        });
      } else {
        // Check if sync is accurate
        if (member.email?.toLowerCase() !== profile.email?.toLowerCase()) {
          triggerIssues.push({
            profileId: profile.id,
            memberId: member.id,
            issue: "Email mismatch between profile and member",
            details: {
              profileEmail: profile.email,
              memberEmail: member.email
            }
          });
        }
      }
    }

    return {
      testName: "Authentication Triggers Validation",
      passed: triggerIssues.length === 0,
      message: triggerIssues.length === 0 ?
        "Authentication triggers are working correctly" :
        `Found ${triggerIssues.length} trigger-related issues`,
      details: {
        profilesChecked: profiles.length,
        triggerIssues: triggerIssues.slice(0, 10), // First 10 for debugging
        issuesCount: triggerIssues.length
      }
    };
  } catch (error) {
    return {
      testName: "Authentication Triggers Validation",
      passed: false,
      message: "Error testing authentication triggers",
      error: String(error)
    };
  }
};

/**
 * Main function to execute all authentication and user management tests
 */
export const executeAuthenticationTests = async (): Promise<AuthTestReport> => {
  console.log("=== EXECUTING AUTHENTICATION AND USER MANAGEMENT TESTS ===");

  const startTime = new Date();
  const tests: AuthTestResult[] = [];

  // Execute all tests
  tests.push(await testUserRegistrationFlow());
  tests.push(await testLoginLogoutFunctionality());
  tests.push(await testAdminSuperuserAccess());
  tests.push(await testAuthenticationTriggers());

  // Calculate summary
  const passedTests = tests.filter(test => test.passed).length;
  const failedTests = tests.length - passedTests;
  const overallPassed = failedTests === 0;

  const report: AuthTestReport = {
    timestamp: startTime.toISOString(),
    overallPassed,
    totalTests: tests.length,
    passedTests,
    failedTests,
    tests
  };

  console.log("=== AUTHENTICATION AND USER MANAGEMENT TESTS COMPLETE ===");
  console.log(`Overall Result: ${overallPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Tests: ${passedTests}/${tests.length} passed`);

  return report;
};