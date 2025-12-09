/**
 * Script to verify super admin roles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySuperAdmins() {
  console.log('🔍 Verifying super admin roles...\n');
  
  try {
    // Get all superuser roles
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at')
      .eq('role', 'superuser');
    
    if (roleError) {
      console.error('Error checking user_roles:', roleError);
      return;
    }
    
    if (!roleData || roleData.length === 0) {
      console.log('❌ No superuser roles found');
      return;
    }
    
    console.log(`✅ Found ${roleData.length} superuser role(s):`);
    
    // For each role, get the user details
    for (let i = 0; i < roleData.length; i++) {
      const role = roleData[i];
      console.log(`\n${i + 1}. User ID: ${role.user_id}`);
      console.log(`   Role: ${role.role}`);
      console.log(`   Created: ${role.created_at}`);
      
      // Get user email from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', role.user_id)
        .single();
      
      if (profileError) {
        console.log(`   ❌ Error getting profile: ${profileError.message}`);
      } else {
        console.log(`   📧 Email: ${profileData.email}`);
        console.log(`   👤 Name: ${profileData.full_name || 'N/A'}`);
      }
    }
    
    // Check specifically for our target emails
    console.log('\n🎯 Checking target emails:');
    const targetEmails = ['dev.samadeyemi@gmail.com', 'popsabey1@gmail.com'];
    
    for (const email of targetEmails) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .single();
      
      if (profileError) {
        console.log(`❌ ${email}: Profile not found`);
        continue;
      }
      
      const { data: userRoleData, error: userRoleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profileData.id)
        .eq('role', 'superuser')
        .single();
      
      if (userRoleError) {
        if (userRoleError.code === 'PGRST116') {
          console.log(`❌ ${email}: No superuser role found`);
        } else {
          console.log(`❌ ${email}: Error checking role - ${userRoleError.message}`);
        }
      } else {
        console.log(`✅ ${email}: Has superuser role`);
      }
    }
    
  } catch (error) {
    console.error('Exception:', error);
  }
}

verifySuperAdmins();