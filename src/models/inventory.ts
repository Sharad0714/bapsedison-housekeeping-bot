export type InventoryStatus = "NONE" | "PENDING" | "ORDERED";

export interface InventoryItem {
	name: string;
	quantity: number;
	status: InventoryStatus;
}