import {TelegramAPI} from "../telegram/api.js";
import {handleCallbackQuery} from "../handlers/callback.js";
import {handleMessage} from "../handlers/message.js";
import {logInfo} from "../utils/logger.js";

export async function routeUpdate (api, update) {
	if (update.message) {
		return handleMessage(api, update.message);
	}

	if (update.callback_query) {
		return handleCallbackQuery(api, update.callback_query);
	}

	logInfo("Ignoring unsupported update type.", update);
}