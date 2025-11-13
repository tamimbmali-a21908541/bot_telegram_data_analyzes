# 📊 Telegram Data Analysis Bot v3.0

A powerful serverless Telegram bot that transforms your Excel and CSV files into comprehensive, visually-rich analysis reports with AI-powered insights.

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🚀 Core Capabilities
- **Multi-Sheet Excel Support** - Analyzes all sheets in Excel workbooks (.xlsx, .xls)
- **CSV Processing** - Full support for comma-separated values files
- **AI-Powered Insights** - DeepSeek AI generates business-focused analysis
- **Interactive Visualizations** - Beautiful charts using Chart.js
- **Automatic Pivot Tables** - Smart generation of meaningful data aggregations
- **Advanced Statistics** - Min, Max, Average, Median, Sum calculations
- **Progress Tracking** - Real-time updates during processing

### 📈 Analysis Features
- Automatic column type detection (categorical vs numeric)
- Multi-dimensional pivot table generation
- Cross-sheet analysis for Excel workbooks
- Statistical summaries with visual stat cards
- First 100 rows data preview per sheet

### 🎨 Report Features
- Professional HTML reports with modern design
- Interactive Chart.js visualizations (bar charts with avg/sum)
- Responsive layout that works on all devices
- Print-ready formatting
- Gradient backgrounds and modern UI
- Color-coded data presentation

### 🛡️ Security & Performance
- Rate limiting (10 requests per minute per user)
- File size validation (10MB limit)
- Non-blocking background processing
- Error recovery and user-friendly messages
- Cloudflare Workers edge deployment

