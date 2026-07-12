import {BUTTONS, BOT_NAME} from "../config";
import type {AuthorizedUser} from "../config";
import {TelegramAPI} from "../telegram/api";
import {getMainMenuKeyboard} from "../telegram/keyboards";
import {Message} from "../telegram/types";
import {UNKNOWN_COMMAND_MESSAGE, WELCOME_MESSAGE} from "../telegram/responses";

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

		case "/inventory":
			await api.sendMessage(chatId, "📦 Inventory coming soon.");
			return;

		case "/update":
			await api.sendMessage(chatId, "📝 Update Inventory coming soon.");
			return;

		case "/manage":
			await api.sendMessage(chatId, "⚙️ Manage Items coming soon.");
			return;

		case "/orders":
			if (user.role === "ADMIN") {
				await api.sendMessage(chatId, "📋 Orders coming soon.");
			}
			return;

		case "/help":
			await sendHelpMessage(api, chatId, user);
			return;

		default:
			await api.sendMessage(
				chatId,
				UNKNOWN_COMMAND_MESSAGE,
				getMainMenuKeyboard(user)
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
		WELCOME_MESSAGE,
		getMainMenuKeyboard(user)
	);
}

export function getWelcomeMessage (user: AuthorizedUser): string {
	return `Jay Swaminarayan, ${user.name}.
Welcome to ${BOT_NAME}!

Use the menu below to navigate the inventory system.`;
}

async function sendHelpMessage (
	api: TelegramAPI,
	chatId: number,
	user: AuthorizedUser
): Promise<void> {
	await api.sendMessage(
		chatId,
		getHelpMessage(user),
		getMainMenuKeyboard(user)
	);
}

export function getHelpMessage (user: AuthorizedUser): string {
	const sections = [
		"❓ Housekeeping Bot Help",
		"",
		"Use the buttons below to navigate the bot.",
		"",
		"📦 Inventory",
		"View the current inventory.",
		"",
		"📝 Update Inventory",
		"Record inventory changes.",
		"",
		"⚙️ Manage Items",
		"Add, edit, or remove inventory items.",
	];

	if (user.role === "ADMIN") {
		sections.push(
			"",
			"📋 Orders",
			"View and manage supply orders."
		);
	}

	return sections.join("\n");
}