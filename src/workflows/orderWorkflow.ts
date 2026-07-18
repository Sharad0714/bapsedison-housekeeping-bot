import {hasOrderAccess, type AuthorizedUser} from "../config";
import {getPendingOrders, markOrdersAsOrdered} from "../db/orderRepository";
import {
	formatNoPendingOrders,
	formatOrdersCompleted,
	formatOrdersScreen,
} from "../formatters/orderFormatter";
import type {ActiveWorkflow} from "../models/activeWorkflow";
import type {InventoryItem} from "../models/inventory";
import {
	ORDER_WORKFLOW,
	type OrderWorkflowState,
} from "../models/orderWorkflow";
import {
	endWorkflow,
	getActiveWorkflow,
	startWorkflow,
	updateWorkflow,
} from "../services/activeWorkflowService";
import type {TelegramClient} from "../telegram/api";
import {getMainMenuKeyboard, getOrdersKeyboard} from "../telegram/keyboards";
import {ORDERS_ADMIN_ONLY_MESSAGE, WORKFLOW_LOCKED_MESSAGE} from "../telegram/responses";
import type {CallbackQuery, Message} from "../telegram/types";
import type {Env} from "../index";

export async function startOrdersWorkflow (
	env: Env,
	api: TelegramClient,
	chatId: number,
	userId: number,
	user: AuthorizedUser,
): Promise<void> {
	if (!hasOrderAccess(user)) {
		await api.sendMessage(chatId, ORDERS_ADMIN_ONLY_MESSAGE, getMainMenuKeyboard(user));
		return;
	}

	const items = await getPendingOrders(env);

	if (items.length === 0) {
		await api.sendMessage(chatId, formatNoPendingOrders(), getMainMenuKeyboard(user));
		return;
	}

	if (await getActiveWorkflow(env)) {
		await api.sendMessage(chatId, WORKFLOW_LOCKED_MESSAGE, getMainMenuKeyboard(user));
		return;
	}

	const now = Date.now();
	const state: OrderWorkflowState = {
		items,
		selectedNames: [],
		chatId,
		state: "SELECT_ITEMS",
	};
	const workflow: ActiveWorkflow = {
		workflow: ORDER_WORKFLOW,
		userId,
		state: state.state,
		data: JSON.stringify(state),
		createdAt: now,
		updatedAt: now,
	};

	if (!await startWorkflow(env, workflow)) {
		await api.sendMessage(chatId, WORKFLOW_LOCKED_MESSAGE, getMainMenuKeyboard(user));
		return;
	}

	try {
		await persistAndRender(env, api, workflow, state);
	} catch (error) {
		await endWorkflow(env);
		throw error;
	}
}

export async function handleOrderCallback (
	env: Env,
	api: TelegramClient,
	callbackQuery: CallbackQuery,
	user: AuthorizedUser,
): Promise<boolean> {
	const data = callbackQuery.data;

	if (!data?.startsWith("orders:")) {
		return false;
	}

	const message = callbackQuery.message;

	if (!message) {
		await api.answerCallbackQuery(callbackQuery.id, "This action is no longer available.");
		return true;
	}

	if (data === "orders:start") {
		await api.answerCallbackQuery(callbackQuery.id);
		await startOrdersWorkflow(
			env,
			api,
			message.chat.id,
			callbackQuery.from.id,
			user,
		);
		return true;
	}

	const active = await getActiveWorkflow(env);
	const state = active ? parseOrderWorkflowState(active) : null;

	if (
		!active ||
		!state ||
		active.workflow !== ORDER_WORKFLOW ||
		active.userId !== callbackQuery.from.id ||
		state.chatId !== message.chat.id
	) {
		if (
			active &&
			active.workflow === ORDER_WORKFLOW &&
			active.userId === callbackQuery.from.id &&
			!state
		) {
			await endWorkflow(env);
		}

		await api.answerCallbackQuery(callbackQuery.id, "This workflow is no longer active.");
		return true;
	}

	switch (data) {
		case "orders:confirm":
			if (state.selectedNames.length === 0) {
				await api.answerCallbackQuery(callbackQuery.id, "Select at least one item first.");
				return true;
			}

			await api.answerCallbackQuery(callbackQuery.id);
			const result = await markOrdersAsOrdered(env, state.selectedNames);
			await endWorkflow(env);
			await api.editMessageText(
				message.chat.id,
				message.message_id,
				formatOrdersCompleted(result.orderedCount),
			);
			await api.sendMessage(
				message.chat.id,
				"Use the menu below to continue.",
				getMainMenuKeyboard(user),
			);
			return true;

		case "orders:cancel":
			await api.answerCallbackQuery(callbackQuery.id);
			await endWorkflow(env);
			await api.editMessageText(
				message.chat.id,
				message.message_id,
				"❌ Order management cancelled.",
			);
			await api.sendMessage(
				message.chat.id,
				"Use the menu below to continue.",
				getMainMenuKeyboard(user),
			);
			return true;

		default:
			if (!data.startsWith("orders:toggle:")) {
				await api.answerCallbackQuery(callbackQuery.id, "Unknown orders action.");
				return true;
			}

			const index = parseToggleIndex(data);

			if (index === null || !state.items[index]) {
				await api.answerCallbackQuery(callbackQuery.id, "This item is no longer available.");
				return true;
			}

			await api.answerCallbackQuery(callbackQuery.id);
			await persistAndRender(
				env,
				api,
				active,
				toggleOrderSelection(state, index),
			);
			return true;
	}
}

