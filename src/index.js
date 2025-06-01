export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      const payload = await request.json();
      if (payload.message) {
        return handleMessage(payload.message, env);
      }
    }
    return new Response("Hello! This is the Telegram bot worker.");
  },
};

async function handleMessage(message, env) {
  const chatId = message.chat.id;
  const text = message.text;

  if (text === "/start") {
    await sendMessage(chatId, "Welcome to your Cloudflare-hosted Telegram Bot! 👋", env);
  } else if (text === "/ping") {
    const startTime = Date.now();
    const response = await sendMessage(chatId, "Pinging...", env);
    const endTime = Date.now();
    const latency = endTime - startTime;
    await editMessage(chatId, response.result.message_id, `Pong! Latency: ${latency} ms`, env);
  }

  return new Response("OK");
}

async function sendMessage(chatId, text, env) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });
  return response.json();
}

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
    }),
  });
}