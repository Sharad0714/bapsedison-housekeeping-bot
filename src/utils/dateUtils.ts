export interface ETComponents {
	year: number;
	month: number; // 1-12
	day: number; // 1-31
	hour: number; // 0-23
	minute: number; // 0-59
	dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export type InventoryReminderLevel = "none" | "weekend" | "escalated";

/**
 * Converts a UTC Date object or timestamp to Eastern Time components.
 * Uses Intl.DateTimeFormat to automatically handle EDT (UTC-4) and EST (UTC-5).
 */
export function toEasternTime (date: Date): ETComponents {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/New_York",
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		weekday: "short",
		hour12: false,
	});

	const parts = formatter.formatToParts(date);
	const partMap: Record<string, string> = {};
	for (const p of parts) {
		partMap[p.type] = p.value;
	}

	const weekdayMap: Record<string, number> = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
	};

	let hour = Number.parseInt(partMap.hour, 10);
	if (hour === 24) {
		hour = 0;
	}

	return {
		year: Number.parseInt(partMap.year, 10),
		month: Number.parseInt(partMap.month, 10),
		day: Number.parseInt(partMap.day, 10),
		hour,
		minute: Number.parseInt(partMap.minute, 10),
		dayOfWeek: weekdayMap[partMap.weekday] ?? 0,
	};
}

/**
 * Calculates the Eastern Time cutoff timestamps relative to a given `now` Date.
 * Cutoffs are defined at Sunday 7:00 PM ET.
 *
 * - lastSunday7PM: Most recent Sunday 7:00 PM ET preceding or equal to `now`.
 * - previousSunday7PM: 7 days before lastSunday7PM.
 * - twoWeeksAgoSunday7PM: 14 days before lastSunday7PM.
 */
export function getCutoffTimestamps (now: Date): {
	lastSunday7PM: number;
	previousSunday7PM: number;
	twoWeeksAgoSunday7PM: number;
} {
	const et = toEasternTime(now);

	// Determine how many days back the most recent Sunday 7:00 PM ET occurred.
	// If today is Sunday (dayOfWeek == 0):
	//   if hour >= 19 (7 PM or later), then today's 7 PM IS the most recent Sunday 7 PM.
	//   if hour < 19, then the previous Sunday (7 days ago) at 7 PM is the most recent.
	// If today is Monday..Saturday (dayOfWeek 1..6):
	//   the most recent Sunday was `dayOfWeek` days ago.
	let daysBack: number;
	if (et.dayOfWeek === 0) {
		if (et.hour >= 19) {
			daysBack = 0;
		} else {
			daysBack = 7;
		}
	} else {
		daysBack = et.dayOfWeek;
	}

	// We construct a UTC date that represents Sunday 19:00 ET.
	// To do this accurately, we find the date string for that Sunday in ET.
	const targetDate = new Date(now.getTime() - daysBack * 86400 * 1000);
	const targetET = toEasternTime(targetDate);

	// Construct ISO string for Sunday 19:00 ET and parse via Date constructor with ET offset detection.
	// We format YYYY-MM-DD for targetET in ET.
	const pad = (n: number) => String(n).padStart(2, "0");
	const dateStr = `${targetET.year}-${pad(targetET.month)}-${pad(targetET.day)}T19:00:00`;

	// Determine offset at that specific Sunday 19:00 ET
	const probeDate = new Date(`${dateStr}-04:00`);
	const probeET = toEasternTime(probeDate);
	const isEDT = probeET.hour === 19;
	const offsetStr = isEDT ? "-04:00" : "-05:00";

	const lastSunday7PM = new Date(`${dateStr}${offsetStr}`).getTime();
	const previousSunday7PM = lastSunday7PM - 7 * 86400 * 1000;
	const twoWeeksAgoSunday7PM = lastSunday7PM - 14 * 86400 * 1000;

	return {
		lastSunday7PM,
		previousSunday7PM,
		twoWeeksAgoSunday7PM,
	};
}

/**
 * Determines the reminder escalation level based on last updated timestamp and current time.
 *
 * Rules:
 * - `lastUpdated` is null: 'escalated'
 * - `lastUpdated` >= lastSunday7PM: 'none' (updated in current week after Sunday 7pm)
 * - `lastUpdated` >= previousSunday7PM: 'none' (0th missed week - updated in week prior to last Sunday 7pm)
 * - `lastUpdated` >= twoWeeksAgoSunday7PM: 'weekend' (1 full weekend missed)
 * - `lastUpdated` < twoWeeksAgoSunday7PM: 'escalated' (2+ full weekends missed)
 */
export function getInventoryReminderLevel (
	lastUpdated: string | null,
	now: Date = new Date(),
): InventoryReminderLevel {
	if (!lastUpdated) {
		return "escalated";
	}

	const updatedTime = new Date(lastUpdated).getTime();
	if (Number.isNaN(updatedTime)) {
		return "escalated";
	}

	const {lastSunday7PM, previousSunday7PM, twoWeeksAgoSunday7PM} =
		getCutoffTimestamps(now);

	if (updatedTime >= lastSunday7PM) {
		return "none";
	}

	if (updatedTime >= previousSunday7PM) {
		return "none";
	}

	if (updatedTime >= twoWeeksAgoSunday7PM) {
		return "weekend";
	}

	return "escalated";
}

/**
 * Checks if the ET time corresponds to an 8:00 AM trigger (daily pending order & weekday escalated reminder).
 */
export function isOrderReminderTime (et: ETComponents): boolean {
	return et.hour === 8 && et.minute === 0;
}

/**
 * Checks if the ET time corresponds to an inventory reminder trigger slot:
 * - Weekend (Sat/Sun) at 12:00 PM ET or 7:30 PM ET
 * - Weekday (Mon-Fri) at 8:00 AM ET
 */
export function isInventoryReminderTime (et: ETComponents): boolean {
	const isWeekend = et.dayOfWeek === 0 || et.dayOfWeek === 6;
	const isNoon = et.hour === 12 && et.minute === 0;
	const isEvening = et.hour === 19 && et.minute === 30;

	if (isWeekend && (isNoon || isEvening)) {
		return true;
	}

	const isWeekday = et.dayOfWeek >= 1 && et.dayOfWeek <= 5;
	const isMorning = et.hour === 8 && et.minute === 0;

	if (isWeekday && isMorning) {
		return true;
	}

	return false;
}
