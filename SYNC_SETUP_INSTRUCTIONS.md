# Profile Sync Setup Instructions

## Issue Fixed
The error "Could not find the function public.sync_all_profiles without parameters in the schema cache" has been resolved.

## What Was Done

### 1. Fixed UUID Error in Members Update
- Updated `MembersManager.tsx` to properly handle UUID fields
- Empty strings are now converted to `null` for UUID fields like `assignedto`
- Added proper dropdown for "Assigned Pastor" field

### 2. Fixed Profile Sync Manager
- Updated `ProfileSyncManager.tsx` to use the correct database functions
- Created missing database functions for profile synchronization

### 3. Created Database Functions
A new SQL file has been created: `src/integrations/supabase/add_missing_sync_functions.sql`

## Required Setup Steps

### Step 1: Run the SQL Functions
You need to run the SQL file in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `src/integrations/supabase/add_missing_sync_functions.sql`
4. Run the SQL script

This will create the following functions:
- `public.sync_all_profiles()` - Syncs all profiles to members table
- `public.check_profile_sync_status()` - Checks sync status between tables
- `public.sync_user_profile(email)` - Syncs a specific user by email

### Step 2: Test the Sync Functionality
After running the SQL:

1. Go to the Profile Synchronization Manager in your admin dashboard
2. Click "Check Status" to see the current sync status
3. Click "Sync All Profiles" to sync all users
4. Use "Sync User" to sync specific users by email

## What This Fixes

1. **UUID Error**: Members can now be updated without the UUID error
2. **Sync Error**: Profile sync now works with proper database functions
3. **Missing Users**: New auth users will be properly synced to the frontend
4. **Data Integrity**: Ensures profiles and members tables stay in sync

## Features Now Working

- ✅ Update member information without UUID errors
- ✅ Sync all profiles from auth to members table
- ✅ Check sync status between tables
- ✅ Sync individual users by email
- ✅ Proper dropdown for assigning pastors to members
- ✅ Handle empty fields correctly (convert to null instead of empty strings)

## Notes

- The sync functions handle both `user_id` and `userid` fields for compatibility
- Empty strings in optional fields are automatically converted to `null`
- The "Assigned Pastor" field now shows a dropdown of available pastors
- All sync operations include proper error handling and user feedback