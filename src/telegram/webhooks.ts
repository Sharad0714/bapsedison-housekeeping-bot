import {Env} from "..";
import {getAuthorizedUser} from "../auth/auth";
import {CHAT_TYPES} from "../config";
import {routeUpdate} from "../services/router";
import {logError} from "../utils/logger";
import {TelegramAPI} from "./api";
import {INTERNAL_ERROR_MESSAGE, UNAUTHORIZED_MESSAGE} from "./responses";
import type {Update} from "./types";

export async function handleWebhook (
	request: Request,
	api: TelegramAPI,
	env: Env
): Promise<Response> {
	if (request.method !== "POST") {
		return new Response("Method Not Allowed", {
			status: 405,
		});
	}

	let update: Update;

	try {
		update = await request.json();
	} catch {
		return new Response("Invalid JSON", {
			status: 400,
		});
	}

	const telegramUser =
		update.message?.from ??
		update.callback_query?.from;

	const chatId =
		update.message?.chat.id ??
		update.callback_query?.message?.chat.id;

	const chatType =
		update.message?.chat.type ??
		update.callback_query?.message?.chat.type;

	if (!telegramUser || !chatId) {
		return new Response("OK");
	}

	// Ignore updates from non-private chats (groups, supergroups, channels).
	// Bot commands can only be invoked in 1-on-1 private DMs with the bot.
	if (chatType !== CHAT_TYPES.PRIVATE) {
		return new Response("OK");
	}

	const user = getAuthorizedUser(telegramUser.id);

	if (!user) {
		await api.sendMessage(chatId, UNAUTHORIZED_MESSAGE);
		return new Response("OK");
	}

	try {
		await routeUpdate(env, api, update, user);
	} catch (error) {
		logError(`Unhandled error while processing update for user ${telegramUser.id}`, error);
		await api.sendMessage(chatId, INTERNAL_ERROR_MESSAGE);
	}

	return new Response("OK");
}
