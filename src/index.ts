import {TelegramAPI} from "./telegram/api";
import {handleWebhook} from "./telegram/webhooks";
import {sendPendingOrderReminder} from "./services/notificationService";
import {logError} from "./utils/logger";

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

	async scheduled (
		_controller: ScheduledController,
		env: Env,
		_context: ExecutionContext,
	): Promise<void> {
		if (!env.TELEGRAM_BOT_TOKEN) {
			logError("Missing TELEGRAM_BOT_TOKEN for scheduled notification.");
			return;
		}

		try {
			await sendPendingOrderReminder(
				env,
				new TelegramAPI(env.TELEGRAM_BOT_TOKEN),
			);
		} catch (error) {
			logError("Failed to send scheduled pending-order reminder.", error);
		}
	},
} satisfies ExportedHandler<Env>;
