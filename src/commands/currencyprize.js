// A simple, dependency-free HTML parser function for this specific task
function parseGoldPrice(html) {
  const targetRowIdentifier = 'هر گرم طلای ۱۸ عیار';
  
  // Find the start of the row containing our target text
  const rowStartIndex = html.indexOf(targetRowIdentifier);
  if (rowStartIndex === -1) {
    throw new Error('Could not find the target row for 18 Karat Gold.');
  }

  // Find the <tr> tag that contains this row
  const tableRowHtml = html.substring(rowStartIndex);
  
  // Use regular expressions to find the values in the <td> elements of that row
  // This looks for content within <td> tags. It's not perfect but works for this structure.
  const cells = tableRowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/g);

  if (!cells || cells.length < 4) {
    throw new Error('Could not parse the data cells for the target row.');
  }

  // Helper to strip HTML tags and trim whitespace from a string
  const clean = (str) => str.replace(/<[^>]+>/g, '').trim();

  // Based on the website's table structure:
  // Cell 0: Live Price (قیمت زنده)
  // Cell 1: Change (تغییر)
  const livePrice = clean(cells[0]);
  const change = clean(cells[1]);

  return { livePrice, change };
}


export default {
  name: '/currencyprize',
  description: 'Fetches the real-time price of 1 gram of 18k gold from IranJib.',
  /**
   * @param {object} message The Telegram message object.
   * @param {object} env The environment variables.
   * @param {object} telegram The telegram helper object.
   */
  handler: async (message, env, telegram) => {
    const chatId = message.chat.id;
    const url = 'https://www.iranjib.ir/showgroup/23/realtime_price/';
    
    // 1. Send an initial "loading" message
    const initialMessage = await telegram.sendMessage(chatId, 'Fetching latest gold price...', env);
    const messageId = initialMessage.result.message_id;

    try {
      // 2. Fetch the website's HTML content
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }
      const html = await response.text();

      // 3. Parse the HTML to get the price and change
      const data = parseGoldPrice(html);

      // 4. Format the final message
      const resultText = `18 Karat Gold Price\n\n` +
                         `- Live Price: \`${data.livePrice}\` Rial\n` +
                         `- Prize Change: \`${data.change}\``;

      // 5. Edit the original message with the result
      await telegram.editMessage(chatId, messageId, resultText, env);

    } catch (error) {
      console.error(error);
      // If anything goes wrong, inform the user
      await telegram.editMessage(chatId, messageId, `Error:\nCould not retrieve the gold price. The website structure may have changed or it might be temporarily unavailable.`, env);
    }
  },
};