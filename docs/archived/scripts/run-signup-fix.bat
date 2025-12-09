@echo off
echo ========================================
echo GOSPEL LABOUR MINISTRY CMS - SIGNUP FIX
echo ========================================
echo.
echo This script will help you fix the signup database errors permanently.
echo.
echo INSTRUCTIONS:
echo 1. Open your Supabase dashboard
echo 2. Go to the SQL Editor
echo 3. Copy and paste the contents of 'supabase/permanent_signup_fix.sql'
echo 4. Run the script in Supabase
echo.
echo The file location is: %cd%\supabase\permanent_signup_fix.sql
echo.
echo After running the SQL script:
echo - Users will be able to sign up without database errors
echo - Profile and member records will be created automatically
echo - All necessary permissions will be granted
echo.
pause
echo.
echo Opening the SQL file for you to copy...
notepad supabase\permanent_signup_fix.sql
echo.
echo After you've run the SQL script in Supabase, test the signup process.
echo.
pause