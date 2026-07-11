import {TelegramAPI} from "../telegram/api";
import {handleCallbackQuery} from "../handlers/callback";
import {handleMessage} from "../handlers/message";
import {logInfo} from "../utils/logger";
import type {AuthorizedUser} from "../config";
import {Update} from "../telegram/types";

export async function routeUpdate (
	api: TelegramAPI,
	update: Update,
	user: AuthorizedUser
): Promise<void> {
	if (update.message) {
		await handleMessage(api, update.message, user);
		return;
	}

	if (update.callback_query) {
		await handleCallbackQuery(api, update.callback_query, user);
		return;
	}

	logInfo("Ignoring unsupported update type.", update);
}