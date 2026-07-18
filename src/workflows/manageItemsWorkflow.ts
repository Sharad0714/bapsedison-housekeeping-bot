import type {AuthorizedUser} from "../config";
import {
	addInventoryItem,
	deleteInventoryItems,
	getInventory,
	getInventoryItemCaseInsensitive,
} from "../db/inventoryRepository";
import {
	formatAddItemCompleted,
	formatAddItemEnterName,
	formatAddItemEnterQuantity,
	formatAddItemReview,
	formatManageItemsMenu,
	formatNoItemsToRemove,
	formatRemoveItemsCompleted,
	formatRemoveItemsScreen,
} from "../formatters/manageItemsFormatter";
import type {ActiveWorkflow} from "../models/activeWorkflow";
import {
	MANAGE_ITEMS_WORKFLOW,
	type ManageItemsState,
} from "../models/manageItems";
import {
	endWorkflow,
	getActiveWorkflow,
	startWorkflow,
	updateWorkflow,
} from "../services/activeWorkflowService";
import {getStatusAfterUpdate} from "../services/inventoryService";
import type {TelegramClient} from "../telegram/api";
import {
	getManageItemsCancelKeyboard,
	getManageItemsMenuKeyboard,
	getManageItemsReviewKeyboard,
	getMainMenuKeyboard,
	getRemoveItemsKeyboard,
} from "../telegram/keyboards";
import {WORKFLOW_LOCKED_MESSAGE} from "../telegram/responses";
import type {CallbackQuery, Message} from "../telegram/types";
import type {Env} from "../index";

export async function startManageItemsWorkflow (
	env: Env,
	api: TelegramClient,
	chatId: number,
	userId: number,
	user: AuthorizedUser,
): Promise<void> {
	if (await getActiveWorkflow(env)) {
		await api.sendMessage(chatId, WORKFLOW_LOCKED_MESSAGE, getMainMenuKeyboard(user));
		return;
	}

	const now = Date.now();
	const state: ManageItemsState = {
		chatId,
		state: "MENU",
	};
	const workflow: ActiveWorkflow = {
		workflow: MANAGE_ITEMS_WORKFLOW,
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
		await api.sendMessage(
			chatId,
			formatManageItemsMenu(),
			getManageItemsMenuKeyboard(),
		);
	} catch (error) {
		await endWorkflow(env);
		throw error;
	}
}

export async function handleManageItemsMessage (
	env: Env,
	api: TelegramClient,
	message: Message,
	user: AuthorizedUser,
): Promise<boolean> {
	const userId = message.from?.id;
	if (userId === undefined) return false;

	const owned = await getOwnedManageItemsWorkflow(env, userId);
	if (!owned || owned.state.chatId !== message.chat.id) {
		return false;
	}

	const text = message.text?.trim() ?? "";

	if (text === "❌ Cancel") {
		await endWorkflow(env);
		await api.sendMessage(
			message.chat.id,
			"❌ Manage items cancelled.",
			getMainMenuKeyboard(user)
		);
		return true;
	}

	switch (owned.state.state) {
		case "MENU":
			if (text === "➕ Add Item") {
				await persistAndRenderAddName(env, api, owned.workflow, owned.state);
				return true;
			}
			if (text === "🗑️ Remove Items") {
				await persistAndRenderRemoveSelect(env, api, owned.workflow, owned.state);
				return true;
			}
			await api.sendMessage(
				message.chat.id,
				"Please use the menu buttons below.",
				getManageItemsMenuKeyboard()
			);
			return true;

		case "ADD_ENTER_NAME":
			if (!text) {
				await persistAndRenderAddName(
					env,
					api,
					owned.workflow,
					owned.state,
					"Please enter a valid name."
				);
				return true;
			}

			const existing = await getInventoryItemCaseInsensitive(env, text);
			if (existing) {
				await persistAndRenderAddName(
					env,
					api,
					owned.workflow,
					owned.state,
					`An item named "${existing.name}" already exists.`
				);
				return true;
			}

			const nameState: ManageItemsState = {
				...owned.state,
				state: "ADD_ENTER_QUANTITY",
				addName: text,
			};
			await persistAndRenderAddQuantity(env, api, owned.workflow, nameState);
			return true;

		case "ADD_ENTER_QUANTITY":
			const quantity = parseQuantity(text);
			if (quantity === null) {
				await persistAndRenderAddQuantity(
					env,
					api,
					owned.workflow,
					owned.state,
					"Enter a non-negative whole number, such as 0 or 12."
				);
				return true;
			}

			const quantityState: ManageItemsState = {
				...owned.state,
				state: "ADD_REVIEW",
				addQuantity: quantity,
			};
			await persistAndRenderAddReview(env, api, owned.workflow, quantityState);
			return true;

		case "ADD_REVIEW":
		case "REMOVE_SELECT":
			// Messages ignored in inline callback states
			await api.sendMessage(
				message.chat.id,
				"Please use the buttons in the previous message to continue."
			);
			return true;
	}

	return false;
}

