import type {Env} from "..";
import {LOW_STOCK_THRESHOLD} from "../config";
import {saveInventoryChanges} from "../db/inventoryUpdateRepository";
import type {InventoryItem, InventoryStatus} from "../models/inventory";
import type {InventoryView} from "../models/inventoryView";

import {getInventory} from "../db/inventoryRepository";
import {getInventoryMetadata} from "../db/metadataRepository";

export async function getInventoryView (
	env: Env,
): Promise<InventoryView> {
	const [items, metadata] = await Promise.all([
		getInventory(env),
		getInventoryMetadata(env),
	]);

	return {
		items,
		metadata,
	};
}

export interface InventorySaveResult {
	changedItemCount: number;
	newlyPendingItems: string[];
}

export async function saveInventoryUpdate (
	env: Env,
	items: InventoryItem[],
	draft: Record<string, number>,
	updatedBy: string,
): Promise<InventorySaveResult> {
	const changes = items.map((item) => {
		const quantity = draft[item.name];

		if (!Number.isSafeInteger(quantity) || quantity < 0) {
			throw new Error(`Invalid quantity for inventory item: ${item.name}`);
		}

		return {
			name: item.name,
			quantity,
			status: getStatusAfterUpdate(item.status, quantity),
		};
	});

	const updatedAt = new Date().toISOString();

	await saveInventoryChanges(env, changes, updatedAt, updatedBy);

	return {
		changedItemCount: changes.filter((change, index) =>
			change.quantity !== items[index].quantity
		).length,
		newlyPendingItems: changes
			.filter((change, index) =>
				change.status === "PENDING" &&
				items[index].status !== "PENDING"
			)
			.map((change) => change.name),
	};
}

function getStatusAfterUpdate (
	currentStatus: InventoryStatus,
	quantity: number,
): InventoryStatus {
	if (quantity > LOW_STOCK_THRESHOLD) {
		return "NONE";
	}

	if (currentStatus === "ORDERED") {
		return "ORDERED";
	}

	return "PENDING";
}
