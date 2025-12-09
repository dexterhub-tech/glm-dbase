/**
 * Script to add a super admin by email
 * 
 * Usage:
 * 1. Make sure you have the Supabase CLI installed
 * 2. Run: node src/scripts/add_superadmin.js your-email@example.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address');
  console.error('Usage: node src/scripts/add_superadmin.js your-email@example.com');
  process.exit(1);
}

// Validate email format
if (!email.includes('@') || !email.includes('.')) {
  console.error('Invalid email format');
  process.exit(1);
}

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSuperAdmin() {
  try {
    console.log(`Adding super admin role to ${email}...`);
    
    // Call the function to add a super admin
    const { data, error } = await supabase.rpc('add_super_admin_by_email', {
      admin_email: email.toLowerCase().trim()
    });
    
    if (error) {
      console.error('Error adding super admin:', error);
      process.exit(1);
    }
    
    console.log('Result:', data);
    
    if (data.success) {
      console.log(`✅ Successfully added super admin role to ${email}`);
    } else {
      console.error(`❌ Failed to add super admin role: ${data.message}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Exception adding super admin:', error);
    process.exit(1);
  }
}

addSuperAdmin();
