import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '@/shared/utils/logger.js';

const { env } = vi.hoisted(() => ({ env: { NODE_ENV: 'test' } }));

vi.mock('@/shared/config/env.js', () => ({ env }));

describe('logger', () => {
	let append: ReturnType<typeof vi.spyOn>;
	let consoleLog: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		env.NODE_ENV = 'test';
		append = vi.spyOn(fs, 'appendFileSync').mockImplementation(() => undefined);
		consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
	});

	it('writes a JSON line with level, message and meta to the file and stdout', () => {
		logger.warn('Something odd', { id: 1 });

		const line = String(append.mock.calls[0][1]);
		expect(JSON.parse(line)).toMatchObject({
			level: 'warn',
			message: 'Something odd',
			meta: { id: 1 },
		});
		expect(JSON.parse(String(consoleLog.mock.calls[0][0]))).toMatchObject({ level: 'warn' });
	});

	it('prints readable text in development', () => {
		env.NODE_ENV = 'development';
		logger.info('Started', { port: 3000 });

		expect(consoleLog).toHaveBeenCalledWith('[INFO] Started', { port: 3000 });
	});

	it('drops debug outside development', () => {
		logger.debug('detail');
		expect(append).not.toHaveBeenCalled();

		env.NODE_ENV = 'development';
		logger.debug('detail');
		expect(append).toHaveBeenCalledTimes(1);
	});
});
