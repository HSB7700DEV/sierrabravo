import telegram from './telegram';
import startCommand from './commands/start';
import pingCommand from './commands/ping';
import currencyprizeCommand from './commands/currencyprize';
import html from './index.html';

// A Map to store our command handlers for easy lookup
const commands = new Map();
commands.set(startCommand.name, startCommand.handler);
commands.set(pingCommand.name, pingCommand.handler);
commands.set(currencyprizeCommand.name, currencyprizeCommand.handler);


function parseRow(html, rowIdentifier) {
    const rowStartIndex = html.indexOf(rowIdentifier);
    if (rowStartIndex === -1) return null;

    const tableRowHtml = html.substring(rowStartIndex);
    const cells = tableRowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g);

    if (!cells || cells.length < 2) return null;

    // Updated 'clean' function to also remove LRM and RLM characters
    const clean = (str) => str.replace(/<[^>]+>/g, '').replace(/&lrm;|&#8206;|&rlm;|&#8207;/gi, '').trim();
    const value = clean(cells[0]);
    const change = clean(cells[1]);

    return { value, change };
}


export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        if (url.pathname === "/api/ping") {
            return new Response(null, { status: 204 });
        }
        if (url.pathname === "/api/currency") {
            try {
                const response = await fetch('https://www.iranjib.ir/showgroup/23/realtime_price/');
                if (!response.ok) throw new Error(`Failed to fetch data. Status: ${response.status}`);
                
                const htmlText = await response.text();
                const goldData = parseRow(htmlText, 'هر گرم طلای ۱۸ عیار');
                const tetherData = parseRow(htmlText, 'تتر');

                if (!goldData || !tetherData) throw new Error('Could not parse all required data.');

                const data = { gold: goldData, tether: tetherData };
                
                return new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json' },
                });
            } catch (error) {
                console.error('Error fetching currency data:', error);
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
            }
        }
    }

    // Handle Telegram webhooks
    if (request.method === "POST") {
      const payload = await request.json();
      return handleUpdate(payload, env);
    }

    // Serve the web app's HTML on the root URL
    if (url.pathname === "/") {
        return new Response(html, {
            headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        });
    }

    return new Response("Not found.", { status: 404 });
  },
};

/**
 * Handles incoming updates from Telegram.
 * @param {object} update The Telegram update object.
 * @param {object} env The environment variables.
 */
async function handleUpdate(update, env) {
  if (update.message) {
    const message = update.message;
    const text = message.text || ''; 

    // Check if the message text is a command
    if (text.startsWith('/')) {
      // Handles both /ping and /ping@YourBotName
      const commandName = text.split(' ')[0].split('@')[0];

      if (commands.has(commandName)) {
        const handler = commands.get(commandName);
        try {
          await handler(message, env, telegram);
        } catch (e) {
          console.error(`Error handling command ${commandName}:`, e);
          await telegram.sendMessage(message.chat.id, 'An error occurred while processing your command.\n\n' + e, env, message.message_thread_id);
        }
      }
    }
  }
  return new Response("OK");
}
