import type {Message} from "./types";

export class TelegramAPI {
	constructor (private readonly token: string) { }

	private get apiUrl (): string {
		return `https://api.telegram.org/bot${this.token}`;
	}

	private async request<T> (
		method: string,
		body: Record<string, unknown>
	): Promise<T> {
		const response = await fetch(`${this.apiUrl}/${method}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			throw new Error(
				`Telegram API request failed (${response.status})`
			);
		}

		const result = await response.json() as {
			ok: boolean;
			result: T;
			description?: string;
		};

		if (!result.ok) {
			throw new Error(result.description ?? "Telegram API error");
		}

		return result.result;
	}

	async sendMessage (
		chatId: number,
		text: string,
		replyMarkup?: object
	): Promise<Message> {
		return this.request<Message>("sendMessage", {
			chat_id: chatId,
			text,
			reply_markup: replyMarkup,
		});
	}

	async editMessageText (
		chatId: number,
		messageId: number,
		text: string,
		replyMarkup?: object
	): Promise<void> {
		await this.request("editMessageText", {
			chat_id: chatId,
			message_id: messageId,
			text,
			reply_markup: replyMarkup,
		});
	}

	async answerCallbackQuery (
		callbackQueryId: string,
		text?: string
	): Promise<void> {
		await this.request("answerCallbackQuery", {
			callback_query_id: callbackQueryId,
			text,
		});
	}
}
