import type {InventoryItem} from "./inventory";

export const INVENTORY_UPDATE_WORKFLOW = "UPDATE_INVENTORY" as const;

export type InventoryUpdateStateName = "ENTER_QUANTITY" | "REVIEW";

export interface InventoryUpdateState {
	items: InventoryItem[];
	currentIndex: number;
	draft: Record<string, number>;
	chatId: number;
	messageId?: number;
	state: InventoryUpdateStateName;
}
