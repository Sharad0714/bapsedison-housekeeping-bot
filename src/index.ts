import {TelegramAPI} from "./telegram/api";
import {handleWebhook} from "./telegram/webhooks";
import {
	sendInventoryUpdateReminder,
	sendPendingOrderReminder,
} from "./services/notificationService";
import {
	isInventoryReminderTime,
	isOrderReminderTime,
	toEasternTime,
} from "./utils/dateUtils";
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
		controller: ScheduledController,
		env: Env,
		_context: ExecutionContext,
	): Promise<void> {
		if (!env.TELEGRAM_BOT_TOKEN) {
			logError("Missing TELEGRAM_BOT_TOKEN for scheduled notification.");
			return;
		}

		const telegram = new TelegramAPI(env.TELEGRAM_BOT_TOKEN);
		const scheduledDate = new Date(controller.scheduledTime);
		const et = toEasternTime(scheduledDate);

		// 8:00 AM ET daily pending order reminder
		if (isOrderReminderTime(et)) {
			try {
				await sendPendingOrderReminder(env, telegram);
			} catch (error) {
				logError("Failed to send scheduled pending-order reminder.", error);
			}
		}

		// Inventory update reminder (Sat/Sun 12:00 PM / 7:30 PM, Mon-Fri 8:00 AM)
		if (isInventoryReminderTime(et)) {
			try {
				await sendInventoryUpdateReminder(env, telegram, scheduledDate);
			} catch (error) {
				logError("Failed to send scheduled inventory-update reminder.", error);
			}
		}
	},
} satisfies ExportedHandler<Env>;
