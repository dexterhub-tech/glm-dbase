/**
 * Script to add a test super admin
 *
 * Usage:
 * 1. Make sure you have the Supabase CLI installed
 * 2. Run: node src/scripts/add_test_super_admin.js your-email@example.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';

// Initialize dotenv
dotenv.config();

// Get email from command line arguments or use a default for testing
const email = process.argv[2] || 'test@example.com';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTestSuperAdmin() {
  try {
    console.log(`Adding super admin role to ${email}...`);

    // First, ensure the superuser role exists in the app_role enum
    console.log('Checking if superuser role exists in app_role enum...');
    const { data: roleCheckData, error: roleCheckError } = await supabase.rpc('check_superuser_role');

    if (roleCheckError) {
      console.error('Error checking superuser role:', roleCheckError);
      process.exit(1);
    }

    console.log('Role check result:', roleCheckData);

    if (!roleCheckData.has_superuser_role) {
      console.log('Adding superuser to app_role enum...');
      const { data: ensureRoleData, error: ensureRoleError } = await supabase.rpc('ensure_superuser_role');

      if (ensureRoleError) {
        console.error('Error adding superuser to app_role enum:', ensureRoleError);
        process.exit(1);
      }

      console.log('Result:', ensureRoleData);
    }

    // List all available roles
    const { data: rolesData, error: rolesError } = await supabase.rpc('list_app_roles');

    if (rolesError) {
      console.error('Error listing app roles:', rolesError);
    } else {
      console.log('Available roles:', rolesData);
    }

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

      // Verify by listing super admins
      const { data: listData, error: listError } = await supabase.rpc('list_super_admins');

      if (listError) {
        console.error('Error listing super admins:', listError);
      } else {
        console.log('Current super admins:', listData);
      }
    } else {
      console.error(`❌ Failed to add super admin role: ${data.message}`);
      process.exit(1);
    }

    // Check user_roles table directly
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'superuser');

    if (roleError) {
      console.error('Error checking user_roles table:', roleError);
    } else {
      console.log(`Found ${roleData.length} superuser roles in user_roles table:`, roleData);
    }
  } catch (error) {
    console.error('Exception adding super admin:', error);
    process.exit(1);
  }
}

addTestSuperAdmin();
