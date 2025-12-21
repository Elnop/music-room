import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@constants';

/**
 * Socket State Interface
 */
interface SocketState {
  socket: Socket | null;
  isConnected: boolean;

  // Actions
  connect: () => void;
  disconnect: () => void;
}

/**
 * Socket Store
 * Manages the global Socket.io connection
 *
 * Usage:
 * - Call connect() when user authenticates
 * - Call disconnect() when user logs out
 * - Use socket and isConnected in feature-specific hooks
 */
export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  /**
   * Connect to the Socket.io server
   */
  connect: () => {
    const existingSocket = get().socket;

    // If already connected, skip
    if (existingSocket?.connected) {
      console.log('[Socket] Already connected:', existingSocket.id);
      return;
    }

    // If socket exists but not connected, disconnect and reconnect
    if (existingSocket) {
      console.log('[Socket] Socket exists but not connected, reconnecting...');
      existingSocket.disconnect();
    }

    const socketUrl = API_CONFIG.BASE_URL;
    console.log('[Socket] Connecting to:', socketUrl);

    const socket = io(socketUrl, {
      // Try WebSocket first, fallback to polling if needed
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      // Force new connection
      forceNew: true,
    });

    socket.on('connect', () => {
      console.log('[Socket] ✅ Connected successfully:', socket.id);
      set({ isConnected: true });
    });

    socket.on('disconnect', reason => {
      console.log('[Socket] ❌ Disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', error => {
      console.error('[Socket] ❌ Connection error:', error.message);
      const transport = socket.io?.engine?.transport?.name ?? 'unknown';
      console.error('[Socket] Error details:', {
        url: socketUrl,
        transport,
      });
    });

    socket.on('reconnect', attemptNumber => {
      console.log('[Socket] 🔄 Reconnected after', attemptNumber, 'attempts');
    });

    socket.on('reconnect_attempt', attemptNumber => {
      console.log('[Socket] 🔄 Reconnect attempt', attemptNumber);
    });

    socket.on('reconnect_error', error => {
      console.error('[Socket] ❌ Reconnect error:', error.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] ❌ Reconnect failed after all attempts');
    });

    set({ socket });
  },

  /**
   * Disconnect from the Socket.io server
   */
  disconnect: () => {
    const { socket } = get();

    if (socket) {
      console.log('[Socket] Disconnecting...');
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