export async function handleManageItemsCallback (
	env: Env,
	api: TelegramClient,
	callbackQuery: CallbackQuery,
	user: AuthorizedUser,
): Promise<boolean> {
	const data = callbackQuery.data;
	if (!data?.startsWith("manage_items:")) {
		return false;
	}

	const message = callbackQuery.message;
	if (!message) {
		await api.answerCallbackQuery(callbackQuery.id, "This action is no longer available.");
		return true;
	}

	const owned = await getOwnedManageItemsWorkflow(env, callbackQuery.from.id);
	if (!owned || owned.state.chatId !== message.chat.id) {
		if (owned) await endWorkflow(env);
		await api.answerCallbackQuery(callbackQuery.id, "This workflow is no longer active.");
		return true;
	}

	switch (data) {
		case "manage_items:cancel":
			await api.answerCallbackQuery(callbackQuery.id);
			await endWorkflow(env);
			await api.editMessageText(
				message.chat.id,
				message.message_id,
				"❌ Manage items cancelled.",
			);
			await api.sendMessage(message.chat.id, "Use the menu below to continue.", getMainMenuKeyboard(user));
			return true;

		case "manage_items:add:back":
			if (owned.state.state !== "ADD_REVIEW") {
				await api.answerCallbackQuery(callbackQuery.id, "Cannot go back from here.");
				return true;
			}
			await api.answerCallbackQuery(callbackQuery.id);
			await api.editMessageText(
				message.chat.id,
				message.message_id,
				"Going back...",
			);
			await persistAndRenderAddQuantity(env, api, owned.workflow, {
				...owned.state,
				state: "ADD_ENTER_QUANTITY",
			});
			return true;

		case "manage_items:add:save":
			if (
				owned.state.state !== "ADD_REVIEW" ||
				!owned.state.addName ||
				owned.state.addQuantity === undefined
			) {
				await api.answerCallbackQuery(callbackQuery.id, "Invalid state.");
				return true;
			}

			await api.answerCallbackQuery(callbackQuery.id);
			const addResult = await addInventoryItem(
				env,
				owned.state.addName,
				owned.state.addQuantity,
				getStatusAfterUpdate("NONE", owned.state.addQuantity),
				new Date().toISOString(),
				user.name,
			);

			await endWorkflow(env);

			if (addResult.added) {
				await api.editMessageText(
					message.chat.id,
					message.message_id,
					formatAddItemCompleted(owned.state.addName),
				);
			} else {
				await api.editMessageText(
					message.chat.id,
					message.message_id,
					`❌ Failed to add "${owned.state.addName}". It might already exist.`,
				);
			}
			await api.sendMessage(message.chat.id, "Use the menu below to continue.", getMainMenuKeyboard(user));
			return true;

		case "manage_items:remove:confirm":
			if (
				owned.state.state !== "REMOVE_SELECT" ||
				!owned.state.removeSelectedNames
			) {
				await api.answerCallbackQuery(callbackQuery.id, "Invalid state.");
				return true;
			}
			if (owned.state.removeSelectedNames.length === 0) {
				await api.answerCallbackQuery(callbackQuery.id, "Select at least one item first.");
				return true;
			}

			await api.answerCallbackQuery(callbackQuery.id);
			const removeResult = await deleteInventoryItems(
				env,
				owned.state.removeSelectedNames,
				new Date().toISOString(),
				user.name,
			);

			await endWorkflow(env);
			await api.editMessageText(
				message.chat.id,
				message.message_id,
				formatRemoveItemsCompleted(removeResult.deletedCount),
			);
			await api.sendMessage(message.chat.id, "Use the menu below to continue.", getMainMenuKeyboard(user));
			return true;

		default:
			if (data.startsWith("manage_items:remove:toggle:")) {
				const index = parseToggleIndex(data);
				if (
					index === null ||
					owned.state.state !== "REMOVE_SELECT" ||
					!owned.state.removeItems?.[index]
				) {
					await api.answerCallbackQuery(callbackQuery.id, "Invalid item.");
					return true;
				}

				await api.answerCallbackQuery(callbackQuery.id);
				const item = owned.state.removeItems[index];
				const selectedNames = new Set(owned.state.removeSelectedNames ?? []);

				if (selectedNames.has(item.name)) {
					selectedNames.delete(item.name);
				} else {
					selectedNames.add(item.name);
				}

				const newState: ManageItemsState = {
					...owned.state,
					removeSelectedNames: Array.from(selectedNames),
				};

				await updateWorkflow(env, {
					...owned.workflow,
					state: newState.state,
					data: JSON.stringify(newState),
					updatedAt: Date.now(),
				});

				await api.editMessageText(
					newState.chatId,
					newState.messageId!,
					formatRemoveItemsScreen(newState),
					getRemoveItemsKeyboard(newState),
				);
				return true;
			}
			
			await api.answerCallbackQuery(callbackQuery.id, "Unknown action.");
			return true;
	}
}

