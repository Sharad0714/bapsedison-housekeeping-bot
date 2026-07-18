import {COMING_SOON_MESSAGE} from "../telegram/responses";
import {TelegramAPI} from "../telegram/api";
import type {AuthorizedUser} from "../config";
import {CallbackQuery} from "../telegram/types";
import {Env} from "..";
import {handleInventoryUpdateCallback} from "../workflows/inventoryUpdateWorkflow";

export async function handleCallbackQuery (
	env: Env,
	api: TelegramAPI,
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

	const chatId = message.chat.id;
	const messageId = message.message_id;

	switch (data) {
		case "inventory":
		case "update_inventory":
		case "manage_items":
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
