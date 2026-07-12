export const BOT_NAME = "BAPS Edison Housekeeping Bot";

export const BUTTONS = {
	INVENTORY: "📦 Inventory",
	UPDATE_INVENTORY: "📝 Update Inventory",
	MANAGE_ITEMS: "⚙️ Manage Items",
	ORDERS: "🛒 Orders",
	HELP: "❓ Help",
} as const;

export const CHAT_TYPES = {
	PRIVATE: "private",
	GROUP: "group",
	SUPERGROUP: "supergroup",
	CHANNEL: "channel",
} as const;

export type ChatType = typeof CHAT_TYPES[keyof typeof CHAT_TYPES];

export type UserRole = "ADMIN" | "USER";

export interface AuthorizedUser {
	readonly name: string;
	readonly role: UserRole;
}

export const AUTHORIZED_USERS: Record<number, AuthorizedUser> = {
	530983335: {
		name: "Abhishekbhai",
		role: "ADMIN",
	},
	478019899: {
		name: "Akashbhai",
		role: "USER",
	},
	713070311: {
		name: "Hiralbhai",
		role: "USER",
	},
	345966894: {
		name: "Rajbhai",
		role: "USER",
	},
	189953614: {
		name: "Sharadbhai",
		role: "USER",
	},
	1100272978: {
		name: "Smitbhai",
		role: "USER",
	},
	414307985: {
		name: "Vasavbhai",
		role: "USER",
	},
	507718756: {
		name: "Vipulbhai",
		role: "USER",
	}
} as const satisfies Record<number, AuthorizedUser>;

export const LOW_STOCK_THRESHOLD = 5;

export const SESSION_TIMEOUT = 15 * 60 * 1000;