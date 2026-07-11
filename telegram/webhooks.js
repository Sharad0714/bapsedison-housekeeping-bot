import {TelegramAPI} from "./api.js";
import {getAuthorizedUser} from "../auth/auth.js";
import {logError} from "../utils/logger.js";
import {routeUpdate} from "../services/router.js";

export async function handleWebhook (request, api) {
	if (request.method !== "POST") {
		return new Response("Method Not Allowed", {
			status: 405,
		});
	}

	try {
		const update = await request.json();

		const telegramUserId =
			update.message?.from?.id ??
			update.callback_query?.from?.id;

		const chatId =
			update.message?.chat?.id ??
			update.callback_query?.message?.chat?.id;

		const user = getAuthorizedUser(telegramUserId);

		if (!user) {
			await api.sendMessage(chatId, "❌ You are not authorized to use this bot.");
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