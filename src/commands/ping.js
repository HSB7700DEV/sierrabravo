// src/commands/ping.js

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
    
    // Send an initial message and get its details
    const response = await telegram.sendMessage(chatId, "Pinging...", env);
    
    const endTime = Date.now();
    const latency = endTime - startTime;

    // Check if the initial message was sent successfully
    if (response && response.ok) {
      const messageId = response.result.message_id;
      // Edit the message to show the latency
      await telegram.editMessage(chatId, messageId, `Pong! 🏓\nLatency: ${latency} ms`, env);
    }
  },
};