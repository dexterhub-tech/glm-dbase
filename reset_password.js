
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const email = 'ojidelawrence@gmail.com';
const newPassword = 'Password123!';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPassword() {
    try {
        console.log(`\n🔄 Attempting to reset password for ${email}...`);

        // First, get the user ID
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error(`❌ Error getting users: ${authError.message}`);
            return;
        }

        const user = authData.users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            console.error(`❌ User ${email} not found in auth.users`);
            return;
        }

        console.log(`✅ Found user: ${user.id}`);

        // Update password
        const { data, error } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (error) {
            console.error(`❌ Error updating password: ${error.message}`);
            return;
        }

        console.log(`✅ Successfully reset password for ${email}`);
        console.log(`🔑 New Password: ${newPassword}`);

    } catch (error) {
        console.error(`❌ Exception processing ${email}:`, error);
    }
}

resetPassword();
