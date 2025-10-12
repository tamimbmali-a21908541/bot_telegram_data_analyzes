import data from './Telegram Data Analysis Bot.json' assert { type: 'json' }

export default {
  async fetch(request) {
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    })
  },
}
