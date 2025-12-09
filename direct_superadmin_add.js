/**
 * Script to directly add super admin roles to user_roles table
 * This bypasses any complex function logic and directly inserts the roles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Emails to make super admins
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

async function addSuperAdminDirect(email) {
  try {
    console.log(`\n🔄 Processing ${email}...`);
    
    // First, get the user ID from auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error(`❌ Error getting users: ${authError.message}`);
      return false;
    }
    
    const user = authData.users.find(u => u.email === email);
    if (!user) {
      console.error(`❌ User ${email} not found in auth.users`);
      return false;
    }
    
    console.log(`✅ Found user: ${user.id}`);
    
    // Check if user already has superuser role
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'superuser')
      .single();
    
    if (roleCheckError && roleCheckError.code !== 'PGRST116') {
      console.error(`❌ Error checking existing role: ${roleCheckError.message}`);
      return false;
    }
    
    if (existingRole) {
      console.log(`✅ User ${email} already has superuser role`);
      return true;
    }
    
    // Remove any existing roles for this user first
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error(`❌ Error removing existing roles: ${deleteError.message}`);
      return false;
    }
    
    // Add superuser role
    const { data: insertData, error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'superuser'
      })
      .select();
    
    if (insertError) {
      console.error(`❌ Error inserting superuser role: ${insertError.message}`);
      return false;
    }
    
    console.log(`✅ Successfully added superuser role to ${email}`);
    console.log(`📋 Role data:`, insertData);
    return true;
    
  } catch (error) {
    console.error(`❌ Exception processing ${email}:`, error);
    return false;
  }
}

async function addMultipleSuperAdminsDirect() {
  console.log('🚀 Starting direct super admin role assignment...');
  console.log(`📧 Emails to process: ${emails.join(', ')}`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const email of emails) {
    const success = await addSuperAdminDirect(email);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  
  // Verify by checking user_roles table directly
  try {
    console.log('\n🔍 Current superuser roles in user_roles table:');
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        created_at,
        profiles!inner(email, full_name)
      `)
      .eq('role', 'superuser');
    
    if (roleError) {
      console.error('Error checking user_roles:', roleError);
    } else {
      if (roleData && roleData.length > 0) {
        roleData.forEach((role, index) => {
          console.log(`${index + 1}. ${role.profiles.email} (${role.profiles.full_name}) - ID: ${role.user_id}`);
        });
      } else {
        console.log('No superuser roles found');
      }
    }
  } catch (error) {
    console.error('Exception checking roles:', error);
  }
  
  if (failureCount > 0) {
    process.exit(1);
  }
}

addMultipleSuperAdminsDirect();