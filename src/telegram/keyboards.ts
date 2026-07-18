import {AuthorizedUser, BUTTONS} from "../config";
import type {OrderWorkflowState} from "../models/orderWorkflow";
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

export function getOrdersKeyboard (
	state: OrderWorkflowState,
): InlineKeyboardMarkup {
	const keyboard: InlineKeyboardMarkup["inline_keyboard"] = state.items.map(
		(item, index) => {
			const selected = state.selectedNames.includes(item.name) ? "☑" : "☐";

			return [{
				text: `${selected} ${item.name} (${item.quantity})`,
				callback_data: `orders:toggle:${index}`,
			}];
		},
	);

	keyboard.push([
		{text: "✅ Mark Selected as Ordered", callback_data: "orders:confirm"},
	]);
	keyboard.push([
		{text: "❌ Cancel", callback_data: "orders:cancel"},
	]);

	return {inline_keyboard: keyboard};
}

export function getOrdersNotificationKeyboard (): InlineKeyboardMarkup {
	return {
		inline_keyboard: [[
			{text: "📋 Review Orders", callback_data: "orders:start"},
		]],
	};
}
