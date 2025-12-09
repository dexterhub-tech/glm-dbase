import { supabase } from "@/integrations/supabase/client";

// Type for the safe helper function response
interface SafeHelperResponse {
  success: boolean;
  message: string;
  user_id?: string;
}

// Type for database errors
interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// Type for operation result
interface OperationResult {
  success: boolean;
  message: string;
  error?: DatabaseError;
}

/**
 * Creates or updates a member record in the members table
 * Using the correct column names from the database schema
 */
const createMemberRecord = async (
  userId: string,
  email: string,
  fullName: string,
  churchUnit?: string,
  assignedPastor?: string,
  phone?: string
): Promise<OperationResult> => {
  try {
    console.log(`Creating/updating member record for user ${userId}`);

    // Determine category based on email (admin users are pastors)
    const adminEmails = ['ojidelawrence@gmail.com', 'popsabey1@gmail.com', 'dev.samadeyemi@gmail.com'];
    const category = adminEmails.includes(email.toLowerCase()) ? 'Pastors' : 'Members';

    // Use the correct column names from the database schema
    const memberData = {
      id: userId, // Use id instead of user_id
      email: email,
      fullname: fullName,
      phone: phone || null,
      category: category,
      churchunit: churchUnit || null, // Use churchunit instead of church_unit
      assignedto: assignedPastor || null, // Use assignedto instead of assigned_pastor
      isactive: true, // Use isactive instead of status
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Member data to insert:", memberData);

    const { error: memberError } = await supabase
      .from('members')
      .upsert(memberData, { onConflict: 'id' }); // Use id for conflict resolution

    if (memberError) {
      console.error("Error creating/updating member record:", memberError);
      return {
        success: false,
        message: memberError.message || "Error creating member record",
        error: memberError
      };
    }

    console.log("Member record created/updated successfully");
    return {
      success: true,
      message: "Member record created/updated successfully"
    };
  } catch (error: unknown) {
    const dbError = error as DatabaseError;
    console.error("Exception in createMemberRecord:", dbError);
    return {
      success: false,
      message: dbError.message || "Unknown error creating member record",
      error: dbError
    };
  }
};

/**
 * Creates or updates a user profile in the profiles table and ensures member record exists
 * This is a utility function to ensure consistent profile and member creation
 *
 * @param userId The user ID from auth.users
 * @param email The user's email address
 * @param fullName The user's full name
 * @param churchUnit Optional church unit
 * @param assignedPastor Optional assigned pastor
 * @param phone Optional phone number
 * @param address Optional address
 * @returns Result of the operation with success flag and error message if applicable
 */
export const createUserProfile = async (
  userId: string,
  email: string,
  fullName: string,
  churchUnit?: string,
  assignedPastor?: string,
  phone?: string,
  address?: string
) => {
  try {
    console.log(`Creating/updating profile for user ${userId}`);

    if (!userId) {
      console.error("Missing user ID for profile creation");
      return {
        success: false,
        message: "Missing user ID for profile creation"
      };
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    // Ensure fullName is not empty
    const sanitizedFullName = fullName?.trim() || email.split('@')[0];

    // Try using the safe helper function first with improved error handling
    try {
      console.log("Attempting to use create_user_profile_safe function");
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('create_user_profile_safe', {
        user_id: userId,
        user_email: normalizedEmail,
        user_full_name: sanitizedFullName,
        church_unit: churchUnit || null,
        phone: phone || null
      }) as { data: SafeHelperResponse | null; error: DatabaseError | null };

      if (error) {
        console.warn("Safe helper function failed:", error);
        // Don't return here, fall through to manual creation
      } else if (data?.success) {
        console.log("Profile created successfully using safe helper function:", data);
        return {
          success: true,
          message: data.message || "Profile and member record created/updated successfully"
        };
      } else if (data && !data.success) {
        console.warn("Safe helper function returned error:", data.message);
        // Don't return here, fall through to manual creation
      }
    } catch (rpcError: unknown) {
      const dbError = rpcError as DatabaseError;
      console.warn("Safe helper function exception:", dbError);
      // Continue to manual creation
    }

    // Fallback to manual creation with improved error handling
    console.log("Using manual profile creation");

    // Create a profile record with all available fields
    const profileData = {
      id: userId,
      email: normalizedEmail,
      full_name: sanitizedFullName,
      church_unit: churchUnit || null,
      phone: phone || null,
      address: address || null,
      updated_at: new Date().toISOString(),
    };

    console.log("Profile data to insert:", profileData);

    // Use upsert to create or update the profile with retry mechanism
    let attempts = 0;
    const maxAttempts = 3;
    let profileError: DatabaseError | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Profile creation attempt ${attempts}/${maxAttempts}`);

      try {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert(profileData, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (!upsertError) {
          console.log(`Profile creation successful on attempt ${attempts}`);
          profileError = null;
          break;
        }

        profileError = upsertError;
        console.error(`Profile creation attempt ${attempts} failed:`, profileError);

        // If it's a schema error, try with minimal data
        if (profileError.message?.includes('column') || profileError.message?.includes('does not exist')) {
          console.log("Trying with minimal profile data due to schema error");
          const minimalProfileData = {
            id: userId,
            email: normalizedEmail,
            full_name: sanitizedFullName,
            updated_at: new Date().toISOString(),
          };

          const { error: minimalError } = await supabase
            .from('profiles')
            .upsert(minimalProfileData, { onConflict: 'id' });

          if (!minimalError) {
            console.log("Profile created with minimal data");
            profileError = null;
            break;
          }
        }

      } catch (exception: unknown) {
        profileError = exception as DatabaseError;
        console.error(`Profile creation attempt ${attempts} exception:`, exception);
      }

      // Wait before retrying (exponential backoff)
      if (attempts < maxAttempts) {
        const delay = Math.pow(2, attempts) * 500; // 500ms, 1s, 2s
        console.log(`Retrying after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (profileError) {
      console.error("All profile creation attempts failed:", profileError);
      return {
        success: false,
        message: `Profile creation failed: ${profileError.message || 'Unknown error'}`,
        error: profileError
      };
    }

    console.log("Profile created/updated successfully");

    // Also create/update member record with error handling
    try {
      const memberResult = await createMemberRecord(userId, normalizedEmail, sanitizedFullName, churchUnit, assignedPastor, phone);
      
      if (!memberResult.success) {
        console.warn("Member record creation failed, but profile was created:", memberResult.message);
        // Don't fail the entire operation if member creation fails
      }
    } catch (memberError: unknown) {
      const dbError = memberError as DatabaseError;
      console.warn("Member record creation threw exception:", dbError.message);
      // Continue anyway since profile was created
    }

    return {
      success: true,
      message: "Profile created/updated successfully"
    };
  } catch (error: unknown) {
    const dbError = error as DatabaseError;
    console.error("Exception in createUserProfile:", dbError);
    return {
      success: false,
      message: dbError.message || "Unknown error creating profile",
      error: dbError
    };
  }
};
