import { supabase } from "@/integrations/supabase/client";

/**
 * Directly adds a specific member to the members table
 * This is a utility function to handle the case where a specific user needs to be added
 * 
 * @returns Result of the operation
 */
export const addSpecificMember = async () => {
  try {
    console.log("Directly adding Samuel Adeyemi to members table");
    
    // Check if the member already exists
    const { data: existingMember, error: checkError } = await supabase
      .from("members")
      .select("*")
      .ilike("email", "adeyemi958@gmail.com");
      
    if (checkError) {
      console.error("Error checking if member exists:", checkError);
      return { 
        success: false, 
        message: `Error checking if member exists: ${checkError.message}` 
      };
    }
    
    if (existingMember && existingMember.length > 0) {
      console.log("Member already exists:", existingMember[0]);
      return { 
        success: true, 
        message: "Member already exists in the database",
        existing: true,
        member: existingMember[0]
      };
    }
    
    // Create the member record directly
    const memberRecord = {
      fullname: "Samuel Adeyemi",
      email: "adeyemi958@gmail.com",
      category: "Others",
      churchunit: null,
      assignedto: null,
      phone: null,
      address: null,
      isactive: true,
      joindate: new Date().toISOString().split('T')[0]
    };
    
    console.log("Inserting member record:", memberRecord);
    
    // Insert the member
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
      message: "Successfully added Samuel Adeyemi to members table",
      member: insertedMember?.[0]
    };
  } catch (error: any) {
    console.error("Error in addSpecificMember:", error);
    return { 
      success: false, 
      message: `Error: ${error.message || "Unknown error"}` 
    };
  }
};
