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

/**
 * Helper function to parse data from a specific row, adapted from currencyprize.js
 * @param {string} html The full HTML content of the page.
 * @param {string} rowIdentifier The unique text that identifies the target row.
 * @returns {{value: string, change: string} | null} The parsed data or null if not found.
 */

/**
 * Creates a secret key for HMAC validation from the bot token.
 * @param {string} botToken The bot token.
 * @returns {Promise<CryptoKey>}
 */
async function createSecretKey(botToken) {
    const encoder = new TextEncoder();
    const secret = encoder.encode("WebAppData");
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(botToken),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const hmac = await crypto.subtle.sign("HMAC", key, secret);
    return crypto.subtle.importKey("raw", hmac, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/**
 * Validates the initData from Telegram.
 * @param {string} initData The initData string from the web app.
 * @param {string} botToken The bot token from environment variables.
 * @returns {Promise<object | null>} The parsed user data or null if invalid.
 */
async function validateInitData(initData, botToken) {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    params.delete("hash");
    
    const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");

    const secretKey = await createSecretKey(botToken);
    const encoder = new TextEncoder();
    const data = encoder.encode(dataCheckString);
    const signature = await crypto.subtle.sign("HMAC", secretKey, data);

    const hexSignature = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    
    if (hexSignature === hash) {
        return Object.fromEntries(params.entries());
    }
    
    return null;
}


function parseRow(html, rowIdentifier) {
    const rowStartIndex = html.indexOf(rowIdentifier);
    if (rowStartIndex === -1) return null;

    const tableRowHtml = html.substring(rowStartIndex);
    const cells = tableRowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g);

    if (!cells || cells.length < 2) return null;

    const clean = (str) => str.replace(/<[^>]+>/g, '').trim();
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
                return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
            }
        }
        if (url.pathname === "/api/user" && request.method === "POST") {
            try {
                const { initData } = await request.json();
                if (!initData) {
                    return new Response(JSON.stringify({ error: "initData is required." }), { status: 400 });
                }

                const userData = await validateInitData(initData, env.BOT_TOKEN);

                if (userData && userData.user) {
                    const user = JSON.parse(userData.user);
                    return new Response(JSON.stringify({
                        id: user.id,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        username: user.username,
                    }), { headers: { 'Content-Type': 'application/json' } });
                } else {
                    return new Response(JSON.stringify({ error: "Invalid initData." }), { status: 403 });
                }
            } catch (error) {
                console.error("User validation error:", error);
                return new Response(JSON.stringify({ error: "Server error during validation." }), { status: 500 });
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
  // ... handleUpdate function remains the same ...
  if (update.message) {
    const message = update.message;
    const text = message.text || ''; // Ensure text is not undefined

    // Check if the message text is a command
    if (text.startsWith('/')) {
      // Handles both /ping and /ping@YourBotName
      const commandName = text.split(' ')[0].split('@')[0];

      if (commands.has(commandName)) {
        const handler = commands.get(commandName);
        try {
          await handler(message, env, telegram);
        } catch (e) {
          console.error(e);
          // Reply in the correct thread if an error occurs
          await telegram.sendMessage(message.chat.id, 'An error occurred while processing your command.\n\n' + e, env, message.message_thread_id);
        }
      }
    }
  }
  return new Response("OK");
}