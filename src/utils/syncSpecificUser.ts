import { supabase } from "@/integrations/supabase/client";

/**
 * Syncs a specific user from the profiles table to the members table
 * This is a utility function to handle the case where a specific user needs to be synced
 * 
 * @param email The email of the user to sync
 * @returns Result of the sync operation
 */
export const syncSpecificUser = async (email: string) => {
  try {
    console.log(`Attempting to sync specific user: ${email}`);
    
    // Step 1: Check if the user exists in profiles
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", email);
    
    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return { 
        success: false, 
        message: `Error fetching profile: ${profileError.message}` 
      };
    }
    
    if (!profileData || profileData.length === 0) {
      console.log(`No profile found with email: ${email}`);
      return { 
        success: false, 
        message: `No profile found with email: ${email}` 
      };
    }
    
    const profile = profileData[0];
    console.log("Found profile:", profile);
    
    // Step 2: Check if the user already exists in members
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("*")
      .ilike("email", email);
    
    if (memberError) {
      console.error("Error checking existing member:", memberError);
      return { 
        success: false, 
        message: `Error checking existing member: ${memberError.message}` 
      };
    }
    
    if (memberData && memberData.length > 0) {
      console.log(`Member already exists with email: ${email}`);
      return { 
        success: true, 
        message: `Member already exists with email: ${email}`,
        existing: true
      };
    }
    
    // Step 3: Create the member record
    const memberRecord = {
      fullname: profile.full_name || email.split('@')[0] || 'Unknown',
      email: email.toLowerCase(),
      category: 'Others', // Default category
      churchunit: profile.church_unit || null,
      assignedto: profile.assigned_pastor || null,
      phone: profile.phone || null,
      address: profile.address || null,
      isactive: true,
      joindate: new Date().toISOString().split('T')[0],
      userid: profile.id, // Link to the auth user ID
    };
    
    console.log("Creating member record:", memberRecord);
    
    // Step 4: Insert the member
    const { data: insertedMember, error: insertError } = await supabase
      .from("members")
      .insert([memberRecord])
      .select();
    
    if (insertError) {
      console.error("Error inserting member:", insertError);
      return { 
        success: false, 
        message: `Error inserting member: ${insertError.message}` 
      };
    }
    
    console.log("Successfully added member:", insertedMember);
    
    return { 
      success: true, 
      message: `Successfully added member with email: ${email}`,
      member: insertedMember?.[0]
    };
  } catch (error: any) {
    console.error("Error in syncSpecificUser:", error);
    return { 
      success: false, 
      message: `Error: ${error.message || "Unknown error"}` 
    };
  }
};
