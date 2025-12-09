import { supabase } from "@/integrations/supabase/client";
import { adminSupabase } from "@/integrations/supabase/adminClient";

/**
 * Diagnostic function to check if profiles are being properly synced to consolidated members table
 * This function works with the new consolidated database structure
 */
export const checkProfileMemberSync = async () => {
  console.log("=== DIAGNOSTIC: CHECKING PROFILE-MEMBER SYNC (CONSOLIDATED STRUCTURE) ===");

  try {
    // Step 1: Get all lightweight profiles (after consolidation, profiles only contain basic auth data)
    console.log("Fetching all lightweight profiles...");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at, updated_at")
      .order('updated_at', { ascending: false });

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return { success: false, error: profilesError.message };
    }

    console.log(`Found ${profiles?.length || 0} lightweight profiles`);

    if (profiles && profiles.length > 0) {
      console.log("First 3 profiles:", profiles.slice(0, 3).map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        updated_at: p.updated_at
      })));
    }

    // Step 2: Get all members from consolidated table
    console.log("Fetching all members from consolidated table...");
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, email, fullname, phone, category, churchunit, churchunits, assignedto, isactive, created_at, updated_at")
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error("Error fetching consolidated members:", membersError);
      return { success: false, error: membersError.message };
    }

    console.log(`Found ${members?.length || 0} consolidated members`);

    if (members && members.length > 0) {
      console.log("First 3 consolidated members:", members.slice(0, 3).map(m => ({
        id: m.id,
        email: m.email,
        fullname: m.fullname,
        category: m.category,
        churchunit: m.churchunit,
        isactive: m.isactive,
        created_at: m.created_at
      })));
    }

    // Step 3: Check for profiles that don't have corresponding members in consolidated table
    const missingMembers = [];
    const profileEmails = new Set();

    for (const profile of profiles || []) {
      if (profile.email) {
        profileEmails.add(profile.email.toLowerCase());

        // Check if this profile has a corresponding member in consolidated table
        const matchingMember = members?.find(m =>
          m.email && m.email.toLowerCase() === profile.email?.toLowerCase()
        );

        if (!matchingMember) {
          missingMembers.push({
            profileId: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            updated_at: profile.updated_at
          });
        }
      }
    }

    console.log(`Found ${missingMembers.length} profiles without corresponding members in consolidated table`);

    if (missingMembers.length > 0) {
      console.log("Profiles missing from consolidated members table:", missingMembers);
    }

    // Step 4: Check for consolidated members that don't have corresponding profiles
    const extraMembers = [];

    for (const member of members || []) {
      if (member.email) {
        // Check if this consolidated member has a corresponding profile
        const hasMatchingProfile = profiles?.some(p =>
          p.email && p.email.toLowerCase() === member.email?.toLowerCase()
        );

        if (!hasMatchingProfile) {
          extraMembers.push({
            memberId: member.id,
            email: member.email,
            fullname: member.fullname,
            category: member.category,
            churchunit: member.churchunit,
            isactive: member.isactive,
            created_at: member.created_at
          });
        }
      }
    }

    console.log(`Found ${extraMembers.length} consolidated members without corresponding profiles`);

    if (extraMembers.length > 0) {
      console.log("Consolidated members without corresponding profiles:", extraMembers);
    }

    return {
      success: true,
      profileCount: profiles?.length || 0,
      memberCount: members?.length || 0,
      missingMemberCount: missingMembers.length,
      extraMemberCount: extraMembers.length,
      missingMembers,
      extraMembers,
      consolidatedStructure: true // Flag to indicate this uses consolidated structure
    };
  } catch (error) {
    console.error("Error in checkProfileMemberSync (consolidated):", error);
    return { success: false, error: String(error) };
  } finally {
    console.log("=== DIAGNOSTIC: CONSOLIDATED CHECK COMPLETE ===");
  }
};

/**
 * Function to manually sync a specific profile to members
 * This can be used to fix specific sync issues
 */
/**
 * Check if a user exists in the database by email
 * This is useful for debugging issues with specific users
 */
