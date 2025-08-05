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

    try {
      const db = env.DB; // D1 binding from environment
      await db.prepare('INSERT OR IGNORE INTO users (user_id) VALUES (?)').bind(chatId).run();
      console.log(`A user added to the database.`);
    } catch (err) {
      console.error('Failed to add user to DB:', err);
      await telegram.sendMessage(chatId, 'Unexpected error on database!\nReport this to an adminisrator of the bot.' + err, env, threadId);
      await logErrorToAdmin('/start', err, env, telegram);
    }

    const welcomeMessage = `This is SierraBravo.\n\n/ping - Check if the bot is alive\n/currencyprize - Get the Real-time price of currencies\n\nChat ID: ${chatId}`;
    
    await telegram.sendMessage(chatId, welcomeMessage, env, threadId);  
    console.log(`start command executed`);
  },
};