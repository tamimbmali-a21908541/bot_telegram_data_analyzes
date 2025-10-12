// Telegram Data Analysis Bot - Cloudflare Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle Telegram webhook
    if (request.method === 'POST' && url.pathname === '/webhook') {
      return handleTelegramUpdate(request, env);
    }

    // Health check endpoint
    if (url.pathname === '/') {
      return new Response('Telegram Data Analysis Bot is running!', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function handleTelegramUpdate(request, env) {
  try {
    const update = await request.json();

    // Check if message contains a document
    if (update.message && update.message.document) {
      await processDocument(update.message, env);
    } else if (update.message) {
      // No file attached
      await sendTelegramMessage(
        update.message.chat.id,
        'Please send an Excel (.xlsx, .xls) or CSV file for analysis.',
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
    // Send processing message
    await sendTelegramMessage(chatId, '📊 Processing your file...', env.TELEGRAM_BOT_TOKEN);

    // Get file info from Telegram
    const fileInfoResponse = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const fileInfo = await fileInfoResponse.json();

    if (!fileInfo.ok) {
      throw new Error('Failed to get file info');
    }

    // Download the file
    const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${fileInfo.result.file_path}`;
    const fileResponse = await fetch(fileUrl);
    const fileData = await fileResponse.arrayBuffer();

    // Parse spreadsheet (simplified - handles CSV)
    const data = await parseSpreadsheet(fileData, message.document.file_name);

    // Prepare data for analysis
    const dataText = prepareDataForAnalysis(data);

    // Get AI analysis from DeepSeek
    const analysis = await getDeepSeekAnalysis(dataText, env.DEEPSEEK_API_KEY);

    // Format and send response
    let responseMessage = `📊 DATA ANALYSIS REPORT\n\n${analysis}\n\n---\n💬 You can ask me follow-up questions about this data!\n📅 ${new Date().toLocaleString()}`;

    // Telegram message limit
    if (responseMessage.length > 4096) {
      responseMessage = responseMessage.substring(0, 4050) + '\n\n... (truncated)';
    }

    await sendTelegramMessage(chatId, responseMessage, env.TELEGRAM_BOT_TOKEN);

  } catch (error) {
    console.error('Error processing document:', error);
    await sendTelegramMessage(
      chatId,
      '❌ Sorry, there was an error processing your file. Please make sure it\'s a valid CSV or Excel file.',
      env.TELEGRAM_BOT_TOKEN
    );
  }
}

async function parseSpreadsheet(arrayBuffer, filename) {
  // Simple CSV parser (for Excel, you'd need a library like xlsx)
  const text = new TextDecoder().decode(arrayBuffer);
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });
    data.push(row);
  }

  return data;
}

function prepareDataForAnalysis(data) {
  let dataText = 'DATA ANALYSIS\n\n';
  dataText += `Total rows: ${data.length}\n\n`;

  if (data.length === 0) return dataText;

  const headers = Object.keys(data[0]);
  dataText += `Columns: ${headers.join(', ')}\n\n`;

  // Sample data (first 30 rows)
  const sample = Math.min(data.length, 30);
  dataText += `Sample (${sample} rows):\n`;
  for (let i = 0; i < sample; i++) {
    dataText += JSON.stringify(data[i]) + '\n';
  }

  // Calculate statistics for numeric columns
  dataText += '\nSTATISTICS:\n';
  headers.forEach(header => {
    const values = data
      .map(row => row[header])
      .filter(v => !isNaN(v) && v !== null && v !== '');

    if (values.length > 0) {
      const numbers = values.map(Number);
      const sum = numbers.reduce((a, b) => a + b, 0);
      const avg = sum / numbers.length;
      const max = Math.max(...numbers);
      const min = Math.min(...numbers);
      dataText += `  ${header}: Min=${min}, Max=${max}, Avg=${avg.toFixed(2)}\n`;
    }
  });

  return dataText;
}

async function getDeepSeekAnalysis(dataText, apiKey) {
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
          content: 'You are a professional data analyst. Analyze data and provide insights in both English and Arabic. Include: 1) Executive Summary (ملخص تنفيذي), 2) Key Findings (النتائج الرئيسية), 3) Trends (الاتجاهات), 4) Recommendations (التوصيات). Use clear structure.'
        },
        {
          role: 'user',
          content: dataText + '\n\nAnalyze this data completely.'
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  const result = await response.json();
  return result.choices[0].message.content;
}

async function sendTelegramMessage(chatId, text, botToken) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
    })
  });
}
