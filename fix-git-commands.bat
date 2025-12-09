@echo off
echo 🔧 Fixing Git Remote Repository
echo ================================

echo.
echo 📋 Step 1: Removing existing remote...
git remote remove origin 2>nul
echo ✅ Existing remote removed (if it existed)

echo.
echo 📋 Step 2: Checking repository status...
git status

echo.
echo 📋 Step 3: Adding all files...
git add .

echo.
echo 📋 Step 4: Committing changes...
git commit -m "Initial commit - Gospel Labour Ministry CMS"

echo.
echo 🎯 NEXT STEPS:
echo ==============
echo 1. Go to https://github.com/gigscode (or your GitHub account)
echo 2. Click "New repository"
echo 3. Name it: glm_database
echo 4. Click "Create repository"
echo 5. Copy the repository URL
echo 6. Run one of these commands:
echo.
echo    For gigscode organization:
echo    git remote add origin https://github.com/gigscode/glm_database.git
echo.
echo    For your personal account:
echo    git remote add origin https://github.com/YOUR_USERNAME/glm_database.git
echo.
echo 7. Then run:
echo    git push -u origin main
echo.

pause