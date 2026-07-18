import {Env} from "..";
import {getAuthorizedUser} from "../auth/auth";
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

	if (!telegramUser || !chatId) {
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
