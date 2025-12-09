import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to test the Supabase connection
 * This can be called from any component to verify if Supabase is working correctly
 */
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  error?: any;
}> => {
  try {
    console.log('Testing Supabase connection...');

    // Simple query to test connection - avoid using aggregate functions
    const { data, error } = await supabase
      .from('members')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return {
        success: false,
        message: `Supabase connection error: ${error.message}`,
        error
      };
    }

    console.log('Supabase connection test successful:', data);
    return {
      success: true,
      message: 'Supabase connection successful'
    };
  } catch (error: any) {
    console.error('Unexpected error testing Supabase connection:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      error
    };
  }
};

/**
 * Utility function to test if the members table exists and has the expected structure
 */
export const testMembersTable = async (): Promise<{
  success: boolean;
  message: string;
  error?: any;
}> => {
  try {
    console.log('Testing members table...');

    // Query to test if the members table exists and has the expected structure
    const { data, error } = await supabase
      .from('members')
      .select('id, fullname, category')
      .limit(1);

    if (error) {
      console.error('Members table test failed:', error);
      return {
        success: false,
        message: `Members table error: ${error.message}`,
        error
      };
    }

    console.log('Members table test successful:', data);
    return {
      success: true,
      message: 'Members table exists and has the expected structure'
    };
  } catch (error: any) {
    console.error('Unexpected error testing members table:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      error
    };
  }
};
