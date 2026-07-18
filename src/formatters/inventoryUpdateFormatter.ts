import type {InventoryUpdateState} from "../models/inventoryUpdate";
import type {InventoryItem} from "../models/inventory";

export function formatInventoryUpdateScreen (
	state: InventoryUpdateState,
	errorMessage?: string,
): string {
	if (state.state === "REVIEW") {
		const review = formatInventoryUpdateReview(state);
		return errorMessage ? `⚠️ ${errorMessage}\n\n${review}` : review;
	}

	const item = state.items[state.currentIndex];
	const draftValue = state.draft[item.name];
	const lines = [
		"📝 Update Inventory",
		"",
		`Item ${state.currentIndex + 1} of ${state.items.length}`,
		"",
		item.name,
		`Current quantity: ${item.quantity}`,
	];

	if (typeof draftValue === "number") {
		lines.push(`Previously entered: ${draftValue}`);
	}

	lines.push(
		"",
		"Enter the new quantity as a whole number.",
	);

	if (errorMessage) {
		lines.unshift(`⚠️ ${errorMessage}`, "");
	}

	return lines.join("\n");
}

function formatInventoryUpdateReview (
	state: InventoryUpdateState,
): string {
	const lines = [
		"🔎 Review Inventory Update",
		"",
	];

	for (const item of state.items) {
		lines.push(
			item.name,
			`${item.quantity} → ${state.draft[item.name]}`,
			"",
		);
	}

	lines.push("Choose Save to apply these changes, or go back to edit.");

	return lines.join("\n");
}

export function formatInventoryUpdateCompleted (
	changedItemCount: number,
	newlyPendingItems: InventoryItem[],
): string {
	const lines = [
		"✅ Inventory updated successfully.",
		`${changedItemCount} item${changedItemCount === 1 ? "" : "s"} changed.`,
	];

	if (newlyPendingItems.length > 0) {
		lines.push(
			"",
			"Items now requiring ordering:",
			...newlyPendingItems.map((item) => `• ${item.name} (${item.quantity})`),
		);
	}

	return lines.join("\n");
}
