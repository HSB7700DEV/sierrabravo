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
  // ...
  handler: async (message, env, telegram) => {
    const chatId = message.chat.id;
    const threadId = message.message_thread_id; // Get the thread ID
    const url = 'https://www.iranjib.ir/showgroup/23/realtime_price/';
    
    // Pass threadId to the initial message
    const initialMessage = await telegram.sendMessage(chatId, 'Fetching latest gold price... ⏳', env, threadId);
    const messageId = initialMessage.result.message_id;

    try {
      // ... (rest of the try block is the same)
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }
      const html = await response.text();
      const data = parseGoldPrice(html);
      const resultText = `🥇 *18 Karat Gold Price*\n\n` +
                         `- *Live Price:* \`${data.livePrice}\` Rial\n` +
                         `- *Change:* \`${data.change}\``;
      await telegram.editMessage(chatId, messageId, resultText, env);

    } catch (error) {
      // ... (catch block is the same)
    }
  },
};