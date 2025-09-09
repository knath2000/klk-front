#!/bin/bash
# build-verify.sh

echo "🧪 Verifying build configuration..."

# Check for multiple lockfiles
if [ -f "package-lock.json" ] && [ -f "pnpm-lock.yaml" ]; then
  echo "⚠️  Multiple lockfiles detected"
  exit 1
fi

# Test build
echo "📦 Testing production build..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi