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
    if (get().socket) {
      console.log('[Socket] Already connected or connecting');
      return;
    }

    console.log('[Socket] Connecting to', API_CONFIG.BASE_URL);

    const socket = io(API_CONFIG.BASE_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
      set({ isConnected: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
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

