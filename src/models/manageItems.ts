import type {InventoryItem} from "./inventory";

export const MANAGE_ITEMS_WORKFLOW = "MANAGE_ITEMS" as const;

export type ManageItemsStateName =
	| "MENU"
	| "ADD_ENTER_NAME"
	| "ADD_ENTER_QUANTITY"
	| "ADD_REVIEW"
	| "REMOVE_SELECT";

export interface ManageItemsState {
	chatId: number;
	messageId?: number;
	state: ManageItemsStateName;

	/** Add-item draft fields (only set during ADD_* states). */
	addName?: string;
	addQuantity?: number;

	/** Remove-items state (only set during REMOVE_SELECT). */
	removeItems?: InventoryItem[];
	removeSelectedNames?: string[];
}
