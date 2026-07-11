import {AUTHORIZED_USERS} from "../config.js";

export function getAuthorizedUser (telegramUserId) {
	return AUTHORIZED_USERS[ telegramUserId ] || null;
}

export function isAuthorized (telegramUserId) {
	return Boolean(getAuthorizedUser(telegramUserId));
}