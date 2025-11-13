#!/bin/bash

# Quick Webhook Setup Script
# Run this AFTER you've deployed the worker and set environment variables

BOT_TOKEN="8347142212:AAGN_lTlBiT0PewaLoAJ23NG2b2Y2rWxNyI"
WORKER_URL="https://botdata.tamim-b-m-ali.workers.dev"

echo "🔗 Setting up Telegram Webhook..."
echo "=================================="
echo ""
echo "Bot Token: ${BOT_TOKEN:0:15}..."
echo "Worker URL: $WORKER_URL"
echo ""

# Set webhook
echo "Setting webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WORKER_URL}/webhook")

echo "Response:"
echo "$WEBHOOK_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$WEBHOOK_RESPONSE"
echo ""

# Verify webhook
echo "Verifying webhook..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")

echo "Webhook Info:"
echo "$WEBHOOK_INFO" | python3 -m json.tool 2>/dev/null || echo "$WEBHOOK_INFO"
echo ""

# Check if webhook is set correctly
if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Success! Webhook configured successfully!"
    echo ""
    echo "🎉 Your bot is now live!"
    echo ""
    echo "📱 Test it:"
    echo "1. Open Telegram and find your bot"
    echo "2. Send /start"
    echo "3. Upload a CSV or Excel file"
    echo ""
    echo "🔍 Check worker status: curl $WORKER_URL"
    echo "📊 View logs: wrangler tail (from project directory)"
else
    echo "❌ Failed to set webhook. Please check:"
    echo "1. Environment variables are set in Cloudflare"
    echo "2. Worker is deployed to production"
    echo "3. Bot token is correct"
fi
