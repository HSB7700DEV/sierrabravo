// src/index.js

import telegram from './telegram';
import startCommand from './commands/start';
import pingCommand from './commands/ping';
import currencyprizeCommand from './commands/currencyprize';

// A Map to store our command handlers for easy lookup
const commands = new Map();
commands.set(startCommand.name, startCommand.handler);
commands.set(pingCommand.name, pingCommand.handler);
commands.set(currencyprizeCommand.name, currencyprizeCommand.handler);

export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      const payload = await request.json();
      return handleUpdate(payload, env);
    }
    return new Response("This bot is running on Cloudflare Workers!");
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
    const text = message.text;

    // Check if the message text is a registered command
    if (text && commands.has(text)) {
      const handler = commands.get(text);
      try {
        await handler(message, env, telegram);
      } catch (e) {
        console.error(e);
        await telegram.sendMessage(message.chat.id, 'An error occurred while processing your command.', env);
      }
    } else {
      // Optional: Respond to unknown commands
      // await telegram.sendMessage(message.chat.id, "Sorry, I don't recognize that command.", env);
    }
  }
  return new Response("OK");
}