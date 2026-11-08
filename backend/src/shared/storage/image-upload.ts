import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { AppError } from '@/shared/middleware/error-handler.js';

/** Also the limit of the `avatars` and `playlist-covers` buckets (migrations 027 and 031). */
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

interface ImageUploadOptions {
	field: string;
	label: string;
	maxBytes?: number;
}

/** The client's MIME type is ignored: the type is checked later, from the bytes. */
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

/** multer caps the size and the bytes give the type: only presence is checked here. */
export function uploadedImageSchema(field: string, label: string) {
	return z.object(
		{
			buffer: z.instanceof(Buffer),
			size: z.number().int().positive(`The ${label} is empty`),
		},
		{ error: `A ${label} is required in the multipart field "${field}"` }
	);
}
