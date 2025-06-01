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
    const welcomeMessage = `Welcome to your Cloudflare-hosted Telegram Bot! 👋\n\nI am now running with a more organized project structure.`;
    await telegram.sendMessage(chatId, welcomeMessage, env);
  },
};