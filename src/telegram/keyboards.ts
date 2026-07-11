import { BUTTONS } from "../config";

export const MAIN_MENU_KEYBOARD = {
	keyboard: [
		[{ text: BUTTONS.INVENTORY }],
		[{ text: BUTTONS.UPDATE_INVENTORY }],
		[{ text: BUTTONS.MANAGE_ITEMS }],
	],
	resize_keyboard: true,
	one_time_keyboard: false,
	is_persistent: true,
};