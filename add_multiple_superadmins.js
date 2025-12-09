/**
 * Script to add multiple super admins
 * 
 * This script will make "dev.samadeyemi@gmail.com" and "popsabey1@gmail.com" super admins
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
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSuperAdmin(email) {
  try {
    console.log(`\n🔄 Adding super admin role to ${email}...`);
    
    // Call the function to add a super admin
    const { data, error } = await supabase.rpc('add_super_admin_by_email', {
      admin_email: email.toLowerCase().trim()
    });
    
    if (error) {
      console.error(`❌ Error adding super admin for ${email}:`, error);
      return false;
    }
    
    console.log(`📋 Result for ${email}:`, data);
    
    if (data.success) {
      console.log(`✅ Successfully added super admin role to ${email}`);
      return true;
    } else {
      console.error(`❌ Failed to add super admin role to ${email}: ${data.message}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Exception adding super admin for ${email}:`, error);
    return false;
  }
}

async function addMultipleSuperAdmins() {
  console.log('🚀 Starting to add multiple super admins...');
  console.log(`📧 Emails to process: ${emails.join(', ')}`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const email of emails) {
    const success = await addSuperAdmin(email);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`✅ Successfully added: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  
  // List current super admins to verify
  try {
    console.log('\n🔍 Current super admins:');
    const { data: listData, error: listError } = await supabase.rpc('list_super_admins');
    
    if (listError) {
      console.error('Error listing super admins:', listError);
    } else {
      if (Array.isArray(listData) && listData.length > 0) {
        listData.forEach((admin, index) => {
          console.log(`${index + 1}. ${admin.email} (ID: ${admin.user_id})`);
        });
      } else {
        console.log('No super admins found or data format unexpected');
      }
    }
  } catch (error) {
    console.error('Exception listing super admins:', error);
  }
  
  if (failureCount > 0) {
    process.exit(1);
  }
}

addMultipleSuperAdmins();