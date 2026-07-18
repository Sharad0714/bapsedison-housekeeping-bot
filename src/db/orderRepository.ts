import type {Env} from "../index";
import type {InventoryItem} from "../models/inventory";

export async function getPendingOrders (
	env: Env,
): Promise<InventoryItem[]> {
	const result = await env.DB
		.prepare(`
			SELECT
				name,
				quantity,
				status
			FROM inventory
			WHERE status = 'PENDING'
			ORDER BY name
		`)
		.all<InventoryItem>();

	return result.results;
}

export interface MarkOrdersResult {
	orderedCount: number;
}

export async function markOrdersAsOrdered (
	env: Env,
	itemNames: string[],
): Promise<MarkOrdersResult> {
	if (itemNames.length === 0) {
		return {orderedCount: 0};
	}

	const placeholders = itemNames.map(() => "?").join(", ");
	const [result] = await env.DB.batch([
		env.DB
			.prepare(`
				UPDATE inventory
				SET status = 'ORDERED'
				WHERE status = 'PENDING'
				AND name IN (${placeholders})
			`)
			.bind(...itemNames),
	]);

	return {
		orderedCount: result.meta.changes,
	};
}
