import {
	zodToOpenAPIRegistry,
	type ResponseConfig,
	type ZodRequestBody,
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

const metaSchema = z.object({ timestamp: z.iso.datetime() });

/** `{ success: true, data, meta }`. */
function successEnvelope<T extends z.ZodType>(data: T) {
	return z.object({ success: z.literal(true), data, meta: metaSchema });
}

export function ok(description: string, data: z.ZodType): ResponseConfig {
	return { description, content: { 'application/json': { schema: successEnvelope(data) } } };
}

export function okMessage(description: string, message: string): ResponseConfig {
	return ok(description, z.object({ message: z.string().meta({ example: message }) }));
}

export function jsonBody(schema: z.ZodType, example?: unknown, required = true): ZodRequestBody {
	return {
		required,
		content: { 'application/json': { schema, ...(example !== undefined && { example }) } },
	};
}

/** Swagger UI shows the description next to the parameter. */
export function param<T extends z.ZodType>(schema: T, description: string): T {
	return schema.meta({ param: { description } });
}

export function describeParams<S extends Record<string, z.ZodType>>(
	schema: z.ZodObject<S>,
	descriptions: Partial<Record<keyof S & string, string>>
): z.ZodObject {
	const shape: Record<string, z.ZodType> = { ...schema.shape };
	for (const [name, description] of Object.entries(descriptions)) {
		if (description) shape[name] = param(schema.shape[name], description);
	}
	return z.object(shape);
}

/** Same as `registry.register`, which needs Zod extended before any schema exists (validators load first). */
export function nameSchemas(schemas: Record<string, z.ZodType>): void {
	for (const [refId, schema] of Object.entries(schemas)) {
		const current = zodToOpenAPIRegistry.get(schema);
		zodToOpenAPIRegistry.add(schema, { ...current, _internal: { ...current?._internal, refId } });
	}
}

/** Mounted in server.ts. */
export const healthSchema = z.object({
	status: z.literal('ok'),
	timestamp: z.iso.datetime(),
	uptime: z.number().meta({ description: 'Seconds since the process started' }),
	environment: z.string(),
	services: z.object({ redis: z.enum(['connected', 'disconnected']) }),
});

export const bearerAuth = [{ bearerAuth: [] }];
