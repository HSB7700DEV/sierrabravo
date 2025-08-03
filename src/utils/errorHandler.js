/**
 * Sends a formatted error message to the admin.
 * @param {string} commandName - The name of the command where the error occurred.
 * @param {Error} error - The error object.
 * @param {object} env - The environment variables.
 * @param {object} telegram - The telegram helper object.
 */
async function logErrorToAdmin(commandName, error, env, telegram) {
  try {
    const adminChatId = env.ADMIN_CHAT_ID;
    if (!adminChatId) {
      console.error("ADMIN_CHAT_ID is not set. Cannot send error report.");
      return;
    }
    
    const errorMessage = `**Error in command:** ${commandName}\n\nMessage: ${error.message}\n\nStack: ${error.stack}`;
    
    // Use the core telegram sender, but don't pass a threadId
    await telegram.sendMessage(adminChatId, errorMessage, env);

  } catch (e) {
    console.error("CRITICAL: Failed to send error report to admin.", e);
  }
}