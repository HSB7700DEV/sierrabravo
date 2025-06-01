// src/commands/currencyprize.js
import { fetchMarketData } from '../services/iranjibScraper.js';

export default {
  name: '/currencyprize',
  description: 'Fetches real-time prices for gold and Tether.',
  handler: async (message, env, telegram) => {
    const chatId = message.chat.id;
    const threadId = message.message_thread_id;
    
    const initialMessage = await telegram.sendMessage(chatId, 'Fetching latest market data... ⏳', env, threadId);
    const messageId = initialMessage.result.message_id;

    try {
      const marketData = await fetchMarketData();

      // +++ THE FOLLOWING TEXT BLOCK IS UPDATED +++
      const gold = marketData.gold;
      const tether = marketData.tether;

      const resultText = `📈 **Market Summary**\n\n` +
                         `🥇 *18 Karat Gold*\n` +
                         `- Price: \`${gold.price}\` Rial\n` +
                         `- Change: \`${gold.change}\`\n\n` +
                         `💲 *Tether (USDT)*\n` +
                         `- Price: \`${tether.price}\` Rial\n` +
                         `- Change: \`${tether.change}\``;

      await telegram.editMessage(chatId, messageId, resultText, env);

    } catch (error) {
      console.error(error);
      await telegram.editMessage(chatId, messageId, `❌ **Error:**\nCould not retrieve market data. The website may be unavailable or its layout has changed.`, env);
    }
  },
};