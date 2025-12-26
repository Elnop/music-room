import { useEffect, useCallback, useState, useRef } from 'react';
import { useSocketStore } from '@store/socketStore';
import { usePlayerStore } from '@store/playerStore';
import { useAuthStore } from '@store/authStore';
import { deviceService, type DeviceInfo } from '@/services/deviceService';

/**
 * Listening status for a single device
 */
export interface ListeningStatus {
  ownerId: string;
  device: DeviceInfo;
  track: {
    id: number;
    title: string;
    artist: string;
    artworkUrl: string | null;
  } | null;
  isPlaying: boolean;
  updatedAt: string;
}

/**
 * Aggregated listening status for a user (all devices)
 */
export interface UserListeningStatus {
  ownerId: string;
  devices: ListeningStatus[];
}

interface ControlCommand {
  action: 'play' | 'pause';
  fromUserId: string;
}

interface PermissionChangedEvent {
  ownerId: string;
  targetUserId: string;
  canControl: boolean;
}

/**
 * Hook to manage music control - emits listening status and receives remote commands
 * Should be used at app root level (e.g., in RootNavigator or App)
 *
 * Multi-device support: each device is uniquely identified and can be controlled independently
 */
export function useMusicControlEmitter() {
  const socket = useSocketStore(state => state.socket);
  const isConnected = useSocketStore(state => state.isConnected);
  const user = useAuthStore(state => state.user);

  const currentTrack = usePlayerStore(state => state.currentTrack);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const pause = usePlayerStore(state => state.pause);
  const resume = usePlayerStore(state => state.resume);

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const isRegistered = useRef(false);

  useEffect(() => {
    deviceService.getDeviceInfo().then(info => {
      setDeviceInfo(info);
      if (__DEV__)
        console.log('[MusicControl] Device info loaded:', info.deviceName, info.deviceId);
    });
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !user || !deviceInfo) {
      isRegistered.current = false;
      return;
    }

    socket.emit('auth:register', { userId: user.id, device: deviceInfo });
    if (__DEV__)
      console.log('[MusicControl] Registered user with device:', user.id, deviceInfo.deviceName);

    // Mark as registered after a small delay to ensure server processed it
    const timer = setTimeout(() => {
      isRegistered.current = true;
    }, 100);

    return () => {
      clearTimeout(timer);
      isRegistered.current = false;
    };
  }, [socket, isConnected, user, deviceInfo]);

  // Emit listening status when track or playing state changes
  useEffect(() => {
    if (!socket || !isConnected || !user || !deviceInfo) return;

    // Wait for registration before emitting
    const emitStatus = () => {
      if (!isRegistered.current) {
        // Retry after a short delay if not yet registered
        const retryTimer = setTimeout(emitStatus, 150);
        return () => clearTimeout(retryTimer);
      }

      const status = {
        device: deviceInfo,
        track: currentTrack
          ? {
              id: currentTrack.id,
              title: currentTrack.title,
              artist: currentTrack.user.username,
              artworkUrl: currentTrack.artwork_url,
            }
          : null,
        isPlaying,
      };

      socket.emit('listening:update', status);
      if (__DEV__)
        console.log(
          '[MusicControl] Emitted listening status:',
          status.track?.title,
          status.isPlaying,
          'from',
          deviceInfo.deviceName
        );
    };

    const timer = setTimeout(emitStatus, 200);

    return () => clearTimeout(timer);
  }, [socket, isConnected, user, deviceInfo, currentTrack, isPlaying]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleControlCommand = (data: ControlCommand) => {
      if (__DEV__) console.log('[MusicControl] Received control command:', data);

      if (data.action === 'play') {
        resume();
      } else if (data.action === 'pause') {
        pause();
      }
    };

    socket.on('control:command', handleControlCommand);

    return () => {
      socket.off('control:command', handleControlCommand);
    };
  }, [socket, isConnected, pause, resume]);
}

/**
 * Hook to subscribe to a friend's listening status (all devices) and control their music
 * Use this in UserProfileScreen when viewing a friend who granted you control
 *
 * Multi-device support: returns all connected devices for the target user
 */
export function useFriendListening(
  targetUserId: string | null,
  initialCanControl: boolean = false
) {
  const socket = useSocketStore(state => state.socket);
  const isConnected = useSocketStore(state => state.isConnected);

  const [devices, setDevices] = useState<ListeningStatus[]>([]);
  const [canControl, setCanControl] = useState(initialCanControl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCanControl(initialCanControl);
  }, [initialCanControl]);

  useEffect(() => {
    if (!socket || !isConnected || !targetUserId) return;

    const handlePermissionChanged = (data: PermissionChangedEvent) => {
      if (__DEV__) console.log('[MusicControl] Permission changed:', data);
      if (data.ownerId === targetUserId) {
        setCanControl(data.canControl);
        if (!data.canControl) {
          // Permission revoked - clear devices
          setDevices([]);
        }
      }
    };

    socket.on('permission:changed', handlePermissionChanged);

    return () => {
      socket.off('permission:changed', handlePermissionChanged);
    };
  }, [socket, isConnected, targetUserId]);

  useEffect(() => {
    if (!socket || !isConnected || !targetUserId || !canControl) {
      if (!canControl) {
        setDevices([]);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    const subscribeTimer = setTimeout(() => {
      socket.emit('listening:subscribe', targetUserId);
      if (__DEV__) console.log('[MusicControl] Subscribed to listening status of:', targetUserId);
    }, 200);

    const handleStatus = (status: UserListeningStatus) => {
      if (__DEV__)
        console.log('[MusicControl] Received listening status:', status.devices.length, 'devices');
      if (status.ownerId === targetUserId) {
        setDevices(status.devices);
        setIsLoading(false);
      }
    };

    const handleError = (err: { message: string; code: string }) => {
      console.error('[MusicControl] Error:', err);
      setError(err.message);
      setIsLoading(false);
    };

    socket.on('listening:status', handleStatus);
    socket.on('listening:error', handleError);

    return () => {
      clearTimeout(subscribeTimer);
      socket.off('listening:status', handleStatus);
      socket.off('listening:error', handleError);
      if (socket.connected) {
        socket.emit('listening:unsubscribe', targetUserId);
        if (__DEV__) console.log('[MusicControl] Unsubscribed from:', targetUserId);
      }
    };
  }, [socket, isConnected, targetUserId, canControl]);

  const remotePlay = useCallback(
    (targetDeviceId: string) => {
      if (!socket || !isConnected || !targetUserId) return;

      socket.emit('control:action', { targetUserId, targetDeviceId, action: 'play' });
      if (__DEV__) console.log('[MusicControl] Sent play command to device:', targetDeviceId);
    },
    [socket, isConnected, targetUserId]
  );

  const remotePause = useCallback(
    (targetDeviceId: string) => {
      if (!socket || !isConnected || !targetUserId) return;

      socket.emit('control:action', { targetUserId, targetDeviceId, action: 'pause' });
      if (__DEV__) console.log('[MusicControl] Sent pause command to device:', targetDeviceId);
    },
    [socket, isConnected, targetUserId]
  );

  return {
    devices,
    canControl,
    isLoading,
    error,
    remotePlay,
    remotePause,
  };
}
