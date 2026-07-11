import {isAuthorized, getAuthorizedUser} from "../auth/auth";
import {routeUpdate} from "../services/router";
import {TelegramAPI} from "./api";
import type {Update} from "../types/telegram";

export async function handleWebhook (
	request: Request,
	api: TelegramAPI
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

	if (!telegramUser) {
		return new Response("OK");
	}

	if (!isAuthorized(telegramUser.id)) {
		return new Response("OK");
	}

	const user = getAuthorizedUser(telegramUser.id);

	if (!user) {
		return new Response("OK");
	}

	await routeUpdate(api, update, user);

	return new Response("OK");
}