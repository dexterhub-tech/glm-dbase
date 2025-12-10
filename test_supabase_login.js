
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const email = 'ojidelawrence@gmail.com';
const password = 'Password123!';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseLogin() {
    console.log('Testing direct Supabase Auth login...');
    console.log(`URL: ${supabaseUrl}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.log('❌ Supabase Login Failed');
        console.log('Error:', error.message);
    } else {
        console.log('✅ Supabase Login Success!');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
    }
}

testSupabaseLogin();