export function toggleOrderSelection (
	state: OrderWorkflowState,
	index: number,
): OrderWorkflowState {
	const item = state.items[index];

	if (!item) {
		return state;
	}

	const selected = new Set(state.selectedNames);

	if (selected.has(item.name)) {
		selected.delete(item.name);
	} else {
		selected.add(item.name);
	}

	return {
		...state,
		selectedNames: state.items
			.filter((candidate) => selected.has(candidate.name))
			.map((candidate) => candidate.name),
	};
}

async function persistAndRender (
	env: Env,
	api: TelegramClient,
	workflow: ActiveWorkflow,
	state: OrderWorkflowState,
): Promise<void> {
	let renderedState = state;

	if (state.messageId === undefined) {
		const sentMessage = await api.sendMessage(
			state.chatId,
			formatOrdersScreen(state),
			getOrdersKeyboard(state),
		);
		renderedState = {
			...state,
			messageId: sentMessage.message_id,
		};
	} else {
		await api.editMessageText(
			state.chatId,
			state.messageId,
			formatOrdersScreen(state),
			getOrdersKeyboard(state),
		);
	}

	const updated = await updateWorkflow(env, {
		...workflow,
		state: renderedState.state,
		data: JSON.stringify(renderedState),
		updatedAt: Date.now(),
	});

	if (!updated) {
		throw new Error("Order workflow is no longer active.");
	}
}

function parseOrderWorkflowState (
	workflow: ActiveWorkflow,
): OrderWorkflowState | null {
	let value: unknown;

	try {
		value = JSON.parse(workflow.data) as unknown;
	} catch {
		return null;
	}

	if (!isRecord(value) || !Array.isArray(value.items)) {
		return null;
	}

	const items = value.items.filter(isPendingItem);
	const selectedNames = value.selectedNames;
	const rawMessageId = value.messageId;

	if (
		items.length !== value.items.length ||
		items.length === 0 ||
		!Array.isArray(selectedNames) ||
		!selectedNames.every((name): name is string => typeof name === "string") ||
		!isSafeInteger(value.chatId) ||
		(rawMessageId !== undefined && !isSafeInteger(rawMessageId)) ||
		value.state !== "SELECT_ITEMS" ||
		workflow.state !== value.state
	) {
		return null;
	}

	const itemNames = new Set(items.map((item) => item.name));

	if (
		new Set(selectedNames).size !== selectedNames.length ||
		selectedNames.some((name) => !itemNames.has(name))
	) {
		return null;
	}

	return {
		items,
		selectedNames,
		chatId: value.chatId,
		messageId: rawMessageId,
		state: "SELECT_ITEMS",
	};
}

function parseToggleIndex (data: string): number | null {
	const value = Number(data.slice("orders:toggle:".length));

	return isSafeInteger(value) && value >= 0 ? value : null;
}

function isRecord (value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeInteger (value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value);
}

function isPendingItem (value: unknown): value is InventoryItem {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.name === "string" &&
		isSafeInteger(value.quantity) &&
		value.quantity >= 0 &&
		value.status === "PENDING"
	);
}
