import type {Env} from "..";
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