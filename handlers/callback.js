import {COMING_SOON_MESSAGE} from "../telegram/responses.js";

export async function handleCallbackQuery (api, callbackQuery) {
	const callbackId = callbackQuery.id;
	const data = callbackQuery.data;
	const message = callbackQuery.message;

	if (!message || !data) {
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
			break;

		default:
			await api.answerCallbackQuery(
				callbackId,
				"Unknown action."
			);
	}
}