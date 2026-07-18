import type {Env} from "../index";
import type {InventoryItem, InventoryStatus} from "../models/inventory";

export async function getInventory (
	env: Env,
): Promise<InventoryItem[]> {
	const result = await env.DB
		.prepare(`
			SELECT
				name,
				quantity,
				status
			FROM inventory
			ORDER BY name
		`)
		.all<InventoryItem>();

	return result.results;
}

export async function getInventoryItem (
	env: Env,
	name: string,
): Promise<InventoryItem | null> {
	const result = await env.DB
		.prepare(`
			SELECT
				name,
				quantity,
				status
			FROM inventory
			WHERE name = ?
		`)
		.bind(name)
		.first<InventoryItem>();

	return result ?? null;
}

export async function getInventoryItemCaseInsensitive (
	env: Env,
	name: string,
): Promise<InventoryItem | null> {
	const result = await env.DB
		.prepare(`
			SELECT
				name,
				quantity,
				status
			FROM inventory
			WHERE name = ? COLLATE NOCASE
		`)
		.bind(name)
		.first<InventoryItem>();

	return result ?? null;
}

export interface AddItemResult {
	added: boolean;
}

export async function addInventoryItem (
	env: Env,
	name: string,
	quantity: number,
	status: InventoryStatus,
	updatedAt: string,
	updatedBy: string,
): Promise<AddItemResult> {
	const insertResult = await env.DB.batch([
		env.DB
			.prepare(`
				INSERT OR IGNORE INTO inventory (name, quantity, status)
				VALUES (?, ?, ?)
			`)
			.bind(name, quantity, status),
		env.DB
			.prepare(`
				INSERT INTO metadata (id, last_updated, updated_by)
				VALUES (1, ?, ?)
				ON CONFLICT(id) DO UPDATE SET
					last_updated = excluded.last_updated,
					updated_by = excluded.updated_by
			`)
			.bind(updatedAt, updatedBy),
	]);

	return {
		added: insertResult[0].meta.changes === 1,
	};
}

export interface DeleteItemsResult {
	deletedCount: number;
}

export async function deleteInventoryItems (
	env: Env,
	itemNames: string[],
	updatedAt: string,
	updatedBy: string,
): Promise<DeleteItemsResult> {
	if (itemNames.length === 0) {
		return {deletedCount: 0};
	}

	const placeholders = itemNames.map(() => "?").join(", ");
	const results = await env.DB.batch([
		env.DB
			.prepare(`
				DELETE FROM inventory
				WHERE name IN (${placeholders})
			`)
			.bind(...itemNames),
		env.DB
			.prepare(`
				INSERT INTO metadata (id, last_updated, updated_by)
				VALUES (1, ?, ?)
				ON CONFLICT(id) DO UPDATE SET
					last_updated = excluded.last_updated,
					updated_by = excluded.updated_by
			`)
			.bind(updatedAt, updatedBy),
	]);

	return {
		deletedCount: results[0].meta.changes,
	};
}