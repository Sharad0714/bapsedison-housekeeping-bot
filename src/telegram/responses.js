import {BOT_NAME} from "../config.js";

export const WELCOME_MESSAGE = `
🙏 Welcome to ${BOT_NAME}!

Use the menu below to get started.

🚧 Inventory features are currently under development.
`.trim();

export const HELP_MESSAGE = `
Welcome!

Use the buttons below to navigate the bot.

📦 Inventory
View the current inventory.

📝 Update Inventory
Update quantities for inventory items.

⚙️ Manage Items
Add, edit, or remove inventory items.

More features will be added soon.
`.trim();

export const UNKNOWN_COMMAND_MESSAGE =
	"Sorry, I didn't understand that. Please use the menu below.";

export const COMING_SOON_MESSAGE =
	"🚧 This feature is coming soon.";