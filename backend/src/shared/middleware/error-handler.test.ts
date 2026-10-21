import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError, errorHandler, sendError } from '@/shared/middleware/error-handler.js';

const { env, logger } = vi.hoisted(() => ({
	env: { NODE_ENV: 'test' },
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/shared/config/env.js', () => ({ env }));
vi.mock('@/shared/utils/logger.js', () => ({ logger }));

interface FakeResponse {
	statusCode?: number;
	body?: { success: boolean; error: Record<string, unknown>; meta: { timestamp: string } };
}

function run(err: Error, handle = errorHandler) {
	const res: FakeResponse = {};
	const fake = {
		status(code: number) {
			res.statusCode = code;
			return fake;
		},
		json(body: FakeResponse['body']) {
			res.body = body;
			return fake;
		},
	};
	const req = { path: '/api/x', method: 'POST' } as Request;
	handle(err, req, fake as unknown as Response, vi.fn() as NextFunction);
	return res;
}

describe('errorHandler', () => {
	beforeEach(() => {
		env.NODE_ENV = 'test';
	});

	it('answers a Zod error with 400 VALIDATION_ERROR and the issues in details', () => {
		const parsed = z.object({ name: z.string() }).safeParse({});
		const res = run(parsed.error as Error);

		expect(res.statusCode).toBe(400);
		expect(res.body).toMatchObject({
			success: false,
			error: {
				message: 'Validation error',
				code: 'VALIDATION_ERROR',
				details: [{ path: 'name', message: expect.any(String) }],
			},
			meta: { timestamp: expect.any(String) },
		});
		expect(logger.warn).toHaveBeenCalled();
	});

	it('sends an AppError with its status, code, details, why and fix outside production', () => {
		const res = run(
			new AppError(403, 'Not allowed', 'FORBIDDEN', { id: 1 }, { why: 'not owner', fix: 'ask' })
		);

		expect(res.statusCode).toBe(403);
		expect(res.body?.error).toEqual({
			message: 'Not allowed',
			code: 'FORBIDDEN',
			details: { id: 1 },
			why: 'not owner',
			fix: 'ask',
		});
	});

	it.each(['production', undefined, 'staging'])(
		'hides why and fix when NODE_ENV is %s but still logs them',
		nodeEnv => {
			(env as { NODE_ENV: string | undefined }).NODE_ENV = nodeEnv;
			const res = run(new AppError(409, 'Conflict', 'CONFLICT', undefined, { why: 'w', fix: 'f' }));

			expect(res.statusCode).toBe(409);
			expect(res.body?.error).toEqual({ message: 'Conflict', code: 'CONFLICT' });
			expect(logger.warn).toHaveBeenCalledWith(
				'Request rejected',
				expect.objectContaining({ status: 409, code: 'CONFLICT', why: 'w', fix: 'f' })
			);
		}
	);

	it('answers an error carrying a code with 400 and that code', () => {
		const err = Object.assign(new Error('duplicate key'), { code: '23505' });
		const res = run(err);

		expect(res.statusCode).toBe(400);
		expect(res.body?.error).toMatchObject({ message: 'duplicate key', code: '23505' });
	});

	it('passes a non-string code through untouched', () => {
		const numeric = run(Object.assign(new Error('odd'), { code: 42 }));
		const missing = run(Object.assign(new Error('odd'), { code: undefined }));

		expect(numeric.body?.error.code).toBe(42);
		expect(missing.body?.error.code).toBeUndefined();
	});

	it('answers an unknown error with 500 INTERNAL_ERROR, logged as an error with its stack', () => {
		const res = run(new Error('boom'));

		expect(res.statusCode).toBe(500);
		expect(res.body?.error).toMatchObject({
			message: 'Internal server error',
			code: 'INTERNAL_ERROR',
			why: 'boom',
		});
		expect(logger.error).toHaveBeenCalledWith(
			'Request failed',
			expect.objectContaining({ status: 500, error: 'boom', stack: expect.any(String) })
		);
	});

	it('does not leak the internal message of an unknown error in production', () => {
		env.NODE_ENV = 'production';
		const res = run(new Error('db password wrong'));

		expect(res.body?.error).toEqual({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
	});
});

describe('sendError', () => {
	it('answers with the same shape as errorHandler', () => {
		const res = run(
			new AppError(429, 'Slow down', 'RATE_LIMIT_EXCEEDED', { retryAfter: 'x' }),
			(err, req, response) => sendError(req, response, err as AppError)
		);

		expect(res.statusCode).toBe(429);
		expect(res.body).toMatchObject({
			success: false,
			error: { message: 'Slow down', code: 'RATE_LIMIT_EXCEEDED', details: { retryAfter: 'x' } },
			meta: { timestamp: expect.any(String) },
		});
	});
});
