import { supabase } from "@/integrations/supabase/client";
import { adminSupabase } from "@/integrations/supabase/adminClient";

// Enhanced sync result interface for consolidated structure
interface SyncResult {
  success: boolean;
  message: string;
  added: number;
  errors?: Array<{ email: string; error: string }>;
  refreshNeeded?: boolean;
  consolidatedStructure?: boolean;
  validationErrors?: string[];
}

// Validation function for member data in consolidated structure
const validateMemberData = (memberData: any): string[] => {
  const errors: string[] = [];
  
  if (!memberData.email || !memberData.email.includes('@')) {
    errors.push('Invalid email address');
  }
  
  if (!memberData.fullname || memberData.fullname.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }
  
  if (!memberData.user_id) {
    errors.push('User ID is required for consolidated structure');
  }
  
  if (!['Members', 'Pastors', 'Workers', 'Visitors', 'Partners'].includes(memberData.category)) {
    errors.push('Invalid member category');
  }
  
  if (!['user', 'admin', 'superuser'].includes(memberData.role)) {
    errors.push('Invalid user role');
  }
  
  return errors;
};

// Check if the database is accessible and credentials are working
const checkDatabaseConnection = async () => {
  try {
    console.log("Testing database connection...");
    // Test both tables to ensure consolidated structure is working
    const { error: profilesError } = await supabase.from("profiles").select("count").limit(1);
    const { error: membersError } = await supabase.from("members").select("count").limit(1);

    if (profilesError || membersError) {
      console.error("Database connection test failed:", { profilesError, membersError });
      return false;
    }

    console.log("Database connection successful - both profiles and members tables accessible");
    return true;
  } catch (err) {
    console.error("Exception testing database connection:", err);
    return false;
  }
};

// Define a more robust function to check if a member exists in the consolidated structure
const checkMemberExists = async (email: string, userId: string | null) => {
  try {
    // Check by email (case-insensitive) in the consolidated members table
    if (email) {
      const { data: emailMatch } = await supabase
        .from("members")
        .select("id, email, user_id")
        .ilike("email", email)
        .maybeSingle();

      if (emailMatch) return true;
    }

    // Check by user_id if provided
    if (userId) {
      const { data: userMatch } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (userMatch) return true;
    }

    return false;
  } catch (error) {
    console.error("Error in checkMemberExists:", error);
    // If there's an error, assume the member doesn't exist
    return false;
  }
};

/**
 * Manually sync a specific profile to the consolidated members table
 * This function works with the new consolidated structure where profiles
 * contain only basic auth data and members contain comprehensive church data
 */
export const manualSyncProfileToMember = async (profileId: string) => {
  try {
    console.log(`Manually syncing profile ${profileId} to consolidated members table`);

    // First check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return {
        success: false,
        error: "Could not connect to the database. Check your credentials and network connection."
      };
    }

    // Get the lightweight profile data
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile for manual sync:", profileError);
      return {
        success: false,
        error: profileError?.message || "Profile not found"
      };
    }

    // Check if member already exists in consolidated table
    const memberExists = await checkMemberExists(profile.email || '', profile.id);
    if (memberExists) {
      console.log(`Member already exists for profile ${profileId} in consolidated table`);
      return {
        success: true,
        message: "Member already exists in the consolidated database"
      };
    }

    // Prepare member record for consolidated structure
    const fullName = profile.full_name?.trim() || profile.email?.split('@')[0] || 'Unknown';
    const now = new Date().toISOString();

    const memberData = {
      user_id: profile.id,
      fullname: fullName,
      email: profile.email?.toLowerCase(),
      phone: null, // Will be populated when user updates their profile
      address: null, // Will be populated when user updates their profile
      genotype: null, // Will be populated when user updates their profile
      category: 'Members' as const,
      title: null,
      assignedto: null,
      churchunit: null,
      churchunits: [],
      auxanogroup: null,
      joindate: now.split('T')[0],
      notes: null,
      isactive: true,
      role: 'user' as const, // Default role for new members
      created_at: now,
      updated_at: now
    };

    // Validate member data before insertion
    const validationErrors = validateMemberData(memberData);
    if (validationErrors.length > 0) {
      console.error("Validation errors for member data:", validationErrors);
      return {
        success: false,
        error: `Validation failed: ${validationErrors.join(', ')}`
      };
    }

    // Insert the member using admin client
    const { data: insertedMember, error: insertError } = await adminSupabase
      .from("members")
      .insert([memberData])
      .select();

    if (insertError) {
      console.error("Error inserting member during manual sync:", insertError);
      return {
        success: false,
        error: insertError.message
      };
    }

    console.log(`Successfully manually synced profile ${profileId} to consolidated members table`);
    return {
      success: true,
      message: `Successfully added ${fullName} to consolidated members table`,
      member: insertedMember?.[0]
    };
  } catch (error: any) {
    console.error("Error in manual sync:", error);
    return {
      success: false,
      error: error.message || "An unknown error occurred"
    };
  }
};

/**
 * Syncs users from the lightweight profiles table to the consolidated members table
 * This ensures that all authenticated users appear in the members list with proper structure
 * Works with the new consolidated database structure where profiles contain only auth data
 */
