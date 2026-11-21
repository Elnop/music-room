type LogMethod = (message: string, context?: unknown) => void;

function write(print: (...args: unknown[]) => void, message: string, context: unknown): void {
	if (context === undefined) print(message);
	else print(message, context);
}

export const logger: Record<'debug' | 'info' | 'warn' | 'error', LogMethod> = {
	debug: (message, context) => {
		if (__DEV__) write(console.debug, message, context);
	},
	info: (message, context) => {
		if (__DEV__) write(console.info, message, context);
	},
	warn: (message, context) => write(console.warn, message, context),
	error: (message, context) => write(console.error, message, context),
};
