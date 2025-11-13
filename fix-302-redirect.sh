#!/bin/bash

echo "🔧 FIX FOR 302 REDIRECT ISSUE"
echo "=============================="
echo ""
echo "This script will fix the webhook 302 redirect issue"
echo ""

# Backup current index.js
echo "1. Creating backup of current index.js..."
cp index.js index-backup-$(date +%Y%m%d-%H%M%S).js

# Apply the fix
echo "2. Applying the fix..."
cp index-fixed.js index.js

echo "3. Deploying to Cloudflare Workers..."
wrangler deploy

echo ""
echo "4. Waiting for deployment to propagate (10 seconds)..."
sleep 10

echo ""
echo "5. Testing webhook endpoint..."
echo ""

# Test GET request (should return 200)
echo "Testing GET /webhook:"
curl -s -X GET https://botdata.tamim-b-m-ali.workers.dev/webhook | python3 -m json.tool 2>/dev/null || curl -s -X GET https://botdata.tamim-b-m-ali.workers.dev/webhook

echo ""
echo ""

# Test POST request (should return 200)
echo "Testing POST /webhook:"
curl -s -X POST https://botdata.tamim-b-m-ali.workers.dev/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  -o /dev/null -w "HTTP Status: %{http_code}\n"

echo ""
echo "6. Re-setting Telegram webhook..."
BOT_TOKEN="8347142212:AAE0eB40ECYhH-ISYMnAsShdNbE5DZBiSBI"
WORKER_URL="https://botdata.tamim-b-m-ali.workers.dev"

# Clear webhook first
echo "   Clearing old webhook..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook" > /dev/null

sleep 2

# Set new webhook
echo "   Setting new webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WORKER_URL}/webhook")
echo "$WEBHOOK_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$WEBHOOK_RESPONSE"

echo ""
echo "7. Verifying webhook status..."
sleep 2
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "$WEBHOOK_INFO" | python3 -m json.tool 2>/dev/null || echo "$WEBHOOK_INFO"

echo ""
echo "✅ Fix Applied!"
echo ""
echo "The webhook endpoint now:"
echo "  • Accepts GET requests (returns status JSON)"
echo "  • Accepts POST requests (processes Telegram updates)"
echo "  • Handles trailing slashes correctly"
echo "  • Returns proper status codes"
echo ""
echo "Your bot should now process messages correctly!"
echo "Test it by sending a message to your bot in Telegram."