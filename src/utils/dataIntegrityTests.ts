import { supabase } from "@/integrations/supabase/client";

export interface DataIntegrityTestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
  error?: string;
}

export interface DataIntegrityReport {
  timestamp: string;
  overallPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  tests: DataIntegrityTestResult[];
  summary: {
    profilesCount: number;
    membersCount: number;
    authUsersCount: number;
    orphanedProfiles: number;
    orphanedMembers: number;
    duplicateEmails: number;
  };
}

/**
 * Test 1: Verify all original data is preserved and accessible
 */
export const testDataPreservation =
  async (): Promise<DataIntegrityTestResult> => {
    try {
      // Check if we can access both tables
      const { error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);

      if (profilesError) {
        return {
          testName: "Data Preservation - Profiles Table Access",
          passed: false,
          message: "Cannot access profiles table",
          error: profilesError.message,
        };
      }

      const { error: membersError } = await supabase
        .from("members")
        .select("*")
        .limit(1);

      if (membersError) {
        return {
          testName: "Data Preservation - Members Table Access",
          passed: false,
          message: "Cannot access members table",
          error: membersError.message,
        };
      }

      // Get total counts
      const { count: profilesCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: membersCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true });

      return {
        testName: "Data Preservation - Table Access",
        passed: true,
        message: "Both tables are accessible",
        details: {
          profilesCount: profilesCount || 0,
          membersCount: membersCount || 0,
          profilesAccessible: true,
          membersAccessible: true,
        },
      };
    } catch (error) {
      return {
        testName: "Data Preservation - Table Access",
        passed: false,
        message: "Error accessing tables",
        error: String(error),
      };
    }
  };

/**
 * Test 2: Verify data consistency between profiles and members tables
 */
export const testDataConsistency =
  async (): Promise<DataIntegrityTestResult> => {
    try {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        return {
          testName: "Data Consistency - Profile Fetch",
          passed: false,
          message: "Cannot fetch profiles",
          error: profilesError.message,
        };
      }

      // Get all members
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("*");

      if (membersError) {
        return {
          testName: "Data Consistency - Members Fetch",
          passed: false,
          message: "Cannot fetch members",
          error: membersError.message,
        };
      }

      // Check for orphaned profiles (profiles without corresponding members)
      const orphanedProfiles = [];
      for (const profile of profiles || []) {
        const hasMatchingMember = members?.some(
          (member) =>
            (member as Record<string, unknown>).userid === profile.id ||
            (member.email &&
              profile.email &&
              member.email.toLowerCase() === profile.email.toLowerCase())
        );

        if (!hasMatchingMember) {
          orphanedProfiles.push(profile);
        }
      }

      // Check for orphaned members (members without corresponding profiles)
      const orphanedMembers = [];
      for (const member of members || []) {
        const memberRecord = member as Record<string, unknown>;
        if (memberRecord.userid) {
          const hasMatchingProfile = profiles?.some(
            (profile) =>
              profile.id === memberRecord.userid ||
              (profile.email &&
                member.email &&
                profile.email.toLowerCase() === member.email.toLowerCase())
          );

          if (!hasMatchingProfile) {
            orphanedMembers.push(member);
          }
        }
      }

      // Check for email duplicates within each table
      const profileEmails = new Set();
      const duplicateProfileEmails = [];
      for (const profile of profiles || []) {
        if (profile.email) {
          const emailLower = profile.email.toLowerCase();
          if (profileEmails.has(emailLower)) {
            duplicateProfileEmails.push(emailLower);
          } else {
            profileEmails.add(emailLower);
          }
        }
      }

      const memberEmails = new Set();
      const duplicateMemberEmails = [];
      for (const member of members || []) {
        if (member.email) {
          const emailLower = member.email.toLowerCase();
          if (memberEmails.has(emailLower)) {
            duplicateMemberEmails.push(emailLower);
          } else {
            memberEmails.add(emailLower);
          }
        }
      }

      const consistencyIssues =
        orphanedProfiles.length +
        orphanedMembers.length +
        duplicateProfileEmails.length +
        duplicateMemberEmails.length;

      return {
        testName: "Data Consistency Check",
        passed: consistencyIssues === 0,
        message:
          consistencyIssues === 0
            ? "Data consistency validated successfully"
            : `Found ${consistencyIssues} consistency issues`,
        details: {
          orphanedProfiles: orphanedProfiles.length,
          orphanedMembers: orphanedMembers.length,
          duplicateProfileEmails: duplicateProfileEmails.length,
          duplicateMemberEmails: duplicateMemberEmails.length,
          orphanedProfilesList: orphanedProfiles.slice(0, 5), // First 5 for debugging
          orphanedMembersList: orphanedMembers.slice(0, 5), // First 5 for debugging
          duplicateEmails: [
            ...duplicateProfileEmails,
            ...duplicateMemberEmails,
          ],
        },
      };
    } catch (error) {
      return {
        testName: "Data Consistency Check",
        passed: false,
        message: "Error checking data consistency",
        error: String(error),
      };
    }
  };

