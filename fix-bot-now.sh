#!/bin/bash

# Quick Fix Script - Run this in your Codespaces terminal
# This will configure the webhook for your bot

BOT_TOKEN="8347142212:AAE0eB40ECYhH-ISYMnAsShdNbE5DZBiSBI"
WORKER_URL="https://botdata.tamim-b-m-ali.workers.dev/webhook"

echo "🔧 Quick Bot Fix"
echo "================"
echo ""

echo "Step 1: Setting webhook..."
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"${WORKER_URL}\"}" | python3 -m json.tool

echo ""
echo ""
echo "Step 2: Verifying webhook..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool

echo ""
echo ""
echo "✅ Done! Now follow these steps:"
echo ""
echo "1. Update Bot Token in Cloudflare:"
echo "   a. Go to: https://dash.cloudflare.com"
echo "   b. Navigate to: Workers & Pages > botdata > Settings > Variables"
echo "   c. Edit TELEGRAM_BOT_TOKEN to: ${BOT_TOKEN}"
echo "   d. Click Save"
echo ""
echo "2. Redeploy Worker (CRITICAL!):"
echo "   a. Stay in Cloudflare dashboard"
echo "   b. Go to Workers & Pages > botdata"
echo "   c. Click 'Quick edit'"
echo "   d. Click 'Save and Deploy' (don't change anything)"
echo "   e. Wait 30 seconds"
echo ""
echo "3. Test the bot:"
echo "   - Open: https://t.me/OneClickAnalyics_bot"
echo "   - Send: /start"
echo "   - You should get a response!"
echo ""
echo "4. Run diagnostic again to verify:"
echo "   ./diagnose-bot.sh"
