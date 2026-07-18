import type {InventoryItem} from "../models/inventory";
import type {OrderWorkflowState} from "../models/orderWorkflow";

export function formatOrdersScreen (state: OrderWorkflowState): string {
	const lines = [
		"📋 Pending Orders",
		"",
		"Select the items that have been ordered:",
		"",
	];

	for (const item of state.items) {
		const selected = state.selectedNames.includes(item.name) ? "☑" : "☐";
		lines.push(`${selected} ${item.name} (${item.quantity})`);
	}

	lines.push(
		"",
		`Selected: ${state.selectedNames.length}`,
		"",
		"Mark selected items as ordered when finished.",
	);

	return lines.join("\n");
}

export function formatOrdersCompleted (orderedCount: number): string {
	return `✅ ${orderedCount} item${orderedCount === 1 ? "" : "s"} marked as ordered.`;
}

export function formatNoPendingOrders (): string {
	return "📋 There are no pending orders right now.";
}

export function formatLowInventoryNotification (
	items: InventoryItem[],
): string {
	return [
		"⚠️ Low inventory detected",
		"",
		...items.map((item) => `• ${item.name} (${item.quantity})`),
		"",
		"Please review the pending orders.",
	].join("\n");
}

export function formatDailyOrderReminder (
	items: InventoryItem[],
): string {
	return [
		"⏰ Pending order reminder",
		"",
		...items.map((item) => `• ${item.name} (${item.quantity})`),
		"",
		"Please review and update the order status when ready.",
	].join("\n");
}
