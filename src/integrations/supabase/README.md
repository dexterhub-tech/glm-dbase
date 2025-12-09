# Supabase Database Updates

This directory contains SQL scripts to update the Supabase database schema.

## How to Update the Database Schema

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of the SQL file you want to run
6. Click "Run" to execute the query

## Available SQL Scripts

- `schema_updates.sql`: Adds church_unit and assigned_pastor columns to the profiles table
- `profile_schema_update.sql`: Adds phone, genotype, and address columns to the profiles table
- `triggers.sql`: Creates or updates the trigger to handle new user signups

## Updating the Profile Schema

To add the new profile fields (phone, genotype, address), run the `profile_schema_update.sql` script in the Supabase SQL Editor.

After running the script, you should see the new columns in the profiles table.

## Updating the Trigger

After updating the schema, you should also update the trigger that handles new user signups. Run the `triggers.sql` script in the Supabase SQL Editor to update the trigger.

This will ensure that when new users sign up, their profile information is properly stored in the database.
