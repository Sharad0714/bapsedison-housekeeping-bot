import {TelegramAPI} from "./api.js";
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

		await routeUpdate(api, update);
	} catch (error) {
		logError("Failed to process Telegram webhook.", error);
	}

	return new Response("OK", {
		status: 200,
	});
}