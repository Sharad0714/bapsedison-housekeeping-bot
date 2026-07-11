import {TelegramAPI} from "./telegram/api.js";
import {handleWebhook} from "./telegram/webhooks.js";

export default {
	async fetch (request, env) {
		const api = new TelegramAPI(env.TELEGRAM_BOT_TOKEN);
		return handleWebhook(request, api);
	},
};