async function persistAndRenderAddName (
	env: Env,
	api: TelegramClient,
	workflow: ActiveWorkflow,
	state: ManageItemsState,
	errorMessage?: string,
): Promise<void> {
	const newState: ManageItemsState = {
		...state,
		state: "ADD_ENTER_NAME",
		addName: undefined,
		addQuantity: undefined,
		removeItems: undefined,
		removeSelectedNames: undefined,
	};
	await updateWorkflow(env, {
		...workflow,
		state: newState.state,
		data: JSON.stringify(newState),
		updatedAt: Date.now(),
	});
	await api.sendMessage(
		newState.chatId,
		formatAddItemEnterName(errorMessage),
		getManageItemsCancelKeyboard(),
	);
}

async function persistAndRenderAddQuantity (
	env: Env,
	api: TelegramClient,
	workflow: ActiveWorkflow,
	state: ManageItemsState,
	errorMessage?: string,
): Promise<void> {
	await updateWorkflow(env, {
		...workflow,
		state: state.state,
		data: JSON.stringify(state),
		updatedAt: Date.now(),
	});
	await api.sendMessage(
		state.chatId,
		formatAddItemEnterQuantity(state, errorMessage),
		getManageItemsCancelKeyboard(),
	);
}

async function persistAndRenderAddReview (
	env: Env,
	api: TelegramClient,
	workflow: ActiveWorkflow,
	state: ManageItemsState,
): Promise<void> {
	const message = await api.sendMessage(
		state.chatId,
		formatAddItemReview(state),
		getManageItemsReviewKeyboard(),
	);
	const newState: ManageItemsState = {
		...state,
		messageId: message.message_id,
	};
	await updateWorkflow(env, {
		...workflow,
		state: newState.state,
		data: JSON.stringify(newState),
		updatedAt: Date.now(),
	});
}

async function persistAndRenderRemoveSelect (
	env: Env,
	api: TelegramClient,
	workflow: ActiveWorkflow,
	state: ManageItemsState,
): Promise<void> {
	const items = await getInventory(env);
	
	if (items.length === 0) {
		await api.sendMessage(state.chatId, formatNoItemsToRemove(), getManageItemsCancelKeyboard());
		return;
	}

	const newState: ManageItemsState = {
		...state,
		state: "REMOVE_SELECT",
		removeItems: items,
		removeSelectedNames: [],
		addName: undefined,
		addQuantity: undefined,
	};
	
	const message = await api.sendMessage(
		newState.chatId,
		formatRemoveItemsScreen(newState),
		getRemoveItemsKeyboard(newState),
	);
	
	newState.messageId = message.message_id;

	await updateWorkflow(env, {
		...workflow,
		state: newState.state,
		data: JSON.stringify(newState),
		updatedAt: Date.now(),
	});
}

interface OwnedManageItemsWorkflow {
	workflow: ActiveWorkflow;
	state: ManageItemsState;
}

async function getOwnedManageItemsWorkflow (
	env: Env,
	userId: number,
): Promise<OwnedManageItemsWorkflow | null> {
	const workflow = await getActiveWorkflow(env);
	if (!workflow || workflow.workflow !== MANAGE_ITEMS_WORKFLOW || workflow.userId !== userId) {
		return null;
	}

	const state = parseManageItemsState(workflow);
	if (!state) {
		await endWorkflow(env);
		return null;
	}

	return {workflow, state};
}

function parseManageItemsState (
	workflow: ActiveWorkflow,
): ManageItemsState | null {
	let value: unknown;
	try {
		value = JSON.parse(workflow.data) as unknown;
	} catch {
		return null;
	}

	if (!isRecord(value)) return null;
	if (
		typeof value.state !== "string" ||
		typeof value.chatId !== "number" ||
		(value.messageId !== undefined && typeof value.messageId !== "number")
	) {
		return null;
	}

	const state: ManageItemsState = {
		state: value.state as any,
		chatId: value.chatId,
		messageId: value.messageId,
	};

	if (typeof value.addName === "string") state.addName = value.addName;
	if (typeof value.addQuantity === "number") state.addQuantity = value.addQuantity;

	if (Array.isArray(value.removeItems)) {
		state.removeItems = value.removeItems as any;
	}
	if (Array.isArray(value.removeSelectedNames)) {
		state.removeSelectedNames = value.removeSelectedNames as string[];
	}

	return state;
}

function parseQuantity (value: string): number | null {
	if (!/^\d+$/.test(value)) return null;
	const quantity = Number(value);
	return Number.isSafeInteger(quantity) ? quantity : null;
}

function parseToggleIndex (data: string): number | null {
	const value = Number(data.slice("manage_items:remove:toggle:".length));
	return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function isRecord (value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