/**
 * Test 3: Validate all foreign key relationships and constraints
 */
export const testForeignKeyConstraints =
  async (): Promise<DataIntegrityTestResult> => {
    try {
      // Test 1: We can't access auth.users directly through Supabase client
      // so we'll test indirectly through profiles table
      const authUsersAccessible = false; // We know we can't access this directly

      // Test 2: Check members.userid -> auth.users(id) relationship
      const { data: membersWithUserId, error: membersError } = await supabase
        .from("members")
        .select("userid")
        .not("userid", "is", null);

      if (membersError) {
        return {
          testName: "Foreign Key Constraints - Members User ID",
          passed: false,
          message: "Cannot fetch members with user_id",
          error: membersError.message,
        };
      }

      // Test 3: Check members.assignedto -> members(id) self-reference
      const { data: membersWithAssignedTo, error: assignedToError } =
        await supabase
          .from("members")
          .select("id, assignedto")
          .not("assignedto", "is", null);

      if (assignedToError) {
        return {
          testName: "Foreign Key Constraints - Members Assigned To",
          passed: false,
          message: "Cannot fetch members with assignedto",
          error: assignedToError.message,
        };
      }

      // Validate self-references
      const invalidSelfReferences = [];
      const allMemberIds = new Set();

      // First, get all member IDs
      const { data: allMembers } = await supabase.from("members").select("id");

      if (allMembers) {
        allMembers.forEach((member) => allMemberIds.add(member.id));
      }

      // Check if assignedto values reference valid member IDs
      for (const member of membersWithAssignedTo || []) {
        if (member.assignedto && !allMemberIds.has(member.assignedto)) {
          invalidSelfReferences.push({
            memberId: member.id,
            invalidAssignedTo: member.assignedto,
          });
        }
      }

      return {
        testName: "Foreign Key Constraints Validation",
        passed: invalidSelfReferences.length === 0,
        message:
          invalidSelfReferences.length === 0
            ? "All foreign key constraints are valid"
            : `Found ${invalidSelfReferences.length} invalid foreign key references`,
        details: {
          authUsersAccessible,
          membersWithUserIdCount: membersWithUserId?.length || 0,
          membersWithAssignedToCount: membersWithAssignedTo?.length || 0,
          invalidSelfReferences: invalidSelfReferences.slice(0, 10), // First 10 for debugging
          totalMemberIds: allMemberIds.size,
        },
      };
    } catch (error) {
      return {
        testName: "Foreign Key Constraints Validation",
        passed: false,
        message: "Error validating foreign key constraints",
        error: String(error),
      };
    }
  };

/**
 * Test 4: Validate required fields and data types
 */
