import type {AuthorizedUser} from "../config";
import {getInventory} from "../db/inventoryRepository";
import {formatInventoryUpdateCompleted, formatInventoryUpdateScreen} from "../formatters/inventoryUpdateFormatter";
import type {ActiveWorkflow} from "../models/activeWorkflow";
import type {InventoryItem, InventoryStatus} from "../models/inventory";
import {
	INVENTORY_UPDATE_WORKFLOW,
	type InventoryUpdateState,
} from "../models/inventoryUpdate";
import {saveInventoryUpdate} from "../services/inventoryService";
import {
	endWorkflow,
	getActiveWorkflow,
	startWorkflow,
	updateWorkflow,
} from "../services/activeWorkflowService";
import type {TelegramClient} from "../telegram/api";
import {getInventoryUpdateKeyboard, getMainMenuKeyboard} from "../telegram/keyboards";
import {WORKFLOW_LOCKED_MESSAGE} from "../telegram/responses";
import {notifyNewLowInventory} from "../services/notificationService";
import type {CallbackQuery, Message} from "../telegram/types";
import type {Env} from "../index";

export async function startInventoryUpdateWorkflow (
	env: Env,
	api: TelegramClient,
	chatId: number,
	userId: number,
	user: AuthorizedUser,
): Promise<void> {
	const items = await getInventory(env);

	if (items.length === 0) {
		await api.sendMessage(
			chatId,
			"There are no inventory items to update yet. Add items from Manage Items first.",
			getMainMenuKeyboard(user),
		);
		return;
	}

	const active = await getActiveWorkflow(env);

	if (active) {
		if (active.userId === userId && active.workflow === INVENTORY_UPDATE_WORKFLOW) {
			await api.sendMessage(
				chatId,
				"Your inventory update is already in progress. Use the buttons in the previous message.",
				getMainMenuKeyboard(user),
			);
			return;
		}

		await api.sendMessage(chatId, WORKFLOW_LOCKED_MESSAGE, getMainMenuKeyboard(user));
		return;
	}

	const now = Date.now();
	const state: InventoryUpdateState = {
		items,
		currentIndex: 0,
		draft: {},
		chatId,
		state: "ENTER_QUANTITY",
	};
	const workflow: ActiveWorkflow = {
		workflow: INVENTORY_UPDATE_WORKFLOW,
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

export async function handleInventoryUpdateMessage (
	env: Env,
	api: TelegramClient,
	message: Message,
): Promise<boolean> {
	const userId = message.from?.id;

	if (userId === undefined) {
		return false;
	}

	const owned = await getOwnedInventoryUpdate(env, userId);

	if (!owned) {
		return false;
	}

	if (owned.state.chatId !== message.chat.id) {
		return false;
	}

	if (owned.state.state !== "ENTER_QUANTITY") {
		await persistAndRender(
			env,
			api,
			owned.workflow,
			owned.state,
			"Use the buttons below to save, go back, or cancel.",
		);
		return true;
	}

	const quantity = parseQuantity(message.text?.trim() ?? "");

	if (quantity === null) {
		await persistAndRender(
			env,
			api,
			owned.workflow,
			owned.state,
			"Enter a non-negative whole number, such as 0 or 12.",
		);
		return true;
	}

	const item = owned.state.items[owned.state.currentIndex];
	const draft = {
		...owned.state.draft,
		[item.name]: quantity,
	};
	const isLastItem = owned.state.currentIndex === owned.state.items.length - 1;
	const nextState: InventoryUpdateState = {
		...owned.state,
		draft,
		currentIndex: isLastItem
			? owned.state.currentIndex
			: owned.state.currentIndex + 1,
		state: isLastItem ? "REVIEW" : "ENTER_QUANTITY",
	};

	await persistAndRender(env, api, owned.workflow, nextState);
	return true;
}

export async function handleInventoryUpdateCallback (
	env: Env,
	api: TelegramClient,
	callbackQuery: CallbackQuery,
	user: AuthorizedUser,
): Promise<boolean> {
	const data = callbackQuery.data;

	if (!data?.startsWith("inventory_update:")) {
		return false;
	}

	const message = callbackQuery.message;

	if (!message) {
		await api.answerCallbackQuery(callbackQuery.id, "This action is no longer available.");
		return true;
	}

	const active = await getActiveWorkflow(env);
	const state = active ? parseInventoryUpdateState(active) : null;

	if (
		!active ||
		!state ||
		active.workflow !== INVENTORY_UPDATE_WORKFLOW ||
		active.userId !== callbackQuery.from.id ||
		state.chatId !== message.chat.id
	) {
		if (
			active &&
			active.workflow === INVENTORY_UPDATE_WORKFLOW &&
			active.userId === callbackQuery.from.id &&
			!state
		) {
			await endWorkflow(env);
		}

		await api.answerCallbackQuery(callbackQuery.id, "This workflow is no longer active.");
		return true;
	}

	switch (data) {
		case "inventory_update:back":
			if (state.state === "REVIEW") {
				await api.answerCallbackQuery(callbackQuery.id);
				await persistAndRender(env, api, active, {
					...state,
					currentIndex: state.items.length - 1,
					state: "ENTER_QUANTITY",
				});
				return true;
			}

			if (state.currentIndex === 0) {
				await api.answerCallbackQuery(callbackQuery.id, "Already at the first item.");
				return true;
			}

			await api.answerCallbackQuery(callbackQuery.id);
			await persistAndRender(env, api, active, {
				...state,
				currentIndex: state.currentIndex - 1,
			});
			return true;

		case "inventory_update:cancel":
			await api.answerCallbackQuery(callbackQuery.id);
			await endWorkflow(env);
			await api.editMessageText(message.chat.id, message.message_id, "❌ Inventory update cancelled.");
			await api.sendMessage(chatMessageId(message), "Use the menu below to continue.", getMainMenuKeyboard(user));
			return true;

		case "inventory_update:save":
			if (state.state !== "REVIEW") {
				await api.answerCallbackQuery(callbackQuery.id, "Enter a quantity for every item first.");
				return true;
			}

			await api.answerCallbackQuery(callbackQuery.id);
			const result = await saveInventoryUpdate(
				env,
				state.items,
				state.draft,
				user.name,
			);

			await endWorkflow(env);
			await notifyNewLowInventory(api, result.newlyPendingItems);
			await api.editMessageText(
				message.chat.id,
				message.message_id,
				formatInventoryUpdateCompleted(
					result.changedItemCount,
					result.newlyPendingItems,
				),
			);
			await api.sendMessage(chatMessageId(message), "Use the menu below to continue.", getMainMenuKeyboard(user));
			return true;

		default:
			await api.answerCallbackQuery(callbackQuery.id, "Unknown update action.");
			return true;
	}
}

interface OwnedInventoryUpdate {
	workflow: ActiveWorkflow;
	state: InventoryUpdateState;
}

async function getOwnedInventoryUpdate (
	env: Env,
	userId: number,
): Promise<OwnedInventoryUpdate | null> {
	const workflow = await getActiveWorkflow(env);

	if (
		!workflow ||
		workflow.workflow !== INVENTORY_UPDATE_WORKFLOW ||
		workflow.userId !== userId
	) {
		return null;
	}

	const state = parseInventoryUpdateState(workflow);

	if (!state) {
		await endWorkflow(env);
		return null;
	}

	return {workflow, state};
}

async function persistAndRender (
	env: Env,
	api: TelegramClient,
	workflow: ActiveWorkflow,
	state: InventoryUpdateState,
	errorMessage?: string,
): Promise<void> {
	let renderedState = state;

	if (state.messageId === undefined) {
		const sentMessage = await api.sendMessage(
			state.chatId,
			formatInventoryUpdateScreen(state, errorMessage),
			getInventoryUpdateKeyboard(state),
		);
		renderedState = {
			...state,
			messageId: sentMessage.message_id,
		};
	} else {
		await api.editMessageText(
			state.chatId,
			state.messageId,
			formatInventoryUpdateScreen(state, errorMessage),
			getInventoryUpdateKeyboard(state),
		);
	}

	const updated = await updateWorkflow(env, {
		...workflow,
		state: renderedState.state,
		data: JSON.stringify(renderedState),
		updatedAt: Date.now(),
	});

	if (!updated) {
		throw new Error("Inventory update workflow is no longer active.");
	}
}

function parseQuantity (value: string): number | null {
	if (!/^\d+$/.test(value)) {
		return null;
	}

	const quantity = Number(value);

	return Number.isSafeInteger(quantity) ? quantity : null;
}

function parseInventoryUpdateState (
	workflow: ActiveWorkflow,
): InventoryUpdateState | null {
	let value: unknown;

	try {
		value = JSON.parse(workflow.data) as unknown;
	} catch {
		return null;
	}

	if (!isRecord(value)) {
		return null;
	}

	const rawItems = value.items;
	const rawDraft = value.draft;
	const rawState = value.state;
	const rawIndex = value.currentIndex;
	const rawChatId = value.chatId;
	const rawMessageId = value.messageId;

	if (!Array.isArray(rawItems) || !isRecord(rawDraft)) {
		return null;
	}

	const items = rawItems.filter(isInventoryItem);

	if (items.length !== rawItems.length || items.length === 0) {
		return null;
	}

	if (
		(rawState !== "ENTER_QUANTITY" && rawState !== "REVIEW") ||
		!isSafeInteger(rawIndex) ||
		rawIndex < 0 ||
		rawIndex >= items.length ||
		!isSafeInteger(rawChatId) ||
		(rawMessageId !== undefined && !isSafeInteger(rawMessageId)) ||
		workflow.state !== rawState
	) {
		return null;
	}

	const draft: Record<string, number> = {};

	for (const [name, quantity] of Object.entries(rawDraft)) {
		if (!isSafeInteger(quantity) || quantity < 0) {
			return null;
		}

		draft[name] = quantity;
	}

	return {
		items,
		currentIndex: rawIndex,
		draft,
		chatId: rawChatId,
		messageId: rawMessageId,
		state: rawState,
	};
}

function isRecord (value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeInteger (value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value);
}

function isInventoryItem (value: unknown): value is InventoryItem {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.name === "string" &&
		isSafeInteger(value.quantity) &&
		value.quantity >= 0 &&
		isInventoryStatus(value.status)
	);
}

function isInventoryStatus (value: unknown): value is InventoryStatus {
	return value === "NONE" || value === "PENDING" || value === "ORDERED";
}

function chatMessageId (message: Message): number {
	return message.chat.id;
}
