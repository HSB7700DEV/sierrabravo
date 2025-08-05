// src/commands/start.js

export default {
  name: '/start',
  description: 'Welcomes the user and provides a button to open the web app.',
  /**
   * @param {object} message The Telegram message object.
   * @param {object} env The environment variables.
   * @param {object} telegram The telegram helper object.
   */
  handler: async (message, env, telegram) => {
    const chatId = message.chat.id;
    const threadId = message.message_thread_id;

    try {
      const db = env.DB; // D1 binding from environment
      await db.prepare('INSERT OR IGNORE INTO users (user_id) VALUES (?)').bind(chatId).run();
    } catch (err) {
      console.error('Failed to add user to DB:', err);
      // It's better not to expose detailed errors to the user.
      // We can log it and send a generic error message.
      await telegram.sendMessage(chatId, 'An unexpected database error occurred.', env, threadId);
      return; // Stop execution if DB fails
    }

    const welcomeMessage = `This is SierraBravo.\n\nClick the button below to open the app!`;
    
    // This is the keyboard with the Web App button
    const replyMarkup = {
      inline_keyboard: [
        [
          { 
            text: '🚀 Open Web App', 
            // The URL should be the URL of your Cloudflare Worker
            web_app: { url: env.WORKER_URL } 
          }
        ]
      ]
    };
    
    // Send the message with the button
    await telegram.sendMessage(chatId, welcomeMessage, env, threadId, replyMarkup);  
  },
};