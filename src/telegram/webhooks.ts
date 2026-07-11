import { TelegramAPI } from "./api";
import { getAuthorizedUser } from "../src/auth/auth";
import { logError } from "../utils/logger";
import { routeUpdate } from "../services/router";
import type { Update } from "../types/telegram";

export async function handleWebhook(
	request: Request,
	api: TelegramAPI
): Promise<Response> {
	if (request.method !== "POST") {
		return new Response("Method Not Allowed", {
			status: 405,
		});
	}

	try {
		const update: Update = await request.json();

		const telegramUserId =
			update.message?.from?.id ??
			update.callback_query?.from?.id;

		const chatId =
			update.message?.chat?.id ??
			update.callback_query?.message?.chat?.id;

		if (telegramUserId === undefined || chatId === undefined) {
			return new Response("OK");
		}

		const user = getAuthorizedUser(telegramUserId);

		if (!user) {
			await api.sendMessage(
				chatId,
				"❌ You are not authorized to use this bot."
			);
			return new Response("OK");
		}

		await routeUpdate(api, update, user);
	} catch (error) {
		logError("Failed to process Telegram webhook.", error);
	}

	return new Response("OK", {
		status: 200,
	});
}