export const checkUserByEmail = async (email: string) => {
  if (!email) {
    return {
      success: false,
      error: "Email is required"
    };
  }

  try {
    console.log(`Checking user with email: ${email}`);
    const results: any = {
      email,
      timestamp: new Date().toISOString()
    };

    // Step 1: Check profiles table
    try {
      // Try admin client first
      let profileData = null;
      let profileError = null;

      try {
        const result = await adminSupabase
          .from("profiles")
          .select("*")
          .ilike("email", email)
          .maybeSingle();

        profileData = result.data;
        profileError = result.error;
      } catch (adminError) {
        console.warn("Could not check profiles with admin client, falling back to regular client:", adminError);

        // Fall back to regular client
        const result = await supabase
          .from("profiles")
          .select("*")
          .ilike("email", email)
          .maybeSingle();

        profileData = result.data;
        profileError = result.error;
      }

      results.inProfiles = !!profileData;
      results.profileData = profileData;
      results.profileError = profileError?.message;

      if (profileError) {
        console.error("Error checking profiles:", profileError);
      } else {
        console.log("Profile check result:", profileData ? "Found" : "Not found");
      }
    } catch (error) {
      console.error("Exception checking profiles:", error);
      results.profileError = String(error);
    }

    // Step 2: Check consolidated members table
    try {
      let memberData = null;
      let memberError = null;

      try {
        const result = await adminSupabase
          .from("members")
          .select("id, email, fullname, phone, category, churchunit, churchunits, assignedto, isactive, created_at, updated_at")
          .ilike("email", email)
          .maybeSingle();

        memberData = result.data;
        memberError = result.error;
      } catch (adminError) {
        console.warn("Could not check consolidated members with admin client, falling back to regular client:", adminError);

        const result = await supabase
          .from("members")
          .select("id, email, fullname, phone, category, churchunit, churchunits, assignedto, isactive, created_at, updated_at")
          .ilike("email", email)
          .maybeSingle();

        memberData = result.data;
        memberError = result.error;
      }

      results.inConsolidatedMembers = !!memberData;
      results.consolidatedMemberData = memberData;
      results.memberError = memberError?.message;

      if (memberError) {
        console.error("Error checking consolidated members:", memberError);
      } else {
        console.log("Consolidated member check result:", memberData ? "Found" : "Not found");
        if (memberData) {
          console.log("Consolidated member details:", {
            category: memberData.category,
            churchunit: memberData.churchunit,
            isactive: memberData.isactive,
            assignedto: memberData.assignedto
          });
        }
      }
    } catch (error) {
      console.error("Exception checking consolidated members:", error);
      results.memberError = String(error);
    }

    // Step 3: Check user_roles table
    try {
      // Try admin client first
      let roleData = null;
      let roleError = null;

      if (results.profileData?.id) {
        try {
          const result = await adminSupabase
            .from("user_roles")
            .select("*")
            .eq("user_id", results.profileData.id)
            .maybeSingle();

          roleData = result.data;
          roleError = result.error;
        } catch (adminError) {
          console.warn("Could not check roles with admin client, falling back to regular client:", adminError);

          // Fall back to regular client
          const result = await supabase
            .from("user_roles")
            .select("*")
            .eq("user_id", results.profileData.id)
            .maybeSingle();

          roleData = result.data;
          roleError = result.error;
        }

        results.hasRole = !!roleData;
        results.roleData = roleData;
        results.roleError = roleError?.message;

        if (roleError) {
          console.error("Error checking roles:", roleError);
        } else {
          console.log("Role check result:", roleData ? `Found: ${roleData.role}` : "Not found");
        }
      }
    } catch (error) {
      console.error("Exception checking roles:", error);
      results.roleError = String(error);
    }

    // Add consolidated structure flag
    results.consolidatedStructure = true;

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error("Error in checkUserByEmail:", error);
    return {
      success: false,
      error: String(error)
    };
  }
};

/**
 * Comprehensive diagnostic function for the consolidated database structure
 * This function validates the integrity of the consolidated members table
 */
