// src/commands/start.js

export default {
  name: '/start',
  description: 'Welcomes the user to the bot.',
  /**
   * @param {object} message The Telegram message object.
   * @param {object} env The environment variables.
   * @param {object} telegram The telegram helper object.
   */
  handler: async (message, env, telegram) => {
    const chatId = message.chat.id;
    const threadId = message.message_thread_id; // Get the thread ID

    const welcomeMessage = `This is SierraBravo.\n\n/ping - Check if the bot is alive\n/currencyprize - Get the Real-time price of currencies`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: 'Ping', callback_data: 'ping' },
          { text: 'Currency Price', callback_data: 'currencyprize' }
        ]
      ]
    };

    await telegram.sendMessage(chatId, welcomeMessage, env, threadId, replyMarkup);
  },
};