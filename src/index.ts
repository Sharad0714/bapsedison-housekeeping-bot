import { TelegramAPI } from "./telegram/api";
import { handleWebhook } from "./telegram/webhooks";

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const api = new TelegramAPI(env.TELEGRAM_BOT_TOKEN);
		return handleWebhook(request, api);
	},
};