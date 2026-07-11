import {BUTTONS} from "../config";

export function getMainMenuKeyboard () {
	return {
		keyboard: [
			[{text: BUTTONS.INVENTORY}],
			[{text: BUTTONS.UPDATE_INVENTORY}],
			[{text: BUTTONS.MANAGE_ITEMS}],
		],
		resize_keyboard: true,
		is_persistent: true,
	};
}

export function getMainMenuInlineKeyboard () {
	return {
		inline_keyboard: [
			[
				{text: BUTTONS.INVENTORY, callback_data: "inventory"},
			],
			[
				{text: BUTTONS.UPDATE_INVENTORY, callback_data: "update_inventory"},
			],
			[
				{text: BUTTONS.MANAGE_ITEMS, callback_data: "manage_items"},
			],
		],
	};
}