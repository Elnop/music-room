import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AppError } from '@/shared/middleware/error-handler.js';

const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

interface ImageUploadOptions {
	field: string;
	label: string;
	maxBytes?: number;
}

export function imageUpload({ field, label, maxBytes = IMAGE_MAX_BYTES }: ImageUploadOptions) {
	const upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: maxBytes, files: 1, fields: 0 },
	}).single(field);
	const megabytes = maxBytes / (1024 * 1024);

	return (req: Request, res: Response, next: NextFunction): void => {
		upload(req, res, (error: unknown) => {
			if (!error) {
				next();
				return;
			}
			if (error instanceof multer.MulterError) {
				if (error.code === 'LIMIT_FILE_SIZE') {
					next(new AppError(413, `The ${label} must not exceed ${megabytes} MB`, 'FILE_TOO_LARGE'));
					return;
				}
				next(new AppError(400, `Invalid upload: ${error.message}`, 'INVALID_UPLOAD'));
				return;
			}
			next(
				new AppError(400, 'Invalid upload: the body must be multipart/form-data', 'INVALID_UPLOAD')
			);
		});
	};
}

export function uploadedImageSchema(field: string, label: string) {
	return z.object(
		{
			buffer: z.instanceof(Buffer),
			size: z.number().int().positive(`The ${label} is empty`),
		},
		{ error: `A ${label} is required in the multipart field "${field}"` }
	);
}
