import type {Env} from "../telegram/types";
import type {InventoryItem} from "../models/inventory";

export async function getInventory (
    env: Env,
): Promise<InventoryItem[]> {
    return env.DB
        .prepare(`
      SELECT
        name,
        quantity,
        status
      FROM inventory
      ORDER BY name
    `)
        .all<InventoryItem>()
        .then((result) => result.results);
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