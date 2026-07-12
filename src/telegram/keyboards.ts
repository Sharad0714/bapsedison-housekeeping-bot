import {AuthorizedUser, BUTTONS} from "../config";

export function getMainMenuKeyboard (user: AuthorizedUser) {
	const keyboard = [
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