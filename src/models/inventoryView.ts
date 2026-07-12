import type {InventoryItem} from "./inventory";
import type {InventoryMetadata} from "./metadata";

export interface InventoryView {
	items: InventoryItem[];
	metadata: InventoryMetadata | null;
}