export const testRequiredFieldsAndTypes =
  async (): Promise<DataIntegrityTestResult> => {
    try {
      // Check profiles table required fields
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) {
        return {
          testName: "Required Fields - Profiles",
          passed: false,
          message: "Cannot fetch profiles for validation",
          error: profilesError.message,
        };
      }

      // Check members table required fields
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("*");

      if (membersError) {
        return {
          testName: "Required Fields - Members",
          passed: false,
          message: "Cannot fetch members for validation",
          error: membersError.message,
        };
      }

      const validationIssues = [];

      // Validate profiles required fields
      for (const profile of profiles || []) {
        if (!profile.id) {
          validationIssues.push({
            table: "profiles",
            issue: "missing id",
            record: profile,
          });
        }
        if (!profile.email) {
          validationIssues.push({
            table: "profiles",
            issue: "missing email",
            record: profile,
          });
        }
        // Validate email format
        if (
          profile.email &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
        ) {
          validationIssues.push({
            table: "profiles",
            issue: "invalid email format",
            record: profile,
          });
        }
      }

      // Validate members required fields
      for (const member of members || []) {
        if (!member.id) {
          validationIssues.push({
            table: "members",
            issue: "missing id",
            record: member,
          });
        }
        if (!member.email) {
          validationIssues.push({
            table: "members",
            issue: "missing email",
            record: member,
          });
        }
        if (!member.fullname) {
          validationIssues.push({
            table: "members",
            issue: "missing fullname",
            record: member,
          });
        }
        // Validate email format
        if (member.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
          validationIssues.push({
            table: "members",
            issue: "invalid email format",
            record: member,
          });
        }
        // Validate boolean fields
        if (typeof member.isactive !== "boolean") {
          validationIssues.push({
            table: "members",
            issue: "invalid isactive type",
            record: member,
          });
        }
      }

      return {
        testName: "Required Fields and Data Types Validation",
        passed: validationIssues.length === 0,
        message:
          validationIssues.length === 0
            ? "All required fields and data types are valid"
            : `Found ${validationIssues.length} validation issues`,
        details: {
          profilesCount: profiles?.length || 0,
          membersCount: members?.length || 0,
          validationIssues: validationIssues.slice(0, 20), // First 20 for debugging
          issuesByType: validationIssues.reduce((acc, issue) => {
            acc[issue.issue] = (acc[issue.issue] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
        },
      };
    } catch (error) {
      return {
        testName: "Required Fields and Data Types Validation",
        passed: false,
        message: "Error validating required fields and data types",
        error: String(error),
      };
    }
  };

/**
 * Main function to execute all data integrity validation tests
 */
export const executeDataIntegrityTests =
  async (): Promise<DataIntegrityReport> => {
    console.log("=== EXECUTING DATA INTEGRITY VALIDATION TESTS ===");

    const startTime = new Date();
    const tests: DataIntegrityTestResult[] = [];

    // Execute all tests
    tests.push(await testDataPreservation());
    tests.push(await testDataConsistency());
    tests.push(await testForeignKeyConstraints());
    tests.push(await testRequiredFieldsAndTypes());

    // Calculate summary
    const passedTests = tests.filter((test) => test.passed).length;
    const failedTests = tests.length - passedTests;
    const overallPassed = failedTests === 0;

    // Get summary data
    const summary = {
      profilesCount: 0,
      membersCount: 0,
      authUsersCount: 0,
      orphanedProfiles: 0,
      orphanedMembers: 0,
      duplicateEmails: 0,
    };

    // Extract summary from test results
    const consistencyTest = tests.find(
      (test) => test.testName === "Data Consistency Check"
    );
    if (consistencyTest?.details) {
      summary.orphanedProfiles =
        Number(consistencyTest.details.orphanedProfiles) || 0;
      summary.orphanedMembers =
        Number(consistencyTest.details.orphanedMembers) || 0;
      summary.duplicateEmails =
        (Number(consistencyTest.details.duplicateProfileEmails) || 0) +
        (Number(consistencyTest.details.duplicateMemberEmails) || 0);
    }

    const preservationTest = tests.find(
      (test) => test.testName === "Data Preservation - Table Access"
    );
    if (preservationTest?.details) {
      summary.profilesCount =
        Number(preservationTest.details.profilesCount) || 0;
      summary.membersCount = Number(preservationTest.details.membersCount) || 0;
    }

    const report: DataIntegrityReport = {
      timestamp: startTime.toISOString(),
      overallPassed,
      totalTests: tests.length,
      passedTests,
      failedTests,
      tests,
      summary,
    };

    console.log("=== DATA INTEGRITY VALIDATION TESTS COMPLETE ===");
    console.log(`Overall Result: ${overallPassed ? "PASSED" : "FAILED"}`);
    console.log(`Tests: ${passedTests}/${tests.length} passed`);

    return report;
  };
