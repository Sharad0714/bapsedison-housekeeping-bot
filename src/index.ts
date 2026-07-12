import {TelegramAPI} from "./telegram/api";
import {handleWebhook} from "./telegram/webhooks";

export interface Env {
	TELEGRAM_BOT_TOKEN: string;
	DB: D1Database;
}

export default {
	async fetch (request: Request, env: Env): Promise<Response> {
		if (!env.TELEGRAM_BOT_TOKEN) {
			return new Response("Missing TELEGRAM_BOT_TOKEN", {
				status: 500,
			});
		}

		const telegram = new TelegramAPI(env.TELEGRAM_BOT_TOKEN);

		return handleWebhook(request, telegram, env);
	},
} satisfies ExportedHandler<Env>;