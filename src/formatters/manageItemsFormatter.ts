import type {ManageItemsState} from "../models/manageItems";

export function formatManageItemsMenu (): string {
	return [
		"⚙️ Manage Items",
		"",
		"Choose an action:",
	].join("\n");
}

export function formatAddItemEnterName (errorMessage?: string): string {
	const lines = [
		"➕ Add Item",
		"",
		"Enter the name of the new item.",
	];

	if (errorMessage) {
		lines.unshift(`⚠️ ${errorMessage}`, "");
	}

	return lines.join("\n");
}

export function formatAddItemEnterQuantity (
	state: ManageItemsState,
	errorMessage?: string,
): string {
	const lines = [
		"➕ Add Item",
		"",
		`Item: ${state.addName}`,
		"",
		"Enter the initial quantity as a whole number.",
	];

	if (errorMessage) {
		lines.unshift(`⚠️ ${errorMessage}`, "");
	}

	return lines.join("\n");
}

export function formatAddItemReview (state: ManageItemsState): string {
	return [
		"➕ Add Item — Review",
		"",
		`Name: ${state.addName}`,
		`Quantity: ${state.addQuantity}`,
		"",
		"Choose Save to add this item, or Cancel to discard.",
	].join("\n");
}

export function formatAddItemCompleted (name: string): string {
	return `✅ "${name}" has been added to inventory.`;
}

export function formatRemoveItemsScreen (state: ManageItemsState): string {
	const items = state.removeItems ?? [];
	const selected = new Set(state.removeSelectedNames ?? []);

	const lines = [
		"🗑️ Remove Items",
		"",
		"Select the items to remove:",
		"",
	];

	for (const item of items) {
		const check = selected.has(item.name) ? "☑" : "☐";
		lines.push(`${check} ${item.name} (${item.quantity})`);
	}

	lines.push(
		"",
		`Selected: ${selected.size}`,
		"",
		"Confirm to permanently delete selected items.",
	);

	return lines.join("\n");
}

export function formatRemoveItemsCompleted (count: number): string {
	return `✅ ${count} item${count === 1 ? "" : "s"} removed from inventory.`;
}

export function formatNoItemsToRemove (): string {
	return "There are no inventory items to remove.";
}