### 🤖 Interactive Commands
- `/start` - Welcome message and bot introduction
- `/help` - Comprehensive help documentation
- `/features` - Detailed feature list
- `/about` - Bot information and specs
- `/stats` - User usage statistics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Telegram User                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Sends File/Command
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (Edge)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Webhook Handler                                      │  │
│  │  • Rate Limiting Check                                │  │
│  │  • Command Processing                                 │  │
│  │  • Immediate Response (200 OK)                        │  │
│  └──────────────────┬────────────────────────────────────┘  │
│                     │                                        │
│                     │ ctx.waitUntil (background)            │
│                     ▼                                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Background Processing Pipeline                       │  │
│  │  1. Download file from Telegram                       │  │
│  │  2. Parse (SheetJS for Excel, custom CSV parser)      │  │
│  │  3. Generate pivot tables                             │  │
│  │  4. Calculate statistics (min/max/avg/median)         │  │
│  │  5. Call DeepSeek AI for insights                     │  │
│  │  6. Generate HTML with Chart.js                       │  │
│  │  7. Send report back to user                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- [Cloudflare Workers account](https://workers.cloudflare.com/) (Free tier available)
- [Telegram Bot Token](https://t.me/botfather)
- [DeepSeek API Key](https://platform.deepseek.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/bot_telegram_data_analyzes.git
cd bot_telegram_data_analyzes
```

2. **Install Wrangler CLI**
```bash
npm install -g wrangler
```

3. **Configure Cloudflare Workers**
```bash
# Login to Cloudflare
wrangler login
```

4. **Set up environment secrets**
```bash
# Set Telegram Bot Token
wrangler secret put TELEGRAM_BOT_TOKEN
# Enter your token when prompted

# Set DeepSeek API Key
wrangler secret put DEEPSEEK_API_KEY
# Enter your API key when prompted
```

5. **Deploy the bot**
```bash
wrangler deploy
```

6. **Set up Telegram webhook**
```bash
# Replace YOUR_WORKER_URL with your deployed worker URL
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>/webhook"
```

## 🔧 Configuration

### `wrangler.toml`
```toml
name = "oneclickanalyzesbot"
main = "index.js"
compatibility_date = "2024-01-01"

# Secrets are configured via wrangler secret put
# TELEGRAM_BOT_TOKEN - Your Telegram bot token
# DEEPSEEK_API_KEY - Your DeepSeek API key
```

### Environment Variables
All sensitive credentials are stored as Cloudflare Workers secrets:
- `TELEGRAM_BOT_TOKEN` - Telegram Bot API token
- `DEEPSEEK_API_KEY` - DeepSeek AI API key

**⚠️ Security Note:** Never commit API keys or tokens to version control!

## 📖 Usage

### For End Users

1. **Start the bot** - Open [@YourBotName](https://t.me/YourBotName) on Telegram
2. **Send a command** - Type `/start` or `/help`
3. **Upload a file** - Send any Excel (.xlsx, .xls) or CSV file
4. **Wait for analysis** - The bot will show progress updates
5. **Download report** - Open the HTML file in any web browser

### File Requirements
- **Formats**: Excel (.xlsx, .xls), CSV (.csv)
- **Max Size**: 10 MB
- **Content**: Must contain at least one row of data
- **Excel**: All sheets with data will be analyzed

### Example Output

The bot generates a beautiful HTML report with:

```
📊 Comprehensive Data Analysis Report

📄 File: sales_data.xlsx
📅 Generated: 2025-11-13 10:30:15
📑 Sheets: 3
📊 Total Rows: 1,247

🤖 AI-Powered Insights
[Detailed AI analysis with executive summary,
key findings, trends, and recommendations]

📄 Sheet: Q1 Sales
├─ 📈 Statistical Summary (visual cards)
├─ 📊 Data Visualizations (Chart.js bar charts)
├─ 📋 Pivot Tables (detailed aggregations)
└─ 📑 Data Preview (first 100 rows)

📄 Sheet: Q2 Sales
[... similar sections ...]
```

## 🔨 Development

### Project Structure
```
bot_telegram_data_analyzes/
├── index.js           # Main bot code (999 lines)
├── wrangler.toml      # Cloudflare Workers config
├── package.json       # Dependencies
├── README.md          # This file
└── .gitignore        # Git ignore rules
```

### Key Functions

#### Core Processing
- `handleTelegramUpdate()` - Main webhook handler with rate limiting
- `processDocument()` - Background processing pipeline with progress updates
- `parseSpreadsheet()` - Multi-sheet Excel and CSV parser

#### Analysis
- `generatePivotTables()` - Auto-generates meaningful pivot tables
- `generateCompleteAnalysis()` - AI analysis with statistics
- `generateHTMLReport()` - Creates beautiful HTML with Chart.js

#### Utilities
- `checkRateLimit()` - In-memory rate limiting (10 req/min)
- `handleCommand()` - Command router for /start, /help, etc.
- `sendTelegramMessage()` - Markdown-enabled message sender

### Dependencies
- [SheetJS (xlsx)](https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs) - Excel parsing
- [Chart.js v4.4.0](https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js) - Data visualization
- [DeepSeek API](https://api.deepseek.com/v1/chat/completions) - AI insights

### Local Testing

```bash
# Start local development server
wrangler dev

# Test with ngrok for Telegram webhook
ngrok http 8787

# Set temporary webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<NGROK_URL>/webhook"
```

## 📊 Performance

- **Response Time**: < 200ms (webhook acknowledgment)
- **Processing Time**: 10-30 seconds (depending on file size and AI)
- **Cold Start**: ~100ms (Cloudflare Workers)
- **Throughput**: 10 requests/minute per user
- **Concurrency**: Unlimited (serverless scaling)

## 🔐 Security Best Practices

1. **Never commit secrets** - Use `wrangler secret put`
2. **Rate limiting** - Built-in protection against abuse
3. **File validation** - Size and format checking
4. **Error handling** - Graceful failures with user feedback
5. **Non-blocking** - Quick webhook responses prevent timeouts

## 🐛 Troubleshooting

### Bot not responding
```bash
# Check worker logs
wrangler tail

# Verify webhook is set
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### Analysis fails
- Check file size (< 10MB)
- Verify file format (Excel or CSV)
- Ensure file has data
- Check DeepSeek API quota

### Charts not showing
- Open HTML in modern browser (Chrome, Firefox, Safari, Edge)
- Check browser console for JavaScript errors
- Ensure internet connection (Chart.js loads from CDN)

## 🚀 Future Enhancements

### Planned Features (v4.0)
- [ ] Cloudflare D1 database for analysis history
- [ ] More chart types (line, pie, scatter plots)
- [ ] PDF export (actual PDF, not HTML)
- [ ] Comparison across multiple files
- [ ] Custom analysis parameters
- [ ] Scheduled reports
- [ ] Multi-language support
- [ ] Correlation analysis
- [ ] Advanced ML models

### Testing (Coming Soon)
- [ ] Unit tests with Vitest
- [ ] Integration tests
- [ ] E2E tests with real files
- [ ] CI/CD pipeline with GitHub Actions

## 📝 Changelog

### v3.0.0 (2025-11-13) - Current
- ✅ Multi-sheet Excel support
- ✅ Chart.js data visualizations
- ✅ Interactive command system
- ✅ Rate limiting
- ✅ Progress indicators
- ✅ Advanced statistics (median)
- ✅ Modern UI with gradients
- ✅ Better error handling

### v2.2 (2025-10-12)
- ✅ Non-blocking background processing
- ✅ Excel file support (.xlsx, .xls)
- ✅ Comprehensive analysis with AI

### v1.0 (2025-10-12)
- ✅ CSV support
- ✅ Basic pivot tables
- ✅ Simple HTML reports

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless platform
- [SheetJS](https://sheetjs.com/) - Excel parsing library
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [DeepSeek AI](https://www.deepseek.com/) - AI insights
- [Telegram Bot API](https://core.telegram.org/bots/api) - Bot framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/bot_telegram_data_analyzes/issues)
- **Telegram**: Use `/help` command in the bot
- **Documentation**: This README

## 🌟 Star History

If you find this project useful, please consider giving it a star on GitHub!

---

**Made with ❤️ using Cloudflare Workers & AI**

*Transforming data into insights, one file at a time* 📊✨