export const syncProfilesToMembers = async () => {
  try {
    console.log("Starting sync of profiles to consolidated members table");

    // First check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return {
        success: false,
        message: "Could not connect to the database. Check your credentials and network connection.",
        added: 0
      };
    }

    // Step 1: Get all profiles from the lightweight profiles table
    const timestamp = new Date().getTime();
    console.log(`Sync profiles timestamp: ${timestamp}`);

    // Fetch lightweight profiles (only contains basic auth data after consolidation)
    let profiles;
    let profilesError;

    try {
      const result = await adminSupabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order('created_at', { ascending: false });

      profiles = result.data;
      profilesError = result.error;

      if (!profilesError && profiles) {
        console.log("Successfully fetched lightweight profiles using admin client");
      }
    } catch (adminError) {
      console.warn("Could not fetch profiles with admin client, falling back to regular client:", adminError);

      const result = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at")
        .order('created_at', { ascending: false });

      profiles = result.data;
      profilesError = result.error;
    }

    if (profilesError) throw profilesError;

    if (!profiles || profiles.length === 0) {
      console.log("No profiles found to sync");
      return { success: true, message: "No profiles found to sync", added: 0 };
    }

    console.log(`Found ${profiles.length} lightweight profiles to check`);
    console.log("First 3 profiles:", profiles.slice(0, 3));

    // Step 2: Get all existing members from consolidated table to avoid duplicates
    console.log(`Fetching existing members from consolidated table with timestamp: ${timestamp}`);

    let existingMembers;
    let membersError;

    try {
      const result = await adminSupabase
        .from("members")
        .select("email, fullname, id, user_id");

      existingMembers = result.data;
      membersError = result.error;

      if (!membersError && existingMembers) {
        console.log("Successfully fetched consolidated members using admin client");
      }
    } catch (adminError) {
      console.warn("Could not fetch members with admin client, falling back to regular client:", adminError);

      const result = await supabase
        .from("members")
        .select("email, fullname, id, user_id");

      existingMembers = result.data;
      membersError = result.error;
    }

    if (membersError) {
      console.error("Error fetching existing members from consolidated table:", membersError);
      throw membersError;
    }

    // Create sets for efficient lookup
    const existingEmails = new Set((existingMembers || [])
      .filter(m => m.email)
      .map(m => m.email.toLowerCase()));

    const existingUserIds = new Set((existingMembers || [])
      .filter(m => m.user_id)
      .map(m => m.user_id));

    console.log(`Found ${existingEmails.size} existing members with emails in consolidated table`);
    console.log(`Found ${existingUserIds.size} existing members with user IDs in consolidated table`);

    // Log the first few existing members for debugging
    if (existingMembers && existingMembers.length > 0) {
      console.log("Sample existing members:", existingMembers.slice(0, 5));
    }

    // Step 3: Filter profiles that don't exist in members table
    const profilesToAdd = [];

    // Check each profile more thoroughly
    for (const profile of profiles) {
      if (!profile.email && !profile.id) {
        console.log(`Skipping profile with no email or id: ${JSON.stringify(profile)}`);
        continue;
      }

      const lowerEmail = profile.email?.toLowerCase() || '';
      const emailExists = existingEmails.has(lowerEmail);
      const userIdExists = existingUserIds.has(profile.id);
      let exists = emailExists || userIdExists;

      // Double-check with a direct database query for important users
      const isTargetUser =
        profile.full_name?.toLowerCase().includes('biodun') ||
        profile.email?.toLowerCase().includes('biodun') ||
        profile.email?.toLowerCase().includes('popsabey1');

      if (isTargetUser || !exists) {
        // For target users or users that don't seem to exist, do an extra check
        console.log(`Performing extra existence check for: ${profile.email} (${profile.full_name || 'No name'})`);
        const memberExistsInDb = await checkMemberExists(profile.email || '', profile.id);

        if (memberExistsInDb) {
          exists = true;
          console.log(`Extra check confirmed user exists in members table: ${profile.email}`);
        } else {
          console.log(`Extra check confirmed user DOES NOT exist in members table: ${profile.email}`);
        }
      }

      // Log details for debugging
      if (isTargetUser) {
        console.log(`IMPORTANT - Found target user: ${profile.email} (${profile.full_name || 'No name'})`);
        console.log(`Target user exists in members? ${exists} (Email match: ${emailExists}, User ID match: ${userIdExists})`);
        if (exists) {
          console.log("This user should be synced but isn't showing up in the frontend");
        }
      } else {
        console.log(`Checking profile ${profile.email} (${profile.full_name || 'No name'}): exists in members? ${exists}`);
      }

      if (!exists) {
        profilesToAdd.push(profile);
      }
    }

    console.log(`Found ${profilesToAdd.length} profiles to add to members table`);

    if (profilesToAdd.length === 0) {
      // Even if no new profiles to add, we'll force a refresh of the members data
      // This helps when members exist but aren't showing in the UI
      return {
        success: true,
        message: "All profiles are already in members table. Refreshed data.",
        added: 0,
        refreshNeeded: true
      };
    }

    // Step 4: Prepare member records for consolidated structure with validation
    const membersToInsert = [];
    const validationErrors = [];

    for (const profile of profilesToAdd) {
      const fullName = profile.full_name?.trim() || profile.email?.split('@')[0] || 'Unknown';
      const now = new Date().toISOString();

      const memberData = {
        user_id: profile.id,
        fullname: fullName,
        email: profile.email?.toLowerCase(),
        phone: null, // Will be populated when user updates their profile
        address: null, // Will be populated when user updates their profile
        genotype: null, // Will be populated when user updates their profile
        category: 'Members' as const,
        title: null,
        assignedto: null,
        churchunit: null,
        churchunits: [],
        auxanogroup: null,
        joindate: now.split('T')[0],
        notes: null,
        isactive: true,
        role: 'user' as const, // Default role for new members
        created_at: now,
        updated_at: now
      };

      // Validate each member record
      const memberValidationErrors = validateMemberData(memberData);
      if (memberValidationErrors.length > 0) {
        console.warn(`Validation errors for profile ${profile.email}:`, memberValidationErrors);
        validationErrors.push({
          email: profile.email || 'unknown',
          errors: memberValidationErrors
        });
      } else {
        membersToInsert.push(memberData);
      }
    }

    if (validationErrors.length > 0) {
      console.warn(`${validationErrors.length} profiles failed validation:`, validationErrors);
    }

    // Step 5: Insert new members into consolidated table
    console.log("Attempting to insert members into consolidated table:", membersToInsert);

    if (membersToInsert.length === 0) {
      console.log("No members to insert into consolidated table");
      return {
        success: true,
        message: "No new members to add to consolidated table",
        added: 0,
        refreshNeeded: true
      };
    }

    // Insert members with improved error handling for consolidated structure
    const insertedMembers = [];
    const errors = [];

    for (const member of membersToInsert) {
      try {
        console.log(`Inserting member into consolidated table: ${member.email}`);

        let data;
        let error;

        try {
          const result = await adminSupabase
            .from("members")
            .insert([member])
            .select();

          data = result.data;
          error = result.error;

          if (!error && data) {
            console.log(`Successfully inserted member into consolidated table: ${member.email}`);
          }
        } catch (adminError) {
          console.warn(`Could not insert member ${member.email} with admin client, falling back to regular client:`, adminError);

          const result = await supabase
            .from("members")
            .insert([member])
            .select();

          data = result.data;
          error = result.error;
        }

        if (error) {
          console.error(`Error inserting member ${member.email} into consolidated table:`, error);
          errors.push({ email: member.email, error: error.message });

          // Special handling for important users
          if (member.email?.toLowerCase().includes('popsabey1') || member.email?.toLowerCase().includes('ojidelawrence')) {
            console.error(`CRITICAL: Failed to insert important user ${member.email} into consolidated table.`);

            // Try with minimal data structure
            try {
              console.log(`Attempting minimal insert for ${member.email}`);
              const minimalMember = {
                fullname: member.fullname,
                email: member.email,
                category: 'Members',
                isactive: true,
                user_id: member.user_id,
                role: 'user'
              };

              const directResult = await adminSupabase
                .from("members")
                .insert([minimalMember])
                .select();

              if (directResult.error) {
                console.error(`Minimal insert also failed for ${member.email}:`, directResult.error);
              } else {
                console.log(`Minimal insert succeeded for ${member.email}`);
                insertedMembers.push(directResult.data[0]);
              }
            } catch (directError) {
              console.error(`Minimal insert exception for ${member.email}:`, directError);
            }
          }
        } else if (data && data.length > 0) {
          console.log(`Successfully inserted member into consolidated table: ${member.email}`);
          insertedMembers.push(data[0]);
        }
      } catch (err) {
        console.error(`Exception inserting member ${member.email} into consolidated table:`, err);
        errors.push({ email: member.email, error: String(err) });
      }
    }

    console.log(`Successfully added ${insertedMembers.length} members to consolidated table from profiles`);
    if (errors.length > 0) {
      console.error(`Failed to add ${errors.length} members to consolidated table:`, errors);
    }

    // Create detailed message for consolidated structure
    let message = `Successfully added ${insertedMembers.length} new members to consolidated table from user profiles`;
    if (insertedMembers.length > 0) {
      const newUserNames = insertedMembers.map(m => m.fullname || m.email).join(', ');
      message += `: ${newUserNames}`;
    } else {
      message = "All registered users are already in the consolidated members table";
    }

    if (errors.length > 0) {
      message += `. Failed to add ${errors.length} members due to errors.`;
    }

    return {
      success: true,
      message: message,
      added: insertedMembers.length,
      errors: errors.length > 0 ? errors : undefined,
      refreshNeeded: true,
      consolidatedStructure: true // Flag to indicate this uses the new structure
    };
  } catch (error: any) {
    console.error("Error syncing profiles to consolidated members table:", error);
    return {
      success: false,
      message: error.message || "An error occurred while syncing profiles to consolidated members table",
      added: 0
    };
  }
};
