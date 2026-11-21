import { createContext } from 'react';
import type { PlayerContextValue } from '@/features/playback/shared/player/types/playerTypes';

export const PlayerContext = createContext<PlayerContextValue | null>(null);
