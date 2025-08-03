// src/commands/ping.js

import { logErrorToAdmin } from '../utils/errorHandler.js';

export default {
  name: '/ping',
  description: "Checks the bot's latency.",
  /**
   * @param {object} message The Telegram message object.
   * @param {object} env The environment variables.
   * @param {object} telegram The telegram helper object.
   */
  handler: async (message, env, telegram) => {
    const chatId = message.chat.id;
    const startTime = Date.now();
    const threadId = message.message_thread_id; // Get the thread ID

    
    // Send an initial message and get its details
    const response = await telegram.sendMessage(chatId, "Pinging...", env, threadId);
    
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Check if the initial message was sent successfully
    if (response && response.ok) {
      const messageId = response.result.message_id;
      // Edit the message to show the latency
      await telegram.editMessage(chatId, messageId, `Bot latency: ${latency} ms`, env);
    }
  },
};