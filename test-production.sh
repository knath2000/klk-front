#!/bin/bash
# test-production.sh

echo "🧪 Running Production Translation Tests"

# Set production env
export NEXT_PUBLIC_BACKEND_URL=https://klk-back-production.up.railway.app

# Build and start
npm run build
npm run start &

# Wait for server
sleep 5

# Test API proxy
echo "🔍 Testing API proxy..."
curl -X GET "http://localhost:3000/api/translate/supported-languages" -H "Content-Type: application/json"

# Test WebSocket (manual check required)
echo "🔌 Check browser console at http://localhost:3000/translate"
echo "   - Verify WebSocket connection"
echo "   - Test translation search"
echo "   - Check for 404 errors"

# Kill server
pkill -f "next start"