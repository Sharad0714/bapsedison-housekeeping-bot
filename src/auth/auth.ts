import {AUTHORIZED_USERS} from "../config";
import type {AuthorizedUser} from "../config";

export function getAuthorizedUser (
	telegramUserId: number
): AuthorizedUser | null {
	return AUTHORIZED_USERS[telegramUserId] ?? null;
}