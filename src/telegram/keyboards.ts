import {AuthorizedUser, BUTTONS} from "../config";
import type {InventoryUpdateState} from "../models/inventoryUpdate";
import {ReplyKeyboardMarkup} from "./types";
import type {InlineKeyboardMarkup} from "./types";

export function getMainMenuKeyboard (user: AuthorizedUser) {
	const keyboard: ReplyKeyboardMarkup["keyboard"] = [
		[{text: BUTTONS.INVENTORY}],
		[{text: BUTTONS.UPDATE_INVENTORY}],
		[{text: BUTTONS.MANAGE_ITEMS}],
	];

	if (user.role === "ADMIN" || user.role === "DEVELOPER") {
		keyboard.push([{text: BUTTONS.ORDERS}]);
	}

	keyboard.push([{text: BUTTONS.HELP}]);

	return {
		keyboard,
		resize_keyboard: true,
		is_persistent: true,
	};
}

export function getInventoryUpdateKeyboard (
	state: InventoryUpdateState,
): InlineKeyboardMarkup {
	if (state.state === "REVIEW") {
		return {
			inline_keyboard: [
				[{text: "✅ Save", callback_data: "inventory_update:save"}],
				[
					{text: "⬅️ Back", callback_data: "inventory_update:back"},
					{text: "❌ Cancel", callback_data: "inventory_update:cancel"},
				],
			],
		};
	}

	const navigation: InlineKeyboardMarkup["inline_keyboard"] = [];

	if (state.currentIndex > 0) {
		navigation.push([
			{text: "⬅️ Back", callback_data: "inventory_update:back"},
		]);
	}

	navigation.push([
		{text: "❌ Cancel", callback_data: "inventory_update:cancel"},
	]);

	return {inline_keyboard: navigation};
}
