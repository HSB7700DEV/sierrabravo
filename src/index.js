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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Handle API requests specifically for the web app
    if (url.pathname === "/api/ping") {
      // This endpoint is just for the web app to measure round-trip time.
      // A 204 No Content response is efficient as we don't need a body.
      return new Response(null, { status: 204 });
    }

    // 2. Handle incoming Telegram webhooks
    if (request.method === "POST") {
      const payload = await request.json();
      return handleUpdate(payload, env);
    }

    // 3. Serve the web app's HTML on the root URL
    if (url.pathname === "/") {
        return new Response(html, {
            headers: {
            'Content-Type': 'text/html;charset=UTF-8',
            },
        });
    }

    // 4. Return a 404 for any other path
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