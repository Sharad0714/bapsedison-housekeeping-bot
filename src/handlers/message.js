import {BUTTONS} from "../config.js";
import {
	COMING_SOON_MESSAGE,
	HELP_MESSAGE,
	UNKNOWN_COMMAND_MESSAGE,
	WELCOME_MESSAGE,
} from "../telegram/responses.js";
import {MAIN_MENU_KEYBOARD} from "../telegram/keyboards.js";

async function handleStart (api, chatId) {
	return api.sendMessage(chatId, WELCOME_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleHelp (api, chatId) {
	return api.sendMessage(chatId, HELP_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleInventory (api, chatId) {
	return api.sendMessage(chatId, COMING_SOON_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleUpdateInventory (api, chatId) {
	return api.sendMessage(chatId, COMING_SOON_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleManageItems (api, chatId) {
	return api.sendMessage(chatId, COMING_SOON_MESSAGE, MAIN_MENU_KEYBOARD);
}

async function handleHello (api, chatId) {
	return api.sendMessage(chatId, "Hello! 👋");
}

async function handlePing (api, chatId) {
	return api.sendMessage(chatId, "Pong! 🏓");
}

async function handleUnknown (api, chatId) {
	return api.sendMessage(
		chatId,
		UNKNOWN_COMMAND_MESSAGE,
		MAIN_MENU_KEYBOARD
	);
}

export async function handleMessage (api, message, user) {
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