import type {Env} from "../index";
import type {InventoryStatus} from "../models/inventory";

export interface InventoryChange {
	name: string;
	quantity: number;
	status: InventoryStatus;
}

export async function saveInventoryChanges (
	env: Env,
	changes: InventoryChange[],
	updatedAt: string,
	updatedBy: string,
): Promise<void> {
	const statements = changes.map((change) =>
		env.DB
			.prepare(`
				UPDATE inventory
				SET quantity = ?, status = ?
				WHERE name = ?
			`)
			.bind(change.quantity, change.status, change.name)
	);

	statements.push(
		env.DB
			.prepare(`
				INSERT INTO metadata (id, last_updated, updated_by)
				VALUES (1, ?, ?)
				ON CONFLICT(id) DO UPDATE SET
					last_updated = excluded.last_updated,
					updated_by = excluded.updated_by
			`)
			.bind(updatedAt, updatedBy)
	);

	await env.DB.batch(statements);
}
