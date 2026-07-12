import type {Env} from "../telegram/types";
import type {InventoryMetadata} from "../models/metadata";

export async function getInventoryMetadata (
    env: Env,
): Promise<InventoryMetadata | null> {
    const result = await env.DB
        .prepare(`
      SELECT
        last_updated AS lastUpdated,
        updated_by AS updatedBy
      FROM metadata
      WHERE id = 1
    `)
        .first<InventoryMetadata>();

    return result ?? null;
}