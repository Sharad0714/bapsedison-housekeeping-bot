function timestamp () {
	return new Date().toISOString();
}

export function logInfo (message, ...args) {
	console.log(`[${timestamp()}] [INFO] ${message}`, ...args);
}

export function logWarn (message, ...args) {
	console.warn(`[${timestamp()}] [WARN] ${message}`, ...args);
}

export function logError (message, error) {
	console.error(`[${timestamp()}] [ERROR] ${message}`, error);
}