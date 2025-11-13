#!/bin/bash

# Script to update the Telegram Bot Token in Cloudflare
# Use this after regenerating your bot token from @BotFather

NEW_TOKEN="8347142212:AAE0eB40ECYhH-ISYMnAsShdNbE5DZBiSBI"

echo "🔄 Updating Telegram Bot Token in Cloudflare"
echo "=============================================="
echo ""
echo "New Token: ${NEW_TOKEN:0:20}..."
echo ""

# Check if wrangler is available
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Please install it first:"
    echo "   npm install -g wrangler"
    exit 1
fi

# Check authentication
echo "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Not authenticated with Cloudflare"
    echo "Please login first:"
    echo "   wrangler login"
    exit 1
fi

echo "✅ Authenticated with Cloudflare"
echo ""

# Update the secret
echo "Updating TELEGRAM_BOT_TOKEN secret..."
echo "$NEW_TOKEN" | wrangler secret put TELEGRAM_BOT_TOKEN

if [ $? -eq 0 ]; then
    echo "✅ Bot token updated successfully!"
    echo ""
    echo "⚠️  IMPORTANT: You must redeploy the worker for changes to take effect!"
    echo ""
    echo "To redeploy, choose one option:"
    echo ""
    echo "Option 1 - Cloudflare Dashboard (Recommended):"
    echo "  1. Go to: https://dash.cloudflare.com"
    echo "  2. Navigate to: Workers & Pages > botdata"
    echo "  3. Click 'Quick edit' then 'Save and Deploy'"
    echo ""
    echo "Option 2 - Command Line:"
    echo "  wrangler deploy"
    echo ""
    echo "After redeployment, test the bot:"
    echo "  1. Open: https://t.me/OneClickAnalyics_bot"
    echo "  2. Send: /start"
    echo "  3. Verify you get a welcome message"
else
    echo "❌ Failed to update bot token"
    echo "Please try manually:"
    echo "  1. Run: wrangler secret put TELEGRAM_BOT_TOKEN"
    echo "  2. Paste token: $NEW_TOKEN"
    echo "  3. Press Enter"
fi
