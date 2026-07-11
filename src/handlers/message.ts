import { BUTTONS } from "../config";
import {
	COMING_SOON_MESSAGE,
	HELP_MESSAGE,
	UNKNOWN_COMMAND_MESSAGE,
	WELCOME_MESSAGE,
} from "../telegram/responses";
import { MAIN_MENU_KEYBOARD } from "../telegram/keyboards";
import { TelegramAPI } from "../telegram/api";
import type { Message } from "../types/telegram";
import type { AuthorizedUser } from "../config";

async function handleStart(
	api: TelegramAPI,
	chatId: number
): Promise<Response> {
	return api.sendMessage(chatId, WELCOME_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleHelp(
	api: TelegramAPI,
	chatId: number
): Promise<Response> {
	return api.sendMessage(chatId, HELP_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleInventory(
	api: TelegramAPI,
	chatId: number
): Promise<Response> {
	return api.sendMessage(chatId, COMING_SOON_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleUpdateInventory(
	api: TelegramAPI,
	chatId: number
): Promise<Response> {
	return api.sendMessage(chatId, COMING_SOON_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleManageItems(
	api: TelegramAPI,
	chatId: number
): Promise<Response> {
	return api.sendMessage(chatId, COMING_SOON_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleHello(
	api: TelegramAPI,
	chatId: number
): Promise<Response> {
	return api.sendMessage(chatId, "Hello! 👋");
}

async function handlePing(
	api: TelegramAPI,
	chatId: number
): Promise<Response> {
	return api.sendMessage(chatId, "Pong! 🏓");
}

async function handleUnknown(
	api: TelegramAPI,
	chatId: number
): Promise<Response> {
	return api.sendMessage(
		chatId,
		UNKNOWN_COMMAND_MESSAGE,
		MAIN_MENU_KEYBOARD
	);
}

export async function handleMessage(
	api: TelegramAPI,
	message: Message,
	_user: AuthorizedUser
): Promise<Response | void> {
	const chatId = message.chat.id;
	const text = message.text?.trim();

	if (!text) {
		return;
	}

	const command = text.toLowerCase();

	switch (command) {
		case "/start":
			return handleStart(api, chatId);

		case "/help":
			return handleHelp(api, chatId);

		case "hello":
			return handleHello(api, chatId);

		case "ping":
			return handlePing(api, chatId);

		case BUTTONS.INVENTORY.toLowerCase():
		case "/inventory":
			return handleInventory(api, chatId);

		case BUTTONS.UPDATE_INVENTORY.toLowerCase():
		case "/updateinventory":
			return handleUpdateInventory(api, chatId);

		case BUTTONS.MANAGE_ITEMS.toLowerCase():
		case "/manageitems":
			return handleManageItems(api, chatId);

		default:
			return handleUnknown(api, chatId);
	}
}