@echo off
echo.
echo ========================================
echo   Phone Validation Fix
echo ========================================
echo.
echo This script will fix the phone validation
echo constraint to allow Nigerian phone numbers
echo starting with 0 (e.g., 07031098097)
echo.
pause

echo Running phone validation fix...
node run_phone_fix.js

echo.
echo ========================================
echo Fix completed!
echo.
echo If the automatic fix didn't work:
echo 1. Open your Supabase dashboard
echo 2. Go to SQL Editor  
echo 3. Run the contents of fix_phone_constraint.sql
echo ========================================
echo.
pause