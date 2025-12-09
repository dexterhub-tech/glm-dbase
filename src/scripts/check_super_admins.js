/**
 * Script to check super admins in the database
 *
 * Usage:
 * 1. Make sure you have the Supabase CLI installed
 * 2. Run: node src/scripts/check_super_admins.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';

// Initialize dotenv
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSuperAdmins() {
  try {
    console.log('Checking super admins in the database...');

    // 1. Check user_roles table for superuser roles
    console.log('\n1. Checking user_roles table for superuser roles:');
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'superuser');

    if (roleError) {
      console.error('Error querying user_roles table:', roleError);
    } else {
      console.log(`Found ${roleData.length} superuser roles in user_roles table:`);
      if (roleData.length > 0) {
        roleData.forEach(role => {
          console.log(`- User ID: ${role.user_id}, Role: ${role.role}, Created: ${role.created_at}`);
        });
      } else {
        console.log('No superuser roles found in user_roles table.');
      }
    }

    // 2. Check if the list_super_admins function works
    console.log('\n2. Testing list_super_admins function:');
    const { data: functionData, error: functionError } = await supabase.rpc('list_super_admins');

    if (functionError) {
      console.error('Error calling list_super_admins function:', functionError);
    } else {
      console.log('Function returned data:', functionData);
      if (Array.isArray(functionData)) {
        console.log(`Found ${functionData.length} super admins via function.`);
      } else if (functionData === null) {
        console.log('Function returned null.');
      } else {
        console.log('Function returned non-array data:', typeof functionData);
        if (typeof functionData === 'object') {
          console.log('Object keys:', Object.keys(functionData));
        }
      }
    }

    // 3. Get user details for any superuser roles
    if (roleData && roleData.length > 0) {
      console.log('\n3. Getting user details for superuser roles:');

      for (const role of roleData) {
        // Get user from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(role.user_id);

        if (userError) {
          console.error(`Error getting user ${role.user_id}:`, userError);
        } else if (userData) {
          console.log(`User ${role.user_id}:`, {
            email: userData.user.email,
            created_at: userData.user.created_at,
            last_sign_in: userData.user.last_sign_in_at
          });
        }

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', role.user_id)
          .single();

        if (profileError) {
          console.error(`Error getting profile for ${role.user_id}:`, profileError);
        } else if (profileData) {
          console.log(`Profile for ${role.user_id}:`, {
            full_name: profileData.full_name,
            email: profileData.email
          });
        }
      }
    }

    // 4. Direct SQL query to check the join
    console.log('\n4. Testing direct SQL query with joins:');
    const { data: joinData, error: joinError } = await supabase.rpc('debug_super_admin_query');

    if (joinError) {
      console.error('Error with direct SQL query:', joinError);
    } else {
      console.log('Direct SQL query result:', joinData);
    }

  } catch (error) {
    console.error('Exception in checkSuperAdmins:', error);
  }
}

// Create the debug function first
async function createDebugFunction() {
  try {
    const { error } = await supabase.rpc('create_debug_function');
    if (error) {
      console.log('Error creating debug function (may already exist):', error);

      // Create it directly
      const { error: sqlError } = await supabase.sql(`
        CREATE OR REPLACE FUNCTION public.debug_super_admin_query()
        RETURNS JSONB AS $$
        DECLARE
            result JSONB;
        BEGIN
            SELECT
                jsonb_agg(
                    jsonb_build_object(
                        'user_id', u.id,
                        'email', u.email,
                        'full_name', p.full_name,
                        'created_at', r.created_at
                    )
                ) INTO result
            FROM
                public.user_roles r
            JOIN
                auth.users u ON r.user_id = u.id
            LEFT JOIN
                public.profiles p ON u.id = p.id
            WHERE
                r.role = 'superuser';

            RETURN COALESCE(result, '[]'::jsonb);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        CREATE OR REPLACE FUNCTION public.create_debug_function()
        RETURNS VOID AS $$
        BEGIN
            -- This is just a placeholder
            RETURN;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);

      if (sqlError) {
        console.error('Error creating debug function via SQL:', sqlError);
      } else {
        console.log('Created debug function via SQL');
      }
    } else {
      console.log('Created debug function');
    }
  } catch (error) {
    console.error('Exception creating debug function:', error);
  }
}

// Run the checks
async function run() {
  await createDebugFunction();
  await checkSuperAdmins();
}

run();
