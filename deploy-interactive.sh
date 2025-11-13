#!/bin/bash

# Telegram Data Analysis Bot - Interactive Deployment Script
# This script helps you deploy your bot to Cloudflare Workers

set -e

echo "🚀 Telegram Data Analysis Bot - Deployment Wizard"
echo "=================================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "📦 Installing Wrangler CLI..."
    npm install -g wrangler
    echo "✅ Wrangler installed successfully!"
    echo ""
fi

# Check authentication
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  You need to login to Cloudflare first"
    echo "Opening browser for authentication..."
    wrangler login
    echo ""
else
    echo "✅ Already authenticated with Cloudflare"
    wrangler whoami
    echo ""
fi

# Get API keys from user
echo "🔑 Setting up API Keys"
echo "====================="
echo ""

# Telegram Bot Token
echo "📱 Telegram Bot Token Setup"
echo "----------------------------"
echo "Get your bot token from @BotFather on Telegram:"
echo "1. Open Telegram and search for @BotFather"
echo "2. Send /mybots and select your bot"
echo "3. Click 'API Token' to view/regenerate"
echo ""
echo "Enter your Telegram Bot Token (format: 1234567890:ABC...):"
read -s TELEGRAM_BOT_TOKEN
echo "Setting TELEGRAM_BOT_TOKEN..."
echo "$TELEGRAM_BOT_TOKEN" | wrangler secret put TELEGRAM_BOT_TOKEN
echo "✅ Telegram Bot Token configured"
echo ""

# DeepSeek API Key
echo "🤖 DeepSeek API Key Setup"
echo "-------------------------"
echo "Get your API key from platform.deepseek.com:"
echo "1. Go to https://platform.deepseek.com"
echo "2. Sign up or log in"
echo "3. Navigate to API Keys section"
echo "4. Create a new API key"
echo ""
echo "Enter your DeepSeek API Key (format: sk-...):"
read -s DEEPSEEK_API_KEY
echo "Setting DEEPSEEK_API_KEY..."
echo "$DEEPSEEK_API_KEY" | wrangler secret put DEEPSEEK_API_KEY
echo "✅ DeepSeek API Key configured"
echo ""

# Deploy
echo "🚀 Deploying to Cloudflare Workers..."
echo "======================================"
DEPLOY_OUTPUT=$(wrangler deploy 2>&1)
echo "$DEPLOY_OUTPUT"
echo ""

# Extract worker URL from deployment output
WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+\.workers\.dev' | head -1)

if [ -z "$WORKER_URL" ]; then
    echo "⚠️  Could not detect worker URL automatically"
    echo "Please enter your worker URL (e.g., https://yourbot.workers.dev):"
    read WORKER_URL
fi

echo "✅ Deployment successful!"
echo "Worker URL: $WORKER_URL"
echo ""

# Set Telegram webhook
echo "🔗 Setting up Telegram Webhook..."
echo "=================================="
WEBHOOK_URL="${WORKER_URL}/webhook"
echo "Webhook URL: $WEBHOOK_URL"

WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}")
echo "Response: $WEBHOOK_RESPONSE"

if echo "$WEBHOOK_RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook configured successfully!"
else
    echo "❌ Webhook configuration failed. Please check your bot token."
    exit 1
fi
echo ""

# Verify webhook
echo "🔍 Verifying webhook setup..."
WEBHOOK_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo")
echo "$WEBHOOK_INFO" | python3 -m json.tool 2>/dev/null || echo "$WEBHOOK_INFO"
echo ""

# Success message
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "✅ Your bot is now live and ready to use!"
echo ""
echo "📊 Next Steps:"
echo "1. Open Telegram and find your bot"
echo "2. Send /start to test the bot"
echo "3. Upload a CSV or Excel file to analyze"
echo ""
echo "🔧 Useful Commands:"
echo "• View logs: wrangler tail"
echo "• Check status: curl $WORKER_URL"
echo "• Redeploy: wrangler deploy"
echo ""
echo "📚 Documentation: See README.md for more information"
echo ""
echo "Happy analyzing! 📊✨"
