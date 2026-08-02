import {env} from "cloudflare:workers";
import {describe, expect, it} from "vitest";
import {
	AUTHORIZED_USERS,
	getAllAuthorizedUserIds,
	getInventoryReminderRecipientIds,
	getNotificationRecipientIds,
	hasManageAccess,
	hasOrderAccess,
} from "../src/config";
import {saveInventoryChanges} from "../src/db/inventoryUpdateRepository";
import {formatInventoryUpdateReminder} from "../src/formatters/orderFormatter";
import {
	sendInventoryUpdateReminder,
	sendPendingOrderReminder,
} from "../src/services/notificationService";
import type {TelegramClient} from "../src/telegram/api";
import type {Message} from "../src/telegram/types";
import {
	getCutoffTimestamps,
	getInventoryReminderLevel,
	isInventoryReminderTime,
	isOrderReminderTime,
	toEasternTime,
} from "../src/utils/dateUtils";
import {startManageItemsWorkflow} from "../src/workflows/manageItemsWorkflow";

class MockTelegramClient implements TelegramClient {
	public sentMessages: {chatId: number; text: string; replyMarkup?: object}[] = [];

	async sendMessage (
		chatId: number,
		text: string,
		replyMarkup?: object,
	): Promise<Message> {
		this.sentMessages.push({chatId, text, replyMarkup});
		return {
			message_id: 1,
			date: Math.floor(Date.now() / 1000),
			chat: {id: chatId, type: "private"},
			text,
		};
	}

	async editMessageText (): Promise<void> {}
	async answerCallbackQuery (): Promise<void> {}
}

describe("Date and Time Utilities", () => {
	it("converts UTC Date to Eastern Time components correctly (EDT)", () => {
		// 2026-07-26T16:00:00Z is 12:00 PM EDT (UTC-4) on Sunday
		const utcDate = new Date("2026-07-26T16:00:00Z");
		const et = toEasternTime(utcDate);

		expect(et.year).toBe(2026);
		expect(et.month).toBe(7);
		expect(et.day).toBe(26);
		expect(et.hour).toBe(12);
		expect(et.minute).toBe(0);
		expect(et.dayOfWeek).toBe(0); // Sunday
	});

	it("converts UTC Date to Eastern Time components correctly (EST)", () => {
		// 2026-01-15T17:00:00Z is 12:00 PM EST (UTC-5) on Thursday
		const utcDate = new Date("2026-01-15T17:00:00Z");
		const et = toEasternTime(utcDate);

		expect(et.year).toBe(2026);
		expect(et.month).toBe(1);
		expect(et.day).toBe(15);
		expect(et.hour).toBe(12);
		expect(et.minute).toBe(0);
		expect(et.dayOfWeek).toBe(4); // Thursday
	});

	it("calculates cutoff timestamps correctly relative to Saturday Jul 26, 2026 noon ET", () => {
		const now = new Date("2026-07-26T16:00:00Z"); // Sat Jul 26 2026 12:00 ET (Wait: Jul 26 2026 is Sunday, Jul 25 is Saturday!)
		// Let's create an explicit date in ET for Sat Jul 25, 2026 12:00 PM ET
		// In EDT (UTC-4), 12:00 PM ET = 16:00 UTC.
		const satJul25NoonET = new Date("2026-07-25T16:00:00Z");

		const {lastSunday7PM, previousSunday7PM, twoWeeksAgoSunday7PM} =
			getCutoffTimestamps(satJul25NoonET);

		// Most recent Sunday 7 PM ET before Sat Jul 25 2026 noon is Sun Jul 19 2026 7 PM ET
		const expectedLastSun7PM = new Date("2026-07-19T23:00:00Z").getTime(); // 19:00 ET = 23:00 UTC
		expect(lastSunday7PM).toBe(expectedLastSun7PM);
		expect(previousSunday7PM).toBe(expectedLastSun7PM - 7 * 86400 * 1000);
		expect(twoWeeksAgoSunday7PM).toBe(expectedLastSun7PM - 14 * 86400 * 1000);
	});

	it("evaluates reminder escalation levels according to week rules", () => {
		const satJul25NoonET = new Date("2026-07-25T16:00:00Z");

		// Case A: Updated on Mon Jul 20 9 AM ET (after Sun Jul 19 7 PM)
		const updatedMonJul20 = "2026-07-20T13:00:00.000Z";
		expect(getInventoryReminderLevel(updatedMonJul20, satJul25NoonET)).toBe("none");

		// Case B (0th week grace period): Updated on Sat Jul 18 noon ET (between Sun Jul 12 7 PM and Sun Jul 19 7 PM)
		const updatedSatJul18 = "2026-07-18T16:00:00.000Z";
		expect(getInventoryReminderLevel(updatedSatJul18, satJul25NoonET)).toBe("none");

		// Case C (1 missed weekend): Updated on Sat Jul 11 noon ET (between Sun Jul 5 7 PM and Sun Jul 12 7 PM)
		const updatedSatJul11 = "2026-07-11T16:00:00.000Z";
		expect(getInventoryReminderLevel(updatedSatJul11, satJul25NoonET)).toBe("weekend");

		// Case D (2+ missed weekends): Updated on Sat Jul 4 noon ET (before Sun Jul 5 7 PM)
		const updatedSatJul4 = "2026-07-04T16:00:00.000Z";
		expect(getInventoryReminderLevel(updatedSatJul4, satJul25NoonET)).toBe("escalated");

		// Case E: Never updated
		expect(getInventoryReminderLevel(null, satJul25NoonET)).toBe("escalated");
	});

	it("identifies reminder trigger times correctly", () => {
		// 8:00 AM ET Mon-Sun
		const mon8am = toEasternTime(new Date("2026-07-20T12:00:00Z")); // Mon 8am EDT
		const sat8am = toEasternTime(new Date("2026-07-25T12:00:00Z")); // Sat 8am EDT
		const satNoon = toEasternTime(new Date("2026-07-25T16:00:00Z")); // Sat 12pm EDT
		const sat730pm = toEasternTime(new Date("2026-07-25T23:30:00Z")); // Sat 7:30pm EDT
		const wed3pm = toEasternTime(new Date("2026-07-22T19:00:00Z")); // Wed 3pm EDT

		expect(isOrderReminderTime(mon8am)).toBe(true);
		expect(isOrderReminderTime(sat8am)).toBe(true);
		expect(isOrderReminderTime(satNoon)).toBe(false);

		expect(isInventoryReminderTime(mon8am)).toBe(true); // Weekday 8am
		expect(isInventoryReminderTime(sat8am)).toBe(false); // Weekend 8am not an inventory slot
		expect(isInventoryReminderTime(satNoon)).toBe(true); // Weekend 12pm
		expect(isInventoryReminderTime(sat730pm)).toBe(true); // Weekend 7:30pm
		expect(isInventoryReminderTime(wed3pm)).toBe(false);
	});
});

