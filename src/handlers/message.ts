import {BUTTONS, BOT_NAME, hasOrderAccess} from "../config";
import type {AuthorizedUser} from "../config";
import type {TelegramClient} from "../telegram/api";
import {getMainMenuKeyboard} from "../telegram/keyboards";
import {Message} from "../telegram/types";
import {UNKNOWN_COMMAND_MESSAGE} from "../telegram/responses";
import {Env} from "..";
import {getInventoryView} from "../services/inventoryService";
import {formatInventory} from "../formatters/inventoryFormatter";
import {
	handleInventoryUpdateMessage,
	startInventoryUpdateWorkflow,
} from "../workflows/inventoryUpdateWorkflow";
import {startOrdersWorkflow} from "../workflows/orderWorkflow";

export async function handleMessage (
	env: Env,
	api: TelegramClient,
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
			const inventory = await getInventoryView(env);
			await api.sendMessage(chatId, formatInventory(inventory), getMainMenuKeyboard(user));
			return;

		case "/update":
			if (message.from?.id === undefined) {
				return;
			}

			await startInventoryUpdateWorkflow(
				env,
				api,
				chatId,
				message.from.id,
				user,
			);
			return;

		case "/manage":
			await api.sendMessage(chatId, "⚙️ Manage Items coming soon.");
			return;

		case "/orders":
			if (message.from?.id === undefined) {
				return;
			}

			await startOrdersWorkflow(env, api, chatId, message.from.id, user);
			return;

		case "/help":
			await sendHelpMessage(api, chatId, user);
			return;

		default:
			if (await handleInventoryUpdateMessage(env, api, message)) {
				return;
			}

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

		case BUTTONS.ORDERS:
			return "/orders";

		case BUTTONS.HELP:
			return "/help";

		default:
			return text;
	}
}

async function sendWelcomeMessage (
	api: TelegramClient,
	chatId: number,
	user: AuthorizedUser
): Promise<void> {
	await api.sendMessage(
		chatId,
		getWelcomeMessage(user),
		getMainMenuKeyboard(user)
	);
}

export function getWelcomeMessage (user: AuthorizedUser): string {
	return `Jay Swaminarayan, ${user.name}.
Welcome to ${BOT_NAME}!

Use the menu below to navigate the inventory system.`;
}

async function sendHelpMessage (
	api: TelegramClient,
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

	if (hasOrderAccess(user)) {
		sections.push(
			"",
			"📋 Orders",
			"View and manage supply orders."
		);
	}

	return sections.join("\n");
}
