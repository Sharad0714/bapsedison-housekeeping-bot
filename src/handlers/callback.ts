import {COMING_SOON_MESSAGE} from "../telegram/responses";
import type {TelegramClient} from "../telegram/api";
import type {AuthorizedUser} from "../config";
import type {CallbackQuery} from "../telegram/types";
import type {Env} from "..";
import {handleOrderCallback} from "../workflows/orderWorkflow";
import {handleInventoryUpdateCallback} from "../workflows/inventoryUpdateWorkflow";
import {handleManageItemsCallback} from "../workflows/manageItemsWorkflow";

export async function handleCallbackQuery (
	env: Env,
	api: TelegramClient,
	callbackQuery: CallbackQuery,
	_user: AuthorizedUser
): Promise<void> {
	const callbackId = callbackQuery.id;
	const data = callbackQuery.data;
	const message = callbackQuery.message;

	if (!message || !data) {
		return;
	}

	if (await handleInventoryUpdateCallback(env, api, callbackQuery, _user)) {
		return;
	}

	if (await handleManageItemsCallback(env, api, callbackQuery, _user)) {
		return;
	}

	if (await handleOrderCallback(env, api, callbackQuery, _user)) {
		return;
	}
	const chatId = message.chat.id;
	const messageId = message.message_id;

	switch (data) {
		case "inventory":
		case "update_inventory":
			await api.answerCallbackQuery(callbackId);
			await api.editMessageText(
				chatId,
				messageId,
				COMING_SOON_MESSAGE
			);
			return;

		default:
			await api.answerCallbackQuery(
				callbackId,
				"Unknown action."
			);
			return;
	}
}