export const validateConsolidatedStructure = async () => {
  console.log("=== DIAGNOSTIC: VALIDATING CONSOLIDATED STRUCTURE ===");

  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      consolidatedStructure: true
    };

    // Step 1: Check consolidated members table structure
    console.log("Checking consolidated members table structure...");
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("id, email, fullname, phone, category, churchunit, churchunits, assignedto, isactive, created_at, updated_at")
      .limit(5);

    if (membersError) {
      console.error("Error accessing consolidated members table:", membersError);
      results.membersTableError = membersError.message;
    } else {
      results.membersTableAccessible = true;
      results.sampleMembers = members;
      console.log("Consolidated members table accessible, sample records:", members?.length || 0);
    }

    // Step 2: Check lightweight profiles table structure
    console.log("Checking lightweight profiles table structure...");
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at, updated_at")
      .limit(5);

    if (profilesError) {
      console.error("Error accessing profiles table:", profilesError);
      results.profilesTableError = profilesError.message;
    } else {
      results.profilesTableAccessible = true;
      results.sampleProfiles = profiles;
      console.log("Lightweight profiles table accessible, sample records:", profiles?.length || 0);
    }

    // Step 3: Check data consistency
    if (members && profiles) {
      const membersWithEmail = members.filter(m => m.email);
      const profilesWithMembers = profiles.filter(p =>
        members.some(m => m.email?.toLowerCase() === p.email?.toLowerCase())
      );

      results.membersWithEmail = membersWithEmail.length;
      results.profilesWithMembers = profilesWithMembers.length;
      results.totalMembers = members.length;
      results.totalProfiles = profiles.length;

      console.log(`Data consistency check:
        - Total members: ${members.length}
        - Members with email: ${membersWithEmail.length}
        - Total profiles: ${profiles.length}
        - Profiles with members: ${profilesWithMembers.length}`);
    }

    // Step 4: Check for required fields in consolidated structure
    if (members && members.length > 0) {
      const requiredFields = ['id', 'email', 'fullname', 'category', 'isactive'];
      const fieldValidation: any = {};

      for (const field of requiredFields) {
        const recordsWithField = members.filter((m: any) => m[field] !== null && m[field] !== undefined);
        fieldValidation[field] = {
          total: members.length,
          withValue: recordsWithField.length,
          percentage: Math.round((recordsWithField.length / members.length) * 100)
        };
      }

      results.fieldValidation = fieldValidation;
      console.log("Field validation for consolidated structure:", fieldValidation);
    }

    return {
      success: true,
      results
    };
  } catch (error) {
    console.error("Error in validateConsolidatedStructure:", error);
    return {
      success: false,
      error: String(error)
    };
  } finally {
    console.log("=== DIAGNOSTIC: CONSOLIDATED STRUCTURE VALIDATION COMPLETE ===");
  }
};

export const manualSyncProfileToMember = async (profileId: string) => {
  console.log(`Manually syncing profile ${profileId} to consolidated members table...`);

  try {
    // Step 1: Get the lightweight profile
    let profile;
    let profileError;

    try {
      const result = await adminSupabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .eq("id", profileId)
        .single();

      profile = result.data;
      profileError = result.error;
    } catch (adminError) {
      console.warn("Could not fetch profile with admin client, falling back to regular client:", adminError);

      const result = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .eq("id", profileId)
        .single();

      profile = result.data;
      profileError = result.error;
    }

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return { success: false, error: profileError.message };
    }

    if (!profile) {
      console.error("Profile not found");
      return { success: false, error: "Profile not found" };
    }

    console.log("Found lightweight profile:", profile);

    // Step 2: Check if a member already exists in consolidated table
    let existingMember;
    let memberError;

    try {
      const result = await adminSupabase
        .from("members")
        .select("*")
        .eq("email", profile.email?.toLowerCase())
        .maybeSingle();

      existingMember = result.data;
      memberError = result.error;
    } catch (adminError) {
      console.warn("Could not check for existing member with admin client, falling back to regular client:", adminError);

      const result = await supabase
        .from("members")
        .select("*")
        .eq("email", profile.email?.toLowerCase())
        .maybeSingle();

      existingMember = result.data;
      memberError = result.error;
    }

    if (memberError) {
      console.error("Error checking for existing member in consolidated table:", memberError);
      return { success: false, error: memberError.message };
    }

    if (existingMember) {
      console.log("Member already exists in consolidated table:", existingMember);
      return { success: true, message: "Member already exists in consolidated table", member: existingMember };
    }

    // Step 3: Create a new member in consolidated structure
    const memberData = {
      fullname: profile.full_name || profile.email?.split('@')[0] || 'Unknown',
      email: profile.email?.toLowerCase(),
      phone: null, // Will be populated when user updates their profile
      category: 'Members', // Default category for consolidated structure
      assignedto: null,
      churchunit: null,
      churchunits: [],
      isactive: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log("Creating new member in consolidated structure:", memberData);

    let newMember;
    let insertError;

    try {
      const result = await adminSupabase
        .from("members")
        .insert([memberData])
        .select();

      newMember = result.data;
      insertError = result.error;

      if (!insertError && newMember) {
        console.log("Successfully inserted member into consolidated table using admin client");
      }
    } catch (adminError) {
      console.warn("Could not insert member with admin client, falling back to regular client:", adminError);

      const result = await supabase
        .from("members")
        .insert([memberData])
        .select();

      newMember = result.data;
      insertError = result.error;
    }

    if (insertError) {
      console.error("Error creating member in consolidated table:", insertError);
      return { success: false, error: insertError.message };
    }

    console.log("Successfully created member in consolidated table:", newMember);

    return { success: true, member: newMember[0], consolidatedStructure: true };
  } catch (error) {
    console.error("Error in manualSyncProfileToMember (consolidated):", error);
    return { success: false, error: String(error) };
  }
};
