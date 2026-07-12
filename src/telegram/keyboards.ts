import {AuthorizedUser, BUTTONS} from "../config";
import {ReplyKeyboardMarkup} from "./types";

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