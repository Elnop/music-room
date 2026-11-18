import { socketLogger } from '@/shared/middleware/socket-logger.middleware.js';
import type { AppSocket } from '@/realtime/socket-auth.js';

export function createSocketQueue(socket: AppSocket, failureAction: string) {
	let queue: Promise<void> = Promise.resolve();
	return (task: () => Promise<void> | void) => {
		queue = queue.then(task).catch((error: unknown) => {
			socketLogger.error(socket.id, error instanceof Error ? error : new Error(String(error)), {
				action: failureAction,
			});
		});
	};
}
