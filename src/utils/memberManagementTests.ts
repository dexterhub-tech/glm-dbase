import { supabase } from "@/integrations/supabase/client";
import { Member, MemberCategory, AppRole } from "@/types/member";

export interface MemberTestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
  error?: string;
}

export interface MemberTestReport {
  timestamp: string;
  overallPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  tests: MemberTestResult[];
}

// Type-safe member data interface for testing
interface TestMemberData {
  fullname: string;
  email: string;
  phone?: string;
  address?: string;
  category: string;
  isactive?: boolean;
  role?: string;
}

/**
 * Comprehensive member management tests
 * Tests CRUD operations, search functionality, and data integrity
 */
export async function runMemberManagementTests(): Promise<MemberTestReport> {
  const testResults: MemberTestResult[] = [];
  const startTime = new Date().toISOString();

  console.log("🧪 Starting Member Management Tests...");

  // Test 1: Database Connection
  try {
    const connectionTest = await testDatabaseConnection();
    testResults.push(connectionTest);
  } catch (error) {
    testResults.push({
      testName: "Database Connection",
      passed: false,
      message: "Failed to connect to database",
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // Test 2: Basic CRUD Operations
  try {
    const crudTest = await testMemberCRUDOperations();
    testResults.push(crudTest);
  } catch (error) {
    testResults.push({
      testName: "Member CRUD Operations",
      passed: false,
      message: "CRUD operations failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // Test 3: Search Functionality
  try {
    const searchTest = await testMemberSearchFunctionality();
    testResults.push(searchTest);
  } catch (error) {
    testResults.push({
      testName: "Member Search Functionality",
      passed: false,
      message: "Search functionality failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // Test 4: Data Validation
  try {
    const validationTest = await testDataValidation();
    testResults.push(validationTest);
  } catch (error) {
    testResults.push({
      testName: "Data Validation",
      passed: false,
      message: "Data validation failed",
      error: error instanceof Error ? error.message : String(error)
    });
  }

  // Calculate summary
  const passedTests = testResults.filter(test => test.passed).length;
  const totalTests = testResults.length;
  const overallPassed = passedTests === totalTests;

  console.log(`✅ Tests completed: ${passedTests}/${totalTests} passed`);

  return {
    timestamp: startTime,
    overallPassed,
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    tests: testResults
  };
}

/**
 * Test database connection and basic table access
 */
async function testDatabaseConnection(): Promise<MemberTestResult> {
  try {
    const { data, error } = await supabase
      .from("members")
      .select("id")
      .limit(1);

    if (error) {
      return {
        testName: "Database Connection",
        passed: false,
        message: "Database query failed",
        error: error.message
      };
    }

    return {
      testName: "Database Connection",
      passed: true,
      message: "Successfully connected to database and accessed members table"
    };
  } catch (error) {
    return {
      testName: "Database Connection",
      passed: false,
      message: "Connection test failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test CRUD operations on members table
 */
async function testMemberCRUDOperations(): Promise<MemberTestResult> {
  const testMemberId = `test-${Date.now()}`;
  const testEmail = `test-${Date.now()}@example.com`;

  try {
    // Test CREATE
    const createData: TestMemberData = {
      fullname: "Test User",
      email: testEmail,
      phone: "123-456-7890",
      category: "Members",
      isactive: true,
      role: "user"
    };

    const { data: createdMember, error: createError } = await supabase
      .from("members")
      .insert([{ id: testMemberId, ...createData }])
      .select()
      .single();

    if (createError) {
      return {
        testName: "Member CRUD Operations - Create",
        passed: false,
        message: "Failed to create member",
        error: createError.message
      };
    }

    // Test READ
    const { data: readMember, error: readError } = await supabase
      .from("members")
      .select("*")
      .eq("id", testMemberId)
      .single();

    if (readError || !readMember) {
      // Clean up
      await supabase.from("members").delete().eq("id", testMemberId);
      return {
        testName: "Member CRUD Operations - Read",
        passed: false,
        message: "Failed to read created member",
        error: readError?.message || "Member not found"
      };
    }

    // Test UPDATE
    const updateData = {
      fullname: "Updated Test User",
      phone: "987-654-3210"
    };

    const { data: updatedMember, error: updateError } = await supabase
      .from("members")
      .update(updateData)
      .eq("id", testMemberId)
      .select()
      .single();

    if (updateError) {
      // Clean up
      await supabase.from("members").delete().eq("id", testMemberId);
      return {
        testName: "Member CRUD Operations - Update",
        passed: false,
        message: "Failed to update member",
        error: updateError.message
      };
    }

    // Verify update worked
    if (updatedMember && ((updatedMember as any).fullname !== updateData.fullname ||
      (updatedMember as any).phone !== updateData.phone)) {
      // Clean up
      await supabase.from("members").delete().eq("id", testMemberId);
      return {
        testName: "Member CRUD Operations - Update Verification",
        passed: false,
        message: "Update verification failed",
        details: {
          expected: updateData,
          actual: {
            fullname: (updatedMember as any).fullname,
            phone: (updatedMember as any).phone
          }
        }
      };
    }

    // Test DELETE
    const { error: deleteError } = await supabase
      .from("members")
      .delete()
      .eq("id", testMemberId);

    if (deleteError) {
      return {
        testName: "Member CRUD Operations - Delete",
        passed: false,
        message: "Failed to delete member",
        error: deleteError.message
      };
    }

    // Verify deletion
    const { data: deletedMember, error: verifyError } = await supabase
      .from("members")
      .select("id")
      .eq("id", testMemberId)
      .single();

    if (!verifyError || deletedMember) {
      return {
        testName: "Member CRUD Operations - Delete Verification",
        passed: false,
        message: "Delete verification failed - member still exists"
      };
    }

    return {
      testName: "Member CRUD Operations",
      passed: true,
      message: "All CRUD operations completed successfully"
    };

  } catch (error) {
    // Clean up in case of error
    await supabase.from("members").delete().eq("id", testMemberId);

    return {
      testName: "Member CRUD Operations",
      passed: false,
      message: "CRUD operations test failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test search functionality
 */
async function testMemberSearchFunctionality(): Promise<MemberTestResult> {
  try {
    // Get sample data for testing
    const { data: sampleMembers, error: sampleError } = await supabase
      .from("members")
      .select("id, fullname, email, phone, category")
      .limit(10);

    if (sampleError || !sampleMembers || sampleMembers.length === 0) {
      return {
        testName: "Member Search Functionality",
        passed: false,
        message: "No sample data available for search testing",
        error: sampleError?.message
      };
    }

    const searchTests = {
      nameSearch: false,
      emailSearch: false,
      phoneSearch: false,
      categorySearch: false
    };

    // Test name search
    const memberWithName = sampleMembers.find((m: any) => (m as any).fullname);
    if (memberWithName) {
      const nameTerm = (memberWithName as any).fullname.split(' ')[0];
      const { data: nameSearchResults, error: nameSearchError } = await supabase
        .from("members")
        .select("id, fullname")
        .ilike("fullname", `%${nameTerm}%`)
        .limit(5);

      if (!nameSearchError && nameSearchResults && nameSearchResults.length > 0) {
        searchTests.nameSearch = true;
      }
    }

    // Test email search
    const memberWithEmail = sampleMembers.find((m: any) => (m as any).email);
    if (memberWithEmail) {
      const emailTerm = (memberWithEmail as any).email.split('@')[0];
      const { data: emailSearchResults, error: emailSearchError } = await supabase
        .from("members")
        .select("id, email")
        .ilike("email", `%${emailTerm}%`)
        .limit(5);

      if (!emailSearchError && emailSearchResults && emailSearchResults.length > 0) {
        searchTests.emailSearch = true;
      }
    }

    // Test phone search (if phone column exists)
    const memberWithPhone = sampleMembers.find((m: any) => (m as any).phone);
    if (memberWithPhone) {
      const phoneTerm = (memberWithPhone as any).phone.substring(0, 3);
      const { data: phoneSearchResults, error: phoneSearchError } = await supabase
        .from("members")
        .select("id, phone")
        .ilike("phone", `%${phoneTerm}%`)
        .limit(5);

      if (!phoneSearchError && phoneSearchResults && phoneSearchResults.length > 0) {
        searchTests.phoneSearch = true;
      }
    }

    // Test category search
    const { data: categorySearchResults, error: categorySearchError } = await supabase
      .from("members")
      .select("id, category")
      .eq("category", "Members")
      .limit(5);

    if (!categorySearchError && categorySearchResults && categorySearchResults.length > 0) {
      searchTests.categorySearch = true;
    }

    const passedSearchTests = Object.values(searchTests).filter(Boolean).length;
    const totalSearchTests = Object.keys(searchTests).length;

    return {
      testName: "Member Search Functionality",
      passed: passedSearchTests >= 2, // At least 2 search types should work
      message: `Search functionality: ${passedSearchTests}/${totalSearchTests} search types working`,
      details: searchTests
    };

  } catch (error) {
    return {
      testName: "Member Search Functionality",
      passed: false,
      message: "Search functionality test failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test data validation and constraints
 */
async function testDataValidation(): Promise<MemberTestResult> {
  try {
    const validationTests = {
      emailUniqueness: false,
      requiredFields: false,
      categoryValidation: false
    };

    // Test email uniqueness (try to create duplicate email)
    const testEmail = `validation-test-${Date.now()}@example.com`;

    // Create first member
    const { data: firstMember, error: firstError } = await supabase
      .from("members")
      .insert([{
        fullname: "Validation Test 1",
        email: testEmail,
        category: "Members"
      }])
      .select()
      .single();

    if (!firstError && firstMember) {
      // Try to create duplicate email
      const { error: duplicateError } = await supabase
        .from("members")
        .insert([{
          fullname: "Validation Test 2",
          email: testEmail,
          category: "Members"
        }]);

      if (duplicateError) {
        validationTests.emailUniqueness = true;
      }

      // Clean up
      await supabase.from("members").delete().eq("email", testEmail);
    }

    // Test required fields
    const { error: requiredFieldError } = await supabase
      .from("members")
      .insert([{
        // Missing required fields
        phone: "123-456-7890"
      }]);

    if (requiredFieldError) {
      validationTests.requiredFields = true;
    }

    // Test category validation (if constraints exist)
    const { error: categoryError } = await supabase
      .from("members")
      .insert([{
        fullname: "Category Test",
        email: `category-test-${Date.now()}@example.com`,
        category: "InvalidCategory"
      }]);

    if (categoryError) {
      validationTests.categoryValidation = true;
    }

    const passedValidationTests = Object.values(validationTests).filter(Boolean).length;
    const totalValidationTests = Object.keys(validationTests).length;

    return {
      testName: "Data Validation",
      passed: passedValidationTests >= 1, // At least 1 validation should work
      message: `Data validation: ${passedValidationTests}/${totalValidationTests} validation rules working`,
      details: validationTests
    };

  } catch (error) {
    return {
      testName: "Data Validation",
      passed: false,
      message: "Data validation test failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Run a quick health check on the member management system
 */
export async function quickMemberHealthCheck(): Promise<{
  healthy: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Check if we can read from members table
    const { data, error } = await supabase
      .from("members")
      .select("id, fullname, email, category")
      .limit(5);

    if (error) {
      return {
        healthy: false,
        message: "Cannot access members table",
        details: { error: error.message }
      };
    }

    return {
      healthy: true,
      message: `Member management system is healthy. Found ${data?.length || 0} sample records.`,
      details: { recordCount: data?.length || 0 }
    };

  } catch (error) {
    return {
      healthy: false,
      message: "Health check failed",
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}