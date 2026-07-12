import {BUTTONS, BOT_NAME, HELP_MESSAGE} from "../config";
import type {AuthorizedUser} from "../config";
import {TelegramAPI} from "../telegram/api";
import {getMainMenuKeyboard} from "../telegram/keyboards";
import {Message} from "../telegram/types";

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

	const command = normalizeCommand(text);

	switch (command) {
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

		case BUTTONS.HELP:
			await sendHelpMessage(api, chatId, user);
			return;

		default:
			await api.sendMessage(
				chatId,
				"I didn't understand that command."
			);
			return;
	}
}

function normalizeCommand (text: string): string {
	switch (text) {
		case BUTTONS.INVENTORY:
			return "/inventory";

		case BUTTONS.UPDATE_INVENTORY:
			return "/update";

		case BUTTONS.MANAGE_ITEMS:
			return "/manage";

		case BUTTONS.HELP:
			return "/help";

		default:
			return text;
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
		getMainMenuKeyboard(user)
	);
}

async function sendHelpMessage (
	api: TelegramAPI,
	chatId: number,
	user: AuthorizedUser
): Promise<void> {
	await api.sendMessage(
		chatId,
		HELP_MESSAGE,
		getMainMenuKeyboard(user)
	);
}