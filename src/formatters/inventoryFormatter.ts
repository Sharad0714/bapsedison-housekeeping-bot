import {InventoryStatus} from "../models/inventory";
import type {InventoryView} from "../models/inventoryView";

const STATUS_LABEL: Record<InventoryStatus, string> = {
    NONE: "",
    PENDING: " ⚠️ Pending",
    ORDERED: " ✅ Ordered",
};

export function formatInventory (view: InventoryView): string {
    const lines: string[] = ["📦 Inventory", ""];

    if (view.items.length === 0) {
        lines.push("No inventory items found.");
    } else {
        for (const item of view.items) {
            lines.push(
                `${item.name}: ${item.quantity}${STATUS_LABEL[item.status] ?? ""}`,
            );
        }
    }

    lines.push("");
    lines.push("──────────────────");
    lines.push("");

    if (view.metadata?.lastUpdated) {
        const date = new Date(view.metadata.lastUpdated);

        lines.push("Last updated:");
        lines.push(date.toLocaleString());

        if (view.metadata.updatedBy) {
            lines.push(`By: ${view.metadata.updatedBy}`);
        }
    } else {
        lines.push("Last updated:");
        lines.push("Never");
    }

    return lines.join("\n");
}