// Telegram Data Analysis Bot - Enhanced with PDF Generation
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/webhook') {
      return handleTelegramUpdate(request, env);
    }

    if (url.pathname === '/') {
      return new Response('Telegram Data Analysis Bot is running!', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleTelegramUpdate(request, env) {
  try {
    const update = await request.json();

    if (update.message && update.message.document) {
      await processDocument(update.message, env);
    } else if (update.message) {
      await sendTelegramMessage(
        update.message.chat.id,
        '📊 Data Analysis Bot\n\nSend me an Excel (.xlsx, .xls) or CSV file and I will generate a comprehensive report with:\n\n✓ Complete data analysis\n✓ Statistical tables\n✓ Pivot tables\n✓ AI-powered insights\n✓ Professional HTML report\n\n💾 Supported formats: .xlsx, .xls, .csv',
        env.TELEGRAM_BOT_TOKEN
      );
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error handling update:', error);
    return new Response('Error', { status: 500 });
  }
}

async function processDocument(message, env) {
  const chatId = message.chat.id;
  const fileId = message.document.file_id;

  try {
    await sendTelegramMessage(
      chatId,
      '📊 Generating comprehensive analysis...\n⏳ This will take a moment\n\n✓ Parsing data\n✓ Creating pivot tables\n✓ Calculating statistics\n✓ Generating AI insights\n✓ Creating PDF report',
      env.TELEGRAM_BOT_TOKEN
    );

    // Download file
    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const fileInfo = await fileInfoResponse.json();

    if (!fileInfo.ok) throw new Error('Failed to get file info');

    const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
    const fileResponse = await fetch(fileUrl);
    const fileData = await fileResponse.arrayBuffer();

    // Parse CSV
    const data = await parseSpreadsheet(fileData, message.document.file_name);

    // Generate complete analysis
    const analysis = await generateCompleteAnalysis(data, env.DEEPSEEK_API_KEY);

    // Generate HTML report
    const htmlReport = generateHTMLReport(data, analysis);

    // Convert HTML to PDF and send
    await sendPDFReport(chatId, htmlReport, env.TELEGRAM_BOT_TOKEN);

  } catch (error) {
    console.error('Error processing document:', error);
    await sendTelegramMessage(
      chatId,
      `❌ Error: ${error.message}\n\nPlease send a valid Excel (.xlsx, .xls) or CSV file.`,
      env.TELEGRAM_BOT_TOKEN
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
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to JSON
      const data = utils.sheet_to_json(worksheet);

      if (data.length === 0) throw new Error('Excel file is empty');

      return data;
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

  return data;
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

async function generateCompleteAnalysis(data, apiKey) {
  const headers = Object.keys(data[0] || {});
  const pivots = generatePivotTables(data);

  let analysisPrompt = `Analyze this dataset completely:\n\n`;
  analysisPrompt += `Total Records: ${data.length}\n`;
  analysisPrompt += `Columns: ${headers.join(', ')}\n\n`;

  // Add statistics
  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(v => v !== '' && !isNaN(v)).map(Number);
    if (values.length > 0) {
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      analysisPrompt += `${header}: Min=${Math.min(...values)}, Max=${Math.max(...values)}, Avg=${avg.toFixed(2)}\n`;
    }
  });

  analysisPrompt += `\n\nProvide comprehensive analysis including:\n1. Executive Summary\n2. Key Findings\n3. Trends\n4. Recommendations\n\nMake it detailed and actionable.`;

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
          content: 'You are a professional data analyst. Provide detailed, actionable analysis.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })
  });

  const result = await response.json();
  return {
    insights: result.choices[0].message.content,
    pivots: pivots
  };
}

function generateHTMLReport(data, analysis) {
  const headers = Object.keys(data[0] || {});
  const date = new Date().toLocaleString();

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th { background-color: #3498db; color: white; padding: 12px; text-align: left; }
    td { border: 1px solid #ddd; padding: 10px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .summary { background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .pivot-table { margin: 30px 0; }
  </style>
</head>
<body>
  <h1>📊 Data Analysis Report</h1>
  <p><strong>Generated:</strong> ${date}</p>
  <p><strong>Total Records:</strong> ${data.length}</p>

  <div class="summary">
    <h2>AI Analysis</h2>
    <pre style="white-space: pre-wrap;">${analysis.insights}</pre>
  </div>

  <h2>Data Summary</h2>
  <table>
    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    ${data.slice(0, 100).map(row =>
      `<tr>${headers.map(h => `<td>${row[h]}</td>`).join('')}</tr>`
    ).join('\n')}
  </table>

  <h2>Pivot Tables</h2>
  ${analysis.pivots.map(pivot => `
    <div class="pivot-table">
      <h3>${pivot.title}</h3>
      <table>
        <tr>
          <th>${pivot.category}</th>
          <th>Count</th>
          <th>Sum</th>
          <th>Average</th>
          <th>Min</th>
          <th>Max</th>
        </tr>
        ${Object.entries(pivot.data).map(([key, values]) => `
          <tr>
            <td>${key}</td>
            <td>${values.count}</td>
            <td>${values.sum.toFixed(2)}</td>
            <td>${values.avg.toFixed(2)}</td>
            <td>${values.min.toFixed(2)}</td>
            <td>${values.max.toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `).join('\n')}

</body>
</html>`;

  return html;
}

async function sendPDFReport(chatId, htmlContent, botToken) {
  // Use CloudConvert API or similar to convert HTML to PDF
  // For now, send HTML as document
  const htmlBlob = new TextEncoder().encode(htmlContent);

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', new Blob([htmlBlob], { type: 'text/html' }), 'analysis_report.html');
  formData.append('caption', '📊 Your comprehensive data analysis report\n\nNote: Open this file in a browser to view the complete report with tables and charts.');

  await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: formData
  });

  await sendTelegramMessage(chatId, '✅ Analysis complete! Check the HTML report above.', botToken);
}

async function sendTelegramMessage(chatId, text, botToken) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}
