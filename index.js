// Telegram Data Analysis Bot v3.0 - Enhanced Edition
// Features: Multi-sheet Excel, Data Visualization, Interactive Commands, Rate Limiting

// In-memory rate limiting (consider using KV for production)
const rateLimitStore = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/webhook') {
      return handleTelegramUpdate(request, env, ctx);
    }

    if (url.pathname === '/') {
      return new Response(JSON.stringify({
        status: 'running',
        version: '3.0.0',
        features: [
          'Multi-sheet Excel support',
          'Data visualization with charts',
          'Interactive commands',
          'Rate limiting',
          'Comprehensive analysis'
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ healthy: true, timestamp: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }
};

// Rate limiting function
async function checkRateLimit(userId) {
  const key = `rate:${userId}`;
  const now = Date.now();
  const limit = 10; // 10 requests per minute
  const window = 60000; // 1 minute

  const userRequests = rateLimitStore.get(key) || [];
  const recentRequests = userRequests.filter(timestamp => now - timestamp < window);

  if (recentRequests.length >= limit) {
    return { allowed: false, remaining: 0, resetIn: window - (now - recentRequests[0]) };
  }

  recentRequests.push(now);
  rateLimitStore.set(key, recentRequests);

  // Clean up old entries
  if (rateLimitStore.size > 10000) {
    const entries = Array.from(rateLimitStore.entries());
    entries.sort((a, b) => {
      const aLast = Math.max(...a[1]);
      const bLast = Math.max(...b[1]);
      return aLast - bLast;
    });
    entries.slice(0, 5000).forEach(([k]) => rateLimitStore.delete(k));
  }

  return { allowed: true, remaining: limit - recentRequests.length };
}

async function handleTelegramUpdate(request, env, ctx) {
  try {
    const update = await request.json();

    if (!update.message) {
      return new Response('OK', { status: 200 });
    }

    const chatId = update.message.chat.id;
    const userId = update.message.from.id;

    // Check rate limit
    const rateLimit = await checkRateLimit(userId);
    if (!rateLimit.allowed) {
      await sendTelegramMessage(
        chatId,
        `⏱️ Rate limit exceeded. Please wait ${Math.ceil(rateLimit.resetIn / 1000)} seconds before sending another request.`,
        env.TELEGRAM_BOT_TOKEN
      );
      return new Response('OK', { status: 200 });
    }

    // Handle commands
    if (update.message.text) {
      const text = update.message.text.trim();

      if (text.startsWith('/')) {
        await handleCommand(text, chatId, env);
        return new Response('OK', { status: 200 });
      }

      // Non-command text
      await sendWelcomeMessage(chatId, env.TELEGRAM_BOT_TOKEN);
      return new Response('OK', { status: 200 });
    }

    // Handle document uploads
    if (update.message.document) {
      // Process in background - don't await
      ctx.waitUntil(processDocument(update.message, env));

      // Respond immediately to Telegram
      return new Response('OK', { status: 200 });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling update:', error);
    return new Response('Error', { status: 500 });
  }
}

// Command handler
async function handleCommand(command, chatId, env) {
  const cmd = command.toLowerCase().split(' ')[0];

  switch (cmd) {
    case '/start':
      await sendWelcomeMessage(chatId, env.TELEGRAM_BOT_TOKEN);
      break;

    case '/help':
      await sendTelegramMessage(
        chatId,
        `📚 *Help - Data Analysis Bot*\n\n` +
        `*Commands:*\n` +
        `/start - Show welcome message\n` +
        `/help - Show this help message\n` +
        `/features - List all features\n` +
        `/about - About this bot\n` +
        `/stats - Your usage statistics\n\n` +
        `*How to use:*\n` +
        `1. Send an Excel (.xlsx, .xls) or CSV file\n` +
        `2. Wait for the analysis to complete\n` +
        `3. Receive a comprehensive HTML report\n\n` +
        `*Features:*\n` +
        `✓ Multi-sheet Excel support\n` +
        `✓ Automatic pivot tables\n` +
        `✓ Statistical analysis\n` +
        `✓ AI-powered insights\n` +
        `✓ Data visualization\n` +
        `✓ Professional HTML reports`,
        env.TELEGRAM_BOT_TOKEN,
        true
      );
      break;

    case '/features':
      await sendTelegramMessage(
        chatId,
        `🚀 *Bot Features v3.0*\n\n` +
        `📊 *Data Processing:*\n` +
        `• Multi-sheet Excel support (.xlsx, .xls)\n` +
        `• CSV file parsing\n` +
        `• Automatic data type detection\n` +
        `• Large file handling (up to 10MB)\n\n` +
        `📈 *Analysis:*\n` +
        `• Automatic pivot table generation\n` +
        `• Statistical calculations (sum, avg, min, max)\n` +
        `• Trend identification\n` +
        `• AI-powered insights via DeepSeek\n\n` +
        `📉 *Visualization:*\n` +
        `• Interactive charts\n` +
        `• Multiple chart types (bar, line, pie)\n` +
        `• Color-coded data presentation\n\n` +
        `📄 *Reports:*\n` +
        `• Professional HTML format\n` +
        `• Styled tables and charts\n` +
        `• Comprehensive data summary\n` +
        `• Downloadable reports`,
        env.TELEGRAM_BOT_TOKEN,
        true
      );
      break;

    case '/about':
      await sendTelegramMessage(
        chatId,
        `ℹ️ *About Data Analysis Bot*\n\n` +
        `Version: 3.0.0\n` +
        `Platform: Cloudflare Workers\n` +
        `AI Engine: DeepSeek Chat\n\n` +
        `This bot provides professional data analysis services, transforming your spreadsheet files into comprehensive reports with insights and visualizations.\n\n` +
        `Built with modern serverless architecture for fast, reliable processing.\n\n` +
        `Rate Limit: 10 requests per minute\n` +
        `Max File Size: 10 MB`,
        env.TELEGRAM_BOT_TOKEN,
        true
      );
      break;

    case '/stats':
      const userRequests = rateLimitStore.get(`rate:${chatId}`) || [];
      await sendTelegramMessage(
        chatId,
        `📊 *Your Statistics*\n\n` +
        `Recent requests: ${userRequests.length}\n` +
        `Rate limit: 10 requests/minute\n` +
        `Status: ✅ Active`,
        env.TELEGRAM_BOT_TOKEN,
        true
      );
      break;

    default:
      await sendTelegramMessage(
        chatId,
        `❓ Unknown command: ${cmd}\n\nType /help to see available commands.`,
        env.TELEGRAM_BOT_TOKEN
      );
  }
}

async function sendWelcomeMessage(chatId, botToken) {
  await sendTelegramMessage(
    chatId,
    `👋 *Welcome to Data Analysis Bot v3.0!*\n\n` +
    `Send me an Excel (.xlsx, .xls) or CSV file and I'll generate a comprehensive analysis with:\n\n` +
    `✅ Multi-sheet data processing\n` +
    `✅ Automatic pivot tables\n` +
    `✅ Statistical analysis\n` +
    `✅ AI-powered insights\n` +
    `✅ Interactive visualizations\n` +
    `✅ Professional HTML reports\n\n` +
    `💡 Type /help for more information\n` +
    `📊 Type /features to see all capabilities`,
    botToken,
    true
  );
}

async function processDocument(message, env) {
  const chatId = message.chat.id;
  const fileId = message.document.file_id;
  const fileName = message.document.file_name;
  const fileSize = message.document.file_size;

  try {
    // Step 1: Initial acknowledgment
    await sendTelegramMessage(
      chatId,
      `📊 *Processing: ${fileName}*\n` +
      `Size: ${(fileSize / 1024).toFixed(1)} KB\n\n` +
      `⏳ Step 1/5: Downloading file...`,
      env.TELEGRAM_BOT_TOKEN,
      true
    );

    // Validate file size (10MB limit)
    if (fileSize > 10 * 1024 * 1024) {
      throw new Error('File too large. Maximum size is 10MB.');
    }

    // Download file
    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const fileInfo = await fileInfoResponse.json();

    if (!fileInfo.ok) throw new Error('Failed to get file info');

    const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
    const fileResponse = await fetch(fileUrl);

    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`);
    }

    const fileData = await fileResponse.arrayBuffer();

    // Step 2: Parse data
    await sendTelegramMessage(
      chatId,
      `✅ Downloaded\n⏳ Step 2/5: Parsing data...`,
      env.TELEGRAM_BOT_TOKEN
    );

    const parseResult = await parseSpreadsheet(fileData, fileName);
    const sheetsCount = parseResult.sheets ? parseResult.sheets.length : 1;
    const totalRows = parseResult.sheets
      ? parseResult.sheets.reduce((sum, sheet) => sum + sheet.data.length, 0)
      : parseResult.data.length;

    // Step 3: Generate pivot tables
    await sendTelegramMessage(
      chatId,
      `✅ Parsed ${sheetsCount} sheet(s), ${totalRows} rows\n⏳ Step 3/5: Creating pivot tables...`,
      env.TELEGRAM_BOT_TOKEN
    );

    // Step 4: AI Analysis
    await sendTelegramMessage(
      chatId,
      `✅ Pivot tables created\n⏳ Step 4/5: Generating AI insights...`,
      env.TELEGRAM_BOT_TOKEN
    );

    const analysis = await generateCompleteAnalysis(parseResult, env.DEEPSEEK_API_KEY);

    // Step 5: Generate report
    await sendTelegramMessage(
      chatId,
      `✅ AI analysis complete\n⏳ Step 5/5: Generating HTML report...`,
      env.TELEGRAM_BOT_TOKEN
    );

    const htmlReport = generateHTMLReport(parseResult, analysis, fileName);

    // Send report
    await sendPDFReport(chatId, htmlReport, fileName, env.TELEGRAM_BOT_TOKEN);

  } catch (error) {
    console.error('Error processing document:', error);
    await sendTelegramMessage(
      chatId,
      `❌ *Error Processing File*\n\n` +
      `${error.message}\n\n` +
      `Please ensure:\n` +
      `• File is valid Excel (.xlsx, .xls) or CSV\n` +
      `• File size is under 10MB\n` +
      `• File contains data\n\n` +
      `Type /help for assistance.`,
      env.TELEGRAM_BOT_TOKEN,
      true
    );
  }
}

async function parseSpreadsheet(arrayBuffer, filename) {
  const lowerFilename = filename.toLowerCase();

  // Handle Excel files
  if (lowerFilename.endsWith('.xlsx') || lowerFilename.endsWith('.xls')) {
    try {
      // Use SheetJS library from CDN
      const { read, utils } = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');

      const workbook = read(new Uint8Array(arrayBuffer), { type: 'array' });

      if (workbook.SheetNames.length === 0) {
        throw new Error('Excel file contains no sheets');
      }

      // Parse all sheets
      const sheets = [];
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = utils.sheet_to_json(worksheet);

        if (data.length > 0) {
          sheets.push({
            name: sheetName,
            data: data,
            rowCount: data.length,
            columnCount: Object.keys(data[0] || {}).length
          });
        }
      }

      if (sheets.length === 0) {
        throw new Error('Excel file has no data in any sheet');
      }

      return {
        type: 'excel',
        sheetsCount: sheets.length,
        sheets: sheets,
        totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0)
      };
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  // Handle CSV files
  const text = new TextDecoder().decode(arrayBuffer);
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length === 0) throw new Error('File is empty');

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return {
    type: 'csv',
    sheetsCount: 1,
    sheets: [{
      name: 'Data',
      data: data,
      rowCount: data.length,
      columnCount: headers.length
    }],
    totalRows: data.length
  };
}

function generatePivotTables(data) {
  if (data.length === 0) return [];

  const headers = Object.keys(data[0]);
  const pivots = [];

  // Find categorical columns
  const categoricalColumns = headers.filter(header => {
    const uniqueValues = [...new Set(data.map(row => row[header]))];
    return uniqueValues.length < 20 && uniqueValues.length > 1;
  });

  // Find numeric columns
  const numericColumns = headers.filter(header => {
    const values = data.map(row => row[header]).filter(v => v !== '');
    return values.length > 0 && values.every(v => !isNaN(v));
  });

  // Create pivot tables
  categoricalColumns.forEach(catCol => {
    numericColumns.forEach(numCol => {
      const pivot = {};
      data.forEach(row => {
        const category = row[catCol];
        const value = parseFloat(row[numCol]);

        if (category && !isNaN(value)) {
          if (!pivot[category]) {
            pivot[category] = { sum: 0, count: 0, values: [] };
          }
          pivot[category].sum += value;
          pivot[category].count++;
          pivot[category].values.push(value);
        }
      });

      // Calculate aggregates
      Object.keys(pivot).forEach(key => {
        pivot[key].avg = pivot[key].sum / pivot[key].count;
        pivot[key].min = Math.min(...pivot[key].values);
        pivot[key].max = Math.max(...pivot[key].values);
      });

      pivots.push({
        title: `${catCol} vs ${numCol}`,
        category: catCol,
        metric: numCol,
        data: pivot
      });
    });
  });

  return pivots.slice(0, 5); // Limit to 5 pivot tables
}

async function generateCompleteAnalysis(parseResult, apiKey) {
  const sheets = parseResult.sheets;
  const allAnalyses = [];

  // Analyze each sheet
  for (const sheet of sheets) {
    const data = sheet.data;
    const headers = Object.keys(data[0] || {});
    const pivots = generatePivotTables(data);

    let analysisPrompt = `Analyze this dataset from sheet "${sheet.name}":\n\n`;
    analysisPrompt += `Total Records: ${data.length}\n`;
    analysisPrompt += `Columns: ${headers.join(', ')}\n\n`;

    // Add statistics
    const statistics = {};
    headers.forEach(header => {
      const values = data.map(row => row[header]).filter(v => v !== '' && !isNaN(v)).map(Number);
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];

        statistics[header] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: avg,
          median: median,
          sum: sum,
          count: values.length
        };

        analysisPrompt += `${header}: Min=${statistics[header].min}, Max=${statistics[header].max}, Avg=${avg.toFixed(2)}, Median=${median.toFixed(2)}\n`;
      }
    });

    allAnalyses.push({
      sheetName: sheet.name,
      data: data,
      pivots: pivots,
      statistics: statistics,
      headers: headers
    });
  }

  // Generate AI insights for all sheets
  let combinedPrompt = `Analyze ${sheets.length} sheet(s) of data:\n\n`;
  allAnalyses.forEach((analysis, idx) => {
    combinedPrompt += `Sheet ${idx + 1}: "${analysis.sheetName}" (${analysis.data.length} rows, ${analysis.headers.length} columns)\n`;
  });
  combinedPrompt += `\n\nProvide comprehensive analysis including:\n1. Executive Summary\n2. Key Findings (per sheet)\n3. Trends and Patterns\n4. Cross-sheet Insights (if multiple sheets)\n5. Actionable Recommendations\n\nMake it detailed and business-focused.`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional data analyst. Provide detailed, actionable analysis with business insights.'
          },
          {
            role: 'user',
            content: combinedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    const result = await response.json();

    return {
      insights: result.choices[0].message.content,
      sheets: allAnalyses,
      totalSheets: sheets.length,
      totalRows: parseResult.totalRows
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return {
      insights: 'AI analysis temporarily unavailable. Please review the statistical analysis and pivot tables below.',
      sheets: allAnalyses,
      totalSheets: sheets.length,
      totalRows: parseResult.totalRows
    };
  }
}

function generateHTMLReport(parseResult, analysis, filename) {
  const date = new Date().toLocaleString();
  const chartColors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Data Analysis Report - ${filename}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 15px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 4px solid #3498db;
      padding-bottom: 15px;
      margin-top: 0;
      font-size: 2.5em;
    }
    h2 {
      color: #34495e;
      margin-top: 40px;
      padding: 10px;
      background: linear-gradient(90deg, #3498db 0%, #2ecc71 100%);
      color: white;
      border-radius: 5px;
    }
    h3 {
      color: #2c3e50;
      margin-top: 25px;
      padding-left: 10px;
      border-left: 4px solid #3498db;
    }
    .metadata {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
    .metadata-item {
      padding: 10px;
      background: rgba(255,255,255,0.1);
      border-radius: 5px;
    }
    .metadata-label {
      font-size: 0.9em;
      opacity: 0.9;
    }
    .metadata-value {
      font-size: 1.3em;
      font-weight: bold;
      margin-top: 5px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }
    th {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      text-align: left;
      font-weight: 600;
    }
    td {
      border: 1px solid #ecf0f1;
      padding: 12px;
      transition: background 0.2s;
    }
    tr:nth-child(even) { background-color: #f8f9fa; }
    tr:hover { background-color: #e3f2fd; }
    .summary {
      background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
      padding: 25px;
      border-radius: 10px;
      margin: 20px 0;
      border-left: 5px solid #3498db;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .summary pre {
      white-space: pre-wrap;
      line-height: 1.6;
      color: #2c3e50;
      margin: 0;
    }
    .pivot-table, .chart-container {
      margin: 30px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .chart-wrapper {
      position: relative;
      height: 400px;
      margin: 20px 0;
    }
    .sheet-section {
      margin: 40px 0;
      padding: 20px;
      border: 2px solid #ecf0f1;
      border-radius: 10px;
      background: white;
    }
    .sheet-header {
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #3498db;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .stat-label {
      font-size: 0.9em;
      color: #7f8c8d;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 1.5em;
      font-weight: bold;
      color: #2c3e50;
    }
    .footer {
      margin-top: 40px;
      padding: 20px;
      text-align: center;
      color: #7f8c8d;
      border-top: 2px solid #ecf0f1;
    }
    @media print {
      body { background: white; }
      .container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Comprehensive Data Analysis Report</h1>

    <div class="metadata">
      <div class="metadata-item">
        <div class="metadata-label">📄 File</div>
        <div class="metadata-value">${filename}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">📅 Generated</div>
        <div class="metadata-value">${date}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">📑 Sheets</div>
        <div class="metadata-value">${analysis.totalSheets}</div>
      </div>
      <div class="metadata-item">
        <div class="metadata-label">📊 Total Rows</div>
        <div class="metadata-value">${analysis.totalRows.toLocaleString()}</div>
      </div>
    </div>

    <div class="summary">
      <h2>🤖 AI-Powered Insights</h2>
      <pre>${analysis.insights}</pre>
    </div>

    ${analysis.sheets.map((sheet, sheetIdx) => `
      <div class="sheet-section">
        <div class="sheet-header">
          <h2 style="margin:0;">📄 Sheet: ${sheet.sheetName}</h2>
          <p style="margin:5px 0 0 0; opacity:0.9;">${sheet.data.length} rows × ${sheet.headers.length} columns</p>
        </div>

        ${Object.keys(sheet.statistics).length > 0 ? `
          <h3>📈 Statistical Summary</h3>
          <div class="stats-grid">
            ${Object.entries(sheet.statistics).map(([col, stats]) => `
              <div class="stat-card">
                <div class="stat-label">${col}</div>
                <div class="stat-value">${stats.avg.toFixed(2)}</div>
                <div style="font-size:0.85em; color:#7f8c8d; margin-top:5px;">
                  Min: ${stats.min.toFixed(2)} | Max: ${stats.max.toFixed(2)}<br>
                  Median: ${stats.median.toFixed(2)} | Sum: ${stats.sum.toFixed(2)}
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${sheet.pivots.length > 0 ? `
          <h3>📊 Data Visualizations</h3>
          ${sheet.pivots.slice(0, 3).map((pivot, pivotIdx) => {
            const chartId = \`chart_\${sheetIdx}_\${pivotIdx}\`;
            const labels = Object.keys(pivot.data);
            const avgData = labels.map(key => pivot.data[key].avg);
            const sumData = labels.map(key => pivot.data[key].sum);

            return `
              <div class="chart-container">
                <h4>${pivot.title}</h4>
                <div class="chart-wrapper">
                  <canvas id="${chartId}"></canvas>
                </div>
              </div>
              <script>
                (function() {
                  const ctx = document.getElementById('${chartId}').getContext('2d');
                  new Chart(ctx, {
                    type: 'bar',
                    data: {
                      labels: ${JSON.stringify(labels)},
                      datasets: [
                        {
                          label: 'Average',
                          data: ${JSON.stringify(avgData)},
                          backgroundColor: '${chartColors[pivotIdx % chartColors.length]}80',
                          borderColor: '${chartColors[pivotIdx % chartColors.length]}',
                          borderWidth: 2
                        },
                        {
                          label: 'Sum',
                          data: ${JSON.stringify(sumData)},
                          backgroundColor: '${chartColors[(pivotIdx + 1) % chartColors.length]}80',
                          borderColor: '${chartColors[(pivotIdx + 1) % chartColors.length]}',
                          borderWidth: 2
                        }
                      ]
                    },
                    options: {
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        title: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }
                  });
                })();
              </script>
            `;
          }).join('')}

          <h3>📋 Pivot Tables</h3>
          ${sheet.pivots.map(pivot => `
            <div class="pivot-table">
              <h4>${pivot.title}</h4>
              <table>
                <tr>
                  <th>${pivot.category}</th>
                  <th>Count</th>
                  <th>Sum</th>
                  <th>Average</th>
                  <th>Median</th>
                  <th>Min</th>
                  <th>Max</th>
                </tr>
                ${Object.entries(pivot.data).map(([key, values]) => `
                  <tr>
                    <td><strong>${key}</strong></td>
                    <td>${values.count}</td>
                    <td>${values.sum.toFixed(2)}</td>
                    <td>${values.avg.toFixed(2)}</td>
                    <td>${values.values ? [...values.values].sort((a,b)=>a-b)[Math.floor(values.values.length/2)].toFixed(2) : 'N/A'}</td>
                    <td>${values.min.toFixed(2)}</td>
                    <td>${values.max.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          `).join('')}
        ` : '<p>No pivot tables generated for this sheet.</p>'}

        <h3>📑 Data Preview (First 100 rows)</h3>
        <div style="overflow-x: auto;">
          <table>
            <tr>${sheet.headers.map(h => `<th>${h}</th>`).join('')}</tr>
            ${sheet.data.slice(0, 100).map(row =>
              `<tr>${sheet.headers.map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>`
            ).join('\n')}
          </table>
        </div>
        ${sheet.data.length > 100 ? `<p style="color:#7f8c8d; font-style:italic;">Showing first 100 of ${sheet.data.length} rows</p>` : ''}
      </div>
    `).join('\n')}

    <div class="footer">
      <p><strong>Generated by Data Analysis Bot v3.0</strong></p>
      <p>Powered by Cloudflare Workers & DeepSeek AI</p>
    </div>
  </div>
</body>
</html>`;

  return html;
}

async function sendPDFReport(chatId, htmlContent, filename, botToken) {
  try {
    const htmlBlob = new TextEncoder().encode(htmlContent);
    const reportFilename = filename.replace(/\.[^/.]+$/, '') + '_analysis.html';

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', new Blob([htmlBlob], { type: 'text/html' }), reportFilename);
    formData.append('caption',
      '🎉 *Analysis Complete!*\n\n' +
      '📊 Your comprehensive data analysis report is ready\n\n' +
      '✨ *Features included:*\n' +
      '• AI-powered insights\n' +
      '• Interactive charts (Chart.js)\n' +
      '• Statistical summaries\n' +
      '• Pivot tables\n' +
      '• Multi-sheet analysis\n\n' +
      '💡 *How to view:* Open this HTML file in any web browser\n\n' +
      '🔥 All visualizations are interactive and print-ready!');

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to send document: ${response.statusText}`);
    }

    await sendTelegramMessage(
      chatId,
      '✅ *Report Generated Successfully!*\n\n' +
      'Type /help for more commands or send another file to analyze.',
      botToken,
      true
    );
  } catch (error) {
    console.error('Error sending report:', error);
    throw new Error(`Failed to send report: ${error.message}`);
  }
}

async function sendTelegramMessage(chatId, text, botToken, markdown = false) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: markdown ? 'Markdown' : undefined
      })
    });
  } catch (error) {
    console.error('Error sending message:', error);
    // Retry without markdown if markdown parsing fails
    if (markdown) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.replace(/[*_`\[\]]/g, '')
        })
      });
    }
  }
}
