import { env } from '@/shared/config/env.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The only backend code allowed to touch `console`. Every entry is a JSON line in backend/logs/app.log;
// the console gets readable text in development and the same JSON line elsewhere.

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

type LogMetadata =
	string | number | boolean | null | undefined | Error | Record<string, unknown> | unknown[];

// From backend/src/shared/utils/ to backend/logs/
const logsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../logs');
const logFilePath = path.join(logsDir, 'app.log');

if (!fs.existsSync(logsDir)) {
	try {
		fs.mkdirSync(logsDir, { recursive: true });
	} catch (error) {
		// The file sink is best effort: never block startup on it.
		console.error('Failed to create logs directory:', error);
	}
}

function writeToFile(logEntry: Record<string, unknown>): void {
	try {
		fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n', 'utf8');
	} catch (error) {
		// Never block the application on a failed file write; say so in development.
		if (env.NODE_ENV === 'development') {
			console.error('Failed to write to log file:', error);
		}
	}
}

function log(level: LogLevel, message: string, meta?: LogMetadata): void {
	const logEntry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...(meta && { meta }),
	};

	writeToFile(logEntry);

	if (env.NODE_ENV === 'development') {
		console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
	} else {
		console.log(JSON.stringify(logEntry));
	}
}

export const logger = {
	info: (message: string, meta?: LogMetadata) => log('info', message, meta),
	warn: (message: string, meta?: LogMetadata) => log('warn', message, meta),
	error: (message: string, meta?: LogMetadata) => log('error', message, meta),
	debug: (message: string, meta?: LogMetadata) => {
		if (env.NODE_ENV === 'development') log('debug', message, meta);
	},
};
