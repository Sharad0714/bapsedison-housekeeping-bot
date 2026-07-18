import type {InventoryItem} from "./inventory";

export const ORDER_WORKFLOW = "ORDERS" as const;

export type OrderWorkflowStateName = "SELECT_ITEMS";

export interface OrderWorkflowState {
	items: InventoryItem[];
	selectedNames: string[];
	chatId: number;
	messageId?: number;
	state: OrderWorkflowStateName;
}
