export class TelegramAPI {
	private readonly baseUrl: string;

	constructor(botToken: string) {
		this.baseUrl = `https://api.telegram.org/bot${botToken}`;
	}

	private async request<T = unknown>(
		method: string,
		payload: Record<string, unknown>
	): Promise<T> {
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

		const result: {
			ok: boolean;
			result: T;
			description?: string;
		} = await response.json();

		if (!result.ok) {
			throw new Error(result.description ?? "Unknown Telegram API error.");
		}

		return result.result;
	}

	async sendMessage(
		chatId: number,
		text: string,
		replyMarkup?: object
	): Promise<void> {
		await this.request("sendMessage", {
			chat_id: chatId,
			text,
			reply_markup: replyMarkup,
		});
	}

	async editMessageText(
		chatId: number,
		messageId: number,
		text: string
	): Promise<void> {
		await this.request("editMessageText", {
			chat_id: chatId,
			message_id: messageId,
			text,
		});
	}

	async editMessageReplyMarkup(
		chatId: number,
		messageId: number,
		replyMarkup: object
	): Promise<void> {
		await this.request("editMessageReplyMarkup", {
			chat_id: chatId,
			message_id: messageId,
			reply_markup: replyMarkup,
		});
	}

	async answerCallbackQuery(
		callbackQueryId: string,
		text?: string
	): Promise<void> {
		await this.request("answerCallbackQuery", {
			callback_query_id: callbackQueryId,
			text,
		});
	}
}