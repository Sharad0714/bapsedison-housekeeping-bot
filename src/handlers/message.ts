import {BUTTONS, BOT_NAME} from "../config";
import type {AuthorizedUser} from "../config";
import type {Message} from "../types/telegram";
import {TelegramAPI} from "../telegram/api";

export async function handleMessage (
	api: TelegramAPI,
	message: Message,
	user: AuthorizedUser
): Promise<void> {
	const chatId = message.chat.id;
	const text = message.text?.trim();

	if (!text) {
		return;
	}

	switch (text) {
		case "/start":
			await sendWelcomeMessage(api, chatId, user);
			return;

		case BUTTONS.INVENTORY:
			await api.sendMessage(chatId, "📦 Inventory coming soon.");
			return;

		case BUTTONS.UPDATE_INVENTORY:
			await api.sendMessage(chatId, "📝 Update Inventory coming soon.");
			return;

		case BUTTONS.MANAGE_ITEMS:
			await api.sendMessage(chatId, "⚙️ Manage Items coming soon.");
			return;

		default:
			await api.sendMessage(
				chatId,
				"I didn't understand that command."
			);
			return;
	}
}

async function sendWelcomeMessage (
	api: TelegramAPI,
	chatId: number,
	user: AuthorizedUser
): Promise<void> {
	await api.sendMessage(
		chatId,
		`Welcome, ${user.name}!`,
		{
			keyboard: [
				[{text: BUTTONS.INVENTORY}],
				[{text: BUTTONS.UPDATE_INVENTORY}],
				[{text: BUTTONS.MANAGE_ITEMS}]
			],
			resize_keyboard: true,
			persistent: true
		}
	);
}