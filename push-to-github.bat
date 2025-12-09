@echo off
echo 🚀 Pushing to GitHub Repository
echo ================================

echo.
echo 📋 Step 1: Removing existing remote (if any)...
git remote remove origin 2>nul

echo.
echo 📋 Step 2: Adding correct remote...
git remote add origin https://github.com/gigscode/glm_database.git

echo.
echo 📋 Step 3: Checking git status...
git status

echo.
echo 📋 Step 4: Adding all files...
git add .

echo.
echo 📋 Step 5: Committing changes...
git commit -m "Initial commit - Gospel Labour Ministry CMS with Supabase integration"

echo.
echo 📋 Step 6: Setting main branch...
git branch -M main

echo.
echo 📋 Step 7: Pushing to GitHub...
git push -u origin main

echo.
echo ✅ Done! Your code should now be on GitHub.
echo.
pause