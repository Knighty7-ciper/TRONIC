#!/bin/bash
# TRONIC Platform - Push All Fixes Script

echo "🚀 Pushing TRONIC deployment fixes..."

# Navigate to tronic directory
cd /workspace/tronic

# Add all modified files
echo "📁 Adding all modified files..."
git add .

# Commit with descriptive message
echo "💾 Committing changes..."
git commit -m "Fix UI freezing, redirect errors, and build dependencies

- Add timeout protection to all AuthContext API calls
- Remove invalid .netlify redirects from _redirects file  
- Add missing serverless-http dependency for Netlify Functions
- Fix build command to install all dependencies
- Ensure all API calls timeout safely to prevent UI freezing"

# Push to main branch
echo "⬆️  Pushing to repository..."
git push origin main

echo "✅ All fixes pushed successfully!"
echo ""
echo "📋 Changes pushed:"
echo "  ✓ AuthContext timeout protection"
echo "  ✓ Clean redirect configuration"
echo "  ✓ Build dependencies fixed"
echo "  ✓ UI freezing prevention"
echo ""
echo "🔄 Next: Redeploy on Netlify and test functionality"