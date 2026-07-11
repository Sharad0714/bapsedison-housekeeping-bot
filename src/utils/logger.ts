function timestamp(): string {
	return new Date().toISOString();
}

function format(level: "INFO" | "WARN" | "ERROR", message: string): string {
	return `[${timestamp()}] [${level}] ${message}`;
}

export function logInfo(message: string, ...args: unknown[]): void {
	console.log(format("INFO", message), ...args);
}

export function logWarn(message: string, ...args: unknown[]): void {
	console.warn(format("WARN", message), ...args);
}

export function logError(message: string, ...args: unknown[]): void {
	console.error(format("ERROR", message), ...args);
}