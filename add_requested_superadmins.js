/**
 * Script to add requested super admins
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Emails to make super admins
const emails = [
    'ojidelawrence@gmail.com',
    'gigsdev007@gmail.com',
    'dexter.tech@gmail.com'
];

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addSuperAdmin(email) {
    try {
        console.log(`\n🔄 Adding super admin role to ${email}...`);

        const { data, error } = await supabase.rpc('add_super_admin_by_email', {
            admin_email: email.toLowerCase().trim()
        });

        if (error) {
            console.error(`❌ Error adding super admin for ${email}:`, error);
            return false;
        }

        console.log(`📋 Result for ${email}:`, data);

        if (data && data.success) {
            console.log(`✅ Successfully added super admin role to ${email}`);
            return true;
        } else {
            console.error(`❌ Failed/Unknown response for ${email}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Exception adding super admin for ${email}:`, error);
        return false;
    }
}

async function run() {
    console.log('🚀 Starting to add super admins...');

    for (const email of emails) {
        await addSuperAdmin(email);
    }

    console.log('\nDone.');
}

run();
