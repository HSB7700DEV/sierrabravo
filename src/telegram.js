// src/telegram.js

/**
 * Sends a text message to a specified chat.
 * @param {string | number} chatId The ID of the chat.
 * @param {string} text The text to send.
 * @param {object} env The environment variables.
 * @param {number | undefined} threadId The ID of the message thread (for topics).
 * @param {object | undefined} replyMarkup The inline keyboard markup.
 * @returns {Promise<object>} The response from the Telegram API.
 */
async function sendMessage(chatId, text, env, threadId, replyMarkup) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  };

  if (threadId) {
    payload.message_thread_id = threadId;
  }
  // Add the keyboard to the payload if it exists
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

/**
 * Edits an existing text message in a chat.
 * @param {string | number} chatId The ID of the chat.
 * @param {number} messageId The ID of the message to edit.
 * @param {string} text The new text for the message.
 * @param {object} env The environment variables.
 */
async function editMessage(chatId, messageId, text, env) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/editMessageText`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: 'Markdown' // Also enable Markdown here
    }),
  });
}

export default { sendMessage, editMessage };