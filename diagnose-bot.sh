#!/bin/bash

# Bot Diagnostic Script
# Helps troubleshoot why the Telegram bot isn't responding

BOT_TOKEN="8347142212:AAE0eB40ECYhH-ISYMnAsShdNbE5DZBiSBI"
WORKER_URL="https://botdata.tamim-b-m-ali.workers.dev"

echo "🔍 Telegram Bot Diagnostics"
echo "==========================="
echo ""

# 1. Check worker status
echo "1️⃣ Checking worker status..."
echo "Worker URL: $WORKER_URL"
WORKER_RESPONSE=$(curl -s "$WORKER_URL")
echo "Response: $WORKER_RESPONSE"

if echo "$WORKER_RESPONSE" | grep -q "\"version\":\"3.0.0\""; then
    echo "✅ Worker is running v3.0"
else
    echo "⚠️  Worker is NOT running v3.0 - needs redeployment!"
    echo "   Expected: JSON with version 3.0.0"
    echo "   Got: $WORKER_RESPONSE"
fi
echo ""

# 2. Check webhook info
echo "2️⃣ Checking webhook configuration..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo")
echo "$WEBHOOK_INFO" | python3 -m json.tool 2>/dev/null || echo "$WEBHOOK_INFO"

WEBHOOK_URL=$(echo "$WEBHOOK_INFO" | grep -oP '"url":"[^"]*"' | cut -d'"' -f4)
PENDING_COUNT=$(echo "$WEBHOOK_INFO" | grep -oP '"pending_update_count":\d+' | cut -d':' -f2)

if [ "$WEBHOOK_URL" = "${WORKER_URL}/webhook" ]; then
    echo "✅ Webhook URL is correct"
else
    echo "⚠️  Webhook URL mismatch!"
    echo "   Expected: ${WORKER_URL}/webhook"
    echo "   Got: $WEBHOOK_URL"
fi

if [ -n "$PENDING_COUNT" ] && [ "$PENDING_COUNT" -gt 0 ]; then
    echo "⚠️  $PENDING_COUNT pending updates - bot may not be processing messages!"
fi
echo ""

# 3. Test webhook endpoint directly
echo "3️⃣ Testing webhook endpoint..."
WEBHOOK_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${WORKER_URL}/webhook" \
    -H "Content-Type: application/json" \
    -d '{"message":{"chat":{"id":123},"from":{"id":123},"text":"/start"}}')

echo "Webhook endpoint HTTP status: $WEBHOOK_TEST"
if [ "$WEBHOOK_TEST" = "200" ]; then
    echo "✅ Webhook endpoint is responding"
else
    echo "⚠️  Webhook endpoint returned $WEBHOOK_TEST"
fi
echo ""

# 4. Get bot info
echo "4️⃣ Checking bot info..."
BOT_INFO=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe")
echo "$BOT_INFO" | python3 -m json.tool 2>/dev/null || echo "$BOT_INFO"

if echo "$BOT_INFO" | grep -q '"ok":true'; then
    BOT_USERNAME=$(echo "$BOT_INFO" | grep -oP '"username":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Bot token is valid: @$BOT_USERNAME"
else
    echo "❌ Bot token is invalid or API is unreachable"
fi
echo ""

# Summary
echo "📋 Summary"
echo "=========="
echo ""
echo "Current Issues:"

ISSUES=0

if ! echo "$WORKER_RESPONSE" | grep -q "\"version\":\"3.0.0\""; then
    ISSUES=$((ISSUES+1))
    echo "❌ $ISSUES. Worker is not running v3.0 code"
    echo "   FIX: Redeploy the worker in Cloudflare dashboard"
    echo "   Steps:"
    echo "   a. Go to Cloudflare dashboard > Workers & Pages"
    echo "   b. Click on 'botdata' worker"
    echo "   c. Click 'Deploy' or 'Quick edit' then 'Save and Deploy'"
    echo "   d. Wait 20-30 seconds for deployment to complete"
    echo ""
fi

if [ -n "$PENDING_COUNT" ] && [ "$PENDING_COUNT" -gt 0 ]; then
    ISSUES=$((ISSUES+1))
    echo "⚠️  $ISSUES. $PENDING_COUNT pending updates in queue"
    echo "   This might mean the bot crashed or stopped responding"
    echo "   After fixing other issues, these will be processed"
    echo ""
fi

if [ "$ISSUES" -eq 0 ]; then
    echo "✅ No obvious issues detected!"
    echo ""
    echo "If bot still doesn't respond, try:"
    echo "1. Send /start command in Telegram again"
    echo "2. Check Cloudflare worker logs for errors"
    echo "3. Verify environment variables are set: TELEGRAM_BOT_TOKEN, DEEPSEEK_API_KEY"
else
    echo "Fix the issues above and run this script again to verify."
fi

echo ""
echo "🔗 Useful Links:"
echo "• Cloudflare Workers: https://dash.cloudflare.com"
echo "• Bot: https://t.me/OneClickAnalyics_bot"
echo "• Worker URL: $WORKER_URL"
