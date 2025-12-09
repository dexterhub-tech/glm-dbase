/**
 * Script to check if users exist in the system
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Emails to check
const emails = [
  'dev.samadeyemi@gmail.com',
  'popsabey1@gmail.com'
];

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  console.log('🔍 Checking user existence in different tables...\n');
  
  for (const email of emails) {
    console.log(`📧 Checking ${email}:`);
    
    // Check auth.users table
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log(`  ❌ Error checking auth.users: ${authError.message}`);
      } else {
        const authUser = authData.users.find(u => u.email === email);
        if (authUser) {
          console.log(`  ✅ Found in auth.users: ID ${authUser.id}, confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
        } else {
          console.log(`  ❌ Not found in auth.users`);
        }
      }
    } catch (error) {
      console.log(`  ❌ Exception checking auth.users: ${error.message}`);
    }
    
    // Check profiles table
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log(`  ❌ Not found in profiles table`);
        } else {
          console.log(`  ❌ Error checking profiles: ${profileError.message}`);
        }
      } else {
        console.log(`  ✅ Found in profiles: ID ${profileData.id}, name: ${profileData.full_name || 'N/A'}`);
      }
    } catch (error) {
      console.log(`  ❌ Exception checking profiles: ${error.message}`);
    }
    
    // Check members table
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('email', email)
        .single();
      
      if (memberError) {
        if (memberError.code === 'PGRST116') {
          console.log(`  ❌ Not found in members table`);
        } else {
          console.log(`  ❌ Error checking members: ${memberError.message}`);
        }
      } else {
        console.log(`  ✅ Found in members: ID ${memberData.id}, status: ${memberData.status || 'N/A'}`);
      }
    } catch (error) {
      console.log(`  ❌ Exception checking members: ${error.message}`);
    }
    
    // Check user_roles table
    try {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', ''); // We'll need to get the user_id first
      
      // This is a bit complex, let's skip for now and focus on the main tables
    } catch (error) {
      // Skip
    }
    
    console.log(''); // Empty line for readability
  }
}

checkUsers();