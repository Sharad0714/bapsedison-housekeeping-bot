import { AUTHORIZED_USERS } from "../../config";

export function getAuthorizedUser(telegramUserId: number) {
	return AUTHORIZED_USERS[telegramUserId] ?? null;
}

export function isAuthorized(telegramUserId: number): boolean {
	return getAuthorizedUser(telegramUserId) !== null;
}