describe("User Roles and Access Controls", () => {
	it("removes DEVELOPER role and defines only ADMIN and USER", () => {
		const adminUser = AUTHORIZED_USERS[189953614]; // Sharadbhai
		expect(adminUser.role).toBe("ADMIN");
		expect(hasOrderAccess(adminUser)).toBe(true);
		expect(hasManageAccess(adminUser)).toBe(true);

		const regularUser = AUTHORIZED_USERS[713070311]; // Hiralbhai
		expect(regularUser.role).toBe("USER");
		expect(hasOrderAccess(regularUser)).toBe(false);
		expect(hasManageAccess(regularUser)).toBe(false);
	});

	it("returns all user IDs for inventory notifications", () => {
		const allIds = getAllAuthorizedUserIds();
		const configuredRecipientIds = getNotificationRecipientIds();

		expect(allIds.length).toBe(Object.keys(AUTHORIZED_USERS).length);
		// Admin recipient IDs should be a subset of all user IDs
		expect(configuredRecipientIds.every((id) => allIds.includes(id))).toBe(true);
	});

	it("blocks non-admin users from starting manage items workflow", async () => {
		const api = new MockTelegramClient();
		const regularUser = AUTHORIZED_USERS[713070311];

		await startManageItemsWorkflow({DB: env.DB} as any, api, 12345, 713070311, regularUser);

		expect(api.sentMessages.length).toBe(1);
		expect(api.sentMessages[0].text).toContain("Managing items is available only to an administrator");
	});
});

describe("Inventory Reminder Service Integration", () => {
	it("sends no notification if inventory was updated within grace period", async () => {
		const api = new MockTelegramClient();

		// Save an update as of 3 days ago relative to Sat Jul 25 2026
		const updatedAt = "2026-07-22T12:00:00.000Z";
		await saveInventoryChanges(
			{DB: env.DB} as any,
			[],
			updatedAt,
			"Sharadbhai",
		);

		const satJul25NoonET = new Date("2026-07-25T16:00:00Z");
		const result = await sendInventoryUpdateReminder(
			{DB: env.DB} as any,
			api,
			satJul25NoonET,
		);

		expect(result.deliveredRecipientIds.length).toBe(0);
		expect(api.sentMessages.length).toBe(0);
	});

	it("delivers reminder to group chat when 1 missed weekend occurs", async () => {
		const api = new MockTelegramClient();

		// Save an update from 2 weeks ago relative to Sat Jul 25 2026
		const updatedAt = "2026-07-11T12:00:00.000Z";
		await saveInventoryChanges(
			{DB: env.DB} as any,
			[],
			updatedAt,
			"Sharadbhai",
		);

		const satJul25NoonET = new Date("2026-07-25T16:00:00Z");
		const result = await sendInventoryUpdateReminder(
			{DB: env.DB} as any,
			api,
			satJul25NoonET,
		);

		const groupRecipientIds = getInventoryReminderRecipientIds();
		expect(result.deliveredRecipientIds).toEqual([-1001585472452]);
		expect(api.sentMessages.length).toBe(1);
		expect(api.sentMessages[0].chatId).toBe(-1001585472452);
		expect(api.sentMessages[0].text).toContain("Inventory Update Reminder");
	});

	it("formats reminder message correctly when never updated", () => {
		const message = formatInventoryUpdateReminder(null, null);
		expect(message).toContain("Inventory Update Reminder");
		expect(message).toContain("Last updated: Never");
	});
});
