import { env } from '@/shared/config/env.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Metadata that can be logged alongside messages
 * Can be primitives, objects, arrays, or errors
 */
type LogMetadata =
	string | number | boolean | null | undefined | Error | Record<string, unknown> | unknown[];

/**
 * Get the project root directory (backend/)
 */
function getProjectRoot(): string {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	// From backend/src/shared/utils/ → backend/
	return path.resolve(__dirname, '../../../');
}

/**
 * Ensure logs directory exists
 */
function ensureLogDirectory(): string {
	const projectRoot = getProjectRoot();
	const logsDir = path.join(projectRoot, 'logs');

	if (!fs.existsSync(logsDir)) {
		try {
			fs.mkdirSync(logsDir, { recursive: true });
		} catch (error) {
			// Silently fail if unable to create directory
			console.error('Failed to create logs directory:', error);
		}
	}

	return logsDir;
}

class Logger {
	private logsDir: string;
	private logFilePath: string;

	constructor() {
		this.logsDir = ensureLogDirectory();
		this.logFilePath = path.join(this.logsDir, 'app.log');
	}

	/**
	 * Write log entry to file
	 */
	private writeToFile(logEntry: Record<string, unknown>): void {
		try {
			const logLine = JSON.stringify(logEntry) + '\n';
			fs.appendFileSync(this.logFilePath, logLine, 'utf8');
		} catch (error) {
			// Silently fail - don't block the application if file write fails
			// Only log to console in development
			if (env.NODE_ENV === 'development') {
				console.error('Failed to write to log file:', error);
			}
		}
	}
	private log(level: LogLevel, message: string, meta?: LogMetadata) {
		const timestamp = new Date().toISOString();
		const logEntry = {
			timestamp,
			level,
			message,
			...(meta && { meta }),
		};

		// Write to file (always, in both dev and prod)
		this.writeToFile(logEntry);

		// Console output
		if (env.NODE_ENV === 'development') {
			console.log(`[${level.toUpperCase()}] ${message}`, meta || '');
		} else {
			// Production: JSON to stdout (for Docker logs)
			console.log(JSON.stringify(logEntry));
		}
	}

	info(message: string, meta?: LogMetadata) {
		this.log('info', message, meta);
	}

	warn(message: string, meta?: LogMetadata) {
		this.log('warn', message, meta);
	}

	error(message: string, meta?: LogMetadata) {
		this.log('error', message, meta);
	}

	debug(message: string, meta?: LogMetadata) {
		if (env.NODE_ENV === 'development') {
			this.log('debug', message, meta);
		}
	}
}

export const logger = new Logger();
