#!/bin/bash

echo "🚀 Deploying Telegram Bot to Cloudflare Workers..."

# Check if CLOUDFLARE_API_TOKEN is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Please set CLOUDFLARE_API_TOKEN environment variable"
    echo "Run: export CLOUDFLARE_API_TOKEN=your_token_here"
    exit 1
fi

# Set secrets
echo "Setting up secrets..."
echo "8347142212:AAE0eB40ECYhH-ISYMnAsShdNbE5DZBiSBI" | npx wrangler secret put TELEGRAM_BOT_TOKEN
echo "sk-3a3738127d9b4b15808aa8adcc104662" | npx wrangler secret put DEEPSEEK_API_KEY

# Deploy
echo "Deploying worker..."
npx wrangler deploy

# Set webhook
echo "Setting up Telegram webhook..."
WORKER_URL="https://oneclickanalyzesbot.tamim-b-m-ali.workers.dev/webhook"
curl "https://api.telegram.org/bot8347142212:AAE0eB40ECYhH-ISYMnAsShdNbE5DZBiSBI/setWebhook?url=$WORKER_URL"

echo ""
echo "✅ Deployment complete!"
echo "Your bot is now running at: $WORKER_URL"
echo "Send a CSV file to your Telegram bot to test it!"
