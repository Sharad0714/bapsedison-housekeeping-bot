import {getNotificationRecipientIds} from "../config";
import {getPendingOrders} from "../db/orderRepository";
import {
	formatDailyOrderReminder,
	formatLowInventoryNotification,
} from "../formatters/orderFormatter";
import type {InventoryItem} from "../models/inventory";
import {getOrdersNotificationKeyboard} from "../telegram/keyboards";
import type {TelegramClient} from "../telegram/api";
import {logError, logWarn} from "../utils/logger";
import type {Env} from "../index";

export interface NotificationDeliveryResult {
	recipientIds: number[];
	deliveredRecipientIds: number[];
	failedRecipientIds: number[];
}

export async function notifyNewLowInventory (
	api: TelegramClient,
	items: InventoryItem[],
): Promise<NotificationDeliveryResult> {
	if (items.length === 0) {
		return emptyDeliveryResult();
	}

	return deliverNotification(
		api,
		formatLowInventoryNotification(items),
		getOrdersNotificationKeyboard(),
	);
}

export async function sendPendingOrderReminder (
	env: Env,
	api: TelegramClient,
): Promise<NotificationDeliveryResult> {
	const items = await getPendingOrders(env);

	if (items.length === 0) {
		return emptyDeliveryResult();
	}

	return deliverNotification(
		api,
		formatDailyOrderReminder(items),
		getOrdersNotificationKeyboard(),
	);
}

export async function deliverNotification (
	api: TelegramClient,
	text: string,
	replyMarkup?: object,
): Promise<NotificationDeliveryResult> {
	const recipientIds = getNotificationRecipientIds();

	if (recipientIds.length === 0) {
		logWarn("No notification recipients are configured.");
		return emptyDeliveryResult();
	}

	return deliverNotificationToRecipients(api, recipientIds, text, replyMarkup);
}

export async function deliverNotificationToRecipients (
	api: TelegramClient,
	recipientIds: number[],
	text: string,
	replyMarkup?: object,
): Promise<NotificationDeliveryResult> {
	if (recipientIds.length === 0) {
		return emptyDeliveryResult();
	}

	const deliveryResults = await Promise.all(
		recipientIds.map(async (recipientId) => {
			try {
				await api.sendMessage(recipientId, text, replyMarkup);
				return {recipientId, delivered: true};
			} catch (error) {
				logError(
					`Failed to deliver notification to Telegram user ${recipientId}.`,
					error,
				);
				return {recipientId, delivered: false};
			}
		}),
	);

	return {
		recipientIds,
		deliveredRecipientIds: deliveryResults
			.filter((result) => result.delivered)
			.map((result) => result.recipientId),
		failedRecipientIds: deliveryResults
			.filter((result) => !result.delivered)
			.map((result) => result.recipientId),
	};
}

function emptyDeliveryResult (): NotificationDeliveryResult {
	return {
		recipientIds: [],
		deliveredRecipientIds: [],
		failedRecipientIds: [],
	};
}
