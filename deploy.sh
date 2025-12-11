#!/bin/bash
# Railway Deployment Script - Fix and Deploy

echo "🚀 LoyaLoop Railway Deployment Script"
echo "======================================"
echo ""

# Navigate to project directory
cd /home/ali-gill/Documents/LoyaLoop

echo "📁 Current directory: $(pwd)"
echo ""

# Check if git repo exists
if [ ! -d .git ]; then
    echo "❌ Error: Not a git repository!"
    echo "   Please run: git init"
    exit 1
fi

echo "✅ Git repository found"
echo ""

# Verify all fixes are in place
echo "🔍 Verifying fixes..."

# Check backend ES modules
echo "   Checking backend package.json..."
if grep -q '"type": "module"' backend/package.json; then
    echo "   ✅ Backend has 'type: module'"
else
    echo "   ❌ Missing 'type: module' in backend/package.json"
    exit 1
fi

# Check for any remaining require statements
echo "   Checking for require() statements..."
REQUIRE_COUNT=$(grep -r "require(" backend/src/ 2>/dev/null | grep -v node_modules | wc -l)
if [ "$REQUIRE_COUNT" -eq 0 ]; then
    echo "   ✅ No require() statements found"
else
    echo "   ❌ Found $REQUIRE_COUNT require() statements"
    grep -rn "require(" backend/src/ 2>/dev/null | grep -v node_modules
    exit 1
fi

# Check frontend build script
echo "   Checking frontend build script..."
if grep -q "CI=false" frontend/package.json; then
    echo "   ✅ Frontend has CI=false in build script"
else
    echo "   ⚠️  Warning: CI=false not found in build script"
fi

# Check for Railway config files
echo "   Checking Railway config files..."
if [ -f "frontend/railway.json" ]; then
    echo "   ✅ frontend/railway.json exists"
else
    echo "   ❌ Missing frontend/railway.json"
fi

if [ -f "frontend/serve.json" ]; then
    echo "   ✅ frontend/serve.json exists"
else
    echo "   ❌ Missing frontend/serve.json"
fi

echo ""
echo "📝 Checking git status..."
git status --short

echo ""
echo "📦 Staging all changes..."
git add -A

echo ""
echo "📝 Current staged changes:"
git status --short

echo ""
echo "💾 Creating commit..."
git commit -m "Fix ES modules for Railway deployment

- Convert remaining require() to import in controllers
- Fix jwt imports in transactionController, eventController, promotionController
- Add Railway deployment configuration files
- Update CORS for production
- Fix frontend API URL configuration
- All files now ES module compatible

Fixes:
- Backend ES module conversion complete
- CORS configured for Railway origins
- Frontend 404 fixed with serve configuration
- Build errors resolved with CI=false

Ready for Railway deployment!"

if [ $? -eq 0 ]; then
    echo "✅ Commit created successfully!"
    echo ""
    echo "🚀 Ready to push to Railway!"
    echo ""
    echo "To deploy, run:"
    echo "   git push origin main"
    echo ""
    echo "Or run this script with --push flag:"
    echo "   bash deploy.sh --push"
else
    echo "⚠️  No changes to commit or commit failed"
    echo "   This might mean everything is already committed"
fi

# If --push flag is provided, push to origin
if [ "$1" == "--push" ]; then
    echo ""
    echo "🚀 Pushing to origin..."
    git push origin main

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Successfully pushed to Railway!"
        echo ""
        echo "🎉 Deployment initiated!"
        echo ""
        echo "📊 Monitor deployment at:"
        echo "   Frontend: https://railway.app/project/your-project-id"
        echo "   Backend:  https://railway.app/project/your-project-id"
        echo ""
        echo "🌐 Your URLs:"
        echo "   Frontend: https://loyaloop-production.up.railway.app/"
        echo "   Backend:  https://innovative-emotion-production-ec97.up.railway.app/"
    else
        echo ""
        echo "❌ Push failed! Please check:"
        echo "   1. Git remote is configured: git remote -v"
        echo "   2. You have push permissions"
        echo "   3. Branch name is correct (main or master)"
    fi
fi

echo ""
echo "✨ Done!"

