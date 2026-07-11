export class TelegramAPI {
	constructor (botToken) {
		this.baseUrl = `https://api.telegram.org/bot${botToken}`;
	}

	async request (method, payload) {
		const response = await fetch(`${this.baseUrl}/${method}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			throw new Error(
				`Telegram API request failed (${response.status} ${response.statusText})`
			);
		}

		const result = await response.json();

		if (!result.ok) {
			throw new Error(result.description ?? "Unknown Telegram API error.");
		}

		return result.result;
	}

	async sendMessage (chatId, text, replyMarkup) {
		await this.request("sendMessage", {
			chat_id: chatId,
			text,
			reply_markup: replyMarkup,
		});
	}

	async editMessageText (chatId, messageId, text) {
		await this.request("editMessageText", {
			chat_id: chatId,
			message_id: messageId,
			text,
		});
	}

	async editMessageReplyMarkup (chatId, messageId, replyMarkup) {
		await this.request("editMessageReplyMarkup", {
			chat_id: chatId,
			message_id: messageId,
			reply_markup: replyMarkup,
		});
	}

	async answerCallbackQuery (callbackQueryId, text) {
		await this.request("answerCallbackQuery", {
			callback_query_id: callbackQueryId,
			text,
		});
	}
}