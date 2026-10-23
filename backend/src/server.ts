import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import swaggerUi from 'swagger-ui-express';
import { env } from '@/shared/config/env.js';
import { logger } from '@/shared/utils/logger.js';
import { AppError, errorHandler } from '@/shared/middleware/error-handler.js';
import { actionLoggerMiddleware } from '@/shared/middleware/action-logger.middleware.js';
import { routes } from '@/app/routes.js';
import * as socketServer from '@/realtime/socket-server.js';
import { connectRedis, disconnectRedis, checkRedisHealth } from '@/shared/config/redis.js';
import { swaggerSpec, swaggerUiOptions } from '@/app/openapi.js';
import { isOriginAllowed } from '@/shared/config/cors.config.js';
import { configureTrustProxy } from '@/shared/config/trust-proxy.js';

const app = express();
configureTrustProxy(app);
const httpServer = createServer(app);

socketServer.initialize(httpServer);

connectRedis().catch(error => {
	logger.error('Failed to initialize Redis', {
		error: error instanceof Error ? error.message : 'Unknown error',
	});
});

app.use(
	cors({
		origin: (origin, callback) => {
			if (isOriginAllowed(origin)) {
				callback(null, true);
			} else {
				logger.warn(`CORS blocked origin: ${origin}`);
				callback(new Error('Not allowed by CORS'));
			}
		},
		credentials: true,
	})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(actionLoggerMiddleware);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

app.get('/api-docs.json', (_req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.send(swaggerSpec);
});

app.get('/health', async (req, res) => {
	const redisHealthy = await checkRedisHealth();

	res.json({
		status: 'ok',
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		environment: env.NODE_ENV,
		services: {
			redis: redisHealthy ? 'connected' : 'disconnected',
		},
	});
});

routes.forEach(({ path, router }) => {
	app.use(path, router);
});

app.use((req, _res, next) => {
	next(
		new AppError(404, 'Route not found', 'NOT_FOUND', undefined, {
			why: `No route matches ${req.method} ${req.path}`,
		})
	);
});

app.use(errorHandler);

const PORT = env.PORT;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
	logger.info('Zumik backend is running', {
		server: `http://localhost:${PORT}`,
		health: `http://localhost:${PORT}/health`,
		docs: `http://localhost:${PORT}/api-docs`,
		environment: env.NODE_ENV,
		host: HOST,
	});
	logger.info('API endpoints available', {
		auth: `http://localhost:${PORT}/api/auth`,
		profile: `http://localhost:${PORT}/api/profile`,
		playlists: `http://localhost:${PORT}/api/playlists`,
		soundcloud: `http://localhost:${PORT}/api/soundcloud`,
	});
});

process.on('SIGTERM', () => {
	logger.info('SIGTERM received, shutting down gracefully...');
	void disconnectRedis().then(() => {
		httpServer.close(() => {
			logger.info('Server closed');
			process.exit(0);
		});
	});
});

process.on('SIGINT', () => {
	logger.info('SIGINT received, shutting down gracefully...');
	void disconnectRedis().then(() => {
		httpServer.close(() => {
			logger.info('Server closed');
			process.exit(0);
		});
	});
});

export { app, httpServer };
