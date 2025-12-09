// Database diagnostic script to check current state
// Run with: node diagnose_database.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseDatabase() {
  console.log('🔍 Diagnosing database state...\n');

  try {
    // 1. Check if tables exist
    console.log('1. Checking table existence:');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'members']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
    } else {
      const tableNames = tables.map(t => t.table_name);
      console.log('✅ Existing tables:', tableNames);
      
      if (!tableNames.includes('profiles')) {
        console.log('❌ profiles table missing');
      }
      if (!tableNames.includes('members')) {
        console.log('❌ members table missing');
      }
    }

    // 2. Check profiles table structure
    console.log('\n2. Checking profiles table structure:');
    
    const { data: profileColumns, error: profileError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');

    if (profileError) {
      console.error('❌ Error checking profiles columns:', profileError.message);
    } else {
      console.log('✅ Profiles table columns:');
      profileColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 3. Check members table structure
    console.log('\n3. Checking members table structure:');
    
    const { data: memberColumns, error: memberError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'members');

    if (memberError) {
      console.error('❌ Error checking members columns:', memberError.message);
    } else {
      console.log('✅ Members table columns:');
      memberColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 4. Check if create_user_profile_safe function exists
    console.log('\n4. Checking create_user_profile_safe function:');
    
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_type')
      .eq('routine_schema', 'public')
      .eq('routine_name', 'create_user_profile_safe');

    if (funcError) {
      console.error('❌ Error checking functions:', funcError.message);
    } else if (functions.length === 0) {
      console.log('❌ create_user_profile_safe function does not exist');
    } else {
      console.log('✅ create_user_profile_safe function exists');
    }

    // 5. Test the function if it exists
    if (functions && functions.length > 0) {
      console.log('\n5. Testing create_user_profile_safe function:');
      
      try {
        const { data: testResult, error: testError } = await supabase.rpc('create_user_profile_safe', {
          user_id: '00000000-0000-0000-0000-000000000000',
          user_email: 'test@example.com',
          user_full_name: 'Test User',
          church_unit: null,
          phone: null
        });

        if (testError) {
          console.error('❌ Function test failed:', testError.message);
        } else {
          console.log('✅ Function test result:', testResult);
        }
      } catch (error) {
        console.error('❌ Function test exception:', error.message);
      }
    }

    // 6. Check RLS policies
    console.log('\n6. Checking RLS policies:');
    
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, permissive, roles, cmd, qual')
      .in('tablename', ['profiles', 'members']);

    if (policyError) {
      console.error('❌ Error checking policies:', policyError.message);
    } else {
      console.log('✅ RLS policies:');
      policies.forEach(policy => {
        console.log(`   - ${policy.tablename}.${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
      });
    }

    // 7. Test basic operations
    console.log('\n7. Testing basic operations:');
    
    // Test profile creation
    try {
      const testUserId = '11111111-1111-1111-1111-111111111111';
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert({
          id: testUserId,
          email: 'diagnostic@test.com',
          full_name: 'Diagnostic Test',
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Profile insert test failed:', insertError.message);
      } else {
        console.log('✅ Profile insert test passed');
        
        // Clean up test data
        await supabase.from('profiles').delete().eq('id', testUserId);
        await supabase.from('members').delete().eq('email', 'diagnostic@test.com');
      }
    } catch (error) {
      console.error('❌ Profile insert test exception:', error.message);
    }

    console.log('\n🎉 Database diagnosis complete!');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

diagnoseDatabase();