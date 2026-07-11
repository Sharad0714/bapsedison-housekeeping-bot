import { TelegramAPI } from "../telegram/api";
import { handleCallbackQuery } from "../handlers/callback";
import { handleMessage } from "../handlers/message";
import { logInfo } from "../utils/logger";
import type { Update } from "../types/telegram";
import type { AuthorizedUser } from "../config";

export async function routeUpdate(
	api: TelegramAPI,
	update: Update,
	user: AuthorizedUser
): Promise<void> {
	if (update.message) {
		return handleMessage(api, update.message);
	}

	if (update.callback_query) {
		return handleCallbackQuery(api, update.callback_query);
	}

	logInfo("Ignoring unsupported update type.", update);
}