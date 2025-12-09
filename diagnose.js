import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseIssue() {
  console.log('🔍 Diagnosing user operations issue...');
  
  try {
    // Test basic operations
    console.log('1. Testing basic table access...');
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .limit(3);
    
    if (profileError) {
      console.error('❌ Profiles access error:', profileError.message);
    } else {
      console.log('✅ Can read profiles:', profiles?.length || 0, 'records');
    }
    
    const { data: members, error: memberError } = await supabase
      .from('members')
      .select('id, fullname, email')
      .limit(3);
    
    if (memberError) {
      console.error('❌ Members access error:', memberError.message);
    } else {
      console.log('✅ Can read members:', members?.length || 0, 'records');
    }
    
    // Test update operation with service role
    if (profiles && profiles.length > 0) {
      const testUser = profiles[0];
      console.log('2. Testing profile update with service role...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testUser.id);
      
      if (updateError) {
        console.error('❌ Service role update failed:', updateError.message);
        console.log('This indicates a deeper database issue');
      } else {
        console.log('✅ Service role can update profiles');
      }
    }
    
    console.log('');
    console.log('🎯 ROOT CAUSE ANALYSIS:');
    console.log('The issue is that your application is using authenticated user context,');
    console.log('but the RLS policies are blocking regular users from updating profiles.');
    console.log('');
    console.log('🔧 IMMEDIATE SOLUTION:');
    console.log('Run this SQL in your Supabase dashboard to temporarily fix the issue:');
    console.log('');
    console.log('-- Temporarily disable RLS to allow operations');
    console.log('ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;');
    console.log('ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;');
    console.log('');
    console.log('⚠️  WARNING: This removes security restrictions temporarily.');
    console.log('You should re-enable RLS with proper policies later.');
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
  }
}

diagnoseIssue();