function timestamp(): string {
	return new Date().toISOString();
}

export function logInfo(message: string, ...args: unknown[]): void {
	console.log(`[${timestamp()}] [INFO] ${message}`, ...args);
}

export function logWarn(message: string, ...args: unknown[]): void {
	console.warn(`[${timestamp()}] [WARN] ${message}`, ...args);
}

export function logError(message: string, error: unknown): void {
	console.error(`[${timestamp()}] [ERROR] ${message}`, error);
}